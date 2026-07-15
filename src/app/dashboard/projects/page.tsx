"use client";

import * as React from "react";
import { FolderGit2, Calendar, Award, ExternalLink, ShieldCheck } from "lucide-react";

export default function ProjectsPage() {
  const mockProjects = [
    {
      title: "Decentralized Health Records Ledger",
      domain: "Blockchain Tech",
      complexity: "Advanced",
      weeks: 6,
      date: "2026-07-12",
      description: "A secure, HIPAA-compliant patient ledger system utilizing Ethereum smart contracts and decentralized storage IPFS stubs.",
    },
    {
      title: "Real-time Traffic Audit Pipeline",
      domain: "IoT / Internet of Things",
      complexity: "Intermediate",
      weeks: 6,
      date: "2026-07-10",
      description: "Edge computing broker nodes collecting simulation speeds, generating congestion models, and updating central routing engines.",
    },
    {
      title: "Predictive Academic Risk Evaluator",
      domain: "AI / Machine Learning",
      complexity: "Intermediate",
      weeks: 6,
      date: "2026-07-05",
      description: "A machine learning pipeline evaluating student study behaviors, highlighting risk percentages, and drafting tutor advice plans.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-primary" />
          My Generated Blueprints
        </h2>
        <p className="text-sm text-foreground/60">
          Access, manage, and share your previously compiled academic project plans.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockProjects.map((project, idx) => (
          <div 
            key={idx} 
            className="p-5 rounded-2xl border border-border-accent bg-bg-accent/20 backdrop-blur-sm flex flex-col gap-3 hover:border-primary/40 hover:scale-[1.01] transition-all duration-200 group"
          >
            <div className="flex items-center justify-between border-b border-border-accent/30 pb-2.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                {project.domain}
              </span>
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] uppercase tracking-wide">
                {project.complexity}
              </span>
            </div>

            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </h4>

            <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
              {project.description}
            </p>

            <div className="mt-2 pt-3 border-t border-border-accent/30 flex items-center justify-between text-[10px] text-foreground/40 font-semibold uppercase">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{project.weeks} Weeks</span>
              </div>
              <span>Saved {project.date}</span>
            </div>

            <button
              onClick={() => alert("This saved blueprint is currently static. Real-time project database syncing will be added in the production database release!")}
              className="mt-3 w-full py-2 rounded-xl bg-bg-accent border border-border-accent hover:border-primary text-foreground hover:text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Load Blueprint</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Persistence Note Banner */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex gap-3 items-start mt-4">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-foreground/90">Database Integration Pending</span>
          <p className="text-xs text-foreground/60 leading-relaxed">
            Saved blueprints are currently rendered as static mock previews. Real-time schema database integration is scheduled in Phase 8 of our product lifecycle.
          </p>
        </div>
      </div>
    </div>
  );
}
