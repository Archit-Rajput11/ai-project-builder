"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Sun, Moon, Terminal, ArrowRight, CheckCircle2, Layers, Cpu, FileCode2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Field values
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Touch flags to prevent premature errors on initial render
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error") || params.get("error_description");
      if (urlError) {
        setAuthError(decodeURIComponent(urlError));
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Strict RFC 5322 regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Validation checks
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 8;
  const isNameValid = !isSignUp || name.trim().length > 0;
  const isAgreementValid = !isSignUp || agreeTerms;

  // Active validation errors
  const emailError = (emailTouched || email.length > 0) && !isEmailValid ? "Please enter a valid email address" : "";
  const passwordError = (passwordTouched || password.length > 0) && !isPasswordValid ? "Password must be at least 8 characters long" : "";
  const nameError = isSignUp && (nameTouched || name.length > 0) && !isNameValid ? "Please enter your name" : "";

  // Submit button disabled conditions
  const isFormInvalid = !isEmailValid || !isPasswordValid || (isSignUp && (!isNameValid || !isAgreementValid));
  const hasValidationErrors = !!(emailError || passwordError || nameError);
  const isSubmitDisabled = isFormInvalid || hasValidationErrors || loading;

  // Reset touched states when changing view mode
  React.useEffect(() => {
    setEmailTouched(false);
    setPasswordTouched(false);
    setNameTouched(false);
  }, [isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          alert(`Sign up error: ${error.message}`);
          return;
        }

        if (data?.user) {
          document.cookie = "mock-logged-in=true; path=/";
          alert("Account created successfully!");
          window.location.href = '/dashboard';
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          alert(`Login failed: ${error.message}`);
          return;
        }

        if (data?.user) {
          document.cookie = "mock-logged-in=true; path=/";
          window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      alert(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setLoading(true);
    setAuthError(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("OAuth sign in error:", err);
      setAuthError(err.message || "Failed to connect to authentication provider.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#080b11] text-[#f8fafc] selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-white/[0.08] bg-[#0c1017]/80 backdrop-blur-md px-6 py-3.5 select-none shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111622] border border-white/[0.1] text-indigo-400 group-hover:border-indigo-400/40 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-[#f8fafc] text-sm sm:text-base">
              AI College Project Builder
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Back to Overview
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-[#111622] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Split / Branded Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-[#090d14] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          
          {/* Left / Hero Column (Raycast/Supabase style product highlight) */}
          <div className="md:col-span-6 bg-[#0c1017] border-b md:border-b-0 md:border-r border-white/[0.08] p-8 sm:p-10 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 w-fit">
                <Cpu className="w-3.5 h-3.5" />
                <span>Next-Gen Capstone Engine</span>
              </div>

              {/* Tagline */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f8fafc] leading-tight">
                  Architect your capstone projects with production-grade scaffolding.
                </h2>
                <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                  Generate complete system blueprints, repository file trees, 6-week Kanban roadmaps, and formatted thesis outlines ready for committee reviews.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: Layers, label: "Full-Stack Templates" },
                  { icon: FileCode2, label: "Automated Architecture" },
                  { icon: CheckCircle2, label: "Export to PDF" },
                  { icon: Terminal, label: "Viva Question Bank" },
                ].map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-[#111622] text-xs font-medium text-slate-300"
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{feat.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Mini Terminal Code Scaffolding Mockup */}
              <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#07090e] p-4 text-xs font-mono text-slate-300 shadow-inner">
                <div className="flex items-center gap-1.5 pb-2 mb-2.5 border-b border-white/[0.06] text-slate-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/60 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60 inline-block" />
                  <span className="ml-1 text-slate-400">academic-scaffold ~ bash</span>
                </div>
                <div className="text-indigo-400 font-semibold">$ npx create-capstone-blueprint</div>
                <div className="text-slate-400 mt-1">✔ Analyzing domain: Distributed Web Architecture</div>
                <div className="text-slate-400">✔ Generating React 19 + Node.js + PostgreSQL tree</div>
                <div className="text-emerald-400 mt-0.5">✔ Generated 6-week Kanban roadmap & IEEE report</div>
              </div>
            </div>

            {/* Bottom social proof marker */}
            <div className="pt-6 mt-6 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
              <span>Trusted by CS & IT Engineering Students</span>
              <span className="text-indigo-400 font-mono text-[11px]">v2.4.0</span>
            </div>
          </div>

          {/* Right / Form Column */}
          <div className="md:col-span-6 bg-[#090d14] p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f8fafc]">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isSignUp 
                  ? "Sign up with your student email to access project tools" 
                  : "Enter your credentials to continue to your dashboard"
                }
              </p>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 leading-relaxed">{authError}</div>
              </div>
            )}

            {/* Social Auth Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleOAuthLogin('github')}
              className={`w-full mb-4 py-2.5 px-4 rounded-lg bg-[#161c28] hover:bg-[#1c2433] text-slate-200 border border-white/[0.08] text-sm font-medium transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm ${
                loading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  <span>Connecting to GitHub...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-[#090d14] text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Or continue with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name Field (Sign up mode) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    placeholder="Jane Doe"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-[#111622] border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none transition-all ${
                      nameError ? "!border-red-500/50" : ""
                    }`}
                  />
                  {nameError && (
                    <span className="text-xs text-red-400 mt-1 block">
                      {nameError}
                    </span>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="student@university.edu"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-[#111622] border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none transition-all ${
                    emailError ? "!border-red-500/50" : ""
                  }`}
                />
                {emailError && (
                  <span className="text-xs text-red-400 mt-1 block">
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Password recovery link has been sent to your email!");
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#111622] border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 focus:outline-none transition-all ${
                      passwordError ? "!border-red-500/50" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer select-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <span className="text-xs text-red-400 mt-1 block">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Terms checkbox if in Sign Up mode */}
              {isSignUp && (
                <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-400/30 cursor-pointer"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="text-indigo-400 hover:underline">Terms</a>
                    {" "}and{" "}
                    <a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>.
                  </span>
                </label>
              )}

              {/* Primary CTA Button: Matte Indigo/Electric Blue with tactile depth */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full mt-3 py-2.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-medium text-sm shadow-sm border border-indigo-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitDisabled ? "!opacity-40 !cursor-not-allowed !pointer-events-none" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Create Student Account" : "Sign In to Console"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
              <p className="text-xs text-slate-400">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="font-medium text-indigo-400 hover:underline transition-colors cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    New to AI Project Builder?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="font-medium text-indigo-400 hover:underline transition-colors cursor-pointer ml-1"
                    >
                      Sign Up Free
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
