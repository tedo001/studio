
"use client";

import { useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, updateDoc, doc, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, Loader2, MapPin, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function WorkerDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const jobsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "reports"), 
      where("status", "in", ["Pending", "In Progress"]),
      orderBy("timestamp", "desc")
    );
  }, [db]);

  const { data: jobs, loading } = useCollection(jobsQuery);

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

  return (
    <div className="flex flex-col min-h-screen bg-orange-50/20">
      <header className="bg-white border-b p-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-2 text-orange-600">
          <HardHat className="h-6 w-6" />
          <h1 className="text-xl font-bold font-headline uppercase tracking-tighter">Field Duty Feed</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full hover:bg-orange-50">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto pb-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest">Active Cleaning Jobs</h2>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-orange-200 text-orange-600 bg-orange-50">Live Sync</Badge>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Retrieving assigned tasks...</p>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-16 space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <p className="font-black text-slate-600 uppercase tracking-tighter text-lg">Area Clear</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No pending reports in this sector.</p>
              </div>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden border-none shadow-lg rounded-3xl bg-white mb-6 group transition-all duration-300 hover:shadow-xl">
                <CardHeader className="p-5 bg-white border-b">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={job.severity === 'High' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-black px-2 h-5">
                          {job.severity} Urgency
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] uppercase font-black h-5 ${job.status === 'In Progress' ? 'border-blue-200 text-blue-600 bg-blue-50' : ''}`}>
                          {job.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-black font-headline pt-1">{job.aiCategory}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        {job.locationName || "Detecting Spot..."}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl text-[10px] font-black uppercase border-2 shadow-sm" onClick={() => {
                      if(job.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`);
                    }}>
                      <Navigation className="h-3.5 w-3.5 mr-1.5" /> GPS Link
                    </Button>
                  </div>
                </CardHeader>
                <div className="relative h-52 w-full bg-slate-100">
                  <Image src={job.imageUrl} alt="Incident" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                {job.location && (
                  <div className="p-4 bg-slate-50/50 border-y">
                     <MapPreview latitude={job.location.latitude} longitude={job.location.longitude} className="h-36" />
                  </div>
                )}
                <CardContent className="p-5 flex gap-3">
                  {job.status === 'Pending' ? (
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl font-black shadow-lg text-sm transition-transform active:scale-95" onClick={() => updateStatus(job.id, "In Progress")}>
                      DEPLOY TO SITE
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black shadow-lg text-sm transition-transform active:scale-95" onClick={() => updateStatus(job.id, "Resolved")}>
                      MARK AS CLEANED
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
