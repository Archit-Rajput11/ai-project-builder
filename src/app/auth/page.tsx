"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Layers, 
  ArrowRight, 
  ArrowUpRight, 
  Lock, 
  Eye, 
  EyeOff, 
  Info,
  X
} from "lucide-react";

type AuthMode = "signin" | "signup" | "reset";

export default function AuthPage() {
  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNotice, setShowNotice] = React.useState(false);

  // Update page title dynamically
  React.useEffect(() => {
    const titles: Record<AuthMode, string> = {
      signin: "Sign in | AI Project Builder",
      signup: "Create account | AI Project Builder",
      reset: "Reset password | AI Project Builder",
    };
    document.title = titles[mode];
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNotice(true);
  };

  const handleGitHubClick = () => {
    setShowNotice(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EEF1F4] text-[#1B2733] font-body selection:bg-[#C7F03C] selection:text-[#1B2733] overflow-x-hidden">
      {/* ========================================================= */}
      {/* LEFT PANEL: AUTH FORM (~49% Desktop, 100% Mobile)          */}
      {/* ========================================================= */}
      <section 
        className="w-full md:w-[49%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen bg-[#EEF1F4] z-10"
        aria-label="Authentication Form"
      >
        {/* Top bar with Staggered Entrance Animation */}
        <header className="w-full flex items-center justify-between pb-8 sm:pb-12 animate-studio-header">
          {/* Logo + Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#1F2C4C] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4 text-white stroke-[2.2]" />
            </div>
            <div className="flex items-center text-base sm:text-[17px] font-display font-semibold tracking-tight text-[#1B2733]">
              <span>project</span>
              <span className="text-[#6C7D8E]/70 font-normal px-[1px]">/</span>
              <span>builder</span>
            </div>
          </div>

          {/* Right Tiny Uppercase Label */}
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#6C7D8E] select-none text-right">
            YOUR WORKSPACE STARTS HERE
          </span>
        </header>

        {/* Centered Column: max-width ~430px */}
        <main className="w-full max-w-[430px] mx-auto my-auto py-4 flex flex-col">
          {/* Hero Section */}
          <div className="flex flex-col mb-8 animate-studio-hero">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 mb-3.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7F03C] shadow-[0_0_8px_#C7F03C]" />
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#1F2C4C]">
                THE STARTING POINT
              </span>
            </div>

            {/* H1 Display Font (Space Grotesk), ~56px, tight leading */}
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.04] tracking-[-0.03em] text-[#1B2733] mb-3">
              {mode === "signin" && (
                <>
                  Welcome <span className="text-[#6C7D8E]/70 font-normal">/</span>
                  <br />
                  back.
                </>
              )}
              {mode === "signup" && (
                <>
                  Make room for <span className="text-[#6C7D8E]/70 font-normal">/</span>
                  <br />
                  big ideas.
                </>
              )}
              {mode === "reset" && (
                <>
                  Find your way <span className="text-[#6C7D8E]/70 font-normal">/</span>
                  <br />
                  back in.
                </>
              )}
            </h1>

            {/* Sub-paragraph */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#6C7D8E]">
              {mode === "signin" && "Sign in to pick up where your next big idea left off."}
              {mode === "signup" && "Start with a blank page. Build something worth sharing."}
              {mode === "reset" && "Enter your email and we'll help you regain access."}
            </p>
          </div>

          {/* Inline Preview Notice Bar */}
          {showNotice && (
            <div 
              role="alert"
              className="bg-[#E2E7ED] border border-[#CBD3DC] text-[#1B2733] px-3.5 py-3 rounded-[6px] text-xs font-medium mb-6 flex items-start justify-between gap-3 animate-fade-in shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                <span>This is a design preview. Account access is not connected yet.</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowNotice(false)}
                className="text-[#6C7D8E] hover:text-[#1B2733] transition-colors p-0.5"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form and Actions */}
          <div className="flex flex-col animate-studio-form">
            {/* GitHub Button (Sign in mode only) */}
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={handleGitHubClick}
                  className="w-full h-[52px] rounded-[6px] bg-[#F9FAFB] hover:bg-white border border-[#D5DBE1] hover:border-[#CBD3DC] text-[#1B2733] font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  {/* GitHub Icon */}
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>

                {/* Divider: two hairlines with "OR WITH EMAIL" */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#D5DBE1]" />
                  </div>
                  <div className="relative px-3 bg-[#EEF1F4] text-[10px] font-bold uppercase tracking-[0.16em] text-[#6C7D8E]">
                    OR WITH EMAIL
                  </div>
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label 
                  htmlFor="email" 
                  className="text-xs font-semibold text-[#1B2733] tracking-wide"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-[52px] px-4 rounded-[6px] bg-[#F9FAFB] border border-[#D5DBE1] text-[#1B2733] placeholder-[#6C7D8E]/60 text-sm focus:outline-none focus:border-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] transition-colors shadow-2xs"
                />
              </div>

              {/* Password Field (Sign in & Sign up modes only) */}
              {mode !== "reset" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="password" 
                      className="text-xs font-semibold text-[#1B2733] tracking-wide"
                    >
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotice(false);
                          setMode("reset");
                        }}
                        className="text-xs font-semibold text-[#6C7D8E] hover:text-[#1F2C4C] transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-[52px] pl-4 pr-11 rounded-[6px] bg-[#F9FAFB] border border-[#D5DBE1] text-[#1B2733] placeholder-[#6C7D8E]/60 text-sm focus:outline-none focus:border-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] transition-colors shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6C7D8E] hover:text-[#1B2733] transition-colors p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Full-width Submit Button: Deep Navy, Label Left, Arrow Right */}
              <button
                type="submit"
                className="w-full h-[52px] rounded-[6px] bg-[#1F2C4C] hover:bg-[#151F36] active:scale-[0.99] text-[#F9FAFB] font-semibold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-between px-5 mt-2 group"
              >
                <span>
                  {mode === "signin" && "Sign in to workspace"}
                  {mode === "signup" && "Create account"}
                  {mode === "reset" && "Reset password"}
                </span>
                <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* Mode Switch Footnote */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#6C7D8E]">
              {mode === "signin" && (
                <>
                  <span>New here?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotice(false);
                      setMode("signup");
                    }}
                    className="font-bold text-[#1F2C4C] hover:text-black inline-flex items-center gap-0.5 cursor-pointer underline-offset-2 hover:underline transition-colors"
                  >
                    <span>Create an account</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {mode === "signup" && (
                <>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotice(false);
                      setMode("signin");
                    }}
                    className="font-bold text-[#1F2C4C] hover:text-black inline-flex items-center gap-0.5 cursor-pointer underline-offset-2 hover:underline transition-colors"
                  >
                    <span>Sign in</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {mode === "reset" && (
                <>
                  <span>Remember your password?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotice(false);
                      setMode("signin");
                    }}
                    className="font-bold text-[#1F2C4C] hover:text-black inline-flex items-center gap-0.5 cursor-pointer underline-offset-2 hover:underline transition-colors"
                  >
                    <span>Back to sign in</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full flex items-center justify-between pt-8 sm:pt-12 text-xs text-[#6C7D8E] border-t border-[#D5DBE1]/60">
          <span>© 2026 AI Project Builder</span>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#6C7D8E]" />
            <span>A space for what&apos;s next</span>
          </div>
        </footer>
      </section>

      {/* ========================================================= */}
      {/* RIGHT PANEL: EDITORIAL PHOTO PANEL (~51% Desktop Only)    */}
      {/* ========================================================= */}
      <section 
        className="hidden md:flex md:w-[51%] flex-col justify-between relative min-h-screen overflow-hidden bg-[#1F2C4C] select-none"
        aria-label="Editorial visual showcase"
      >
        {/* Full-bleed Architectural Photograph */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Image
            src="/images/architectural-model.jpg"
            alt="Architectural scale model and technical blueprints on workbench"
            fill
            priority
            sizes="55vw"
            className="object-cover w-full h-full animate-photo-settle"
          />
        </div>

        {/* Top Scrim (subtle darkening for top overlay text) */}
        <div 
          className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#1F2C4C]/75 via-[#1F2C4C]/30 to-transparent pointer-events-none"
          aria-hidden="true" 
        />

        {/* Dark Navy Gradient Scrim from the bottom (65% height) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#1F2C4C] via-[#1F2C4C]/85 via-45% to-transparent pointer-events-none" 
          aria-hidden="true"
        />

        {/* Top Overlay Row */}
        <header className="relative z-10 p-8 sm:p-10 flex items-center justify-between text-[#EEF1F4]">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#EEF1F4]/90">
            A BETTER WAY TO BEGIN
          </span>
          <span className="text-[11px] font-mono tracking-widest text-[#EEF1F4]/80">
            01 / 03
          </span>
        </header>

        {/* Bottom Overlay Content */}
        <footer className="relative z-10 mt-auto p-8 sm:p-10 flex flex-col gap-4 text-white">
          {/* Small chartreuse pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C7F03C] text-[#1B2733] font-bold text-[9px] tracking-[0.18em] uppercase w-fit shadow-xs">
            FROM IDEA TO IMPACT
          </div>

          {/* Large display headline */}
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#F8FAFC] tracking-tight leading-[1.14] max-w-lg">
            The next thing you build starts here.
          </h2>

          {/* Sub-line */}
          <p className="font-body text-xs sm:text-sm text-[#CBD3DC] tracking-normal -mt-1">
            Give your ideas the space to take shape.
          </p>

          {/* Hairline-top row */}
          <div className="border-t border-white/15 pt-3.5 mt-2 flex items-center justify-between text-[10px] uppercase font-bold tracking-[0.16em] text-[#CBD3DC]/75">
            <span>MAKE SOMETHING MEANINGFUL</span>
            <span>PROJECT BUILDER © 2026</span>
          </div>

          {/* Thin Progress Bar with looping chartreuse segment */}
          <div 
            className="relative w-full h-[2px] bg-white/15 rounded-full overflow-hidden mt-0.5"
            role="progressbar"
            aria-label="Editorial visual indicator"
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="absolute top-0 bottom-0 w-24 bg-[#C7F03C] rounded-full animate-line-travel" />
          </div>
        </footer>
      </section>
    </div>
  );
}
