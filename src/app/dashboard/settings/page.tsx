"use client";

import * as React from "react";
import { Settings, Shield, Bell, Eye, EyeOff } from "lucide-react";

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
    <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-3xl font-body">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-semibold tracking-tight text-[#1B2733] flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#1F2C4C]" />
          Dashboard Settings
        </h2>
        <p className="text-sm font-body text-[#6C7D8E] mt-1">
          Configure API specifications and notification preferences.
        </p>
      </div>

      {/* API Key settings card */}
      <div className="bg-white border border-[#D5DBE1] rounded-xl shadow-xs p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-[#1F2C4C]/5 border border-[#1F2C4C]/10 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-[#1F2C4C]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#1B2733]">
              Custom Google Gemini API Key
            </h3>
            <p className="font-body text-xs text-[#6C7D8E] leading-relaxed mt-0.5">
              Provide your personal Gemini API key to override free tier limits. Key is saved strictly locally in your browser&apos;s local storage.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#D5DBE1]/60">
          <label 
            htmlFor="gemini-api-key"
            className="text-xs font-semibold text-[#1B2733] tracking-wide"
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
              className="w-full h-[44px] px-4 pr-11 rounded-[6px] bg-[#F9FAFB] border border-[#D5DBE1] text-[#1B2733] placeholder-[#6C7D8E]/50 font-mono text-xs focus:outline-none focus:border-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] transition-colors shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C7D8E] hover:text-[#1B2733] transition-colors p-1 cursor-pointer"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications and Preferences settings card */}
      <div className="bg-white border border-[#D5DBE1] rounded-xl shadow-xs p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-[#1F2C4C]/5 border border-[#1F2C4C]/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#1F2C4C]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-[#1B2733]">
              Notification Preferences
            </h3>
            <p className="font-body text-xs text-[#6C7D8E] leading-relaxed mt-0.5">
              Choose what email updates and collaboration notifications you receive.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#D5DBE1]/60">
          <label className="flex items-start gap-3 p-3 rounded-[6px] border border-transparent hover:border-[#D5DBE1]/60 hover:bg-[#F9FAFB] transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifReports}
              onChange={(e) => setNotifReports(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D5DBE1] text-[#1F2C4C] accent-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#1B2733]">Email Weekly Progress Reports</span>
              <span className="text-xs text-[#6C7D8E] mt-0.5">Send visual summaries of active Kanban board goals.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-[6px] border border-transparent hover:border-[#D5DBE1]/60 hover:bg-[#F9FAFB] transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifTeam}
              onChange={(e) => setNotifTeam(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D5DBE1] text-[#1F2C4C] accent-[#1F2C4C] focus:ring-1 focus:ring-[#1F2C4C] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#1B2733]">Shared Link Collab Alerts</span>
              <span className="text-xs text-[#6C7D8E] mt-0.5">Notify when group team members access my shared plans.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSaveSettings}
          className="bg-[#1F2C4C] hover:bg-[#151F36] active:scale-[0.99] text-white font-semibold rounded-[6px] px-5 py-2.5 shadow-xs text-xs transition-all cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
