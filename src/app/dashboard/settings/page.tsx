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
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Dashboard Settings
        </h2>
        <p className="text-sm text-foreground/60">
          Configure API specifications and notification preferences.
        </p>
      </div>

      {/* API Key settings card */}
      <div className="p-6 rounded-3xl border border-border-accent bg-bg-accent/20 backdrop-blur-md flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Shield className="w-4.5 h-4.5 text-primary" />
          Custom Google Gemini API Key
        </h3>
        <p className="text-xs text-foreground/60 leading-relaxed">
          Provide your personal Gemini API key to override free tier limits. Key is saved strictly locally in your browser's local storage.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Gemini API Key</label>
          <div className="flex items-center gap-2 relative w-full">
            <input
              type={showKey ? "text" : "password"}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-accent bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-foreground/20 pr-12 transition-all"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications and Preferences settings card */}
      <div className="p-6 rounded-3xl border border-border-accent bg-bg-accent/20 backdrop-blur-md flex flex-col gap-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Bell className="w-4.5 h-4.5 text-primary" />
          Notification Preferences
        </h3>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifReports}
              onChange={(e) => setNotifReports(e.target.checked)}
              className="w-4.5 h-4.5 rounded border border-border-accent bg-background text-primary focus:ring-primary/20 cursor-pointer accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Email Weekly Progress Reports</span>
              <span className="text-[10px] text-foreground/50">Send visual summaries of active Kanban board goals.</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifTeam}
              onChange={(e) => setNotifTeam(e.target.checked)}
              className="w-4.5 h-4.5 rounded border border-border-accent bg-background text-primary focus:ring-primary/20 cursor-pointer accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Shared Link Collab Alerts</span>
              <span className="text-[10px] text-foreground/50">Notify when group team members access my shared plans.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-primary/10"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
