"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Terminal } from "lucide-react";
import Link from "next/link";

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-md px-6 py-3.5 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111622] border border-white/[0.1] text-indigo-400 group-hover:border-indigo-400/40 transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-sans font-semibold tracking-tight text-[#f8fafc] text-sm sm:text-base">
            AI College Project Builder
          </span>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-sm border border-indigo-400/30 transition-all"
          >
            Console
          </Link>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-[#111622] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
