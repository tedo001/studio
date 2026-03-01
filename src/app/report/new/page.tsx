
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { aiCategorySuggestion } from "@/ai/flows/ai-category-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, CheckCircle, X, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function NewReportPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);
  
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const shortName = address.road || address.suburb || address.neighbourhood || address.city || data.display_name.split(',')[0];
        setLocationName(shortName + (address.city ? `, ${address.city}` : ""));
      } else {
        setLocationName(`Madurai Sector (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
      }
    } catch (error) {
      setLocationName(`Madurai Limit (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
    }
  };

  const getGPS = () => {
    setLocLoading(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({ latitude: lat, longitude: lon });
          reverseGeocode(lat, lon);
          setLocLoading(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          // High-stability fallback for Madurai Region
          const fallbackLat = 9.9252;
          const fallbackLon = 78.1198;
          setLocation({ latitude: fallbackLat, longitude: fallbackLon });
          setLocationName("Madurai Municipal Sector (GPS Signal Weak)");
          setLocLoading(false);
          toast({
            title: "GPS Lock Weak",
            description: "Using default Madurai sector coordinates.",
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setLocLoading(false);
      toast({ title: "Hardware Unavailable", description: "GPS positioning not found.", variant: "destructive" });
    }
  };

  useEffect(() => {
    getGPS();
  }, []);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAiAnalyzing(true);
    try {
      const result = await aiCategorySuggestion({ photoDataUri: base64 });
      setCategory(result.aiCategory);
    } catch (error) {
      setCategory("Environmental Issue"); 
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      toast({ title: "Evidence Needed", description: "Please capture a photo.", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    
    const reportData = {
      imageUrl: image,
      aiCategory: category || "Uncategorized Issue",
      severity: severity,
      status: "Pending",
      timestamp: serverTimestamp(),
      userId: user?.uid || "anonymous_citizen",
      location: location || { latitude: 9.9252, longitude: 78.1198 },
      locationName: locationName || "Madurai Municipal Limit",
    };

    if (!db) {
      toast({ title: "System Offline", description: "Database connection failed.", variant: "destructive" });
      setUploading(false);
      return;
    }

    const reportsCollection = collection(db, "reports");
    addDoc(reportsCollection, reportData)
      .then(() => {
        setSubmitted(true);
        toast({ title: "Transmission Success", description: "Report is live in the Ops feed." });
        setTimeout(() => router.push("/user"), 2000);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: reportsCollection.path,
          operation: 'create',
          requestResourceData: reportData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setUploading(false);
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background space-y-8 text-center">
        <div className="h-32 w-32 bg-primary/20 rounded-[3rem] flex items-center justify-center shadow-2xl animate-anti-gravity">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tighter uppercase italic">Case Transmitted</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident registered at {locationName}</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to Feed...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-12">
      <header className="p-6 flex items-center space-x-4 border-b bg-white sticky top-0 z-20 shadow-sm">
        <Link href="/user">
          <Button variant="ghost" size="icon" className="rounded-2xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black font-headline tracking-tight uppercase italic">New Incident</h1>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Reporting to Madurai Corp</span>
        </div>
      </header>

      <div className="px-6 flex-1 flex flex-col space-y-8 py-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">1. Capture Evidence</Label>
            {image && (
               <Button variant="ghost" size="sm" onClick={() => setImage(null)} className="h-6 text-[8px] font-black uppercase tracking-widest text-red-500 hover:text-red-600">
                 Clear Photo
               </Button>
            )}
          </div>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-72 w-full rounded-[2.5rem] border-[3px] border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 shadow-inner ${image ? 'border-primary' : 'border-slate-200 bg-slate-50'}`}
          >
            {image ? (
              <Image src={image} alt="Evidence" fill className="object-cover" />
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl animate-anti-gravity">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800 uppercase italic">Open Report Lens</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visual verification required</p>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">2. Incident Intel</Label>
            <Button variant="ghost" size="sm" onClick={getGPS} disabled={locLoading} className="h-6 text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
              {locLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync Zone
            </Button>
          </div>
          <Card className="bg-white border-2 border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Operational Zone</Label>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                   <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {locationName || (locLoading ? "Syncing Sector..." : "Detecting Sector...")}
                   </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AI Category Suggestion</Label>
                <div className="flex items-center">
                  {aiAnalyzing ? (
                    <div className="flex items-center space-x-2 text-primary bg-primary/5 px-4 py-2 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Analyzing Image...</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="bg-primary/10 text-primary px-5 py-2 border-none shadow-sm text-[10px] font-black rounded-xl uppercase tracking-wider italic">
                      {category || "Awaiting Scan"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Priority Grade</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="bg-slate-50 h-14 rounded-2xl border-none shadow-inner font-black uppercase tracking-tight text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Low" className="font-bold text-xs">MODERATE (Level 1)</SelectItem>
                    <SelectItem value="Medium" className="font-bold text-xs">STANDARD (Level 2)</SelectItem>
                    <SelectItem value="High" className="font-bold text-xs text-red-600">URGENT (Level 3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          className="w-full h-20 text-xl font-black rounded-[2rem] shadow-2xl transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800 disabled:opacity-50" 
          onClick={handleSubmit}
          disabled={uploading || aiAnalyzing || !image}
        >
          {uploading ? "TRANSMITTING..." : "TRANSMIT OFFICIAL REPORT"}
        </Button>
      </div>
    </div>
  );
}
