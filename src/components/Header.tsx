"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles } from "lucide-react";
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
    <header className="sticky top-4 z-50 w-full max-w-5xl mx-auto px-4 select-none">
      <nav className="flex items-center justify-between px-6 py-3 rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/[0.08] shadow-lg shadow-black/20 transition-all duration-200">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 transition-all duration-200 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-sans font-semibold tracking-tight text-slate-100 text-base">
            AI College Project Builder
          </span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.08] bg-slate-900/60 text-slate-200 hover:bg-white/10 hover:border-cyan-500/30 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-300 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-400 rotate-0 transition-transform duration-300 hover:-rotate-12" />
            )
          ) : (
            <div className="w-4 h-4 rounded-full bg-slate-800 animate-pulse" />
          )}
        </button>
      </nav>
    </header>
  );
}
