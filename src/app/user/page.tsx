
"use client";

import { useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, History, Leaf, AlertCircle, LogOut } from "lucide-react";
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

  if (authLoading) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-24">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
            My Reports
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </Button>
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
          </div>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-none shadow-md">
              <div className="relative h-48 w-full">
                <Image 
                  src={report.imageUrl} 
                  alt={report.aiCategory} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-white/90 text-primary border-none font-bold">
                    {report.aiCategory}
                  </Badge>
                  <Badge variant={report.status === 'Resolved' ? 'default' : 'secondary'} className="font-bold">
                    {report.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground font-bold">
                  <MapPin className="h-3 w-3 mr-1" />
                  {report.severity} Severity
                </div>
                <div className="text-xs text-muted-foreground">
                  {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Just now'}
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
            <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90">
              <Plus className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
