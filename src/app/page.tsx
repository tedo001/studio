"use client";

import { useState } from "react";
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
  const { user, isUserLoading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workerIdInput, setWorkerIdInput] = useState("");
  const [workerPassInput, setWorkerPassInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async () => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      toast({ title: "Fields Required", description: "Enter government email and master key.", variant: "destructive" });
      return;
    }
    
    setIsLoggingIn(true);
    
    // Master Demo Credentials
    if ((cleanEmail === "admin@madurai.gov" || cleanEmail === "admin@gov.in") && cleanPass === "madurai2024") {
      if (user && db) {
        setDoc(doc(db, "users", user.uid), { email: cleanEmail, role: "admin" }, { merge: true });
      }
      toast({ title: "Command Authorized", description: "Entering Ops Center." });
      router.push("/admin");
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid government credentials." });
      setIsLoggingIn(false);
    }
  };

  const startAsUser = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, "users", result.user.uid), { 
        email: result.user.email, 
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: "user" 
      }, { merge: true });
      
      toast({ title: "Identity Verified", description: `Welcome, ${result.user.displayName}.` });
      router.push("/user");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign-In Failed", description: error.message });
      setIsLoggingIn(false);
    }
  };

  const handleWorkerLogin = async () => {
    if (!workerIdInput || !workerPassInput || !db) {
      toast({ variant: "destructive", title: "Fields Required", description: "Staff ID and PIN required." });
      return;
    }
    setIsLoggingIn(true);
    
    try {
      const q = query(
        collection(db, "users"), 
        where("workerId", "==", workerIdInput.trim()), 
        where("workerPass", "==", workerPassInput.trim())
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        toast({ title: "Duty Commenced", description: "Field access granted." });
        router.push("/worker");
      } else {
        toast({ variant: "destructive", title: "Auth Failed", description: "Invalid staff record." });
        setIsLoggingIn(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Retry connection." });
      setIsLoggingIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Loading Anti-Gravity Ops...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-16 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center shadow-inner animate-anti-gravity">
          <Leaf className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase italic leading-none">
            Madurai <span className="text-slate-800">CleanUp</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-[9px] font-black uppercase tracking-[0.4em] italic opacity-60">
            Gov Infrastructure Network
          </p>
        </div>
      </header>

      <div className="grid gap-6 flex-1 max-w-sm mx-auto w-full">
        {!role ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            {[
              { id: 'user', icon: User, title: 'Citizen', desc: 'Report & Track', color: 'blue' },
              { id: 'worker', icon: HardHat, title: 'Workforce', desc: 'Duty & Logs', color: 'orange' },
              { id: 'admin', icon: ShieldCheck, title: 'Ops Center', desc: 'Admin Command', color: 'slate' }
            ].map((r) => (
              <Card key={r.id} className="cursor-pointer hover:scale-[1.02] transition-transform border-2 rounded-[2.5rem] shadow-xl bg-white overflow-hidden active:scale-95" onClick={() => setRole(r.id as Role)}>
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center space-x-5">
                    <div className={`h-16 w-16 bg-${r.color}-100 text-${r.color}-600 rounded-3xl flex items-center justify-center`}>
                      <r.icon className="h-8 w-8" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-xl uppercase italic">{r.title}</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{r.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-500">
             <Button variant="ghost" onClick={() => setRole(null)} className="mb-6 text-[10px] font-black uppercase text-slate-400">
               <ArrowRight className="rotate-180 mr-2 h-4 w-4" /> Back to Selection
             </Button>
             
             {role === 'admin' && (
               <Card className="rounded-[3rem] shadow-2xl border-none overflow-hidden">
                 <CardHeader className="bg-slate-900 text-white p-8">
                   <CardTitle className="text-2xl font-black uppercase italic text-center">Command Auth</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-5">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic">Email</Label>
                     <Input placeholder="admin@gov.in" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic">PIN</Label>
                     <Input type="password" placeholder="••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                   </div>
                   <Button className="w-full h-16 font-black rounded-2xl bg-slate-900 hover:bg-slate-800 text-lg uppercase italic" onClick={handleAdminLogin} disabled={isLoggingIn}>
                     {isLoggingIn ? <Loader2 className="animate-spin" /> : "Authorize"}
                   </Button>
                 </CardContent>
               </Card>
             )}

             {role === 'worker' && (
               <Card className="rounded-[3rem] shadow-2xl border-none overflow-hidden">
                 <CardHeader className="bg-orange-600 text-white p-8">
                   <CardTitle className="text-2xl font-black uppercase italic text-center">Duty Login</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-5">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic">Staff ID</Label>
                     <Input placeholder="w123" value={workerIdInput} onChange={e => setWorkerIdInput(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic">PIN</Label>
                     <Input type="password" placeholder="•••" value={workerPassInput} onChange={e => setWorkerPassInput(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                   </div>
                   <Button className="w-full h-16 font-black bg-orange-600 hover:bg-orange-700 rounded-2xl text-lg uppercase italic" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                     {isLoggingIn ? <Loader2 className="animate-spin" /> : "Login"}
                   </Button>
                 </CardContent>
               </Card>
             )}

             {role === 'user' && (
               <div className="space-y-8">
                 <div className="p-12 bg-blue-50/50 rounded-[4rem] text-center border-2 border-dashed border-blue-100">
                   <User className="h-20 w-20 text-blue-600 mx-auto animate-anti-gravity" />
                   <h2 className="text-2xl font-black mt-6 uppercase italic">Citizen Portal</h2>
                   <p className="text-[10px] text-blue-400 font-black mt-2 uppercase tracking-widest italic">Google Auth Required</p>
                 </div>
                 <Button className="w-full h-20 text-lg font-black rounded-[2.5rem] shadow-2xl bg-blue-600 hover:bg-blue-700 italic flex items-center justify-center gap-4" onClick={startAsUser} disabled={isLoggingIn}>
                   {isLoggingIn ? <Loader2 className="animate-spin" /> : <><Globe className="h-6 w-6" /> Google Sign-In</>}
                 </Button>
               </div>
             )}
          </div>
        )}
      </div>

      <footer className="mt-auto py-10 text-center space-y-1">
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">© 2024 Madurai Corp</p>
        <p className="text-[9px] text-primary font-black uppercase italic">Powered by Anti-Gravity Engine</p>
      </footer>
    </div>
  );
}