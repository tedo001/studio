
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

  // Unified data tracking
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
        <p className="text-muted-foreground font-medium">Authenticating Citizen...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-24">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
            My Incident Feed
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push("/")} title="Change Role">
            <Home className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push("/")} title="Logout">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Reports Feed */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Tracking</h2>
          <div className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
            <RefreshCw className="h-2 w-2 animate-spin" /> Live Updates
          </div>
        </div>

        {reportsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <AlertCircle className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-600">No Reports Filed</p>
              <p className="text-sm text-muted-foreground px-10">Help keep Madurai clean. Submit your first environmental report today.</p>
            </div>
            <Link href="/report/new">
              <Button className="mt-4 rounded-xl px-8 h-12 shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-lg rounded-2xl group active:scale-[0.98] transition-transform mb-4">
              <div className="relative h-56 w-full bg-slate-100">
                <Image 
                  src={report.imageUrl} 
                  alt={report.aiCategory} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Badge className="bg-white/95 text-primary border-none font-bold shadow-md h-7 px-3 text-[10px] uppercase">
                      {report.aiCategory}
                    </Badge>
                    <Badge 
                      variant={report.status === 'Resolved' ? 'default' : 'secondary'} 
                      className={`font-bold shadow-md h-7 px-3 text-[10px] uppercase ${report.status === 'Pending' ? 'bg-orange-100 text-orange-700' : report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : ''}`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-black/40 text-white border-none backdrop-blur-md text-[9px] font-bold py-1 truncate max-w-[180px]">
                    <MapPin className="h-2 w-2 mr-1 inline" /> {report.locationName || "Madurai Area"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 flex items-center justify-between bg-white">
                <div className="flex items-center text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  {report.severity} Priority
                </div>
                <div className="text-[11px] text-muted-foreground font-semibold bg-slate-50 px-2 py-1 rounded-md">
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
            <Button size="lg" className="rounded-full h-20 w-20 shadow-2xl bg-primary hover:bg-primary/90 border-[6px] border-white group active:scale-90 transition-transform">
              <Plus className="h-10 w-10 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
