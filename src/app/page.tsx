
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
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    
    // In real world, this should be a Firebase Auth check or admin claim check
    if (email === "admin@madurai.gov" && password === "madurai2024") {
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { email, role: "admin" }, { merge: true }).catch(() => {});
      }
      router.push("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "Invalid credentials for government portal.",
      });
      setIsLoggingIn(false);
    }
  };

  const startAsUser = async () => {
    setIsLoggingIn(true);
    if (user && db) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { email: user.email || "anonymous@madurai.gov", role: "user" }, { merge: true }).catch(() => {});
    }
    router.push("/user");
  };

  const handleWorkerLogin = async () => {
    if (!workerId || !workerPass || !db) return;
    setIsLoggingIn(true);
    
    try {
      // Query the users collection for matching worker credentials
      const q = query(
        collection(db, "users"), 
        where("workerId", "==", workerId), 
        where("workerPass", "==", workerPass),
        where("role", "==", "worker")
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({ title: "Welcome to Shift", description: `Authorized as ${workerId}` });
        router.push("/worker");
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "No matching worker credentials found.",
        });
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Auth Error", description: "Verification failed. Try again." });
      setIsLoggingIn(false);
    }
  };

  if ((authLoading) && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Leaf className="h-16 w-16 text-primary animate-bounce mb-4" />
        <p className="text-muted-foreground font-medium mb-8">Madurai CleanUp Initializing...</p>
        <Button variant="outline" size="sm" onClick={() => setForceShowUI(true)} className="rounded-xl">
          <RefreshCcw className="h-3 w-3 mr-2" /> Skip Wait
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-10 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 shadow-inner">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
            Madurai CleanUp
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">
            Digital Governance for a cleaner tomorrow.
          </p>
        </div>
      </header>

      <div className="grid gap-4 flex-1">
        {!db && (
          <Alert className="bg-orange-50 border-orange-200 mb-4 rounded-2xl">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Demo Sandbox</AlertTitle>
            <AlertDescription className="text-[11px]">
              Firebase is disconnected. Connect project to enable real database sync.
            </AlertDescription>
          </Alert>
        )}

        {!role ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="cursor-pointer hover:border-primary transition-all border-2 rounded-2xl group shadow-sm" onClick={() => setRole('user')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Citizen Portal</h3>
                    <p className="text-xs text-muted-foreground">Report environmental issues</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-all border-2 rounded-2xl group shadow-sm" onClick={() => setRole('worker')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HardHat className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Workforce Portal</h3>
                    <p className="text-xs text-muted-foreground">Field task management</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-all border-2 rounded-2xl group shadow-sm" onClick={() => setRole('admin')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Gov Portal</h3>
                    <p className="text-xs text-muted-foreground">Operations & analytics</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        ) : role === 'admin' ? (
          <Card className="animate-in slide-in-from-right-4 duration-300 rounded-2xl shadow-xl">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs font-bold" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> EXIT PORTAL
              </Button>
              <CardTitle className="font-headline font-black text-2xl uppercase tracking-tighter">Authorized Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Government Email</Label>
                <Input placeholder="admin@madurai.gov" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Master Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <Button className="w-full h-14 font-black rounded-xl shadow-lg mt-2" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5" /> : "VERIFY CREDENTIALS"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in slide-in-from-right-4 duration-300 rounded-2xl shadow-xl">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs font-bold" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> EXIT PORTAL
              </Button>
              <CardTitle className="font-headline font-black text-2xl uppercase tracking-tighter">Duty Log-In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Worker ID</Label>
                <Input placeholder="MDU-W-101" value={workerId} onChange={e => setWorkerId(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">PIN</Label>
                <Input type="password" placeholder="••••" value={workerPass} onChange={e => setWorkerPass(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <Button className="w-full h-14 font-black bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg mt-2" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5" /> : "AUTHENTICATE & ENTER"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-10 bg-blue-50 rounded-3xl text-center space-y-4 border border-blue-100 shadow-inner">
              <User className="h-16 w-16 text-blue-600 mx-auto" />
              <h2 className="text-2xl font-black font-headline tracking-tighter uppercase">Citizen Access</h2>
              <p className="text-sm text-blue-600 font-bold">Public feed for environmental hygiene reporting.</p>
            </div>
            <Button className="w-full h-16 text-xl font-black rounded-2xl shadow-xl transition-transform active:scale-95" onClick={startAsUser} disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "ENTER CITIZEN FEED"}
            </Button>
            <Button variant="ghost" className="w-full font-bold text-muted-foreground" onClick={() => setRole(null)}>RETURN TO MAIN</Button>
          </div>
        )}
      </div>

      <footer className="mt-12 py-6 border-t text-center">
        <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">© 2024 Madurai Municipal Corporation</p>
      </footer>
    </div>
  );
}
