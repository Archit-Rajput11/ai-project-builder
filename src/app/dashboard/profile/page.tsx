"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Award, Mail, GraduationCap, Calendar } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear mock session cookie
    document.cookie = "mock-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/auth");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          My Profile
        </h2>
        <p className="text-sm text-foreground/60">
          Review your student account credentials and learning tracking metrics.
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-3xl border border-border-accent bg-bg-accent/20 backdrop-blur-md shadow-sm flex flex-col md:flex-row gap-6 items-center">
        {/* Glowing Profile Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-1 shadow-lg shadow-primary/20 flex items-center justify-center relative select-none">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-foreground font-extrabold text-3xl">
            S
          </div>
        </div>

        {/* User Info details */}
        <div className="flex-1 flex flex-col gap-4 w-full text-center md:text-left">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Student User</h3>
            <span className="text-xs text-foreground/40 mt-1 block">Account Level: Standard Academic Tier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground/70">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Mail className="w-4 h-4 text-foreground/40" />
              <span>student@university.edu</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <GraduationCap className="w-4 h-4 text-foreground/40" />
              <span>Computer Science & Engineering</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Calendar className="w-4 h-4 text-foreground/40" />
              <span>Joined July 2026</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Award className="w-4 h-4 text-foreground/40" />
              <span>3 Blueprints Compiled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Control Actions */}
      <div className="p-5 rounded-2xl border border-border-accent bg-bg-accent/10 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Account Operations</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
