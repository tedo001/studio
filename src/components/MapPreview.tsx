"use client";

import { cn } from "@/lib/utils";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  className?: string;
}

/**
 * A simple OpenStreetMap embed component to show a specific location.
 */
export function MapPreview({ latitude, longitude, className }: MapPreviewProps) {
  // Madurai central bounds approx (9.9252, 78.1198)
  // We calculate a small bounding box around the point
  const delta = 0.002;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className={cn("relative w-full aspect-video rounded-2xl overflow-hidden border bg-slate-100 shadow-inner", className)}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={src}
        className="grayscale-[0.1] contrast-[1.1] opacity-90"
      />
      <div className="absolute inset-0 pointer-events-none border-[6px] border-white/20 rounded-2xl" />
    </div>
  );
}
