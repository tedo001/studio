"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { aiCategorySuggestion } from "@/ai/flows/ai-category-suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      setCategory("Litter"); // Fallback
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!image || !user || !db) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const reportId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `reports/${user.uid}/${reportId}.jpg`);
      
      await uploadString(storageRef, image, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);

      const reportData = {
        imageUrl: downloadUrl,
        aiCategory: category,
        severity: severity,
        timestamp: serverTimestamp(),
        userId: user.uid,
      };

      addDoc(collection(db, "reports"), reportData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'reports',
            operation: 'create',
            requestResourceData: reportData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      setSubmitted(true);
      toast({
        title: "Success",
        description: "Thank you for reporting this issue!",
      });
      
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please check your connection and try again.",
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
          <p className="text-muted-foreground">Madurai is one step closer to being cleaner thanks to you.</p>
        </div>
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline">Report Issue</h1>
      </header>

      <div className="px-6 flex-1 flex flex-col space-y-6 pb-10">
        <div className="space-y-4">
          <Label className="text-lg font-bold">Capture the issue</Label>
          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={`relative h-64 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${image ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'}`}
          >
            {image ? (
              <>
                <Image src={image} alt="Captured issue" fill className="object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute top-4 right-4 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Click to take a photo</p>
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
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <Label className="text-lg font-bold">Details</Label>
              <Card className="bg-secondary/10 border-none shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">AI Suggested Category</Label>
                    <div className="flex items-center space-x-2">
                      {aiAnalyzing ? (
                        <div className="flex items-center space-x-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Gemini is analyzing...</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-white text-primary text-md px-3 py-1">
                          {category || "Awaiting scan..."}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity" className="text-xs text-muted-foreground uppercase font-bold">Severity Level</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="bg-white border-none shadow-sm">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low - Minor issue</SelectItem>
                        <SelectItem value="Medium">Medium - Needs attention</SelectItem>
                        <SelectItem value="High">High - Urgent cleanup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold shadow-xl" 
              onClick={handleSubmit}
              disabled={uploading || aiAnalyzing}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        )}

        {!image && (
          <div className="flex items-center p-4 bg-accent/30 rounded-xl space-x-3 text-accent-foreground border border-accent/50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm italic">
              AI will automatically suggest a category once you take a photo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}