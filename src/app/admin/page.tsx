"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, LogOut, HardHat, Loader2, MapPin, AlertCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [workerId, setWorkerId] = useState("");
  const [workerPass, setWorkerPass] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Optimized memoization: Wait for authenticated user before querying
  const reportsRef = useMemoFirebase(() => (db && user) ? collection(db, "reports") : null, [db, user]);
  const usersRef = useMemoFirebase(() => (db && user) ? collection(db, "users") : null, [db, user]);

  const { data: reports, isLoading: reportsLoading } = useCollection(reportsRef);
  const { data: users, isLoading: usersLoading } = useCollection(usersRef);

  const handleAddWorker = async () => {
    if (!workerEmail || !workerId || !workerPass) {
      toast({ title: "Input Required", description: "All personnel fields (Email, ID, PIN) are required.", variant: "destructive" });
      return;
    }

    if (!db) {
      toast({ title: "Database Offline", description: "Firestore is not connected.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const usersCollection = collection(db, "users");
    const data = {
      email: workerEmail.toLowerCase().trim(),
      role: "worker",
      workerId: workerId.trim(),
      workerPass: workerPass.trim(),
      enrolledAt: serverTimestamp()
    };

    addDoc(usersCollection, data)
      .then(() => {
        setWorkerId("");
        setWorkerPass("");
        setWorkerEmail("");
        toast({ title: "Personnel Enrolled", description: `Staff ID ${data.workerId} is now live in the system.` });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: usersCollection.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-slate-800 p-8 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center space-x-4 text-white">
          <div className="bg-primary/20 p-3 rounded-2xl animate-anti-gravity">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-2xl font-black font-headline tracking-tighter uppercase italic leading-none">Operations Command</h1>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.5em] italic">Google Anti-Gravity Framework</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-[10px] font-black uppercase text-slate-400 hover:text-white rounded-xl h-10">
            <LogOut className="h-4 w-4 mr-2" /> Exit Command
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-8 max-w-lg mx-auto w-full">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-20 bg-white border-4 border-slate-100 rounded-[3rem] p-2 shadow-xl mb-8">
            <TabsTrigger value="overview" className="rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Live Ops</TabsTrigger>
            <TabsTrigger value="workers" className="rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Personnel</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Incident Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 py-4 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
                <CardHeader className="pb-2 bg-primary/5 group-hover:bg-primary/10 transition-colors p-8">
                  <CardTitle className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 italic">
                    <TrendingUp className="h-4 w-4" /> Global Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 p-8">
                  <p className="text-6xl font-black text-primary italic tracking-tighter">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
                <CardHeader className="pb-2 bg-blue-50 group-hover:bg-blue-100 transition-colors p-8">
                  <CardTitle className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                    <HardHat className="h-4 w-4" /> Field Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 p-8">
                  <p className="text-6xl font-black text-blue-600 italic tracking-tighter">
                    {users?.filter((u: any) => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-10 py-4 animate-in slide-in-from-right-12 duration-500">
            <Card className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-10">
                <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase italic">
                  <UserPlus className="h-8 w-8 text-primary" /> Personnel Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Official Staff Email</Label>
                  <Input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="sam@gmail.com" className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Staff ID</Label>
                    <Input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="w122" className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Secure PIN</Label>
                    <Input value={workerPass} type="password" onChange={e => setWorkerPass(e.target.value)} placeholder="•••" className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
                  </div>
                </div>
                <Button className="w-full h-20 rounded-[2rem] font-black shadow-2xl mt-4 transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800 uppercase italic tracking-tight text-lg" onClick={handleAddWorker} disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin h-8 w-8" /> : "Verify & Enroll Personnel"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <h3 className="font-black text-[10px] text-slate-400 px-4 uppercase tracking-[0.4em] italic">Authorized Field Roster</h3>
              {usersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
              ) : users?.filter((u: any) => u.role === 'worker').length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em] italic">No verified staff accounts</p>
                </div>
              ) : (
                users?.filter((u: any) => u.role === 'worker').map((w: any, i: number) => (
                  <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:scale-[1.03] transition-transform duration-300">
                    <CardContent className="p-8 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
                          <HardHat className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-xl text-slate-900 uppercase italic tracking-tighter">{w.workerId}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">{w.email}</p>
                        </div>
                      </div>
                      <Badge className="text-[10px] font-black border-none text-green-600 bg-green-50 uppercase h-8 px-5 shadow-sm italic rounded-xl">Verified</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-8 py-4 animate-in slide-in-from-right-12 duration-500">
            {reportsLoading ? (
              <div className="flex flex-col items-center py-32 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-6 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Syncing Central Database...</p>
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white rounded-[4rem] border-8 border-dashed border-slate-50">
                <AlertCircle className="h-20 w-20 text-slate-100" />
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Zero Incidents in Sector</p>
              </div>
            ) : (
              reports.map((r: any, i: number) => (
                <Card key={i} className="overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white mb-10 group transition-all duration-500 hover:translate-y-[-8px]">
                  <CardContent className="p-0 flex flex-col">
                    <div className="flex p-6 gap-6">
                      <div className="relative w-40 h-40 shrink-0 bg-slate-100 rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-white">
                        <Image src={r.imageUrl} fill alt="incident" className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2 text-left">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-2xl text-slate-900 italic tracking-tighter uppercase">{r.aiCategory}</h4>
                          <Badge variant="secondary" className={`text-[10px] h-7 px-4 font-black ${r.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'} uppercase shrink-0 rounded-full italic`}>{r.severity} Priority</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          {r.locationName || "Location Syncing..."}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status: <span className={r.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{r.status}</span></span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-[11px] font-black text-primary hover:no-underline uppercase italic tracking-tighter">Secure Intel</Button>
                        </div>
                      </div>
                    </div>
                    {r.location && (
                      <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                        <MapPreview latitude={r.location.latitude} longitude={r.location.longitude} className="h-56 rounded-[2rem] shadow-inner" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
