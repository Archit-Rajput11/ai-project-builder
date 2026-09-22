import { Sparkles, Laptop, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen py-4 bg-background">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 mt-6">
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 mb-6 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Next-gen Academic Workspace</span>
          </div>

          {/* Hero Headings */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight text-slate-900 dark:text-white">
            Build Production-Ready <br />
            <span className="bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              College Projects with AI
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-8 leading-relaxed">
            An intelligent workspace designed to help students brainstorm, architect, and generate full-stack source code for academic assignments with ease.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 select-none">
            <Link
              href="/auth"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.99] cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 font-semibold text-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] cursor-pointer"
            >
              Sign In
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
            <div className="flex flex-col items-start p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-left hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 mb-4 shadow-sm shadow-cyan-500/10">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Lightning Scaffolding</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate project structures, boilerplate, and schema configurations in seconds with AI assistance.
              </p>
            </div>

            <div className="flex flex-col items-start p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-left hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 mb-4 shadow-sm shadow-cyan-500/10">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Full-Stack Architecture</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Design robust database models and matching interface components aligned with modern frameworks.
              </p>
            </div>

            <div className="flex flex-col items-start p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-left hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-200 shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 mb-4 shadow-sm shadow-cyan-500/10">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Secure & Clean Code</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure security best practices, dependency safety, and separation of concerns out of the box.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
