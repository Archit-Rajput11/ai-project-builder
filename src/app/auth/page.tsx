"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
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

  // Touch flags to prevent premature errors on initial render
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
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

  // The submit button is disabled if there are any active errors,
  // or if the required inputs are invalid/empty.
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
        // Sign up through Supabase Auth
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
        // Log in via Supabase
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

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#07090e] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Atmospheric Background & Ambient Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-0" />

      {/* Top Navbar */}
      <header className="fixed top-5 w-[90%] max-w-4xl z-20">
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/40">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all duration-200">
              {/* Logo Icon */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-white text-sm sm:text-base">AI College Project Builder</span>
          </Link>
          {/* Theme Toggle Button */}
          <button 
            type="button" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/10 cursor-pointer"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )
            ) : (
              <div className="w-4 h-4 rounded-full bg-slate-800 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="relative z-10 w-full max-w-[420px] px-4 pt-16">
        <div className="rounded-3xl bg-[#0d121d]/80 border border-white/[0.1] backdrop-blur-2xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-400">
              {isSignUp ? "Start building your academic portfolio today" : "Sign in to access your dashboard and projects"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Only in Sign Up Mode) */}
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ml-0.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    placeholder="Jane Doe"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/[0.09] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 ${
                      nameError ? "!border-red-500/50 !focus:ring-red-500/20" : ""
                    }`}
                  />
                </div>
                {nameError && (
                  <span className="text-[11px] text-red-400 font-medium pl-1 mt-1 block">
                    {nameError}
                  </span>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ml-0.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="student@university.edu"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/[0.09] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 ${
                    emailError ? "!border-red-500/50 !focus:ring-red-500/20" : ""
                  }`}
                />
              </div>
              {emailError && (
                <span className="text-[11px] text-red-400 font-medium pl-1 mt-1 block">
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-0.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {!isSignUp && (
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Password recovery link has been sent to your email!");
                    }}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090d16]/90 border border-white/[0.09] text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 ${
                    passwordError ? "!border-red-500/50 !focus:ring-red-500/20" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer select-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <span className="text-[11px] text-red-400 font-medium pl-1 mt-1 block">
                  {passwordError}
                </span>
              )}
            </div>

            {/* Terms checkbox if in Sign Up mode */}
            {isSignUp && (
              <label className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400/30 cursor-pointer accent-cyan-500"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-cyan-400 hover:underline font-semibold">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-cyan-400 hover:underline font-semibold">Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* Sign up / Sign in mode switch */}
            <p className="text-xs text-center text-slate-400 pt-1">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
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
                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:shadow-[0_0_32px_rgba(34,211,238,0.5)] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitDisabled ? "!opacity-50 !cursor-not-allowed !pointer-events-none !shadow-none" : ""
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Free Account" : "Sign In to Account"}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
