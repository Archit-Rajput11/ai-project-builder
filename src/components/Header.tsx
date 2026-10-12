"use client";

import * as React from "react";
import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D5DBE1]/60 bg-[#EEF1F4]/90 backdrop-blur-md px-6 py-3.5 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[6px] bg-[#1F2C4C] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          <div className="flex items-center text-base font-display font-semibold tracking-tight text-[#1B2733]">
            <span>project</span>
            <span className="text-[#6C7D8E]/70 font-normal px-[1px]">/</span>
            <span>builder</span>
          </div>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-xs font-medium text-[#6C7D8E] hover:text-[#1B2733] transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-[6px] bg-[#1F2C4C] hover:bg-[#151F36] text-white shadow-xs transition-all"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
