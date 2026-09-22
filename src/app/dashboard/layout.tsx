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
  Zap
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
      icon: Zap,
    },
  ];

  const handleSignOut = () => {
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#0a0a0c] text-[#f8fafc] gap-0">
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-md w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-100">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-[#f8fafc]">AI Project Builder</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg border border-white/[0.08] bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Sidebar Container (Fixed left side, hidden on mobile) */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-white/[0.08] bg-[#0d1017] p-4 transition-all duration-150 ease-out ${
          isExpanded ? "w-60" : "w-18"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-white/[0.1] bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer z-10"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-100 shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold tracking-tight text-[#f8fafc] truncate">
                Project Builder
              </span>
              <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive 
                    ? "bg-white/[0.08] text-white border border-white/[0.08]" 
                    : "border border-transparent text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#64748b]"}`} />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-white/[0.08] pt-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:border-red-500/20 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 bg-[#0d1017] border-r border-white/[0.08] p-5 gap-6 h-full shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-100">
                  <Terminal className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-[#f8fafc]">Navigation</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? "bg-white/[0.08] text-white border border-white/[0.08]" 
                        : "border border-transparent text-[#94a3b8] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/[0.08] pt-3 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:border-red-500/20 text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
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
