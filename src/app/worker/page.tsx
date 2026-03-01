
"use client";

import { useState, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, updateDoc, doc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, Loader2, MapPin, AlertCircle, Home, Camera, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function WorkerDashboard() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const jobsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return query(collection(db, "reports"), orderBy("timestamp", "desc"));
  }, [db, isUserLoading, user?.uid]);

  const { data: allJobs, isLoading: loading, error } = useCollection(jobsQuery);
  const jobs = allJobs?.filter(job => job.status === 'Pending' || job.status === 'In Progress') || [];

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    setIsProcessing(true);
    const docRef = doc(db, "reports", id);
    const data: any = { status: newStatus };
    
    if (newStatus === 'Resolved' && capturedImage) {
      data.resolvedImageUrl = capturedImage;
    }

    updateDoc(docRef, data)
      .then(() => {
        toast({ title: "Duty Logged", description: `Task status updated to ${newStatus}` });
        setResolvingId(null);
        setCapturedImage(null);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <div className="animate-anti-gravity bg-orange-100 p-8 rounded-[3rem] mb-6 shadow-xl">
          <HardHat className="h-12 w-12 text-orange-600" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 text-center animate-pulse italic">Establishing Field Session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-orange-50/20">
      <header className="bg-white/90 backdrop-blur-md border-b p-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3 text-orange-600">
          <div className="bg-orange-100 p-2 rounded-xl">
            <HardHat className="h-6 w-6" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-black font-headline uppercase tracking-tighter italic leading-none">Field Operations</h1>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 italic">Worker Network Active</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-2xl hover:bg-orange-100 h-10 w-10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto pb-10">
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic text-left">Assigned Tasks</h2>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-orange-200 text-orange-600 bg-orange-100/50 italic px-3 h-6">Active Feed</Badge>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Syncing incidents...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24 space-y-6 bg-white rounded-[3.5rem] border-4 border-dashed border-orange-100 shadow-inner">
              <div className="h-20 w-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner animate-anti-gravity-slow">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase tracking-tighter text-xl italic leading-none">Sector Secured</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-60">All reported issues are cleared.</p>
              </div>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white mb-8 group transition-all duration-500 hover:scale-[1.01]">
                <CardHeader className="p-6 bg-white border-b text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`text-[9px] uppercase font-black px-3 h-6 italic border-none ${job.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {job.severity} Priority
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] uppercase font-black h-6 px-3 italic border-2 ${job.status === 'In Progress' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-slate-100 text-slate-500 bg-slate-50'}`}>
                          {job.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black font-headline italic uppercase tracking-tighter leading-tight pt-1">{job.aiCategory}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 italic">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        {job.locationName || "Sector Locked"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-12 w-12 rounded-2xl border-2 shadow-sm flex-shrink-0" onClick={() => {
                      if(job.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`);
                    }}>
                      <Navigation className="h-5 w-5 text-slate-600" />
                    </Button>
                  </div>
                </CardHeader>
                
                <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                  <Image src={job.imageUrl} alt="Incident" fill className="object-cover" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-black/60 text-white border-none uppercase text-[8px] font-black italic">Reported Scene</Badge>
                  </div>
                </div>

                {job.status === 'In Progress' && (
                  <div className="p-6 bg-slate-50 border-y space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Cleanup Verification</p>
                      {capturedImage && (
                        <Button variant="ghost" size="sm" onClick={() => setCapturedImage(null)} className="h-6 px-2 text-red-500 text-[9px] font-black uppercase">
                          <X className="h-3 w-3 mr-1" /> Remove Photo
                        </Button>
                      )}
                    </div>
                    
                    {!capturedImage ? (
                      <Button 
                        variant="outline" 
                        className="w-full h-32 rounded-2xl border-dashed border-2 flex flex-col gap-2 bg-white hover:bg-orange-50 transition-colors"
                        onClick={() => {
                          setResolvingId(job.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <Camera className="h-8 w-8 text-orange-500" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Capture Cleaned Site</span>
                      </Button>
                    ) : (
                      <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-inner border-2 border-green-500">
                        <Image src={capturedImage} alt="Resolved proof" fill className="object-cover" />
                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                           <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                              <Check className="h-6 w-6 text-green-600" />
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <CardContent className="p-6 flex gap-3 bg-white">
                  {job.status === 'Pending' ? (
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 h-16 rounded-[1.5rem] font-black shadow-2xl text-base transition-transform active:scale-95 italic uppercase tracking-tight" 
                      onClick={() => updateStatus(job.id, "In Progress")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : "START CLEARANCE"}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-[1.5rem] font-black shadow-2xl text-base transition-transform active:scale-95 italic uppercase tracking-tight" 
                      onClick={() => updateStatus(job.id, "Resolved")}
                      disabled={!capturedImage || isProcessing}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : capturedImage ? "CONFIRM RESOLUTION" : "PHOTO REQUIRED"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
