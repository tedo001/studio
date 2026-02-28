"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, FileText, Settings, LogOut, HardHat, Home, Search, Loader2 } from "lucide-react";
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

  // Memoized collection references to prevent redundant loading
  const reportsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "reports"), orderBy("timestamp", "desc"));
  }, [db]);

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, "users");
  }, [db]);

  const { data: reports, loading: reportsLoading } = useCollection(reportsQuery);
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

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
      toast({ title: "Authorized", description: `Worker ${workerId} enrolled successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Authorization failed." });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline">Operations Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-9 rounded-xl">
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5">
            <LogOut className="h-4 w-4 mr-1" /> Exit
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white border-2 rounded-2xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Live Status</TabsTrigger>
            <TabsTrigger value="workers" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Workforce</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Case List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-2 bg-primary/5">
                  <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Incidents</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-4xl font-black text-primary">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-2 bg-blue-50">
                  <CardTitle className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Field Staff</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-4xl font-black text-blue-600">
                    {users?.filter((u: any) => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4 py-4">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Enroll Field Worker
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Official Email</Label>
                  <Input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="name@cleanmadurai.gov" className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Field ID</Label>
                    <Input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="W-101" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Secure PIN</Label>
                    <Input value={workerPass} type="password" onChange={e => setWorkerPass(e.target.value)} placeholder="••••" className="h-12 rounded-xl" />
                  </div>
                </div>
                <Button className="w-full h-14 rounded-2xl font-bold shadow-lg mt-2 transition-transform active:scale-95" onClick={handleAddWorker} disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize Workforce Account"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3 pt-4">
              <h3 className="font-black text-[10px] text-slate-400 px-1 uppercase tracking-widest">Active Roster</h3>
              {users?.filter((u: any) => u.role === 'worker').map((w: any, i: number) => (
                <Card key={i} className="border-none shadow-sm rounded-2xl hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                        <HardHat className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-800">{w.workerId}</p>
                        <p className="text-xs text-muted-foreground">{w.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold border-green-200 text-green-600 bg-green-50 uppercase h-6 px-2">Verified</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 py-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search cases..." className="pl-10 h-12 rounded-2xl bg-white border-none shadow-sm" />
            </div>
            {reports?.map((r: any, i: number) => (
              <Card key={i} className="overflow-hidden border-none shadow-md rounded-2xl bg-white group hover:shadow-xl transition-shadow">
                <CardContent className="p-0 flex">
                  <div className="relative w-28 h-28 shrink-0 bg-slate-100">
                    <Image src={r.imageUrl} fill alt="report" className="object-cover" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800 truncate pr-2">{r.aiCategory}</h4>
                      <Badge variant="secondary" className={`text-[9px] h-5 px-2 font-black ${r.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600'} uppercase tracking-tighter`}>{r.severity}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status: <span className={r.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{r.status}</span></span>
                      <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold text-primary hover:no-underline">Manage</Button>
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
