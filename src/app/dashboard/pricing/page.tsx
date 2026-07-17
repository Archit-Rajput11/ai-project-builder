"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Award, ShieldCheck, Sparkles, Loader2, Calendar } from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";

export default function PricingPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkoutProgress, setCheckoutProgress] = React.useState(3);

  const { isPro: isPremiumToken } = useProStatus();
  const [isPremiumState, setIsPremiumState] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isPremium") === "true";
    }
    return false;
  });
  const isPremium = isPremiumState || isPremiumToken;

  React.useEffect(() => {
    setMounted(true);
    const premiumState = localStorage.getItem("isPremium") === "true";
    setIsPremiumState(premiumState);
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradeNow = async () => {
    console.log("Payment triggered for ₹99");
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment gateway. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate transaction order.");
      }

      const { orderId, amount, currency } = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TE4CbpGSxEukJY",
        amount: amount,
        currency: currency,
        name: "Academic Project Builder",
        description: "Upgrade to Pro Plan - Unlimited Projects",
        order_id: orderId,
        handler: async function (res: any) {
          try {
            const verifyRes = await fetch("/api/subscriptions/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setIsPremiumState(true);
              localStorage.setItem("isPremium", "true");
              localStorage.setItem("pro_session", verifyData.token);
              alert("Payment successful! Upgraded to Pro Plan.");
              router.push("/dashboard");
            } else {
              alert("Payment verification failed: " + (verifyData.error || "Invalid signature"));
            }
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            alert("Verification error: " + verifyErr.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "Student User",
          email: "student@example.com",
        },
        theme: {
          color: "#8b5cf6",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed by user.");
            setLoading(false);
          },
        },
      };

      const razorpayObj = new (window as any).Razorpay(options);
      
      razorpayObj.on("payment.failed", function (failRes: any) {
        console.error("Payment failed:", failRes.error);
        alert(`Payment failed: ${failRes.error.description}`);
        setLoading(false);
      });

      razorpayObj.open();

    } catch (err: any) {
      console.error("Order creation failed:", err);
      alert("Error starting checkout: " + err.message);
      setLoading(false);
    }
  };

  const handleDowngradeMock = () => {
    if (confirm("Are you sure you want to mock downgrade your account to Free? (For testing purposes)")) {
      localStorage.removeItem("isPremium");
      localStorage.removeItem("pro_session");
      setIsPremiumState(false);
      alert("Account downgraded to Free Tier for testing.");
      window.location.reload();
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse text-sm text-foreground/40 p-6 border border-border-accent bg-bg-accent/20 backdrop-blur-md rounded-3xl">
        Loading pricing models...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto animate-fade-in">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Flexible Plans for Students</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Choose the Perfect Plan for Your Academic Journey
        </h2>
        <p className="text-sm md:text-base text-foreground/60 max-w-2xl leading-relaxed">
          Get expert-level project structures, source boilerplate, and instant PDF formats to ace your curriculum.
        </p>
      </div>

      {/* Pricing Cards Grid - Side-by-Side two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-4 w-full">
        {/* Free Plan Card */}
        <div className="p-8 rounded-3xl border border-border-accent bg-bg-accent/10 flex flex-col justify-between transition-all duration-300">
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest block mb-1">
                Standard Access
              </span>
              <h3 className="text-xl font-extrabold text-foreground">Free Plan</h3>
              <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                Perfect for testing the AI generation capabilities.
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2 border-b border-border-accent/30">
              <span className="text-3xl font-extrabold text-foreground">₹0</span>
              <span className="text-xs text-foreground/40 font-semibold">/ forever</span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-foreground/75">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>1 Project Generation per week</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Basic View Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              disabled={!isPremium}
              className={`w-full py-3 rounded-xl border font-bold text-sm text-center transition-all ${
                !isPremium
                  ? "border-primary/20 bg-primary/5 text-primary pointer-events-none cursor-default"
                  : "border-border-accent hover:border-foreground/35 bg-bg-accent/40 text-foreground cursor-pointer"
              }`}
            >
              {!isPremium ? "Active Plan" : "Go to Dashboard"}
            </button>
          </div>
        </div>

        {/* Pro Plan Card (Pop visually with border and glow) */}
        <div className="p-8 rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-500/5 to-slate-900 flex flex-col justify-between transition-all duration-300 relative shadow-xl shadow-amber-500/5">
          {/* Best Value Badge */}
          <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold uppercase tracking-widest select-none">
            Recommended
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                Unlimited Access
              </span>
              <h3 className="text-xl font-extrabold text-foreground">Pro Plan</h3>
              <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                Designed for active engineering students seeking top-tier blueprints.
              </p>
            </div>

            <div className="flex items-baseline gap-2 py-2 border-b border-border-accent/30">
              <span className="text-xs text-foreground/45 line-through font-bold">
                ₹199
              </span>
              <span className="text-3xl font-extrabold text-amber-400">
                ₹99
              </span>
              <span className="text-xs text-foreground/40 font-semibold">
                / per month
              </span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-amber-400/40 uppercase tracking-widest mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-foreground/80">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-foreground">Unlimited Projects</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-foreground">One-Click PDF Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Project History</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Priority AI Generation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            {isPremium ? (
              <div className="flex flex-col gap-2">
                <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm text-center select-none flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4.5 h-4.5" />
                  Pro Active
                </div>
                <button
                  onClick={handleDowngradeMock}
                  className="w-full py-2 text-[10px] uppercase font-bold text-foreground/35 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Mock Downgrade (Testing)
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgradeNow}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-950" />
                    Processing upgrade...
                  </>
                ) : (
                  <>
                    <Award className="w-4.5 h-4.5 text-slate-950" />
                    Get Premium for ₹99/mo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Billing Toast */}
      {loading && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-950/90 text-amber-400 text-xs font-bold shadow-lg shadow-amber-950/50 animate-fade-in flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          Verifying transaction...
        </div>
      )}
    </div>
  );
}
