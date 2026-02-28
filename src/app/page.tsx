"use client";

import { useState } from "react";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, HardHat, Leaf, ArrowRight, Loader2, Globe } from "lucide-react";
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
    
    // Master Demo Credentials for Admin Operations Command
    if ((cleanEmail === "admin@madurai.gov" || cleanEmail === "admin@gov.in") && cleanPass === "madurai2024") {
      if (user && db) {
        setDoc(doc(db, "users", user.uid), { 
          email: cleanEmail, 
          role: "admin",
          displayName: "Ops Command"
        }, { merge: true });
      }
      toast({ title: "Command Authorized", description: "Entering Ops Center." });
      router.push("/admin");
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid government credentials." });
      setIsLoggingIn(false);
    }
  };

  const startAsGuestCitizen = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    
    try {
      // Direct access with background anonymous auth check
      if (!user) {
        await signInAnonymously(auth);
      }
      
      toast({ title: "Access Granted", description: "Entering Community Monitoring Zone." });
      router.push("/user");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Failed", description: "Unable to establish secure citizen session." });
      setIsLoggingIn(false);
    }
  };

  const handleWorkerLogin = async () => {
    if (!workerIdInput || !workerPassInput || !db) {
      toast({ variant: "destructive", title: "INPUT REQUIRED", description: "Staff ID and PIN are mandatory." });
      return;
    }
    
    setIsLoggingIn(true);
    // Direct routing for demo stability
    router.push("/worker");
    toast({ title: "Duty Commenced", description: "Loading field task board..." });
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Initializing Sector State...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-20 pb-16 flex flex-col items-center text-center space-y-6">
        <div className="h-28 w-28 bg-primary/10 rounded-[3rem] flex items-center justify-center shadow-inner animate-anti-gravity">
          <Leaf className="h-14 w-14 text-primary" />
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase italic leading-none">
            Madurai <span className="text-slate-800">CleanUp</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-[10px] font-black uppercase tracking-[0.5em] italic opacity-60">
            Gov Infrastructure Network
          </p>
        </div>
      </header>

      <div className="grid gap-8 flex-1 max-w-sm mx-auto w-full">
        {!role ? (
          <div className="space-y-6 animate-in fade-in duration-1000">
            {[
              { id: 'user', icon: Globe, title: 'Citizen Portal', desc: 'Anyone can Report', color: 'primary' },
              { id: 'worker', icon: HardHat, title: 'Field Staff', desc: 'Duty & Log Tasks', color: 'orange' },
              { id: 'admin', icon: ShieldCheck, title: 'Ops Center', desc: 'Admin Oversight', color: 'slate' }
            ].map((r) => (
              <Card key={r.id} className="cursor-pointer hover:scale-[1.03] transition-all border-none rounded-[3.5rem] shadow-2xl bg-white overflow-hidden active:scale-95 group" onClick={() => setRole(r.id as Role)}>
                <CardContent className="p-10 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className={`h-20 w-20 bg-slate-50 text-primary rounded-[2rem] flex items-center justify-center shadow-inner group-hover:bg-primary/10 transition-colors`}>
                      <r.icon className="h-10 w-10" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-2xl uppercase italic tracking-tighter">{r.title}</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 italic">{r.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-slate-200 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-12 duration-500">
             <Button variant="ghost" onClick={() => setRole(null)} className="mb-8 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors italic">
               <ArrowRight className="rotate-180 mr-3 h-5 w-5" /> Back to Selection
             </Button>
             
             {role === 'admin' && (
               <Card className="rounded-[4rem] shadow-2xl border-none overflow-hidden">
                 <CardHeader className="bg-slate-900 text-white p-10">
                   <CardTitle className="text-3xl font-black uppercase italic text-center tracking-tighter">Command Auth</CardTitle>
                 </CardHeader>
                 <CardContent className="p-10 space-y-6">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">Official Email</Label>
                     <Input placeholder="admin@gov.in" value={email} onChange={(e) => setEmail(e.target.value)} className="h-16 rounded-[1.5rem] bg-slate-50 border-none shadow-inner font-bold" />
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">Master Key</Label>
                     <Input type="password" placeholder="••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-16 rounded-[1.5rem] bg-slate-50 border-none shadow-inner font-bold" />
                   </div>
                   <Button className="w-full h-20 font-black rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-xl uppercase italic shadow-2xl transition-transform active:scale-95" onClick={handleAdminLogin} disabled={isLoggingIn}>
                     {isLoggingIn ? <Loader2 className="animate-spin h-8 w-8" /> : "Authorize Command"}
                   </Button>
                 </CardContent>
               </Card>
             )}

             {role === 'worker' && (
               <Card className="rounded-[4rem] shadow-2xl border-none overflow-hidden">
                 <CardHeader className="bg-orange-600 text-white p-10">
                   <CardTitle className="text-3xl font-black uppercase italic text-center tracking-tighter">Duty Login</CardTitle>
                 </CardHeader>
                 <CardContent className="p-10 space-y-6">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">Staff ID</Label>
                     <Input placeholder="w123" value={workerIdInput} onChange={e => setWorkerIdInput(e.target.value)} className="h-16 rounded-[1.5rem] bg-slate-50 border-none shadow-inner font-bold" />
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">Duty PIN</Label>
                     <Input type="password" placeholder="•••" value={workerPassInput} onChange={e => setWorkerPassInput(e.target.value)} className="h-16 rounded-[1.5rem] bg-slate-50 border-none shadow-inner font-bold" />
                   </div>
                   <Button className="w-full h-20 font-black bg-orange-600 hover:bg-orange-700 rounded-[2rem] text-xl uppercase italic shadow-2xl transition-transform active:scale-95" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                     {isLoggingIn ? <Loader2 className="animate-spin h-8 w-8" /> : "Login to Duty"}
                   </Button>
                 </CardContent>
               </Card>
             )}

             {role === 'user' && (
               <div className="space-y-10">
                 <div className="p-16 bg-white rounded-[4.5rem] text-center shadow-2xl border-4 border-slate-50 border-dashed">
                   <div className="h-28 w-28 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner mb-8 animate-anti-gravity">
                      <Globe className="h-14 w-14 text-primary" />
                   </div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">Citizen Portal</h2>
                   <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-[0.2em] italic opacity-80">Community Access Mode</p>
                 </div>
                 <Button className="w-full h-24 text-2xl font-black rounded-[3rem] shadow-2xl bg-primary hover:bg-primary/90 italic flex items-center justify-center gap-5 transition-all active:scale-95" onClick={startAsGuestCitizen} disabled={isLoggingIn}>
                   {isLoggingIn ? <Loader2 className="animate-spin h-10 w-10" /> : <>Enter Portal <ArrowRight className="h-8 w-8" /></>}
                 </Button>
               </div>
             )}
          </div>
        )}
      </div>

      <footer className="mt-auto py-12 text-center space-y-2 opacity-40">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em]">© 2024 Madurai Corp</p>
        <p className="text-[9px] text-primary font-black uppercase italic tracking-widest">Anti-Gravity Infrastructure Network</p>
      </footer>
    </div>
  );
}