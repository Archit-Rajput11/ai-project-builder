"use client";

import * as React from "react";
import { Settings, Shield, Bell, Eye, EyeOff, Palette } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function SettingsPage() {
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [notifReports, setNotifReports] = React.useState(true);
  const [notifTeam, setNotifTeam] = React.useState(false);

  React.useEffect(() => {
    // Read local API key from storage on mount if exists
    const savedKey = localStorage.getItem("custom_gemini_api_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem("custom_gemini_api_key", apiKey.trim());
    } else {
      localStorage.removeItem("custom_gemini_api_key");
    }
    alert("Settings and configurations saved successfully!");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-3xl font-body transition-colors">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-semibold tracking-tight text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#202D50] dark:text-[#C5F52D]" />
          Dashboard Settings
        </h2>
        <p className="text-sm font-body text-[#475569] dark:text-[#CBD5E1] mt-1">
          Configure interface appearance, API keys, and notification preferences.
        </p>
      </div>

      {/* Appearance / Theme card */}
      <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs p-6 flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-[#172033] dark:text-[#F1F5F9]">
                Interface Theme
              </h3>
              <p className="font-body text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed mt-0.5">
                Choose between Light mode, comfortable Dark mode, or your System preference.
              </p>
            </div>
          </div>
          <ThemeSwitcher variant="segmented" />
        </div>
      </div>

      {/* API Key settings card */}
      <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs p-6 flex flex-col gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#172033] dark:text-[#F1F5F9]">
              Custom Google Gemini API Key
            </h3>
            <p className="font-body text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed mt-0.5">
              Provide your personal Gemini API key to override free tier limits. Key is saved strictly locally in your browser&apos;s storage.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#CBD5E1]/60 dark:border-[#344456]">
          <label 
            htmlFor="gemini-api-key"
            className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9] tracking-wide"
          >
            Gemini API Key
          </label>
          <div className="flex items-center relative w-full">
            <input
              id="gemini-api-key"
              type={showKey ? "text" : "password"}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-[44px] px-4 pr-11 rounded-[6px] bg-white dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] text-[#172033] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#94A3B8] font-mono text-xs focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D] transition-colors shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52647A] dark:text-[#A7B6C8] hover:text-[#172033] dark:hover:text-[#F1F5F9] transition-colors p-1 cursor-pointer"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications and Preferences settings card */}
      <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs p-6 flex flex-col gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#172033] dark:text-[#F1F5F9]">
              Notification Preferences
            </h3>
            <p className="font-body text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed mt-0.5">
              Choose what email updates and collaboration notifications you receive.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#CBD5E1]/60 dark:border-[#344456]">
          <label className="flex items-start gap-3 p-3 rounded-[6px] border border-transparent hover:border-[#CBD5E1]/60 dark:hover:border-[#344456] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B]/40 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifReports}
              onChange={(e) => setNotifReports(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#202D50] dark:text-[#C5F52D] accent-[#202D50] dark:accent-[#C5F52D] focus:ring-1 focus:ring-[#202D50] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9]">Email Weekly Progress Reports</span>
              <span className="text-xs text-[#52647A] dark:text-[#A7B6C8] mt-0.5">Send visual summaries of active Kanban board goals.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-[6px] border border-transparent hover:border-[#CBD5E1]/60 dark:hover:border-[#344456] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B]/40 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifTeam}
              onChange={(e) => setNotifTeam(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#202D50] dark:text-[#C5F52D] accent-[#202D50] dark:accent-[#C5F52D] focus:ring-1 focus:ring-[#202D50] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9]">Shared Link Collab Alerts</span>
              <span className="text-xs text-[#52647A] dark:text-[#A7B6C8] mt-0.5">Notify when group team members access my shared plans.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSaveSettings}
          className="bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] active:scale-[0.99] font-semibold rounded-[6px] px-5 py-2.5 shadow-xs text-xs transition-all cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
