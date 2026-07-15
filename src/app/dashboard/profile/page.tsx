"use client";

import * as React from "react";
import { User, Award, Mail, GraduationCap, Calendar, Edit3, Check, Key, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = React.useState("Student User");
  const [email, setEmail] = React.useState("student@university.edu");
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editNameInput, setEditNameInput] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState("");

  React.useEffect(() => {
    const savedName = localStorage.getItem("profile_user_name");
    const savedEmail = localStorage.getItem("profile_user_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSaveName = () => {
    if (editNameInput.trim()) {
      setName(editNameInput.trim());
      localStorage.setItem("profile_user_name", editNameInput.trim());
    }
    setIsEditingName(false);
  };

  const getInitials = (userName: string) => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "S";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleResetPassword = () => {
    setToastMessage(`A password reset link has been sent to ${email}.`);
    setTimeout(() => setToastMessage(""), 4000);
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
            {getInitials(name)}
          </div>
        </div>

        {/* User Info details */}
        <div className="flex-1 flex flex-col gap-4 w-full text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    className="px-3 py-1 rounded-lg border border-primary bg-background text-foreground text-sm font-semibold focus:outline-none"
                    placeholder="Enter name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-primary/10 border border-primary/20 text-primary cursor-pointer hover:bg-primary/20 transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-extrabold text-foreground">{name}</h3>
                  <button
                    onClick={() => {
                      setEditNameInput(name);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded text-foreground/45 hover:text-foreground hover:bg-bg-accent/40 transition-all cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            <span className="text-xs text-foreground/40 mt-1 block">Account Level: Standard Academic Tier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground/70">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Mail className="w-4 h-4 text-foreground/40" />
              <span>{email}</span>
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
            onClick={handleResetPassword}
            className="px-4 py-2 rounded-xl border border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-4 h-4" />
            Reset Password
          </button>
        </div>
      </div>

      {/* Toast Notification for reset link */}
      {toastMessage && (
        <div className="no-print fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-950/90 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-950/50 animate-fade-in flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
