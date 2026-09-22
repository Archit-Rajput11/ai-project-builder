"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Sun, Moon, Terminal, ArrowRight } from "lucide-react";
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

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a0a0c] text-[#f8fafc] selection:bg-zinc-800 selection:text-zinc-100">
      {/* Standard Full-Width Top Navigation Bar Anchored to the Top */}
      <header className="w-full border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 select-none shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-100 group-hover:border-zinc-700 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-[#f8fafc] text-sm sm:text-base">
              AI College Project Builder
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
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

      {/* Center Auth Card Surface */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] p-7 sm:p-8 rounded-xl bg-[#11141c] border border-white/[0.08] shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#f8fafc]">
              {isSignUp ? "Create an account" : "Sign in to your account"}
            </h1>
            <p className="text-sm text-[#94a3b8] mt-1.5 leading-relaxed">
              {isSignUp 
                ? "Enter your details to access the AI workspace" 
                : "Welcome back. Enter your credentials to continue"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (Sign up mode) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Jane Doe"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-[#161a24] border border-white/[0.1] text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:outline-none transition-colors ${
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
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="student@university.edu"
                required
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#161a24] border border-white/[0.1] text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:outline-none transition-colors ${
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
                <label className="text-xs font-medium text-[#94a3b8]">
                  Password
                </label>
                {!isSignUp && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Password recovery link has been sent to your email!");
                    }}
                    className="text-xs text-[#94a3b8] hover:text-zinc-200 transition-colors"
                  >
                    Forgot password?
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
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#161a24] border border-white/[0.1] text-sm text-[#f8fafc] placeholder-[#64748b] focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:outline-none transition-colors ${
                    passwordError ? "!border-red-500/50" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#64748b] hover:text-zinc-300 transition-colors cursor-pointer select-none"
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
              <label className="flex items-start gap-2.5 text-xs text-[#94a3b8] cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-zinc-200 focus:ring-zinc-400/30 cursor-pointer"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-zinc-200 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-zinc-200 hover:underline">Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* Solid High-Contrast Primary Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full mt-2 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitDisabled ? "!opacity-40 !cursor-not-allowed !pointer-events-none" : ""
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
            <p className="text-xs text-[#94a3b8]">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="font-medium text-zinc-200 hover:underline transition-colors cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="font-medium text-zinc-200 hover:underline transition-colors cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
