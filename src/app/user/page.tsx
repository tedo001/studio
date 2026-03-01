"use client";

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

export default function UserDashboard() {
  const { user, isUserLoading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const reportsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "reports"), orderBy("timestamp", "desc"));
  }, [db]);

  const { data: reports, isLoading: reportsLoading } = useCollection<Report>(reportsQuery);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
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
            <RefreshCw className="h-3 w-3 animate-spin" /> LIVE
          </div>
        </div>

        {reportsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-dashed border-2">
            <Leaf className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="font-black uppercase text-slate-400">No Incidents Found</p>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-2xl rounded-[3rem] mb-10 bg-white">
              <div className="relative h-64 w-full bg-slate-100 flex">
                <div className={`relative h-full transition-all duration-500 ${report.status === 'Resolved' && report.resolvedImageUrl ? 'w-1/2' : 'w-full'}`}>
                  <Image src={report.imageUrl} alt="Before" fill className="object-cover" />
                  {report.status === 'Resolved' && report.resolvedImageUrl && (
                    <Badge className="absolute bottom-3 left-3 bg-black/60 text-white border-none text-[6px] font-black uppercase">Incident</Badge>
                  )}
                </div>
                {report.status === 'Resolved' && report.resolvedImageUrl && (
                  <div className="relative h-full w-1/2 border-l-2 border-white animate-in slide-in-from-right duration-700">
                    <Image src={report.resolvedImageUrl} alt="After" fill className="object-cover" />
                    <Badge className="absolute bottom-3 left-3 bg-green-600/80 text-white border-none text-[6px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="h-2 w-2" /> Cleaned
                    </Badge>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Badge className="bg-white/90 backdrop-blur-md text-primary border-none font-black text-[8px] uppercase italic rounded-lg">
                      {report.aiCategory}
                    </Badge>
                    <Badge className={`text-[8px] font-black uppercase italic rounded-lg border-none ${
                      report.status === 'Resolved' ? 'bg-green-500 text-white' : 
                      report.status === 'Pending' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-3 bg-white border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[10px] font-black uppercase italic text-slate-500">
                    <MapPin className="h-3 w-3 mr-2 text-primary" />
                    {report.locationName || "Location Locked"}
                  </div>
                  <div className="text-[9px] font-black text-slate-300 uppercase italic">
                    {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Active'}
                  </div>
                </div>
                <div className="flex items-center text-[9px] font-black uppercase text-slate-400 tracking-widest italic">
                  <AlertCircle className={`h-4 w-4 mr-2 ${report.severity === 'High' ? 'text-red-500' : 'text-primary'}`} />
                  Priority: {report.severity}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="fixed bottom-10 left-0 right-0 px-6 max-w-lg mx-auto pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <Link href="/report/new">
            <Button size="lg" className="rounded-full h-20 w-20 shadow-2xl bg-primary hover:bg-primary/90 border-8 border-white active:scale-90 transition-transform">
              <Plus className="h-10 w-10 text-white" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}