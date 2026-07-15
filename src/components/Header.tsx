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
      <nav className="flex items-center justify-between px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border border-border-accent/50 shadow-sm transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight bg-gradient-to-r from-primary to-blue-600 dark:to-cyan-400 bg-clip-text text-transparent">
            AI College Project Builder
          </span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-border-accent bg-bg-accent/40 text-foreground hover:bg-border-accent hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-90" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-blue-600 rotate-0 transition-transform duration-500 hover:-rotate-12" />
            )
          ) : (
            <div className="w-4.5 h-4.5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          )}
        </button>
      </nav>
    </header>
  );
}
