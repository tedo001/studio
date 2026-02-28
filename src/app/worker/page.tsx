"use client";

import { useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, Loader2, MapPin } from "lucide-react";
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
      where("status", "in", ["Pending", "In Progress"])
    );
  }, [db]);

  const { data: jobs, loading } = useCollection(jobsQuery);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    const docRef = doc(db, "reports", id);
    const data = { status: newStatus };
    
    updateDoc(docRef, data)
      .then(() => {
        toast({ title: "Status Updated", description: `Job marked as ${newStatus}` });
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
    <div className="flex flex-col min-h-screen bg-orange-50/30">
      <header className="bg-white border-b p-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-2 text-orange-600">
          <HardHat className="h-6 w-6" />
          <h1 className="text-xl font-bold font-headline">Field Duty</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="rounded-full">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Active Cleaning Jobs</h2>
          
          {loading ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading field tasks...</p>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-12 space-y-2 opacity-50 bg-white rounded-3xl border-2 border-dashed">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
              <p className="font-medium">All clear! No pending issues.</p>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden border-none shadow-md rounded-2xl bg-white">
                <CardHeader className="p-4 bg-white border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={job.severity === 'High' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold">
                        {job.severity} Urgency
                      </Badge>
                      <CardTitle className="text-md mt-2 font-bold">{job.aiCategory}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold" onClick={() => {
                      if(job.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`);
                    }}>
                      <Navigation className="h-3.5 w-3.5 mr-1" /> Navigation
                    </Button>
                  </div>
                </CardHeader>
                <div className="relative h-48 w-full bg-slate-100">
                  <Image src={job.imageUrl} alt="task" fill className="object-cover" />
                </div>
                {job.location && (
                  <div className="p-3 bg-slate-50 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Job Location</span>
                    </div>
                    <MapPreview latitude={job.location.latitude} longitude={job.location.longitude} className="h-32 rounded-xl" />
                  </div>
                )}
                <CardContent className="p-4 flex gap-3">
                  {job.status === 'Pending' ? (
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl font-bold shadow-lg" onClick={() => updateStatus(job.id, "In Progress")}>
                      Start Cleanup
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold shadow-lg" onClick={() => updateStatus(job.id, "Resolved")}>
                      Mark as Resolved
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
