
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
      title: "Downloading Madurai CleanUp",
      description: "Transferring APK package to your device...",
    });
    
    // Create a dummy file blob to simulate a real APK download in the browser
    const dummyContent = "Madurai CleanUp v1.0 Official Production Build. This file is a placeholder for the side-loadable Android APK package.";
    const blob = new Blob([dummyContent], { type: 'application/vnd.android.package-archive' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'madurai-cleanup-v1.0.apk');
    document.body.appendChild(link);
    link.click();
    
    // Immediate cleanup to ensure performance
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleDownload}
              size="icon" 
              className="h-16 w-16 rounded-[2rem] bg-slate-900 hover:bg-slate-800 shadow-2xl animate-anti-gravity group border-[6px] border-white active:scale-90 transition-all"
            >
              <Download className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900 text-white border-none py-2 px-4 italic">
            Get Android App (APK)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
