
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { aiCategorySuggestion } from "@/ai/flows/ai-category-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, CheckCircle, X, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    const getGPS = () => {
      setLocLoading(true);
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocLoading(false);
          },
          (err) => {
            console.error(err);
            toast({
              title: "Location Denied",
              description: "Please enable GPS to provide accurate report location.",
              variant: "destructive"
            });
            setLocLoading(false);
          }
        );
      } else {
        setLocLoading(false);
      }
    };
    getGPS();
  }, [toast]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
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
      toast({
        title: "AI Analysis Error",
        description: "Couldn't suggest a category automatically.",
        variant: "destructive",
      });
      setCategory("Litter"); 
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!image || !user || !db || !storage) {
       toast({ title: "Submission Error", description: "Firebase not connected or photo missing.", variant: "destructive" });
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
        location: location || null,
      };

      const reportsCollection = collection(db, "reports");
      addDoc(reportsCollection, reportData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: reportsCollection.path,
            operation: 'create',
            requestResourceData: reportData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

      // Optimistic transition
      setSubmitted(true);
      toast({
        title: "Report Filed",
        description: "Your report has been sent to the city council.",
      });
      
      setTimeout(() => {
        router.push("/user");
      }, 2000);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Submission failed",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background space-y-6 text-center">
        <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary font-headline">Report Submitted!</h2>
          <p className="text-muted-foreground">Location and image recorded. Authorities have been notified.</p>
        </div>
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex items-center space-x-4 border-b">
        <Link href="/user">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline">New Report</h1>
      </header>

      <div className="px-6 flex-1 flex flex-col space-y-6 py-6 pb-10">
        {!location && !locLoading && (
          <Alert variant="destructive">
            <AlertTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> GPS Disabled</AlertTitle>
            <AlertDescription>
              We couldn't get your location. Please enable GPS for better reporting.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label className="text-lg font-bold">1. Take a Photo</Label>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-64 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${image ? 'border-primary' : 'border-muted-foreground/30'}`}
          >
            {image ? (
              <>
                <Image src={image} alt="issue" fill className="object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute top-4 right-4 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Click to Open Camera</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
          </div>
        </div>

        {image && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <Label className="text-lg font-bold">2. Verification</Label>
              <Card className="bg-secondary/10 border-none">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Location Status</Label>
                    <div className="flex items-center text-sm font-medium gap-2">
                      {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className={`h-4 w-4 ${location ? 'text-green-600' : 'text-red-600'}`} />}
                      {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Position not fixed"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Issue Category</Label>
                    <div className="flex items-center space-x-2">
                      {aiAnalyzing ? (
                        <div className="flex items-center space-x-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Gemini scanning...</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-white text-primary px-3 py-1">
                          {category || "Scan incomplete"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Urgency</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low - Cosmetic issue</SelectItem>
                        <SelectItem value="Medium">Medium - Health hazard</SelectItem>
                        <SelectItem value="High">High - Emergency removal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold" 
              onClick={handleSubmit}
              disabled={uploading || aiAnalyzing}
            >
              {uploading ? "Uploading..." : "Submit to City Council"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
