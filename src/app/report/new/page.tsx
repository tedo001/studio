
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { aiCategorySuggestion } from "@/ai/flows/ai-category-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, CheckCircle, X, MapPin, RefreshCw, AlertTriangle } from "lucide-react";
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
        setLocationName(`Madurai Area (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      setLocationName(`Madurai Area (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
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
        (err) => {
          console.error(err);
          toast({
            title: "Location Denied",
            description: "Please enable GPS to file a report.",
            variant: "destructive"
          });
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocLoading(false);
      toast({ title: "Hardware Error", description: "GPS not supported.", variant: "destructive" });
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
      console.error("AI Analysis failed", error);
      setCategory("Litter/Trash"); 
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    // Debug checks for robust error handling
    if (!image) {
      toast({ title: "Evidence Required", description: "Please capture a photo of the issue.", variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: "Location Missing", description: "Waiting for GPS coordinates...", variant: "destructive" });
      return;
    }
    if (!user || !db || !storage) {
      toast({ title: "System Syncing", description: "Firebase connection is initializing. Please wait.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const reportId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const storageRef = ref(storage, `reports/${reportId}.jpg`);
      
      await uploadString(storageRef, image, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);

      const reportData = {
        imageUrl: downloadUrl,
        aiCategory: category || "General Issue",
        severity: severity,
        status: "Pending",
        timestamp: serverTimestamp(),
        userId: user.uid,
        location: location,
        locationName: locationName || "Madurai Municipal Limit",
      };

      const reportsCollection = collection(db, "reports");
      
      addDoc(reportsCollection, reportData)
        .then(() => {
          setSubmitted(true);
          toast({ title: "Report Transmitted", description: "Official record created in Madurai central database." });
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
      console.error("Submission error", error);
      toast({ title: "Transmission Failed", description: error.message || "Unknown server error.", variant: "destructive" });
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background space-y-6 text-center">
        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center shadow-xl">
          <CheckCircle className="h-12 w-12 text-primary animate-in zoom-in duration-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-primary font-headline tracking-tight">Record Registered</h2>
          <p className="text-sm font-bold text-slate-600 px-8">{locationName}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          <Loader2 className="h-4 w-4 animate-spin" /> Finalizing official case...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-10">
      <header className="p-4 flex items-center space-x-4 border-b bg-white sticky top-0 z-20">
        <Link href="/user">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline">New Incident Case</h1>
      </header>

      <div className="px-6 flex-1 flex flex-col space-y-6 py-6">
        {!location && !locLoading && (
          <Alert variant="destructive" className="rounded-3xl border-2">
            <AlertTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><MapPin className="h-4 w-4" /> GPS Locked</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>We cannot file a report without precise coordinates.</p>
              <Button size="sm" variant="outline" className="h-9 rounded-xl bg-white text-xs font-bold" onClick={getGPS}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Re-Scan Location
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label className="text-sm font-black uppercase text-slate-400 tracking-widest">1. Visual Evidence</Label>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-64 w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${image ? 'border-primary' : 'border-muted-foreground/30 bg-slate-50'}`}
          >
            {image ? (
              <>
                <Image src={image} alt="Evidence" fill className="object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute top-4 right-4 h-10 w-10 bg-black/60 text-white rounded-full flex items-center justify-center z-10 shadow-lg backdrop-blur-sm"
                >
                  <X className="h-6 w-6" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-bold text-slate-500">Tap to capture issue</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
          </div>
        </div>

        {image && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="space-y-4">
              <Label className="text-sm font-black uppercase text-slate-400 tracking-widest">2. Incident Details</Label>
              <Card className="bg-slate-50 border-none shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Verified Address</Label>
                    <div className="bg-white p-3 rounded-2xl border border-primary/10 shadow-sm">
                       <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {locationName || "Locating..."}
                       </p>
                    </div>
                    {location && <MapPreview latitude={location.latitude} longitude={location.longitude} className="h-40" />}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AI Audit</Label>
                    <div className="flex items-center">
                      {aiAnalyzing ? (
                        <div className="flex items-center space-x-2 text-primary bg-primary/5 px-4 py-2 rounded-xl">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase">Deep Scan...</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-white text-primary px-4 py-2 border-primary/10 shadow-sm text-xs font-black rounded-xl uppercase">
                          {category || "Uncategorized"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Priority</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="bg-white h-12 rounded-xl border-none shadow-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low - Moderate</SelectItem>
                        <SelectItem value="Medium">Medium - Standard</SelectItem>
                        <SelectItem value="High">High - Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              className="w-full h-16 text-lg font-black rounded-2xl shadow-xl transition-transform active:scale-95" 
              onClick={handleSubmit}
              disabled={uploading || aiAnalyzing || !location || authLoading}
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Syncing Official Case...</span>
                </div>
              ) : "Transmit Official Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
