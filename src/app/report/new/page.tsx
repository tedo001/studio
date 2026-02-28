"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function NewReportPage() {
  const { user } = useUser();
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
  const [locLoading, setLocLoading] = useState(false);

  const getGPS = () => {
    setLocLoading(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocLoading(false);
        },
        (err) => {
          console.error(err);
          toast({
            title: "Location Access Required",
            description: "Please enable GPS permissions in your browser to file a report.",
            variant: "destructive"
          });
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocLoading(false);
      toast({
        title: "GPS Not Supported",
        description: "Your browser does not support geolocation tracking.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    getGPS();
  }, []);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a smaller image (under 5MB).",
          variant: "destructive"
        });
        return;
      }

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
      setCategory("General Environmental Issue"); 
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      toast({ title: "Photo Required", description: "Please take a photo of the issue first.", variant: "destructive" });
      return;
    }

    if (!location) {
      toast({ title: "GPS Required", description: "Waiting for location...", variant: "destructive" });
      return;
    }

    if (!db || !storage || !user) {
       // Demo fallback for previewing flow without connected project
       setUploading(true);
       setTimeout(() => {
         setSubmitted(true);
         setUploading(false);
         setTimeout(() => router.push("/user"), 2000);
       }, 1500);
       return;
    }

    setUploading(true);
    try {
      const reportId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `reports/${user.uid}/${reportId}.jpg`);
      
      await uploadString(storageRef, image, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);

      const reportData = {
        imageUrl: downloadUrl,
        aiCategory: category || "Uncategorized",
        severity: severity,
        status: "Pending",
        timestamp: serverTimestamp(),
        userId: user.uid,
        location: location, // Consistently storing as {latitude, longitude}
      };

      const reportsCollection = collection(db, "reports");
      
      addDoc(reportsCollection, reportData)
        .then(() => {
          setSubmitted(true);
          toast({
            title: "Report Filed",
            description: "Your report has been successfully recorded.",
          });
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
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background space-y-6 text-center">
        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-primary animate-in zoom-in duration-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary font-headline">Report Submitted!</h2>
          <p className="text-muted-foreground">Coordinates: {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Returning to dashboard...
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
        <h1 className="text-xl font-bold font-headline">Report New Issue</h1>
      </header>

      <div className="px-6 flex-1 flex flex-col space-y-6 py-6">
        {!location && !locLoading && (
          <Alert variant="destructive" className="rounded-2xl border-2">
            <AlertTitle className="flex items-center gap-2 text-xs font-black uppercase"><MapPin className="h-4 w-4" /> GPS Access Required</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>We need your location to help workers find the issue.</p>
              <Button size="sm" variant="outline" className="h-8 rounded-xl bg-white" onClick={getGPS}>
                <RefreshCw className="h-3 w-3 mr-2" /> Retry GPS
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label className="text-lg font-bold">1. Capture Visual Evidence</Label>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-64 w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${image ? 'border-primary' : 'border-muted-foreground/30 bg-slate-50'}`}
          >
            {image ? (
              <>
                <Image src={image} alt="Captured evidence" fill className="object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); setCategory(""); }}
                  className="absolute top-4 right-4 h-10 w-10 bg-black/60 text-white rounded-full flex items-center justify-center z-10 shadow-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Tap to Open Camera</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleCapture} 
            />
          </div>
        </div>

        {image && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="space-y-4">
              <Label className="text-lg font-bold">2. Verification Details</Label>
              <Card className="bg-slate-50 border-none shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Incident Location</Label>
                    {location ? (
                      <MapPreview latitude={location.latitude} longitude={location.longitude} className="h-40" />
                    ) : (
                      <div className="h-40 rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
                        {locLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <MapPin className="h-8 w-8" />}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AI Suggested Category</Label>
                    <div className="flex items-center">
                      {aiAnalyzing ? (
                        <div className="flex items-center space-x-2 text-primary bg-primary/5 px-4 py-2 rounded-xl">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs font-bold">Analyzing Evidence...</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-white text-primary px-4 py-2 border-primary/10 shadow-sm text-xs font-bold rounded-xl">
                          {category || "Identifying Issue..."}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Issue Priority</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="bg-white h-12 rounded-xl border-none shadow-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low - Non-hazardous</SelectItem>
                        <SelectItem value="Medium">Medium - Regular hazard</SelectItem>
                        <SelectItem value="High">High - Emergency removal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl" 
              onClick={handleSubmit}
              disabled={uploading || aiAnalyzing || !location}
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Submitting Case...</span>
                </div>
              ) : "File Official Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
