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
  Terminal,
  Zap,
  Search,
  Bell,
  Sparkles
} from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const { isPro } = useProStatus();

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
      icon: Zap,
    },
  ];

  const handleSignOut = () => {
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard/projects") return "My Projects";
    if (pathname === "/dashboard/profile") return "User Profile";
    if (pathname === "/dashboard/settings") return "Workspace Settings";
    if (pathname === "/dashboard/pricing") return "Subscription & Plans";
    return "New Blueprint";
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#080b11] text-[#f8fafc] gap-0">
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-md w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#111622] border border-white/[0.1] text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-[#f8fafc]">AI Project Builder</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg border border-white/[0.08] bg-[#111622] text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Sidebar Container (Fixed left side, hidden on mobile) */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-white/[0.08] bg-[#0c1017] p-4 transition-all duration-150 ease-out ${
          isExpanded ? "w-60" : "w-18"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-white/[0.1] bg-[#111622] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer z-10"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111622] border border-white/[0.1] text-indigo-400 shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold tracking-tight text-[#f8fafc] truncate">
                Project Builder
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Developer Console
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors rounded-r-md ${
                  isActive 
                    ? "bg-white/[0.08] text-white border-l-2 border-indigo-400 font-medium" 
                    : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-white/[0.08] pt-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isExpanded && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print flex">
          <div 
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="relative flex flex-col w-64 bg-[#0c1017] border-r border-white/[0.08] p-5 gap-6 h-full shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#111622] border border-white/[0.1] text-indigo-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-[#f8fafc]">Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors rounded-r-md ${
                      isActive 
                        ? "bg-white/[0.08] text-white border-l-2 border-indigo-400 font-medium" 
                        : "border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/[0.08] pt-3 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area with Persistent Top Header Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Persistent Top Header Bar across main content area */}
        <header className="sticky top-0 z-30 no-print w-full border-b border-white/[0.08] bg-[#0c1017]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-400">Projects</span>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold">{getBreadcrumbTitle()}</span>
          </div>

          {/* Quick Search & User Profile Header */}
          <div className="flex items-center gap-3">
            {/* Quick search pill */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates or stacks..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#111622] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400/50 w-52 transition-all"
              />
            </div>

            {/* Pro Status Tag */}
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Pro Member</span>
              </span>
            ) : (
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <span>Free Plan</span>
                <span className="underline ml-0.5">Upgrade</span>
              </Link>
            )}

            {/* User Avatar Initials */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
              ST
            </div>
          </div>
        </header>

        {/* Workspace Canvas Pane */}
        <div className="flex-1 w-full px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
