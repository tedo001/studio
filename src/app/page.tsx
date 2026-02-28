
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, HardHat, Leaf, ArrowRight, Loader2, Globe, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type Role = 'admin' | 'user' | 'worker' | null;

export default function LandingPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
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
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminLogin = async () => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      toast({ title: "Fields Required", description: "Please enter your government email and master key.", variant: "destructive" });
      return;
    }
    
    setIsLoggingIn(true);
    
    // Validated credentials: admin@gov.in / madurai2024
    if ((cleanEmail === "admin@madurai.gov" || cleanEmail === "admin@gov.in") && cleanPass === "madurai2024") {
      try {
        if (user && db) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, { email: cleanEmail, role: "admin" }, { merge: true });
        }
        toast({ title: "Command Authorized", description: "Entering Google Anti-Gravity Operations Center." });
        router.push("/admin");
      } catch (e) {
        // Even if Firestore write fails, allow entry for local prototype preview
        router.push("/admin");
      }
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
    if (!auth || !db) {
      toast({ variant: "destructive", title: "System Not Ready", description: "Firebase initialization in progress..." });
      return;
    }
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { 
        email: currentUser.email, 
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        role: "user" 
      }, { merge: true });
      
      toast({ title: "Identity Verified", description: `Welcome, ${currentUser.displayName}.` });
      router.push("/user");
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: "Failed to authenticate with Google. Ensure popups are enabled.",
      });
      setIsLoggingIn(false);
    }
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
        toast({ title: "Duty Commenced", description: `Access granted for Staff ID ${workerId}.` });
        router.push("/worker");
      } else {
        toast({
          variant: "destructive",
          title: "Auth Failed",
          description: "No verified workforce record matches these credentials.",
        });
        setIsLoggingIn(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Database is unreachable. Please retry." });
      setIsLoggingIn(false);
    }
  };

  if (authLoading && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <div className="animate-anti-gravity bg-primary/10 p-10 rounded-[4rem]">
          <Leaf className="h-20 w-20 text-primary" />
        </div>
        <p className="mt-8 text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Anti-Gravity Gov Initializing...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-28 w-28 bg-primary/10 rounded-[3rem] flex items-center justify-center shadow-inner animate-anti-gravity">
          <Leaf className="h-14 w-14 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase italic leading-none">
            Madurai <span className="text-slate-800">CleanUp</span>
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto text-[9px] font-black uppercase tracking-[0.4em] italic opacity-60">
            Google Anti-Gravity Framework
          </p>
        </div>
      </header>

      <div className="grid gap-8 flex-1 max-w-sm mx-auto w-full">
        {!role ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Card className="cursor-pointer hover:border-blue-500 transition-all border-2 rounded-[2.5rem] group shadow-xl bg-white overflow-hidden active:scale-95" onClick={() => setRole('user')}>
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tight italic">Citizen</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Report & Track</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-2 transition-transform" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-all border-2 rounded-[2.5rem] group shadow-xl bg-white overflow-hidden active:scale-95" onClick={() => setRole('worker')}>
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HardHat className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tight italic">Workforce</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Duty & Logs</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-2 transition-transform" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-slate-800 transition-all border-2 rounded-[2.5rem] group shadow-xl bg-white overflow-hidden active:scale-95" onClick={() => setRole('admin')}>
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <div className="h-16 w-16 bg-slate-100 text-slate-800 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tight italic">Ops Center</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Admin Command</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-2 transition-transform" />
              </CardContent>
            </Card>
          </div>
        ) : role === 'admin' ? (
          <Card className="animate-in slide-in-from-right-12 duration-700 rounded-[3rem] shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-10 text-center relative">
              <Button variant="ghost" className="absolute left-4 top-10 h-8 px-2 text-[10px] font-black uppercase text-slate-500 hover:text-white" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle className="font-headline font-black text-3xl uppercase tracking-tighter italic">Command Auth</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Gov Credentials</Label>
                <Input placeholder="admin@gov.in" value={email} onChange={(e) => setEmail(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Master Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
              </div>
              <Button className="w-full h-20 font-black rounded-3xl shadow-2xl mt-4 bg-slate-900 hover:bg-slate-800 transition-transform active:scale-95 italic text-lg" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-8 w-8" /> : "ENTER OPS CENTER"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in slide-in-from-right-12 duration-700 rounded-[3rem] shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-orange-600 text-white p-10 text-center relative">
              <Button variant="ghost" className="absolute left-4 top-10 h-8 px-2 text-[10px] font-black uppercase text-orange-200 hover:text-white" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle className="font-headline font-black text-3xl uppercase tracking-tighter italic">Duty Login</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Staff ID</Label>
                <Input placeholder="MDU-W-101" value={workerId} onChange={e => setWorkerId(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Secure PIN</Label>
                <Input type="password" placeholder="••••" value={workerPass} onChange={e => setWorkerPass(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none shadow-inner font-bold" />
              </div>
              <Button className="w-full h-20 font-black bg-orange-600 hover:bg-orange-700 rounded-3xl shadow-2xl mt-4 transition-transform active:scale-95 italic text-lg" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-8 w-8" /> : "AUTHENTICATE"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="p-14 bg-blue-50/50 rounded-[4rem] text-center space-y-5 border-2 border-dashed border-blue-100 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-100/20 scale-150 group-hover:scale-100 transition-transform duration-1000 rotate-12" />
              <User className="h-24 w-24 text-blue-600 mx-auto animate-anti-gravity relative z-10" />
              <h2 className="text-3xl font-black font-headline tracking-tighter uppercase italic relative z-10">Citizen Portal</h2>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] relative z-10 italic">Live Infrastructure Reporting</p>
            </div>
            <Button className="w-full h-24 text-2xl font-black rounded-[3rem] shadow-2xl transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700 italic flex items-center justify-center gap-4" onClick={startAsUser} disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="animate-spin h-10 w-10" /> : (
                <>
                  <Globe className="h-8 w-8" />
                  GOOGLE SIGN-IN
                </>
              )}
            </Button>
            <Button variant="ghost" className="w-full font-black text-slate-400 text-[10px] uppercase tracking-[0.5em] italic" onClick={() => setRole(null)}>Return to Selection</Button>
          </div>
        )}
      </div>

      <footer className="mt-auto py-12 flex flex-col items-center space-y-5">
        <div className="flex items-center gap-6 opacity-40">
           <Globe className="h-5 w-5 hover:text-primary transition-colors cursor-pointer" />
           <Github className="h-5 w-5 hover:text-primary transition-colors cursor-pointer" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[9px] text-muted-foreground font-black tracking-[0.4em] uppercase">© 2024 Madurai Municipal Corporation</p>
          <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] italic">Powered by Google Anti-Gravity Engine</p>
        </div>
      </footer>
    </div>
  );
}
