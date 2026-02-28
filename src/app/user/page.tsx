
"use client";

import { useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Leaf, AlertCircle, LogOut, Home, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Report {
  id: string;
  imageUrl: string;
  aiCategory: string;
  severity: string;
  status: string;
  locationName?: string;
  timestamp: any;
  userId: string;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Unified data tracking for authenticated user
  const reportsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [db, user?.uid]);

  const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsQuery);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Authenticating Citizen...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-24">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-primary shadow-lg">
            {user?.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-black">
                {user?.displayName?.[0] || <User className="h-6 w-6" />}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-headline uppercase italic leading-none">
              {user?.displayName?.split(' ')[0]}&apos;s Feed
            </h1>
            <span className="text-[9px] font-black uppercase text-primary tracking-widest">Verified Citizen</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 hover:bg-slate-100" onClick={() => router.push("/")}>
            <Home className="h-5 w-5 text-slate-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 hover:bg-red-50 hover:text-red-600" onClick={() => router.push("/")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Reports Feed */}
      <div className="flex-1 px-6 space-y-6 pt-6 overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Active Monitoring</h2>
          <div className="flex items-center gap-2 text-[9px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full animate-glow">
            <RefreshCw className="h-3 w-3 animate-spin" /> LIVE UPDATES
          </div>
        </div>

        {reportsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
            <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center shadow-inner animate-anti-gravity">
              <Leaf className="h-12 w-12 text-slate-200" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-400 uppercase italic">Sector Clear</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest max-w-[200px] mx-auto opacity-60">Help keep Madurai clean. Submit your first environmental report today.</p>
            </div>
            <Link href="/report/new">
              <Button className="rounded-2xl px-10 h-16 shadow-2xl font-black uppercase italic tracking-tight">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] group active:scale-[0.98] transition-all duration-300 mb-8 bg-white">
              <div className="relative h-64 w-full bg-slate-100">
                <Image 
                  src={report.imageUrl} 
                  alt={report.aiCategory} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Badge className="bg-white/95 text-primary border-none font-black shadow-2xl h-8 px-4 text-[10px] uppercase italic rounded-xl">
                      {report.aiCategory}
                    </Badge>
                    <Badge 
                      className={`font-black shadow-2xl h-8 px-4 text-[10px] uppercase italic rounded-xl border-none ${
                        report.status === 'Resolved' ? 'bg-green-500 text-white' : 
                        report.status === 'Pending' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      }`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-black/30 text-white border-white/20 backdrop-blur-xl text-[9px] font-black py-2 px-3 truncate max-w-[220px] rounded-lg uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-2 inline text-primary" /> {report.locationName || "Detecting Street..."}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6 flex items-center justify-between bg-white border-t border-slate-50">
                <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
                  <AlertCircle className={`h-4 w-4 mr-2 ${report.severity === 'High' ? 'text-red-500' : 'text-primary'}`} />
                  {report.severity} Priority
                </div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner italic">
                  {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Syncing...'}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-lg mx-auto pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <Link href="/report/new">
            <Button size="lg" className="rounded-[2.5rem] h-24 w-24 shadow-2xl bg-primary hover:bg-primary/90 border-[8px] border-white group active:scale-90 transition-all duration-300">
              <Plus className="h-12 w-12 text-white group-hover:rotate-90 transition-transform duration-500" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
