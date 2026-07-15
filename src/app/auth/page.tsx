"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";

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

        {/* Tab/Toggle Switcher */}
        <div className="p-1 rounded-xl bg-border-accent/40 border border-border-accent/10 relative flex items-center select-none">
          {/* Animated Slider Background */}
          <div 
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-border-accent/20 transition-transform duration-300 ease-out ${
              isSignUp ? "translate-x-full" : "translate-x-0"
            }`}
          />
          
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg z-10 transition-colors duration-250 cursor-pointer ${
              !isSignUp ? "text-foreground" : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            Log In
          </button>
          
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg z-10 transition-colors duration-250 cursor-pointer ${
              isSignUp ? "text-foreground" : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Social logins */}
        <div className="flex flex-col gap-3">
          {/* Google Button */}
          <button
            onClick={() => handleSocialLogin("Google")}
            className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-border-accent bg-background hover:bg-bg-accent font-semibold text-sm transition-all duration-200 cursor-pointer hover:scale-[1.01]"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* GitHub Button */}
          <button
            onClick={() => handleSocialLogin("GitHub")}
            className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-border-accent bg-background hover:bg-bg-accent font-semibold text-sm transition-all duration-200 cursor-pointer hover:scale-[1.01]"
          >
            {/* GitHub SVG */}
            <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-accent/70" />
          <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-border-accent/70" />
        </div>

        {/* Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5 animate-slide-down">
              <label htmlFor="name" className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
                Full Name
              </label>
              <div 
                className={`relative flex items-center rounded-xl border bg-background/50 transition-all duration-150 ${
                  nameError 
                    ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10 focus-within:border-red-500" 
                    : "border-border-accent focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
                }`}
              >
                <User className="absolute left-3 w-4 h-4 text-foreground/40" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className="w-full py-2.5 pl-10 pr-4 text-sm bg-transparent border-0 outline-none rounded-xl text-foreground placeholder:text-foreground/30"
                />
              </div>
              {nameError && (
                <p className="text-[11px] text-red-500 font-medium mt-0.5 ml-1 animate-fade-in">
                  {nameError}
                </p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
              Email Address
            </label>
            <div 
              className={`relative flex items-center rounded-xl border bg-background/50 transition-all duration-150 ${
                emailError 
                  ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10 focus-within:border-red-500" 
                  : "border-border-accent focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
              }`}
            >
              <Mail className="absolute left-3 w-4 h-4 text-foreground/40" />
              <input
                id="email"
                type="email"
                required
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                className="w-full py-2.5 pl-10 pr-4 text-sm bg-transparent border-0 outline-none rounded-xl text-foreground placeholder:text-foreground/30"
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-500 font-medium mt-0.5 ml-1 animate-fade-in">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-bold text-foreground/75 uppercase tracking-wide">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert("Password reset link sent to your registered email (demonstration).")}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div 
              className={`relative flex items-center rounded-xl border bg-background/50 transition-all duration-150 ${
                passwordError 
                  ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/10 focus-within:border-red-500" 
                  : "border-border-accent focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
              }`}
            >
              <Lock className="absolute left-3 w-4 h-4 text-foreground/40" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordTouched) setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
                className="w-full py-2.5 pl-10 pr-10 text-sm bg-transparent border-0 outline-none rounded-xl text-foreground placeholder:text-foreground/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-foreground/40 hover:text-foreground/75 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-500 font-medium mt-0.5 ml-1 animate-fade-in">
                {passwordError}
              </p>
            )}
          </div>

          {/* Agreement Checkbox (Sign Up only) */}
          {isSignUp && (
            <div className="flex items-start gap-2.5 mt-1 animate-fade-in">
              <input
                id="agree"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-border-accent text-primary focus:ring-primary cursor-pointer w-4 h-4"
              />
              <label htmlFor="agree" className="text-xs text-foreground/70 leading-normal select-none">
                I agree to the{" "}
                <span className="font-semibold text-primary hover:underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="font-semibold text-primary hover:underline cursor-pointer">Privacy Policy</span>.
              </label>
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
  );
}
