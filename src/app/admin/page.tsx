"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, Home, LogOut, HardHat, Search, Loader2, MapPin, AlertCircle, TrendingUp, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPreview } from "@/components/MapPreview";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function AdminDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [workerId, setWorkerId] = useState("");
  const [workerPass, setWorkerPass] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
    if (!workerId || !workerPass || !workerEmail || !db) {
      toast({ title: "Incomplete Form", description: "All personnel fields are required.", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const usersCollection = collection(db, "users");
    const data = {
      email: workerEmail,
      role: "worker",
      workerId,
      workerPass,
      enrolledAt: serverTimestamp()
    };

    addDoc(usersCollection, data)
      .then(() => {
        setWorkerId("");
        setWorkerPass("");
        setWorkerEmail("");
        toast({ title: "Personnel Enrolled", description: `Worker ${workerId} is now active.` });
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
      <header className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between sticky top-0 z-20 shadow-2xl">
        <div className="flex items-center space-x-3 text-white">
          <div className="bg-primary/20 p-2 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black font-headline tracking-tighter uppercase italic">Ops Command</h1>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic">Government Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-[10px] font-black uppercase text-slate-400 hover:text-white rounded-xl">
            <Home className="h-4 w-4 mr-2" /> Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-[10px] font-black uppercase text-red-400 hover:bg-red-950/30 rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> Exit
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-8 max-w-lg mx-auto w-full">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-16 bg-white border-2 border-slate-100 rounded-[2rem] p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Live Ops</TabsTrigger>
            <TabsTrigger value="workers" className="rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Staff</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all italic">Case List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 py-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                <CardHeader className="pb-2 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <CardTitle className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" /> Total Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-5xl font-black text-primary italic tracking-tighter">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                <CardHeader className="pb-2 bg-blue-50 group-hover:bg-blue-100 transition-colors">
                  <CardTitle className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <HardHat className="h-3 w-3" /> Active Duty
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-5xl font-black text-blue-600 italic tracking-tighter">
                    {users?.filter((u: any) => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2 italic">Global Activity Map</Label>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-none">
                <p className="text-xs font-black mb-4 text-slate-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> {reports?.[0]?.locationName || "Monitoring Madurai Limits..."}
                </p>
                {reports?.[0]?.location ? (
                  <MapPreview latitude={reports[0].location.latitude} longitude={reports[0].location.longitude} className="h-72 rounded-[2rem] shadow-inner" />
                ) : (
                  <div className="h-72 bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Awaiting Incident Data</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-8 py-6 animate-in slide-in-from-right-8 duration-500">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3 uppercase italic italic">
                  <UserPlus className="h-6 w-6 text-primary" /> Personnel Enrollment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Official Email</Label>
                  <Input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="staff@madurai.gov" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Staff ID</Label>
                    <Input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="MDU-W-101" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Secure PIN</Label>
                    <Input value={workerPass} type="password" onChange={e => setWorkerPass(e.target.value)} placeholder="••••" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                  </div>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] font-black shadow-xl mt-4 transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800 uppercase italic tracking-tight" onClick={handleAddWorker} disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin h-6 w-6" /> : "Verify & Enroll Staff"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-black text-[10px] text-slate-400 px-2 uppercase tracking-[0.2em] italic">Authorized Roster</h3>
              {users?.filter((u: any) => u.role === 'worker').length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No verified personnel found</p>
                </div>
              ) : (
                users?.filter((u: any) => u.role === 'worker').map((w: any, i: number) => (
                  <Card key={i} className="border-none shadow-lg rounded-[2rem] bg-white hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
                          <HardHat className="h-7 w-7 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-black text-base text-slate-900 uppercase italic tracking-tight">{w.workerId}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{w.email}</p>
                        </div>
                      </div>
                      <Badge className="text-[9px] font-black border-none text-green-600 bg-green-50 uppercase h-7 px-4 shadow-sm italic">Verified</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 py-6 animate-in slide-in-from-right-8 duration-500">
            <div className="relative mb-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input placeholder="Search global case records..." className="pl-12 h-16 rounded-[1.5rem] bg-white border-none shadow-2xl text-sm font-bold placeholder:font-normal placeholder:italic" />
            </div>
            
            {reportsLoading ? (
              <div className="flex flex-col items-center py-24 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest">Syncing Command Database...</p>
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <AlertCircle className="h-16 w-16 text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No Incidents Reported in Sector</p>
              </div>
            ) : (
              reports.map((r: any, i: number) => (
                <Card key={i} className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white mb-8 group transition-all duration-500 hover:translate-y-[-4px]">
                  <CardContent className="p-0 flex flex-col">
                    <div className="flex p-4 gap-4">
                      <div className="relative w-32 h-32 shrink-0 bg-slate-100 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                        <Image src={r.imageUrl} fill alt="incident" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-lg text-slate-900 italic tracking-tighter uppercase">{r.aiCategory}</h4>
                          <Badge variant="secondary" className={`text-[9px] h-6 px-3 font-black ${r.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'} uppercase shrink-0 rounded-full italic`}>{r.severity} Priority</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {r.locationName || "Madurai Area"}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status: <span className={r.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{r.status}</span></span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black text-primary hover:no-underline uppercase italic tracking-tighter">View Intel</Button>
                        </div>
                      </div>
                    </div>
                    {r.location && (
                      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                        <MapPreview latitude={r.location.latitude} longitude={r.location.longitude} className="h-44 rounded-[2rem] shadow-inner" />
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