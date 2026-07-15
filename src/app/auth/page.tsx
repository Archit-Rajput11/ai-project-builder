"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Field values
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);

  // Touch flags to prevent premature errors on initial render
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

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
  const isSubmitDisabled = isFormInvalid || hasValidationErrors;

  // Reset touched states when changing view mode
  React.useEffect(() => {
    setEmailTouched(false);
    setPasswordTouched(false);
    setNameTouched(false);
  }, [isSignUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    console.log("Form Submitted:", {
      type: isSignUp ? "Sign Up" : "Log In",
      name: isSignUp ? name : undefined,
      email,
      password,
      agreeTerms: isSignUp ? agreeTerms : undefined,
    });
    
    // Set mock session cookie to satisfy Edge proxy validations
    document.cookie = "mock-logged-in=true; path=/";
    
    // Redirect straight to dashboard
    router.push("/dashboard");
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`OAuth login initiated for ${provider}`);
    alert(`Initiating OAuth connection with ${provider}...`);
  };

  return (
    <div className="flex flex-col min-h-screen py-4 bg-background">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 mt-6">
        <div className="flex flex-1 items-center justify-center py-8 md:py-16">
          <div className="w-full max-w-md p-8 rounded-3xl border border-border-accent bg-bg-accent/30 backdrop-blur-lg shadow-xl flex flex-col gap-6 animate-fade-in">
            
            {/* Top Header Card */}
            <div className="text-center flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/15 mb-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI College Project Builder</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-sm text-foreground/60">
                {isSignUp 
                  ? "Start building your academic portfolio today" 
                  : "Sign in to access your dashboard and projects"
                }
              </p>
            </div>

            {/* Social Logins Group */}
            <div className="grid grid-cols-2 gap-3 select-none">
              {/* Google Button */}
              <button
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border-accent bg-bg-accent/40 text-foreground text-xs font-bold hover:bg-border-accent hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>

              {/* GitHub Button */}
              <button
                onClick={() => handleSocialLogin("GitHub")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border-accent bg-bg-accent/40 text-foreground text-xs font-bold hover:bg-border-accent hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-accent/40" />
              <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest select-none">Or Email</span>
              <div className="flex-1 h-px bg-border-accent/40" />
            </div>

            {/* Main Auth Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name Field (Only visible in signup mode) */}
              {isSignUp && (
                <div className="flex flex-col gap-1.5 animate-slide-down">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Full Name</label>
                  <div className="flex items-center relative">
                    <User className="absolute left-4 w-4 h-4 text-foreground/35" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        nameError 
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-border-accent focus:border-primary"
                      }`}
                    />
                  </div>
                  {nameError && (
                    <span className="text-[10px] text-red-500 font-semibold pl-1">
                      {nameError}
                    </span>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center relative">
                  <Mail className="absolute left-4 w-4 h-4 text-foreground/35" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      emailError 
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                        : "border-border-accent focus:border-primary"
                    }`}
                  />
                </div>
                {emailError && (
                  <span className="text-[10px] text-red-500 font-semibold pl-1">
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Password recovery link has been sent to your email!");
                      }}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                    >
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="flex items-center relative">
                  <Lock className="absolute left-4 w-4 h-4 text-foreground/35" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    className={`w-full pl-11 pr-12 py-3 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12 ${
                      passwordError 
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                        : "border-border-accent focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-foreground/35 hover:text-foreground/70 transition-colors cursor-pointer select-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {passwordError && (
                  <span className="text-[10px] text-red-500 font-semibold pl-1">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Toggle Form / Terms Switcher */}
              {isSignUp ? (
                <div className="flex flex-col gap-4 mt-2">
                  <label className="flex items-start gap-2.5 text-xs text-foreground/60 leading-relaxed cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 rounded border-border-accent bg-bg-accent/40 text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                    <span>
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline font-bold">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-primary hover:underline font-bold">Privacy Policy</a>.
                    </span>
                  </label>
                  <p className="text-center text-xs text-foreground/50 select-none">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              ) : (
                <div className="mt-2 select-none">
                  <p className="text-center text-xs text-foreground/50">
                    New to AI Project Builder?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Sign Up Free
                    </button>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 mt-2 select-none ${
                  isSubmitDisabled 
                    ? "opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-foreground/40 shadow-none pointer-events-none" 
                    : "bg-primary text-white hover:bg-primary-hover active:scale-[0.99] cursor-pointer shadow-primary/10"
                }`}
              >
                <span>{isSignUp ? "Create Free Account" : "Sign In to Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
