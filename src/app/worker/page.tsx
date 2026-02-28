
"use client";

import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogOut, CheckCircle2, Navigation, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function WorkerDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Workers see reports assigned to them or general pending tasks
  const { data: jobs, loading } = useCollection(
    query(collection(db!, "reports"), where("status", "in", ["Pending", "In Progress"]))
  );

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db!, "reports", id), { status: newStatus });
      toast({ title: "Status Updated", description: `Job marked as ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-orange-50/30">
      <header className="bg-white border-b p-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-orange-600">
          <HardHat className="h-6 w-6" />
          <h1 className="text-xl font-bold font-headline">Field Duty</h1>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Active Cleaning Jobs</h2>
          
          {loading ? (
            <p>Loading tasks...</p>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-12 space-y-2 opacity-50">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
              <p className="font-medium">All clear! No pending issues.</p>
            </div>
          ) : (
            jobs.map((job: any) => (
              <Card key={job.id} className="overflow-hidden border-orange-100">
                <CardHeader className="p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={job.severity === 'High' ? 'destructive' : 'secondary'}>
                        {job.severity} Urgency
                      </Badge>
                      <CardTitle className="text-md mt-2">{job.aiCategory}</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => {
                      if(job.location) window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`);
                    }}>
                      <Navigation className="h-4 w-4 mr-1" /> GPS
                    </Button>
                  </div>
                </CardHeader>
                <div className="relative h-40 w-full bg-slate-200">
                  <Image src={job.imageUrl} alt="task" fill className="object-cover" />
                </div>
                <CardContent className="p-4 bg-white flex gap-2">
                  {job.status === 'Pending' ? (
                    <Button className="w-full bg-orange-600" onClick={() => updateStatus(job.id, "In Progress")}>
                      Start Cleanup
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600" onClick={() => updateStatus(job.id, "Resolved")}>
                      Mark as Done
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
