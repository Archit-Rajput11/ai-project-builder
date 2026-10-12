"use client";

import * as React from "react";
import { Suspense } from "react";
import { User, Award, Mail, GraduationCap, Calendar, Edit3, Check, Key, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ProfileContent() {
  const searchParams = useSearchParams();

  const [name, setName] = React.useState("Student User");
  const [email, setEmail] = React.useState("student@university.edu");
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editNameInput, setEditNameInput] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState("");

  const [isVerified, setIsVerified] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isVerified") === "true";
    }
    return false;
  });

  React.useEffect(() => {
    const savedName = localStorage.getItem("profile_user_name");
    const savedEmail = localStorage.getItem("profile_user_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);

    // Check if the URL contains the verified=true search parameter
    const isUrlVerified = searchParams.get("verified") === "true";
    if (isUrlVerified) {
      setIsVerified(true);
      localStorage.setItem("isVerified", "true");
      // Clean up/remove the query parameter from the browser's address bar
      const newUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams]);

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

  const handleInstantVerify = () => {
    setIsVerified(true);
    localStorage.setItem("isVerified", "true");
    setToastMessage("Account verified successfully!");
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="flex flex-col gap-6 font-body pb-12">
      <div>
        <h2 className="text-xl font-display font-semibold tracking-tight text-[#1B2733] flex items-center gap-2">
          <User className="w-5 h-5 text-[#1F2C4C]" />
          My Profile
        </h2>
        <p className="text-sm text-[#6C7D8E] mt-1">
          Review your student account credentials and learning tracking metrics.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="p-6 md:p-8 rounded-xl border border-[#D5DBE1] bg-white shadow-xs flex flex-col md:flex-row gap-6 items-center">
        {/* Navy Profile Avatar with Chartreuse Accent Border */}
        <div className="w-24 h-24 rounded-full bg-[#1F2C4C] border-2 border-[#C7F03C] shadow-xs flex items-center justify-center text-white font-display font-bold text-3xl shrink-0 select-none">
          {getInitials(name)}
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
                    className="h-9 px-3 rounded-[6px] border border-[#D5DBE1] bg-[#F9FAFB] text-[#1B2733] text-sm font-semibold focus:outline-none focus:border-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] transition-all"
                    placeholder="Enter name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-[6px] bg-[#1F2C4C] hover:bg-[#151F36] text-white cursor-pointer transition-colors shadow-xs"
                    title="Save Name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-display font-semibold text-[#1B2733]">{name}</h3>
                  <button
                    onClick={() => {
                      setEditNameInput(name);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded-[6px] text-[#6C7D8E] hover:text-[#1B2733] hover:bg-[#1F2C4C]/5 transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            <span className="text-xs text-[#6C7D8E] mt-1 block">Account Level: Standard Academic Tier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#1B2733]">
            <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
              <Mail className="w-4 h-4 text-[#6C7D8E]" />
              <span className="text-[#1B2733]">{email}</span>
              {isVerified ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1 select-none">
                  ✅ Verified Account
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1 select-none">
                    ⚠️ Unverified Account
                  </span>
                  <button
                    onClick={handleInstantVerify}
                    className="bg-[#1F2C4C] hover:bg-[#151F36] text-white text-[10px] px-2 py-0.5 rounded-[4px] font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors select-none"
                  >
                    Verify Now
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <GraduationCap className="w-4 h-4 text-[#6C7D8E]" />
              <span>Computer Science & Engineering</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Calendar className="w-4 h-4 text-[#6C7D8E]" />
              <span>Joined July 2026</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Award className="w-4 h-4 text-[#6C7D8E]" />
              <span>3 Blueprints Compiled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Control Actions */}
      <div className="p-6 rounded-xl border border-[#D5DBE1] bg-white shadow-xs flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-[#6C7D8E] uppercase tracking-wider">Account Operations</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetPassword}
            className="px-4 py-2 rounded-[6px] border border-[#D5DBE1] bg-white hover:bg-[#F9FAFB] text-[#1B2733] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Key className="w-4 h-4 text-[#6C7D8E]" />
            Reset Password
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-24 right-6 z-50 px-4 py-3 rounded-[6px] border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold shadow-md flex items-center gap-2 transition-all">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse text-sm text-[#6C7D8E] p-6 border border-[#D5DBE1] bg-white rounded-xl">
          Loading profile data...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
