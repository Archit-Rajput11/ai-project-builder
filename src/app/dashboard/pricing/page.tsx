"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Award, ShieldCheck, Sparkles, Loader2, Calendar } from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkoutProgress, setCheckoutProgress] = React.useState(3);

  const { isPro: isPremium, loading: isProLoading } = useProStatus();

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
    console.log("Payment triggered for ₹20");
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
          color: "#1F2C4C",
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
      alert("Account downgraded to Free Tier for testing.");
      window.location.reload();
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse text-sm text-[#6C7D8E] p-6 border border-[#D5DBE1] bg-white rounded-xl shadow-xs">
        Loading pricing models...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto font-body">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 bg-white border border-[#D5DBE1] rounded-full px-3 py-1 text-xs font-semibold text-[#1B2733] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#C7F03C]" />
          <span>Flexible Plans for Students</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-[#1B2733] tracking-tight">
          Choose the Perfect Plan for Your Academic Journey
        </h1>
        <p className="text-sm md:text-base text-[#6C7D8E] max-w-2xl leading-relaxed">
          Get expert-level project structures, source boilerplate, and instant PDF formats to ace your curriculum.
        </p>
      </div>

      {/* Pricing Cards Grid - Side-by-Side two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mt-2 w-full">
        {/* Free Plan Card */}
        <div className="bg-white border border-[#D5DBE1] rounded-xl p-8 flex flex-col justify-between shadow-xs">
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-[#6C7D8E] uppercase block mb-1">
                Standard Access
              </span>
              <h2 className="text-xl font-display font-semibold text-[#1B2733]">Free Plan</h2>
              <p className="text-xs text-[#6C7D8E] mt-1 leading-relaxed">
                Perfect for testing the AI generation capabilities.
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-3 border-b border-[#D5DBE1]/60">
              <span className="text-3xl font-display font-semibold text-[#1B2733]">₹0</span>
              <span className="text-xs text-[#6C7D8E] font-medium">/ forever</span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-[#6C7D8E] uppercase tracking-wider mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-[#1B2733]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span>1 Project Generation per week</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span>Basic View Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              disabled={!isPremium}
              className={`w-full py-3 bg-[#F9FAFB] border border-[#D5DBE1] text-[#1B2733] rounded-[6px] font-semibold text-sm text-center transition-all ${
                !isPremium
                  ? "text-[#6C7D8E] pointer-events-none cursor-default"
                  : "hover:bg-white cursor-pointer shadow-xs"
              }`}
            >
              {!isPremium ? "Active Plan" : "Go to Dashboard"}
            </button>
          </div>
        </div>

        {/* Pro Plan Card (Recommended) */}
        <div className="bg-white border-2 border-[#1F2C4C] rounded-xl p-8 flex flex-col justify-between shadow-md relative">
          {/* Badge */}
          <div className="bg-[#C7F03C] text-[#1B2733] font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full absolute -top-3 right-6 shadow-xs select-none">
            Recommended
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-[#1F2C4C] uppercase block mb-1">
                Unlimited Access
              </span>
              <h2 className="text-xl font-display font-semibold text-[#1B2733]">Pro Plan</h2>
              <p className="text-xs text-[#6C7D8E] mt-1 leading-relaxed">
                Designed for active engineering students seeking top-tier blueprints.
              </p>
            </div>

            <div className="flex items-baseline gap-2 py-3 border-b border-[#D5DBE1]/60">
              <span className="text-xs text-[#6C7D8E] line-through font-semibold">
                ₹99
              </span>
              <span className="text-3xl font-display font-semibold text-[#1B2733]">
                ₹20
              </span>
              <span className="text-xs text-[#6C7D8E] font-medium">
                / per month
              </span>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-[#6C7D8E] uppercase tracking-wider mb-1 block">
                What's Included:
              </span>
              <ul className="flex flex-col gap-3 text-xs text-[#1B2733]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span className="font-semibold text-[#1B2733]">Unlimited Projects</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span className="font-semibold text-[#1B2733]">One-Click PDF Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span>Project History</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1F2C4C] shrink-0" />
                  <span>Priority AI Generation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            {isPremium ? (
              <div className="flex flex-col gap-2">
                <div className="w-full py-3 bg-[#C7F03C]/20 border border-[#C7F03C] text-[#1B2733] font-bold rounded-[6px] text-sm text-center select-none flex items-center justify-center gap-2 shadow-xs">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#1F2C4C]" />
                  <span>Pro Active</span>
                </div>
                <button
                  onClick={handleDowngradeMock}
                  className="w-full py-2 text-xs text-[#6C7D8E] hover:text-red-600 font-semibold transition-colors cursor-pointer"
                >
                  Mock Downgrade (Testing)
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgradeNow}
                disabled={loading}
                className="w-full py-3 bg-[#1F2C4C] hover:bg-[#151F36] active:scale-[0.99] text-white font-semibold rounded-[6px] text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing upgrade...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-[#C7F03C]" />
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
        <div className="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl border border-[#1F2C4C] bg-white text-[#1B2733] text-xs font-semibold shadow-lg flex items-center gap-2.5 animate-fade-in">
          <Loader2 className="w-4 h-4 text-[#1F2C4C] animate-spin" />
          <span>Verifying transaction...</span>
        </div>
      )}
    </div>
  );
}
