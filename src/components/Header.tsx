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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-100 group-hover:border-zinc-700 transition-colors">
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
            className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors"
          >
            Console
          </Link>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
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
