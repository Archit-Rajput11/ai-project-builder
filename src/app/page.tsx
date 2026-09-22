import { Terminal, Laptop, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-[#f8fafc]">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Academic Engineering Platform</span>
          </div>

          {/* Hero Headings */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 max-w-2xl leading-tight text-[#f8fafc]">
            Build Production-Ready Academic Projects
          </h1>

          <p className="text-sm md:text-base text-[#94a3b8] max-w-xl mb-8 leading-relaxed">
            An intelligent workspace designed to brainstorm, architect, and generate full-stack source code, report blueprints, and roadmaps.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 select-none">
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-sm transition-colors cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Sign In
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-left">
            <div className="flex flex-col items-start p-5 rounded-xl border border-white/[0.08] bg-[#11141c]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-200 mb-3.5">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-[#f8fafc]">Instant Scaffolding</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Generate project structures, boilerplate, and schema configurations in seconds.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-white/[0.08] bg-[#11141c]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-200 mb-3.5">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-[#f8fafc]">Full-Stack Architecture</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Design robust database models and interface components aligned with modern frameworks.
              </p>
            </div>

            <div className="flex flex-col items-start p-5 rounded-xl border border-white/[0.08] bg-[#11141c]">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-200 mb-3.5">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-[#f8fafc]">Clean & Structured</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Ensure security best practices, dependency safety, and clean separation of concerns.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
