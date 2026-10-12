import { Layers, Laptop, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#EEF1F4] text-[#1B2733] font-body">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#D5DBE1] text-[#1B2733] mb-6 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C7F03C] shadow-[0_0_6px_#C7F03C]" />
            <span>Academic Engineering Platform</span>
          </div>

          {/* Hero Headings */}
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl leading-tight text-[#1B2733]">
            Build Production-Ready Academic Projects
          </h1>

          <p className="text-sm md:text-base text-[#6C7D8E] max-w-xl mb-8 leading-relaxed">
            An intelligent workspace designed to brainstorm, architect, and generate full-stack source code, report blueprints, and roadmaps.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 select-none">
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#1F2C4C] hover:bg-[#151F36] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-[#D5DBE1] bg-white hover:bg-[#F9FAFB] text-[#1B2733] font-medium text-sm transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-left">
            <div className="flex flex-col items-start p-5 rounded-xl border border-[#D5DBE1] bg-white shadow-xs">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#1F2C4C] text-white mb-3.5">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#1B2733]">Instant Scaffolding</h3>
              <p className="text-xs text-[#6C7D8E] leading-relaxed">
                Generate project structures, boilerplate, and schema configurations in seconds.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-[#D5DBE1] bg-white shadow-xs">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#1F2C4C] text-white mb-3.5">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#1B2733]">Full-Stack Architecture</h3>
              <p className="text-xs text-[#6C7D8E] leading-relaxed">
                Design robust database models and interface components aligned with modern frameworks.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-[#D5DBE1] bg-white shadow-xs">
              <div className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#1F2C4C] text-white mb-3.5">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-semibold mb-1 text-[#1B2733]">Clean & Structured</h3>
              <p className="text-xs text-[#6C7D8E] leading-relaxed">
                Ensure security best practices, dependency safety, and clean separation of concerns.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
