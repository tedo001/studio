"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { aiCategorySuggestion } from "@/ai/flows/ai-category-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, CheckCircle, X, MapPin, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function NewReportPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
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
        setLocationName(`Madurai Sector (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch (error) {
      setLocationName(`Madurai Limit (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
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
        () => {
          toast({
            title: "GPS Locked",
            description: "Location access is required for official reporting.",
            variant: "destructive"
          });
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocLoading(false);
      toast({ title: "Hardware Failure", description: "GPS positioning not available.", variant: "destructive" });
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
      setCategory("General Waste"); 
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      toast({ title: "Evidence Needed", description: "Please upload a photo of the incident.", variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: "No Location", description: "Wait for GPS signal to lock coordinates.", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    
    try {
      let downloadUrl = "https://picsum.photos/seed/cleanup-placeholder/600/400";
      
      // Real-world storage integration
      if (storage) {
        const reportId = `REP-${Date.now()}`;
        const storageRef = ref(storage, `reports/${reportId}.jpg`);
        await uploadString(storageRef, image, "data_url");
        downloadUrl = await getDownloadURL(storageRef);
      }

      const reportData = {
        imageUrl: downloadUrl,
        aiCategory: category || "Uncategorized Issue",
        severity: severity,
        status: "Pending",
        timestamp: serverTimestamp(),
        userId: user?.uid || "anonymous",
        location: location,
        locationName: locationName || "Madurai Municipal Limit",
      };

      if (!db) {
        // Fallback for Demo Mode if Firebase Studio isn't connected yet
        setTimeout(() => {
          setSubmitted(true);
          toast({ title: "Demo Mode Success", description: "Report simulated successfully." });
          setTimeout(() => router.push("/user"), 2000);
        }, 1500);
        return;
      }

      const reportsCollection = collection(db, "reports");
      addDoc(reportsCollection, reportData)
        .then(() => {
          setSubmitted(true);
          toast({ title: "Transmission Success", description: "Your report is now live in the Ops feed." });
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

    } catch (error: any) {
      toast({ title: "System Error", description: "Failed to transmit report. Try again.", variant: "destructive" });
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background space-y-8 text-center">
        <div className="h-32 w-32 bg-primary/20 rounded-[3rem] flex items-center justify-center shadow-2xl animate-anti-gravity">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tighter uppercase italic">Case Filed</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 max-w-[200px] mx-auto">Incident registered at {locationName}</p>
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
        {!location && !locLoading && (
          <Alert variant="destructive" className="rounded-[2rem] border-2 shadow-xl bg-red-50">
            <AlertTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><MapPin className="h-4 w-4" /> Hardware Block</AlertTitle>
            <AlertDescription className="text-[11px] font-bold space-y-3 mt-2">
              <p>GPS positioning is required for official government filing.</p>
              <Button size="sm" variant="outline" className="h-10 rounded-xl bg-white text-[10px] font-black uppercase" onClick={getGPS}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Re-Scan Area
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">1. Capture Evidence</Label>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-72 w-full rounded-[2.5rem] border-[3px] border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 shadow-inner ${image ? 'border-primary' : 'border-slate-200 bg-slate-50'}`}
          >
            {image ? (
              <>
                <Image src={image} alt="Evidence" fill className="object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute top-6 right-6 h-12 w-12 bg-black/70 text-white rounded-2xl flex items-center justify-center z-10 shadow-2xl backdrop-blur-md border border-white/20"
                >
                  <X className="h-6 w-6" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl animate-anti-gravity">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800 uppercase italic">Tap to Open Lens</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capture clear visual proof</p>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
          </div>
        </div>

        {image && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">2. Incident Intel</Label>
              <Card className="bg-white border-2 border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Operational Zone</Label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                       <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {locationName || "Detecting Zone..."}
                       </p>
                    </div>
                    {location && <MapPreview latitude={location.latitude} longitude={location.longitude} className="h-44 rounded-2xl shadow-xl" />}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AI Categorization</Label>
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
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                      <ShieldCheck className="h-6 w-6 text-slate-300" />
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
              className="w-full h-20 text-xl font-black rounded-[2rem] shadow-2xl transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800" 
              onClick={handleSubmit}
              disabled={uploading || aiAnalyzing || !location}
            >
              {uploading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="uppercase italic">Transmitting...</span>
                </div>
              ) : "TRANSMIT OFFICIAL REPORT"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}