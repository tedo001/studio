
"use client";

import { useState } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, UserPlus, FileText, Settings, LogOut, HardHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [workerId, setWorkerId] = useState("");
  const [workerPass, setWorkerPass] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");

  const { data: reports } = useCollection(collection(db!, "reports"));
  const { data: users } = useCollection(collection(db!, "users"));

  const handleAddWorker = async () => {
    if (!workerId || !workerPass || !workerEmail) return;

    try {
      // Logic to create a worker profile
      await addDoc(collection(db!, "users"), {
        email: workerEmail,
        role: "worker",
        workerId,
        workerPass,
        createdAt: new Date().toISOString()
      });

      setWorkerId("");
      setWorkerPass("");
      setWorkerEmail("");
      toast({ title: "Success", description: `Worker ${workerId} added successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add worker." });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b p-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Admin Console</h1>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")}>
          <LogOut className="h-5 w-5 mr-2" /> Logout
        </Button>
      </header>

      <main className="p-6 space-y-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Manage Workers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Workers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Add New Worker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Worker Email</Label>
                  <Input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="worker@clean.mdu" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assign ID</Label>
                    <Input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="W-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Set PIN</Label>
                    <Input value={workerPass} type="password" onChange={e => setWorkerPass(e.target.value)} placeholder="1234" />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddWorker}>Enroll Worker</Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-muted-foreground px-1 uppercase">Active Workforce</h3>
              {users?.filter(u => u.role === 'worker').map((w, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HardHat className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-bold">{w.workerId}</p>
                        <p className="text-xs text-muted-foreground">{w.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 py-4">
            {reports?.map((r, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0 flex">
                  <div className="relative w-24 h-24 shrink-0">
                    <Image src={r.imageUrl} fill alt="report" className="object-cover" />
                  </div>
                  <div className="p-3 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm">{r.aiCategory}</h4>
                      <Badge variant="secondary" className="text-[10px]">{r.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">Status: {r.status}</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs">Assign Worker</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
