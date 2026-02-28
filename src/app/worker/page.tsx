"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, updateDoc, doc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, Loader2, MapPin, AlertCircle, Home } from "lucide-react";
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

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    // Simplified query to avoid potential index requirements during rapid prototyping
    return query(
      collection(db, "reports"), 
      where("status", "in", ["Pending", "In Progress"]),
      orderBy("timestamp", "desc")
    );
  }, [db, user, isUserLoading]);

  const { data: jobs, isLoading: loading, error } = useCollection(jobsQuery);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    const docRef = doc(db, "reports", id);
    const data = { status: newStatus };
    
    updateDoc(docRef, data)
      .then(() => {
        toast({ title: "Task Updated", description: `Incident status set to ${newStatus}` });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50/20 p-8">
        <div className="animate-anti-gravity bg-orange-100 p-8 rounded-[3rem] mb-6 shadow-xl">
          <HardHat className="h-12 w-12 text-orange-600" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 text-center animate-pulse italic">Verifying Field Authorization...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white text-center space-y-8">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <div className="space-y-2">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sync Interrupted</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database connection timed out or restricted.</p>
        </div>
        <Button variant="outline" className="rounded-2xl h-14 px-8 font-black uppercase italic border-2" onClick={() => router.push("/")}>
          <Home className="mr-2 h-4 w-4" /> Back to HQ
        </Button>
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
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 italic">Anti-Gravity Workforce</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-2xl hover:bg-orange-100 h-10 w-10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto pb-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic text-left">Sector Task Board</h2>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-orange-200 text-orange-600 bg-orange-100/50 italic px-3 h-6">Live Link</Badge>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Polling Central Feed...</p>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-24 space-y-6 bg-white rounded-[3.5rem] border-4 border-dashed border-orange-100 shadow-inner">
              <div className="h-20 w-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner animate-anti-gravity-slow">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase tracking-tighter text-xl italic leading-none">Sector Secured</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-60">No pending reports in this zone.</p>
              </div>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white mb-8 group transition-all duration-500 hover:scale-[1.02]">
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
                        {job.locationName || "Location Processing..."}
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
                  <Image src={job.imageUrl} alt="Incident" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                {job.location && (
                  <div className="p-6 bg-slate-50 border-y">
                     <MapPreview latitude={job.location.latitude} longitude={job.location.longitude} className="h-40 rounded-[1.5rem]" />
                  </div>
                )}
                <CardContent className="p-6 flex gap-3 bg-white">
                  {job.status === 'Pending' ? (
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 h-16 rounded-[1.5rem] font-black shadow-2xl text-base transition-transform active:scale-95 italic uppercase tracking-tight" onClick={() => updateStatus(job.id, "In Progress")}>
                      START CLEARANCE
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-[1.5rem] font-black shadow-2xl text-base transition-transform active:scale-95 italic uppercase tracking-tight" onClick={() => updateStatus(job.id, "Resolved")}>
                      CONFIRM RESOLUTION
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