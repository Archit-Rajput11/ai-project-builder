import { Sparkles, Laptop, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-fade-in">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>Next-gen Academic Workspace</span>
      </div>

      {/* Hero Headings */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
        Build Production-Ready <br />
        <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-500 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          College Projects with AI
        </span>
      </h1>

      <p className="text-base md:text-lg text-foreground/75 max-w-2xl mb-8 leading-relaxed">
        An intelligent workspace designed to help students brainstorm, architect, and generate full-stack source code for academic assignments with ease.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 select-none">
        <Link
          href="/auth"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-primary/10 cursor-pointer"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/auth"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border-accent bg-bg-accent/40 text-foreground font-semibold text-sm hover:bg-border-accent hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          Sign In
        </Link>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
        <div className="flex flex-col items-start p-6 rounded-2xl border border-border-accent bg-bg-accent/40 text-left hover:scale-[1.02] hover:bg-bg-accent/60 transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold mb-2">Lightning Scaffolding</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Generate project structures, boilerplate, and schema configurations in seconds with AI assistance.
          </p>
        </div>

        <div className="flex flex-col items-start p-6 rounded-2xl border border-border-accent bg-bg-accent/40 text-left hover:scale-[1.02] hover:bg-bg-accent/60 transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-4">
            <Laptop className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold mb-2">Full-Stack Architecture</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Design robust database models and matching interface components aligned with modern frameworks.
          </p>
        </div>

        <div className="flex flex-col items-start p-6 rounded-2xl border border-border-accent bg-bg-accent/40 text-left hover:scale-[1.02] hover:bg-bg-accent/60 transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold mb-2">Secure & Clean Code</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Ensure security best practices, dependency safety, and separation of concerns out of the box.
          </p>
        </div>
      </div>
    </div>
  );
}
