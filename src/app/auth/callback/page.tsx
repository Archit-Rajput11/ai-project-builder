"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Terminal, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = React.useState("Verifying authentication...");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isSubscribed = true;

    const handleCallback = async () => {
      try {
        if (typeof window === "undefined") return;

        const currentUrl = new URL(window.location.href);
        const searchParams = currentUrl.searchParams;

        // 1. Check for error parameters returned from provider or Supabase
        const error = searchParams.get("error") || searchParams.get("error_code");
        const errorDescription = searchParams.get("error_description");
        if (error) {
          throw new Error(errorDescription || error || "OAuth authorization failed.");
        }

        // 2. Extract code for PKCE exchange
        const code = searchParams.get("code");

        if (code) {
          setStatusMessage("Exchanging authorization code for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }

          if (data?.session) {
            // Establish session cookie for Next.js proxy route protection
            document.cookie = "mock-logged-in=true; path=/; max-age=604800; SameSite=Lax";
            setStatusMessage("Session established! Redirecting to dashboard...");
            window.location.href = "/dashboard";
            return;
          }
        }

        // 3. Fallback: check if session is already active (e.g., implicit hash fragment)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          document.cookie = "mock-logged-in=true; path=/; max-age=604800; SameSite=Lax";
          setStatusMessage("Session recognized! Redirecting to dashboard...");
          window.location.href = "/dashboard";
          return;
        }

        // 4. Listen for auth state change if Supabase client is processing hash fragment asynchronously
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!isSubscribed) return;
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && newSession) {
            document.cookie = "mock-logged-in=true; path=/; max-age=604800; SameSite=Lax";
            subscription.unsubscribe();
            window.location.href = "/dashboard";
          }
        });

        // 5. Timeout if no session established within 4 seconds
        setTimeout(() => {
          if (!isSubscribed) return;
          subscription.unsubscribe();
          setErrorMessage("Authentication timed out. No valid session was received.");
          setTimeout(() => {
            router.push("/auth?error=" + encodeURIComponent("Authentication session could not be established. Please try logging in again."));
          }, 1200);
        }, 4000);

      } catch (err: any) {
        console.error("Auth callback error:", err);
        if (!isSubscribed) return;
        setErrorMessage(err.message || "Failed to complete authentication.");
        setTimeout(() => {
          router.push("/auth?error=" + encodeURIComponent(err.message || "OAuth login failed."));
        }, 1200);
      }
    };

    handleCallback();

    return () => {
      isSubscribed = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080b11] text-[#f8fafc] px-4 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-md w-full p-8 rounded-2xl border border-white/[0.08] bg-[#0c1017] shadow-2xl flex flex-col items-center text-center gap-4 animate-fade-in">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
          errorMessage
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
            : "bg-[#111622] border-white/[0.1] text-indigo-400"
        }`}>
          {errorMessage ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <Terminal className="w-6 h-6" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-[#f8fafc]">
            {errorMessage ? "Authentication Issue" : "Authenticating with GitHub"}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            {errorMessage || statusMessage}
          </p>
        </div>

        {!errorMessage ? (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium pt-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Establishing your session...</span>
          </div>
        ) : (
          <button
            onClick={() => router.push("/auth")}
            className="mt-2 px-4 py-2 rounded-lg bg-[#111622] hover:bg-[#161c28] border border-white/[0.1] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}
