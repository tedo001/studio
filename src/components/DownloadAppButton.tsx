
"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DownloadAppButton() {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Generating APK Package",
      description: "Preparing Madurai CleanUp v1.0 for download... Please wait.",
    });
    
    // Simulate a download delay
    setTimeout(() => {
      // Create a dummy file blob to simulate an APK download in the browser
      const dummyContent = "This is a placeholder for the Madurai CleanUp Android APK. In a production environment, this would be the binary .apk file for side-loading.";
      const blob = new Blob([dummyContent], { type: 'application/vnd.android.package-archive' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'madurai-cleanup-v1.0.apk');
      document.body.appendChild(link);
      link.click();
      
      // Cleanup resources
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "madurai-cleanup-v1.0.apk is being saved to your device.",
      });
    }, 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleDownload}
              size="icon" 
              className="h-14 w-14 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-2xl animate-anti-gravity group border-4 border-white"
            >
              <Download className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white border-none py-2 px-4 italic">
            Get Android APK
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
