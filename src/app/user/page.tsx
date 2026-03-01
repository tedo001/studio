
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Leaf, AlertCircle, Home, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Report {
  id: string;
  imageUrl: string;
  resolvedImageUrl?: string;
  aiCategory: string;
  severity: string;
  status: string;
  locationName?: string;
  timestamp: any;
  userId: string;
}

function FormattedDate({ date }: { date: any }) {
  const [formatted, setFormatted] = useState("");
  useEffect(() => {
    if (date?.toDate) {
      setFormatted(new Date(date.toDate()).toLocaleDateString());
    } else {
      setFormatted("Real-Time");
    }
  }, [date]);
  return <span>{formatted}</span>;
}

export default function UserDashboard() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Wait for auth to be stable before querying to avoid permission race conditions
  const reportsQuery = useMemoFirebase(() => {
    if (!db || authLoading || !user) return null;
    return query(collection(db, "reports"), orderBy("timestamp", "desc"));
  }, [db, authLoading, user?.uid]);

  const { data: reports, isLoading: reportsLoading } = useCollection<Report>(reportsQuery);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Syncing Sector Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-24">
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-primary rounded-2xl">
            <AvatarFallback className="bg-primary/10 text-primary font-black italic">MC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-xl font-black font-headline uppercase italic leading-none">Citizen Feed</h1>
            <span className="text-[8px] font-black uppercase text-primary tracking-widest italic">Madurai Global Sync</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => router.push("/")}>
          <Home className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 px-6 space-y-8 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Live Community Feed</h2>
          <div className="flex items-center gap-2 text-[8px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" /> LIVE SENSOR
          </div>
        </div>

        {reportsLoading ? (
          <div className="flex flex-col items-center py-24 text-slate-300">
            <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Interrogating Database...</p>
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[4rem] border-dashed border-4 border-slate-50">
            <Leaf className="h-16 w-16 text-slate-100 mx-auto mb-6" />
            <p className="font-black uppercase text-slate-300 italic text-[11px] tracking-[0.3em]">Zero Active Incidents</p>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] mb-12 bg-white group transition-all duration-500 hover:translate-y-[-4px]">
              <div className="relative h-72 w-full bg-slate-100 flex">
                <div className={`relative h-full transition-all duration-700 ${report.status === 'Resolved' && report.resolvedImageUrl ? 'w-1/2' : 'w-full'}`}>
                  <Image src={report.imageUrl} alt="Before" fill className="object-cover" />
                  {report.status === 'Resolved' && report.resolvedImageUrl && (
                    <Badge className="absolute bottom-4 left-4 bg-black/70 text-white border-none text-[8px] font-black uppercase backdrop-blur-md">Incident</Badge>
                  )}
                </div>
                {report.status === 'Resolved' && report.resolvedImageUrl && (
                  <div className="relative h-full w-1/2 border-l-4 border-white animate-in slide-in-from-right duration-1000">
                    <Image src={report.resolvedImageUrl} alt="After" fill className="object-cover" />
                    <Badge className="absolute bottom-4 left-4 bg-green-600 text-white border-none text-[8px] font-black uppercase flex items-center gap-2 shadow-2xl">
                      <CheckCircle2 className="h-3 w-3" /> Cleaned
                    </Badge>
                  </div>
                )}
                
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Badge className="bg-white/90 backdrop-blur-xl text-primary border-none font-black text-[10px] uppercase italic rounded-xl px-5 py-1.5 shadow-2xl">
                      {report.aiCategory}
                    </Badge>
                    <Badge className={`text-[10px] font-black uppercase italic rounded-xl border-none px-5 py-1.5 shadow-2xl ${
                      report.status === 'Resolved' ? 'bg-green-500 text-white' : 
                      report.status === 'Pending' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <CardContent className="p-8 space-y-4 bg-white border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[11px] font-black uppercase italic text-slate-500 tracking-tight">
                    <MapPin className="h-4 w-4 mr-3 text-primary" />
                    {report.locationName || "Detecting Sector..."}
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase italic">
                    <FormattedDate date={report.timestamp} />
                  </div>
                </div>
                <div className="flex items-center text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
                  <AlertCircle className={`h-4 w-4 mr-3 ${report.severity === 'High' ? 'text-red-500' : 'text-primary'}`} />
                  Priority Grade: {report.severity}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-6 max-w-lg mx-auto pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <Link href="/report/new">
            <Button size="lg" className="rounded-full h-24 w-24 shadow-2xl bg-primary hover:bg-primary/90 border-[10px] border-white active:scale-90 transition-transform group">
              <Plus className="h-12 w-12 text-white group-hover:rotate-90 transition-transform duration-500" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
