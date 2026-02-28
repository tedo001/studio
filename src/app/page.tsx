
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, HardHat, Leaf, ArrowRight, Loader2, RefreshCcw, Home } from "lucide-react";
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
  const userProfileRef = user ? doc(db!, "users", user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (profile && !role) {
      if (profile.role === 'admin') router.push("/admin");
      else if (profile.role === 'worker') router.push("/worker");
      else if (profile.role === 'user') router.push("/user");
    }
  }, [profile, router, role]);

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
        toast({ variant: "destructive", title: "Error", description: "Firebase not initialized." });
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
      description: "Checking credentials...",
    });
    // For prototype, we'll just wait then show an error as ID/PIN check isn't implemented here yet
    setTimeout(() => {
      setIsLoggingIn(false);
      toast({ variant: "destructive", title: "Login Failed", description: "Worker authentication is handled by the city council." });
    }, 1500);
  };

  const startAsUser = async () => {
    if (user && db) {
      setIsLoggingIn(true);
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email || "anonymous@user.com",
          role: "user"
        }, { merge: true });
        router.push("/user");
      } catch (e) {
        setIsLoggingIn(false);
        router.push("/user"); // Fallback to navigation
      }
    } else {
      router.push("/user");
    }
  };

  // If loading takes too long or fails, allow user to override
  if ((authLoading || profileLoading) && !forceShowUI) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Leaf className="h-12 w-12 text-primary animate-bounce mb-4" />
        <p className="text-muted-foreground font-medium mb-8 text-center">
          Madurai CleanUp is preparing...
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setForceShowUI(true)}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset & Try Again
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            If this screen persists, please check your internet connection or verify your Firebase setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <header className="pt-10 pb-12 flex flex-col items-center text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
            Madurai CleanUp
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            A cleaner city begins with your report. Select your role to continue.
          </p>
        </div>
      </header>

      <div className="grid gap-4 flex-1">
        {!role ? (
          <>
            <Card 
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => setRole('user')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Citizen User</h3>
                    <p className="text-sm text-muted-foreground">Report issues & track progress</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => setRole('worker')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <HardHat className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Cleanup Worker</h3>
                    <p className="text-sm text-muted-foreground">Assigned tasks & field reports</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => setRole('admin')}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Authority Admin</h3>
                    <p className="text-sm text-muted-foreground">Manage workers & operations</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </>
        ) : role === 'admin' ? (
          <Card className="animate-in zoom-in-95 duration-300">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back to roles
              </Button>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>Enter government credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Government Email</Label>
                <Input 
                  id="email" 
                  placeholder="admin@gov.in" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
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
                />
              </div>
              <Button className="w-full h-12 font-bold" onClick={handleAdminLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Verify Identity"}
              </Button>
            </CardContent>
          </Card>
        ) : role === 'worker' ? (
          <Card className="animate-in zoom-in-95 duration-300">
            <CardHeader>
              <Button variant="ghost" className="w-fit -ml-2 mb-2 h-8 px-2 text-xs" onClick={() => setRole(null)}>
                <ArrowRight className="rotate-180 mr-1 h-3 w-3" /> Back to roles
              </Button>
              <CardTitle>Worker Entry</CardTitle>
              <CardDescription>Log in with your assigned ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workerId">Worker ID</Label>
                <Input id="workerId" placeholder="MDU-W-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workerPass">Assigned PIN</Label>
                <Input id="workerPass" type="password" placeholder="••••" />
              </div>
              <Button className="w-full h-12 font-bold" onClick={handleWorkerLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Login to Field Dashboard"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-8 bg-blue-50 rounded-2xl text-center space-y-4">
              <User className="h-12 w-12 text-blue-600 mx-auto" />
              <h2 className="text-xl font-bold">Welcome, Citizen</h2>
              <p className="text-sm text-blue-600">You can report littering, illegal dumping, and more directly to the city council.</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full h-14 text-lg font-bold shadow-xl" onClick={startAsUser} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Continue as Citizen"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setRole(null)}>
                Change Role
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-12 py-6 border-t text-center">
        <p className="text-xs text-muted-foreground">© 2024 Madurai Municipal Corporation</p>
      </footer>
    </div>
  );
}
