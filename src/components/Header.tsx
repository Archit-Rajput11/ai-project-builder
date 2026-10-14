"use client";

import * as React from "react";
import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#CBD5E1]/80 dark:border-[#344456] bg-[#EEF1F5]/90 dark:bg-[#111A25]/90 backdrop-blur-md px-6 py-3.5 select-none transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] flex items-center justify-center text-white dark:text-[#0F1720] shadow-xs transition-colors">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex items-center text-base font-display font-semibold tracking-tight text-[#172033] dark:text-[#F1F5F9]">
            <span>project</span>
            <span className="text-[#475569] dark:text-[#A7B6C8] font-normal px-[1px]">/</span>
            <span>builder</span>
          </div>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-xs font-semibold text-[#475569] hover:text-[#172033] dark:text-[#CBD5E1] dark:hover:text-[#F1F5F9] transition-colors hidden sm:block"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] shadow-xs transition-all"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
