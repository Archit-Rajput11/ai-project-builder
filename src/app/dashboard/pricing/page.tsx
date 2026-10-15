"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Award, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { isPro: isPremium } = useProStatus();

  React.useEffect(() => {
    setMounted(true);
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
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in before initiating payment.");
        setLoading(false);
        return;
      }

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
        handler: async function (response: any) {
          try {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token || "";

            const verifyRes = await fetch("/api/subscriptions/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              const resJson = await verifyRes.json();
              if (resJson.token) {
                localStorage.setItem("pro_session", resJson.token);
              }
            }
          } catch (err) {
            console.error("Payment verification client error:", err);
          } finally {
            alert("Payment submitted successfully! Unlocking Pro features...");
            window.location.href = "/dashboard";
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || "Student User",
          email: user.email || "student@example.com",
        },
        notes: {
          userId: user.id,
          email: user.email,
        },
        theme: {
          color: "#202D50",
        },
        modal: {
          ondismiss: function () {
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
      alert("Account downgraded to Free Tier for testing.");
      window.location.reload();
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse text-sm text-[#405169] dark:text-[#CBD5E1] p-6 border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] rounded-xl shadow-xs">
        Loading pricing models...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto font-body text-[#172033] dark:text-[#F1F5F9] transition-colors">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#172033] dark:text-[#F1F5F9] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#C5F52D] shadow-[0_0_8px_#C5F52D]" />
          <span>Flexible Plans for Students</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9] tracking-tight">
          Choose the Perfect Plan for Your Academic Journey
        </h1>
        <p className="text-sm md:text-base text-[#334155] dark:text-[#CBD5E1] max-w-2xl leading-relaxed">
          Get expert-level project structures, source boilerplate, and instant PDF formats to ace your curriculum.
        </p>
      </div>

      {/* Pricing Cards Grid - Side-by-Side two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-2 w-full">
        {/* Free Plan Card */}
        <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-8 flex flex-col justify-between shadow-xs transition-colors">
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#405169] dark:text-[#CBD5E1] uppercase block mb-1">
                Standard Access
              </span>
              <h2 className="text-xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">Free Plan</h2>
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-1 leading-relaxed">
                Perfect for testing the AI generation capabilities.
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-3 border-b border-[#CBD5E1] dark:border-[#344456]">
              <span className="text-3xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">₹0</span>
              <span className="text-xs text-[#405169] dark:text-[#CBD5E1] font-semibold">/ forever</span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-[#405169] dark:text-[#CBD5E1] uppercase tracking-wider mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-[#172033] dark:text-[#F1F5F9]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span>1 Project Generation per week</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span>Basic View Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              disabled={!isPremium}
              className={`w-full py-3 bg-[#F8FAFC] dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] text-[#172033] dark:text-[#F1F5F9] rounded-[6px] font-bold text-sm text-center transition-all ${
                !isPremium
                  ? "text-[#405169] dark:text-[#CBD5E1] pointer-events-none cursor-default"
                  : "hover:bg-white dark:hover:bg-[#202D3B] cursor-pointer shadow-xs"
              }`}
            >
              {!isPremium ? "Active Plan" : "Go to Dashboard"}
            </button>
          </div>
        </div>

        {/* Pro Plan Card (Recommended) */}
        <div className="bg-white dark:bg-[#182330] border-2 border-[#202D50] dark:border-[#C5F52D] rounded-xl p-8 flex flex-col justify-between shadow-md relative transition-colors">
          {/* Badge */}
          <div className="bg-[#C5F52D] text-[#172033] font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full absolute -top-3 right-6 shadow-xs select-none">
            Recommended
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#202D50] dark:text-[#C5F52D] uppercase block mb-1">
                Unlimited Access
              </span>
              <h2 className="text-xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">Pro Plan</h2>
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-1 leading-relaxed">
                Designed for active engineering students seeking top-tier blueprints.
              </p>
            </div>

            <div className="flex items-baseline gap-2 py-3 border-b border-[#CBD5E1] dark:border-[#344456]">
              <span className="text-xs text-[#405169] dark:text-[#CBD5E1] line-through font-bold">
                ₹99
              </span>
              <span className="text-3xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">
                ₹20
              </span>
              <span className="text-xs text-[#405169] dark:text-[#CBD5E1] font-semibold">
                / per month
              </span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-[#405169] dark:text-[#CBD5E1] uppercase tracking-wider mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-[#172033] dark:text-[#F1F5F9]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span className="font-bold text-[#172033] dark:text-[#F1F5F9]">Unlimited Projects</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span className="font-bold text-[#172033] dark:text-[#F1F5F9]">One-Click PDF Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span>Project History</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                  <span>Priority AI Generation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            {isPremium ? (
              <div className="flex flex-col gap-2">
                <div className="w-full py-3 bg-[#C5F52D]/20 dark:bg-[#C5F52D]/15 border border-[#C5F52D] text-[#172033] dark:text-[#C5F52D] font-bold rounded-[6px] text-sm text-center select-none flex items-center justify-center gap-2 shadow-xs">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#202D50] dark:text-[#C5F52D]" />
                  <span>Pro Active</span>
                </div>
                <button
                  onClick={handleDowngradeMock}
                  className="w-full py-2 text-xs text-[#405169] dark:text-[#CBD5E1] hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors cursor-pointer"
                >
                  Mock Downgrade (Testing)
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgradeNow}
                disabled={loading}
                className="w-full py-3 bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] active:scale-[0.99] font-bold rounded-[6px] text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white dark:text-[#0F1720]" />
                    <span>Processing upgrade...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-[#C5F52D] dark:text-[#0F1720]" />
                    <span>Get Premium for ₹20/mo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Billing Toast */}
      {loading && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl border border-[#202D50] dark:border-[#C5F52D] bg-white dark:bg-[#111A25] text-[#172033] dark:text-[#F1F5F9] text-xs font-semibold shadow-lg flex items-center gap-2.5 animate-fade-in">
          <Loader2 className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D] animate-spin" />
          <span>Verifying transaction...</span>
        </div>
      )}
    </div>
  );
}
