"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Leaf, AlertCircle, Home, Loader2, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Community Feed: Wait for user (even anonymous) to be ready to avoid permission race conditions
  const reportsQuery = useMemoFirebase(() => {
    if (!db || authLoading || !user) return null;
    return query(
      collection(db, "reports"),
      orderBy("timestamp", "desc")
    );
  }, [db, authLoading, user?.uid]);

  const { data: reports, isLoading: reportsLoading, error } = useCollection<Report>(reportsQuery);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Initializing Sector State...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-24">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b shadow-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-14 w-14 border-[3px] border-primary shadow-2xl rounded-2xl overflow-hidden">
            <AvatarFallback className="bg-primary/10 text-primary font-black">
              <Users className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 font-headline uppercase italic leading-none">
              Citizen Feed
            </h1>
            <span className="text-[9px] font-black uppercase text-primary tracking-[0.3em] italic">
              Madurai Citizen Network
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-slate-100" onClick={() => router.push("/")}>
            <Home className="h-6 w-6 text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Reports Feed */}
      <div className="flex-1 px-6 space-y-8 pt-8 overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Active Monitoring</h2>
          <div className="flex items-center gap-2 text-[9px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full shadow-sm animate-pulse border border-green-100 italic">
            <RefreshCw className="h-3 w-3 animate-spin" /> LIVE UPDATES
          </div>
        </div>

        {error ? (
          <div className="p-10 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-red-100 shadow-inner">
             <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest text-red-600 italic">Permission Block</p>
             <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-tight">Rules are propagating... please refresh.</p>
          </div>
        ) : reportsLoading ? (
          <div className="space-y-10">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-[3.5rem]" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-10 bg-white rounded-[4rem] border-8 border-dashed border-slate-100 shadow-inner">
            <div className="h-28 w-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner animate-anti-gravity">
              <Leaf className="h-14 w-14 text-slate-200" />
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Sector Clear</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest max-w-[220px] mx-auto opacity-50 italic">Be the first to report an environmental issue in your zone.</p>
            </div>
            <Link href="/report/new">
              <Button className="rounded-[2rem] px-12 h-20 shadow-2xl bg-primary hover:bg-primary/90 font-black uppercase italic tracking-tight text-lg transition-transform active:scale-95">
                Begin Reporting
              </Button>
            </Link>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-2xl rounded-[3.5rem] group active:scale-[0.98] transition-all duration-500 mb-10 bg-white hover:translate-y-[-4px]">
              <div className="relative h-72 w-full bg-slate-100 overflow-hidden">
                <Image 
                  src={report.imageUrl} 
                  alt={report.aiCategory} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Badge className="bg-white text-primary border-none font-black shadow-2xl h-8 px-5 text-[10px] uppercase italic rounded-xl">
                      {report.aiCategory}
                    </Badge>
                    <Badge 
                      className={`font-black shadow-2xl h-8 px-5 text-[10px] uppercase italic rounded-xl border-none ${
                        report.status === 'Resolved' ? 'bg-green-500 text-white' : 
                        report.status === 'Pending' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      }`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-xl text-[10px] font-black py-2.5 px-4 truncate max-w-[240px] rounded-2xl uppercase tracking-widest shadow-2xl italic">
                    <MapPin className="h-4 w-4 mr-2 inline text-primary" /> {report.locationName || "Location Locked"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-8 flex items-center justify-between bg-white border-t border-slate-50">
                <div className="flex items-center text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
                  <AlertCircle className={`h-5 w-5 mr-3 ${report.severity === 'High' ? 'text-red-500' : 'text-primary'}`} />
                  {report.severity} Priority
                </div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner italic">
                  {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Active'}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-0 right-0 px-6 max-w-lg mx-auto pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <Link href="/report/new">
            <Button size="lg" className="rounded-[3rem] h-28 w-28 shadow-2xl bg-primary hover:bg-primary/90 border-[10px] border-white group active:scale-90 transition-all duration-500">
              <Plus className="h-14 w-14 text-white group-hover:rotate-90 transition-transform duration-700" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}