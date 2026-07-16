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
      <div className="md:hidden no-print flex items-center justify-between p-4 border-b border-border-accent/40 bg-bg-accent/20 backdrop-blur-md w-full">
        <span className="text-sm font-extrabold text-foreground">Dashboard Menu</span>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl border border-border-accent bg-background/50 text-foreground cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar Container (Fixed left side, hidden on mobile) */}
      <aside 
        className={`hidden md:flex no-print flex-col shrink-0 border-r border-border-accent/40 bg-bg-accent/10 p-5 transition-all duration-300 ${
          isExpanded ? "w-64" : "w-20"
        } relative min-h-screen`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-border-accent bg-background flex items-center justify-center text-foreground hover:text-primary transition-all cursor-pointer shadow-sm z-10"
        >
          {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/10" 
                    : "border-transparent text-foreground/60 hover:text-foreground hover:bg-bg-accent/30"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-border-accent/40 pt-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all cursor-pointer"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 bg-slate-900 border-r border-border-accent/60 p-6 gap-6 animate-slide-in h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground">Navigation</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-xl border border-border-accent text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                      isActive 
                        ? "bg-primary border-primary text-white shadow-lg" 
                        : "border-transparent text-foreground/60 hover:text-foreground hover:bg-bg-accent/30"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-border-accent/40 pt-4 mt-auto">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all cursor-pointer"
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
