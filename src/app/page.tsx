"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, HardHat, Leaf, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch user role from Firestore if logged in
  const userProfileRef = user && db ? doc(db, "users", user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  // Auto-redirect if profile is found
  useEffect(() => {
    if (profile && !role) {
      if (profile.role === 'admin') router.push("/admin");
      else if (profile.role === 'worker') router.push("/worker");
      else if (profile.role === 'user') router.push("/user");
    }
  }, [profile, router, role]);

  // Safety timer to prevent getting stuck on loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceShowUI(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    if (email === "admin@gov.in" && password === "admin@123") {
      if (user && db) {
        try {
          await setDoc(doc(db, "users", user.uid), {
            email: "admin@gov.in",
            role: "admin"
          }, { merge: true });
          router.push("/admin");
        } catch (e) {
          toast({ variant: "destructive", title: "Update Failed", description: "Could not set admin role." });
          setIsLoggingIn(false);
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: "Firebase project not connected." });
        setIsLoggingIn(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid admin credentials.",
      });
      setIsLoggingIn(false);
    }
  };

  const handleWorkerLogin = async () => {
    setIsLoggingIn(true);
    toast({
      title: "Worker Login",
      description: "Checking field credentials...",
    });
    setTimeout(() => {
      setIsLoggingIn(false);
      toast({ variant: "destructive", title: "Login Failed", description: "Please use assigned credentials." });
    }, 1000);
  };

  const startAsUser = async () => {
    setIsLoggingIn(true);
    if (user && db) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email || "citizen@user.com",
          role: "user"
        }, { merge: true });
        router.push("/user");
      } catch (e) {
        router.push("/user");
      }
    } else {
      router.push("/user");
    }
  };

  if ((authLoading || (profileLoading && user)) && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <div className="relative">
          <Leaf className="h-16 w-16 text-primary animate-bounce mb-4" />
          <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium mb-8 text-center animate-pulse">
          Starting Madurai CleanUp...
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <Button 
            variant="outline" 
            className="w-full rounded-xl" 
            onClick={() => setForceShowUI(true)}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Continue Manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-10 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform cursor-pointer">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
            Madurai CleanUp
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Reporting issues for a better tomorrow. Select your role.
          </p>
        </div>
      </header>

      <div className="grid gap-4 flex-1">
        {!role ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <Card 
              className="cursor-pointer hover:border-primary transition-all group hover:shadow-lg border-2"
              onClick={() => setRole('user')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Citizen User</h3>
                    <p className="text-sm text-muted-foreground">Report issues & tracking</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-orange-500 transition-all group hover:shadow-lg border-2"
              onClick={() => setRole('worker')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HardHat className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Cleanup Worker</h3>
                    <p className="text-sm text-muted-foreground">Field tasks & GPS duties</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-all group hover:shadow-lg border-2"
              onClick={() => setRole('admin')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Authority Admin</h3>
                    <p className="text-sm text-muted-foreground">Control & Oversight</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </div>
        ) : role === 'admin' ? (
          <Card className="animate-in zoom-in-95 duration-300 border-none shadow-xl">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back
              </Button>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Official government credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Government Email</Label>
                <Input 
                  id="email" 
                  placeholder="admin@gov.in" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-12"
                />
              </div>
              <Button className="w-full h-14 font-bold text-lg shadow-lg" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Authorize Entry"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in zoom-in-95 duration-300 border-none shadow-xl">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back
              </Button>
              <CardTitle>Worker Entry</CardTitle>
              <CardDescription>Log in with your field ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workerId">Worker ID</Label>
                <Input id="workerId" placeholder="MDU-W-001" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workerPass">PIN Code</Label>
                <Input id="workerPass" type="password" placeholder="••••" className="h-12" />
              </div>
              <Button className="w-full h-14 font-bold text-lg bg-orange-600 hover:bg-orange-700 shadow-lg" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Field Duty Access"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-10 bg-blue-50 rounded-3xl text-center space-y-4 border border-blue-100 shadow-inner">
              <User className="h-16 w-16 text-blue-600 mx-auto" />
              <h2 className="text-2xl font-bold">Citizen Portal</h2>
              <p className="text-sm text-blue-600">Securely report environmental issues in your neighborhood.</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full h-16 text-xl font-bold shadow-2xl rounded-2xl" onClick={startAsUser} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : "Open Dashboard"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setRole(null)}>
                Change Role
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 py-6 border-t text-center">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">© 2024 Madurai Municipal Corporation</p>
      </footer>
    </div>
  );
}
