
"use client";

import { useState } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, FileText, Settings, LogOut, HardHat, Home, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [workerId, setWorkerId] = useState("");
  const [workerPass, setWorkerPass] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: reports, loading: reportsLoading } = useCollection(db ? collection(db, "reports") : null);
  const { data: users, loading: usersLoading } = useCollection(db ? collection(db, "users") : null);

  const handleAddWorker = async () => {
    if (!workerId || !workerPass || !workerEmail || !db) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, "users"), {
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
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline">Admin Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-8">
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-8 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {users?.filter((u: any) => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4 py-4">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Add New Worker
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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
                <Button className="w-full h-12" onClick={handleAddWorker} disabled={isAdding}>
                  {isAdding ? "Enrolling..." : "Enroll Worker"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-xs text-muted-foreground px-1 uppercase">Active Workforce</h3>
              {users?.filter((u: any) => u.role === 'worker').map((w: any, i: number) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <HardHat className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{w.workerId}</p>
                        <p className="text-xs text-muted-foreground">{w.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 py-4">
            {reports?.map((r: any, i: number) => (
              <Card key={i} className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-0 flex">
                  <div className="relative w-24 h-24 shrink-0 bg-slate-200">
                    <Image src={r.imageUrl} fill alt="report" className="object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm truncate max-w-[150px]">{r.aiCategory}</h4>
                      <Badge variant="secondary" className="text-[9px] px-1.5 h-4">{r.severity}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">Status: {r.status}</span>
                      <Button variant="link" size="sm" className="h-auto p-0 text-[10px]">Assign Worker</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </main>
        </Tabs>
      </main>
    </div>
  );
}
