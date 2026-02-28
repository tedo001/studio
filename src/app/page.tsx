"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, HardHat, Leaf, ArrowRight, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Role = 'admin' | 'user' | 'worker' | null;

export default function LandingPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [workerId, setWorkerId] = useState("");
  const [workerPass, setWorkerPass] = useState("");
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [forceShowUI, setForceShowUI] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceShowUI(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    
    // Production logic: In a real app, this would use Firebase Auth with custom claims
    if (email === "admin@madurai.gov" && password === "madurai2024") {
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, { email, role: "admin" }, { merge: true });
      }
      router.push("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Unauthorized Access",
        description: "Invalid government credentials. Access denied.",
      });
      setIsLoggingIn(false);
    }
  };

  const startAsUser = async () => {
    setIsLoggingIn(true);
    if (user && db) {
      const userRef = doc(db, "users", user.uid);
      setDoc(userRef, { email: user.email || "citizen@madurai.gov", role: "user" }, { merge: true });
    }
    router.push("/user");
  };

  const handleWorkerLogin = async () => {
    if (!workerId || !workerPass || !db) {
      toast({ variant: "destructive", title: "Incomplete", description: "Worker ID and PIN required." });
      return;
    }
    setIsLoggingIn(true);
    
    try {
      const q = query(
        collection(db, "users"), 
        where("workerId", "==", workerId), 
        where("workerPass", "==", workerPass),
        where("role", "==", "worker")
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({ title: "Duty Commenced", description: `Welcome, ${workerId}. Dashboard loaded.` });
        router.push("/worker");
      } else {
        toast({
          variant: "destructive",
          title: "Auth Failed",
          description: "No verified worker record matches these credentials.",
        });
        setIsLoggingIn(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Database busy. Try again." });
      setIsLoggingIn(false);
    }
  };

  if (authLoading && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <div className="animate-anti-gravity bg-primary/10 p-8 rounded-[3rem]">
          <Leaf className="h-16 w-16 text-primary" />
        </div>
        <p className="mt-8 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Initializing Madurai CleanUp...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-10 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner animate-anti-gravity">
          <Leaf className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase italic">
            Madurai <span className="text-slate-800">CleanUp</span>
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto text-[10px] font-bold uppercase tracking-widest">
            Official Digital Governance Hub
          </p>
        </div>
      </header>

      <div className="grid gap-6 flex-1 max-w-sm mx-auto w-full">
        {!role ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="cursor-pointer hover:border-primary transition-all border-2 rounded-[2rem] group shadow-sm bg-white overflow-hidden" onClick={() => setRole('user')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight">Citizen</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Report & Track Incidents</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-all border-2 rounded-[2rem] group shadow-sm bg-white overflow-hidden" onClick={() => setRole('worker')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HardHat className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight">Workforce</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Duty Logs & Assignments</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-slate-800 transition-all border-2 rounded-[2rem] group shadow-sm bg-white overflow-hidden" onClick={() => setRole('admin')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight">Ops Center</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Government Admin</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </div>
        ) : role === 'admin' ? (
          <Card className="animate-in slide-in-from-right-8 duration-500 rounded-[2.5rem] shadow-2xl border-none">
            <CardHeader className="bg-slate-900 text-white rounded-t-[2.5rem] p-8">
              <Button variant="ghost" className="w-fit -ml-2 mb-4 h-8 px-2 text-[10px] font-black uppercase text-slate-400 hover:text-white" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-2 h-3 w-3" /> Back
              </Button>
              <CardTitle className="font-headline font-black text-2xl uppercase tracking-tighter italic">Authorized Command</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gov Email</Label>
                <Input placeholder="admin@madurai.gov" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Master Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
              </div>
              <Button className="w-full h-16 font-black rounded-2xl shadow-xl mt-4 bg-slate-900 hover:bg-slate-800" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "ENTER OPS CENTER"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in slide-in-from-right-8 duration-500 rounded-[2.5rem] shadow-2xl border-none">
            <CardHeader className="bg-orange-600 text-white rounded-t-[2.5rem] p-8">
              <Button variant="ghost" className="w-fit -ml-2 mb-4 h-8 px-2 text-[10px] font-black uppercase text-orange-200 hover:text-white" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-2 h-3 w-3" /> Back
              </Button>
              <CardTitle className="font-headline font-black text-2xl uppercase tracking-tighter italic">Duty Authentication</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Worker ID</Label>
                <Input placeholder="MDU-W-101" value={workerId} onChange={e => setWorkerId(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Secure PIN</Label>
                <Input type="password" placeholder="••••" value={workerPass} onChange={e => setWorkerPass(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
              </div>
              <Button className="w-full h-16 font-black bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-xl mt-4" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "AUTHENTICATE DUTY"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-12 bg-blue-50 rounded-[3rem] text-center space-y-4 border border-blue-100 shadow-inner">
              <User className="h-20 w-20 text-blue-600 mx-auto animate-anti-gravity" />
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase italic">Citizen Access</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Report hygiene & infrastructure issues live.</p>
            </div>
            <Button className="w-full h-20 text-xl font-black rounded-[2rem] shadow-2xl transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700" onClick={startAsUser} disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="animate-spin h-8 w-8" /> : "OPEN CITIZEN FEED"}
            </Button>
            <Button variant="ghost" className="w-full font-black text-muted-foreground text-[10px] uppercase tracking-widest" onClick={() => setRole(null)}>Return to Selection</Button>
          </div>
        )}
      </div>

      <footer className="mt-auto py-10 border-t text-center space-y-2">
        <p className="text-[10px] text-muted-foreground font-black tracking-[0.3em] uppercase">© 2024 Madurai Municipal Corporation</p>
        <p className="text-[9px] text-primary font-bold uppercase tracking-widest opacity-60 italic">Anti-Gravity Gov Systems Integrated</p>
      </footer>
    </div>
  );
}