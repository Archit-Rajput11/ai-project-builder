"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";

interface ThemeSwitcherProps {
  variant?: "dropdown" | "segmented";
  className?: string;
}

export function ThemeSwitcher({ variant = "dropdown", className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Segmented control variant (ideal for Settings page)
  if (variant === "segmented") {
    if (!mounted) {
      return (
        <div className={`flex items-center p-1 rounded-lg bg-[#E2E8F0] dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] ${className}`}>
          <div className="h-8 w-full animate-pulse rounded-md" />
        </div>
      );
    }

    const modes = [
      { id: "light", label: "Light", icon: Sun },
      { id: "dark", label: "Dark", icon: Moon },
      { id: "system", label: "System", icon: Laptop },
    ];

    return (
      <div 
        role="group"
        aria-label="Theme selection"
        className={`inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] ${className}`}
      >
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = theme === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setTheme(mode.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-white dark:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] shadow-xs border border-[#CBD5E1] dark:border-[#344456]"
                  : "text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown button variant (compact, for headers and nav bars)
  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] animate-pulse ${className}`} />
    );
  }

  const currentIcon = () => {
    if (theme === "system") {
      return <Laptop className="w-4 h-4 text-[#334155] dark:text-[#CBD5E1]" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="w-4 h-4 text-[#C5F52D]" />;
    }
    return <Sun className="w-4 h-4 text-[#F59E0B]" />;
  };

  const getLabel = () => {
    if (theme === "system") return "System theme";
    if (theme === "dark") return "Dark theme";
    return "Light theme";
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Toggle theme (currently ${getLabel()})`}
        title={`Theme: ${getLabel()}`}
        className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D]"
      >
        {currentIcon()}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-36 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-lg py-1 z-50 animate-fade-in text-xs font-medium"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme("light");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-[#F1F5F9] dark:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] font-semibold"
                : "text-[#405169] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B]/60 hover:text-[#172033] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Light</span>
            </div>
            {theme === "light" && <Check className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme("dark");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-[#F1F5F9] dark:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] font-semibold"
                : "text-[#405169] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B]/60 hover:text-[#172033] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-[#C5F52D]" />
              <span>Dark</span>
            </div>
            {theme === "dark" && <Check className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme("system");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer border-t border-[#CBD5E1] dark:border-[#344456] mt-1 pt-1.5 ${
              theme === "system"
                ? "bg-[#F1F5F9] dark:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] font-semibold"
                : "text-[#405169] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B]/60 hover:text-[#172033] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-[#405169] dark:text-[#CBD5E1]" />
              <span>System</span>
            </div>
            {theme === "system" && <Check className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />}
          </button>
        </div>
      )}
    </div>
  );
}
