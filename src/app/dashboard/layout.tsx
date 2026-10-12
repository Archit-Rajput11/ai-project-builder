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
  Sparkles
} from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";

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
    if (pathname === "/dashboard/profile") return "User Profile";
    if (pathname === "/dashboard/settings") return "Workspace Settings";
    if (pathname === "/dashboard/pricing") return "Subscription & Plans";
    return "New Blueprint";
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#EEF1F4] text-[#1B2733] font-body gap-0">
      {/* Mobile Top Header */}
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-[#D5DBE1] bg-white/90 backdrop-blur-md w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-[#1F2C4C] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          <span className="text-sm font-display font-semibold text-[#1B2733]">project<span className="text-[#6C7D8E]/70 font-normal">/</span>builder</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-[6px] border border-[#D5DBE1] bg-white text-[#6C7D8E] hover:text-[#1B2733] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-[#D5DBE1] bg-white p-4 transition-all duration-150 ease-out ${
          isExpanded ? "w-60" : "w-18"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-[#D5DBE1] bg-white flex items-center justify-center text-[#6C7D8E] hover:text-[#1B2733] hover:border-[#1F2C4C]/30 transition-colors cursor-pointer z-10 shadow-xs"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1 mb-6">
          <div className="w-8 h-8 rounded-[6px] bg-[#1F2C4C] flex items-center justify-center text-white shadow-xs shrink-0">
            <Layers className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center text-sm font-display font-semibold tracking-tight text-[#1B2733]">
                <span>project</span>
                <span className="text-[#6C7D8E]/70 font-normal px-[1px]">/</span>
                <span>builder</span>
              </div>
              <span className="text-[10px] font-medium text-[#6C7D8E] uppercase tracking-wider">
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
                    ? "bg-[#1F2C4C]/8 text-[#1F2C4C] border-l-2 border-[#C7F03C] font-semibold" 
                    : "border-l-2 border-transparent text-[#6C7D8E] hover:text-[#1B2733] hover:bg-[#1F2C4C]/5"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#1F2C4C]" : "text-[#6C7D8E]"}`} />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="border-t border-[#D5DBE1]/60 pt-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] border border-transparent hover:border-red-200 text-[#6C7D8E] hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-[#1B2733]/40 backdrop-blur-sm transition-opacity"
          />

          <div className="relative flex flex-col w-64 bg-white border-r border-[#D5DBE1] p-5 gap-6 h-full shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] bg-[#1F2C4C] flex items-center justify-center text-white">
                  <Layers className="w-4 h-4 text-white stroke-[2.2]" />
                </div>
                <span className="text-sm font-display font-semibold text-[#1B2733]">Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-[6px] border border-[#D5DBE1] text-[#6C7D8E] hover:text-[#1B2733] transition-colors cursor-pointer"
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
                        ? "bg-[#1F2C4C]/8 text-[#1F2C4C] border-l-2 border-[#C7F03C] font-semibold" 
                        : "border-l-2 border-transparent text-[#6C7D8E] hover:text-[#1B2733] hover:bg-[#1F2C4C]/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#D5DBE1]/60 pt-3 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] border border-transparent hover:border-red-200 text-[#6C7D8E] hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
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
        <header className="sticky top-0 z-30 no-print w-full border-b border-[#D5DBE1]/60 bg-white/90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-[#6C7D8E]">Projects</span>
            <span className="text-[#D5DBE1]">/</span>
            <span className="text-[#1B2733] font-semibold">{getBreadcrumbTitle()}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#6C7D8E] pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates or stacks..."
                className="pl-8 pr-3 py-1.5 rounded-[6px] bg-[#F9FAFB] border border-[#D5DBE1] text-xs text-[#1B2733] placeholder-[#6C7D8E]/60 focus:outline-none focus:border-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] w-52 transition-all"
              />
            </div>

            {/* Pro Status */}
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-[#C7F03C]/30 bg-[#C7F03C]/10 text-[#1B2733]">
                <Sparkles className="w-3 h-3 text-[#1F2C4C]" />
                <span>Pro Member</span>
              </span>
            ) : (
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-[#1F2C4C]/20 bg-[#1F2C4C]/5 text-[#1F2C4C] hover:bg-[#1F2C4C]/10 transition-colors"
              >
                <span>Free Plan</span>
                <span className="underline ml-0.5">Upgrade</span>
              </Link>
            )}

            {/* Avatar */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1F2C4C] text-white text-xs font-bold">
              ST
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 w-full px-6 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
