
"use client";

import { useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, History, Leaf, AlertCircle, LogOut, Home, ArrowLeft } from "lucide-react";
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
  timestamp: any;
  userId: string;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const reportsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "reports"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
  }, [db, user]);

  const { data: reports, loading: reportsLoading } = useCollection<Report>(reportsQuery);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading citizen profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-24">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
            My Reports
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/")} title="Back to roles">
            <Home className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/")} title="Log Out">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Reports Feed */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto">
        {reportsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/50 rounded-2xl border border-dashed border-muted-foreground/20">
            <AlertCircle className="h-12 w-12 text-muted-foreground opacity-30" />
            <div>
              <p className="text-lg font-bold text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground px-10">Start by capturing an issue around you.</p>
            </div>
            <Link href="/report/new">
              <Button variant="outline" className="mt-4">
                File First Report
              </Button>
            </Link>
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-md">
              <div className="relative h-48 w-full bg-slate-100">
                <Image 
                  src={report.imageUrl} 
                  alt={report.aiCategory} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-white/95 text-primary border-none font-bold shadow-sm">
                    {report.aiCategory}
                  </Badge>
                  <Badge variant={report.status === 'Resolved' ? 'default' : 'secondary'} className="font-bold shadow-sm">
                    {report.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  {report.severity} Severity
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Pending...'}
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
            <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90 border-4 border-white">
              <Plus className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
