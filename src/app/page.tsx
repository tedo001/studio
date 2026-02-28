"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, HardHat, Leaf, ArrowRight, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

type Role = 'admin' | 'user' | 'worker' | null;

export default function LandingPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [forceShowUI, setForceShowUI] = useState(false);

  // Safety timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceShowUI(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    
    if (email === "admin@gov.in" && password === "admin@123") {
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        const data = { email: "admin@gov.in", role: "admin" };
        setDoc(userRef, data, { merge: true })
          .catch(async () => {
             // Silently catch if demo mode
          });
      }
      router.push("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid admin credentials.",
      });
      setIsLoggingIn(false);
    }
  };

  const startAsUser = async () => {
    setIsLoggingIn(true);
    if (user && db) {
      const userRef = doc(db, "users", user.uid);
      const data = { email: user.email || "citizen@user.com", role: "user" };
      setDoc(userRef, data, { merge: true }).catch(() => {});
    }
    router.push("/user");
  };

  const handleWorkerLogin = async () => {
    setIsLoggingIn(true);
    router.push("/worker");
  };

  if ((authLoading) && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Leaf className="h-16 w-16 text-primary animate-bounce mb-4" />
        <p className="text-muted-foreground font-medium mb-8">Loading Madurai CleanUp...</p>
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
          <p className="text-muted-foreground max-w-xs mx-auto">
            Choose your portal to continue.
          </p>
        </div>
      </header>

      <div className="grid gap-4 flex-1">
        {!db && (
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-xs font-bold uppercase">Demo Mode</AlertTitle>
            <AlertDescription className="text-[11px]">
              Firebase is not connected. Use the local preview to test UI and flow.
            </AlertDescription>
          </Alert>
        )}

        {!role ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="cursor-pointer hover:border-primary transition-all border-2" onClick={() => setRole('user')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Citizen</h3>
                    <p className="text-sm text-muted-foreground">Report issues & track progress</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-orange-500 transition-all border-2" onClick={() => setRole('worker')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <HardHat className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Worker</h3>
                    <p className="text-sm text-muted-foreground">Field tasks & cleaning duties</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-all border-2" onClick={() => setRole('admin')}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Admin</h3>
                    <p className="text-sm text-muted-foreground">System control & analytics</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        ) : role === 'admin' ? (
          <Card className="animate-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back
              </Button>
              <CardTitle>Admin Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Government Email</Label>
                <Input placeholder="admin@gov.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full h-14 font-bold" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize Entry"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in slide-in-from-right-4 duration-300">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back
              </Button>
              <CardTitle>Worker Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Worker ID</Label>
                <Input placeholder="MDU-W-001" />
              </div>
              <div className="space-y-2">
                <Label>PIN</Label>
                <Input type="password" placeholder="••••" />
              </div>
              <Button className="w-full h-14 font-bold bg-orange-600 hover:bg-orange-700" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5" /> : "Enter Field Duty"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-10 bg-blue-50 rounded-3xl text-center space-y-4 border border-blue-100">
              <User className="h-16 w-16 text-blue-600 mx-auto" />
              <h2 className="text-2xl font-bold">Citizen Dashboard</h2>
              <p className="text-sm text-blue-600">Report trash, dumping, or water issues.</p>
            </div>
            <Button className="w-full h-16 text-xl font-bold rounded-2xl" onClick={startAsUser} disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "Open Citizen Feed"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setRole(null)}>Return Home</Button>
          </div>
        )}
      </div>

      <footer className="mt-12 py-6 border-t text-center">
        <p className="text-xs text-muted-foreground font-bold tracking-widest">© 2024 Madurai Municipal Corp</p>
      </footer>
    </div>
  );
}
