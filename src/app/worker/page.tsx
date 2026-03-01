"use client";

import { useState, useRef } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, updateDoc, doc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, Loader2, MapPin, Camera, X, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function WorkerDashboard() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const jobsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return query(collection(db, "reports"), orderBy("timestamp", "desc"));
  }, [db, isUserLoading, user?.uid]);

  const { data: allJobs, isLoading: loading } = useCollection(jobsQuery);
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
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'Resolved') {
      if (!capturedImage) {
        toast({ title: "Evidence Required", description: "Please capture a photo of the cleaned area.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      updateData.resolvedImageUrl = capturedImage;
    }

    updateDoc(docRef, updateData)
      .then(() => {
        toast({ title: "Task Logged", description: `Incident is now ${newStatus}.` });
        setCapturedImage(null);
        setActiveJobId(null);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-orange-50/20">
      <header className="bg-white border-b p-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3 text-orange-600">
          <HardHat className="h-6 w-6" />
          <h1 className="text-xl font-black font-headline uppercase italic">Field Ops</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-2xl">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1">
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleCapture} />
        
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Assigned Duty</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 bg-white rounded-[3rem]">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-black uppercase italic text-slate-400">All Sectors Clear</p>
          </Card>
        ) : (
          jobs.map((job: any) => (
            <Card key={job.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white mb-8">
              <CardHeader className="p-6 bg-white border-b">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge className={`text-[9px] uppercase font-black mb-2 ${job.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {job.severity} Priority
                    </Badge>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">{job.aiCategory}</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> {job.locationName || "Sector Locked"}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={() => job.location && window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`)}>
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="relative h-48 w-full bg-slate-100">
                <Image src={job.imageUrl} alt="Incident" fill className="object-cover" />
                <Badge className="absolute bottom-3 left-3 bg-black/50 text-white border-none uppercase text-[8px] font-black">Reported Scene</Badge>
              </div>

              {job.status === 'In Progress' && (
                <div className="p-6 bg-slate-50 border-y space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">1. Cleanup Verification</Label>
                  {!capturedImage ? (
                    <Button 
                      variant="outline" 
                      className="w-full h-24 rounded-2xl border-dashed border-2 flex flex-col gap-2 bg-white hover:bg-orange-50"
                      onClick={() => {
                        setActiveJobId(job.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Camera className="h-6 w-6 text-orange-500" />
                      <span className="text-[9px] font-black uppercase">Capture Proof Photo</span>
                    </Button>
                  ) : (
                    <div className="relative h-40 w-full rounded-2xl overflow-hidden shadow-inner border-2 border-green-500">
                      <Image src={capturedImage} alt="Proof" fill className="object-cover" />
                      <button onClick={() => setCapturedImage(null)} className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <CardContent className="p-6 bg-white">
                {job.status === 'Pending' ? (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 h-16 rounded-2xl font-black uppercase italic" 
                    onClick={() => updateStatus(job.id, "In Progress")}
                    disabled={isProcessing}
                  >
                    Start Clearance
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-2xl font-black uppercase italic" 
                    onClick={() => updateStatus(job.id, "Resolved")}
                    disabled={!capturedImage || isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : capturedImage ? "Confirm Resolution" : "Photo Required"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

import { Label } from "@/components/ui/label";