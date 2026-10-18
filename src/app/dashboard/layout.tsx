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
  Layers,
  Zap,
  Search,
  Sparkles,
  Compass,
  Activity
} from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

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
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Projects", href: "/dashboard/projects", icon: FolderGit2 },
    { name: "AI Mentor", href: "/dashboard/mentor", icon: Compass },
    { name: "Feasibility", href: "/dashboard/feasibility", icon: Activity },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: isPro ? "Subscription" : "Upgrade to Pro", href: "/dashboard/pricing", icon: Zap },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("project_generation_count");
      localStorage.removeItem("loaded_project_blueprint");
    }
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard/projects") return "My Projects";
    if (pathname === "/dashboard/mentor") return "AI Project Mentor";
    if (pathname === "/dashboard/feasibility") return "AI Feasibility Analyzer";
    if (pathname === "/dashboard/profile") return "User Profile";
    if (pathname === "/dashboard/settings") return "Workspace Settings";
    if (pathname === "/dashboard/pricing") return "Subscription & Plans";
    return "New Blueprint";
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#EEF1F5] dark:bg-[#0F1720] text-[#172033] dark:text-[#F1F5F9] font-body gap-0 transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-[#CBD5E1] dark:border-[#344456] bg-white/95 dark:bg-[#111A25]/95 backdrop-blur-md w-full transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] flex items-center justify-center text-white dark:text-[#0F1720] shadow-xs transition-colors">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-sm font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">project<span className="text-[#405169] dark:text-[#CBD5E1] font-normal px-[1px]">/</span>builder</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] transition-colors cursor-pointer shadow-2xs"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] p-4 transition-all duration-150 ease-out ${
          isExpanded ? "w-60" : "w-18"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] flex items-center justify-center text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] hover:border-[#202D50]/50 dark:hover:border-[#C5F52D]/60 transition-colors cursor-pointer z-10 shadow-xs"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1 mb-6">
          <div className="w-8 h-8 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] flex items-center justify-center text-white dark:text-[#0F1720] shadow-xs shrink-0 transition-colors">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center text-sm font-display font-semibold tracking-tight text-[#172033] dark:text-[#F1F5F9]">
                <span>project</span>
                <span className="text-[#405169] dark:text-[#CBD5E1] font-normal px-[1px]">/</span>
                <span>builder</span>
              </div>
              <span className="text-[10px] font-bold text-[#405169] dark:text-[#CBD5E1] uppercase tracking-wider">
                Workspace
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
                    ? "bg-[#F1F5F9] dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] border-l-2 border-[#C5F52D] font-bold shadow-2xs" 
                    : "border-l-2 border-transparent text-[#334155] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#182330]/70 font-semibold"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#202D50] dark:text-[#C5F52D]" : "text-[#405169] dark:text-[#CBD5E1]"}`} />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="border-t border-[#CBD5E1] dark:border-[#344456] pt-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] border border-transparent hover:border-red-200 dark:hover:border-red-500/30 text-[#405169] dark:text-[#CBD5E1] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-[#0F1720]/60 backdrop-blur-sm transition-opacity"
          />

          <div className="relative flex flex-col w-64 bg-white dark:bg-[#111A25] border-r border-[#CBD5E1] dark:border-[#344456] p-5 gap-6 h-full shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] flex items-center justify-center text-white dark:text-[#0F1720]">
                  <Layers className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-sm font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
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
                        ? "bg-[#F1F5F9] dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] border-l-2 border-[#C5F52D] font-bold" 
                        : "border-l-2 border-transparent text-[#334155] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#182330]/60 font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#CBD5E1] dark:border-[#344456] pt-3 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] border border-transparent hover:border-red-200 dark:hover:border-red-500/30 text-[#405169] dark:text-[#CBD5E1] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 no-print w-full border-b border-[#CBD5E1] dark:border-[#344456] bg-white/95 dark:bg-[#111A25]/95 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4 transition-colors">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-[#334155] dark:text-[#CBD5E1]">Projects</span>
            <span className="text-[#94A3B8] dark:text-[#4B5E76]">/</span>
            <span className="text-[#172033] dark:text-[#F1F5F9] font-bold">{getBreadcrumbTitle()}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#566880] dark:text-[#A3B3C7] pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates or stacks..."
                className="pl-8 pr-3 py-1.5 rounded-[6px] bg-white dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] text-xs text-[#172033] dark:text-[#F1F5F9] placeholder-[#566880] dark:placeholder-[#A3B3C7] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D] w-52 transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Pro Status */}
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border border-[#C5F52D]/40 bg-[#C5F52D]/20 text-[#172033] dark:border-[#C5F52D]/50 dark:bg-[#C5F52D]/15 dark:text-[#C5F52D] select-none shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#202D50] dark:text-[#C5F52D]" />
                <span>Pro Member</span>
              </span>
            ) : (
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] transition-colors shadow-2xs"
              >
                <span>Free Plan</span>
                <span className="text-[#202D50] dark:text-[#C5F52D] underline ml-0.5">Upgrade</span>
              </Link>
            )}

            {/* Theme Switcher Button */}
            <ThemeSwitcher />

            {/* User Avatar */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] text-xs font-bold shadow-xs select-none">
              ST
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-1 w-full px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
