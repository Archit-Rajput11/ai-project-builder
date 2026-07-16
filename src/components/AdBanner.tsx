"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

export function AdBanner() {
  return (
    <div className="no-print w-full p-4 rounded-xl border border-dashed border-border-accent bg-bg-accent/5 flex flex-col items-center justify-center gap-1 text-center select-none">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        <span>Sponsor Advertisement</span>
      </div>
      <span className="text-xs font-semibold text-foreground/50">
        Google AdSense Slot - [Banner Placeholder]
      </span>
    </div>
  );
}
