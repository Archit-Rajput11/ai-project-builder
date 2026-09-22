"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderGit2, 
  User, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkles
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Projects",
      href: "/dashboard/projects",
      icon: FolderGit2,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      name: "Upgrade to Pro",
      href: "/dashboard/pricing",
      icon: Sparkles,
    },
  ];

  const handleSignOut = () => {
    // Clear mock session cookie
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-background text-foreground gap-0">
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl w-full">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-foreground">AI Project Builder</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/60 text-foreground hover:border-cyan-500/30 transition-all duration-200 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar Container (Fixed left side, hidden on mobile) */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#0f172a]/95 backdrop-blur-xl p-5 transition-all duration-200 ease-out ${
          isExpanded ? "w-64" : "w-20"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer shadow-sm z-10"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1 mb-6">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-extrabold tracking-tight truncate bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Project Builder
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Workspace
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ease-out ${
                  isActive 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-sm shadow-cyan-500/10 font-bold" 
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-500 dark:text-cyan-400" : ""}`} />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-slate-200 dark:border-white/10 pt-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold transition-all duration-200 ease-out cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isExpanded && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Mobile menu backdrop and content) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print flex">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-white/10 p-6 gap-6 animate-slide-in h-full shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold text-foreground">Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-100 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ease-out ${
                      isActive 
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-sm shadow-cyan-500/10 font-bold" 
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold transition-all duration-200 ease-out cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Content Pane */}
      <div className="flex-1 w-full overflow-y-auto px-6 md:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
