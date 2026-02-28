
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
import { ShieldCheck, UserPlus, Home, LogOut, HardHat, Search, Loader2, MapPin, AlertCircle, TrendingUp } from "lucide-react";
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

  // Memoize queries for stability and performance
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
      toast({ title: "Validation Error", description: "All worker fields are required.", variant: "destructive" });
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
        toast({ title: "Workforce Updated", description: `Worker ${workerId} enrolled successfully.` });
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
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline tracking-tight">Ops Command</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-9 rounded-xl">
            <Home className="h-4 w-4 mr-1" /> Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-xs h-9 rounded-xl text-destructive hover:bg-destructive/5">
            <LogOut className="h-4 w-4 mr-1" /> Exit
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white border-2 rounded-2xl p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Live Feed</TabsTrigger>
            <TabsTrigger value="workers" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Personnel</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Incident List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-2 bg-primary/5">
                  <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" /> Total Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-4xl font-black text-primary">{reports?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-2 bg-blue-50">
                  <CardTitle className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <HardHat className="h-3 w-3" /> Active Workers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-4xl font-black text-blue-600">
                    {users?.filter((u: any) => u.role === 'worker').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
            {reports?.[0]?.location && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Global Activity Map</Label>
                <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100">
                  <p className="text-xs font-bold mb-3 text-slate-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> {reports[0].locationName || "Recent Incident Spot"}
                  </p>
                  <MapPreview latitude={reports[0].location.latitude} longitude={reports[0].location.longitude} className="h-64" />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workers" className="space-y-4 py-4 animate-in slide-in-from-right-4 duration-300">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Create Workforce Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Assigned Email</Label>
                  <Input value={workerEmail} onChange={e => setWorkerEmail(e.target.value)} placeholder="staff@madurai.gov" className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Staff ID</Label>
                    <Input value={workerId} onChange={e => setWorkerId(e.target.value)} placeholder="MDU-W-101" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Secret Passcode</Label>
                    <Input value={workerPass} type="password" onChange={e => setWorkerPass(e.target.value)} placeholder="••••" className="h-12 rounded-xl" />
                  </div>
                </div>
                <Button className="w-full h-14 rounded-2xl font-bold shadow-lg mt-2 transition-transform active:scale-95" onClick={handleAddWorker} disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Enroll Personnel"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3 pt-4">
              <h3 className="font-black text-[10px] text-slate-400 px-1 uppercase tracking-widest">Authorized Roster</h3>
              {users?.filter((u: any) => u.role === 'worker').map((w: any, i: number) => (
                <Card key={i} className="border-none shadow-sm rounded-2xl hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                        <HardHat className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-800">{w.workerId}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{w.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold border-green-200 text-green-600 bg-green-50 uppercase h-6">Verified</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 py-4 animate-in slide-in-from-right-4 duration-300">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search case records..." className="pl-10 h-12 rounded-2xl bg-white border-none shadow-sm" />
            </div>
            
            {reportsLoading ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Syncing centralized database...</p>
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed">
                <AlertCircle className="h-12 w-12 text-slate-200" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Incidents Filed Yet</p>
              </div>
            ) : (
              reports.map((r: any, i: number) => (
                <Card key={i} className="overflow-hidden border-none shadow-md rounded-2xl bg-white mb-6 group transition-all">
                  <CardContent className="p-0 flex flex-col">
                    <div className="flex">
                      <div className="relative w-28 h-28 shrink-0 bg-slate-100">
                        <Image src={r.imageUrl} fill alt="incident" className="object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-800 truncate pr-2">{r.aiCategory}</h4>
                          <Badge variant="secondary" className={`text-[9px] h-5 px-2 font-black ${r.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600'} uppercase shrink-0`}>{r.severity}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold truncate mt-1">
                          <MapPin className="h-3 w-3 inline mr-1 text-primary" />
                          {r.locationName || "Madurai Area"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status: <span className={r.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{r.status}</span></span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold text-primary hover:no-underline">Details</Button>
                        </div>
                      </div>
                    </div>
                    {r.location && (
                      <div className="p-3 border-t bg-slate-50/50">
                        <MapPreview latitude={r.location.latitude} longitude={r.location.longitude} className="h-36 rounded-xl" />
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
