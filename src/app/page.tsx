import { Layers, Laptop, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#EEF1F5] dark:bg-[#0F1720] text-[#172033] dark:text-[#F1F5F9] font-body transition-colors">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] text-[#172033] dark:text-[#F1F5F9] mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C5F52D] shadow-[0_0_8px_#C5F52D]" />
            <span>Academic Engineering Platform</span>
          </div>

          {/* Hero Headings */}
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl leading-tight text-[#172033] dark:text-[#F1F5F9]">
            Build Production-Ready Academic Projects
          </h1>

          <p className="text-sm md:text-base text-[#334155] dark:text-[#CBD5E1] max-w-xl mb-8 leading-relaxed font-normal">
            An intelligent workspace designed to brainstorm, architect, and generate full-stack source code, report blueprints, and roadmaps.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 select-none">
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] font-semibold text-sm transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-left">
            <div className="flex flex-col items-start p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] mb-3.5 transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#172033] dark:text-[#F1F5F9]">Instant Scaffolding</h3>
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                Generate project structures, boilerplate, and schema configurations in seconds.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] mb-3.5 transition-colors">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#172033] dark:text-[#F1F5F9]">Full-Stack Architecture</h3>
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                Design robust database models and interface components aligned with modern frameworks.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] mb-3.5 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#172033] dark:text-[#F1F5F9]">Clean & Structured</h3>
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                Ensure security best practices, dependency safety, and clean separation of concerns.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
