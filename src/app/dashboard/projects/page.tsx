"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  FolderGit2, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Plus 
} from "lucide-react";
import { useProStatus } from "@/hooks/useProStatus";
import { supabase } from "@/lib/supabase";

export default function ProjectsPage() {
  const router = useRouter();
  const { isPro: isPremium, loading } = useProStatus();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loading || !isPremium) return;

    const fetchProjects = async () => {
      try {
        setLoadingHistory(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/projects", { headers });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        } else {
          setError("Failed to load your project history.");
        }
      } catch (err) {
        console.error("Fetch projects error:", err);
        setError("Error connecting to server. Please try again.");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchProjects();
  }, [isPremium, loading]);

  const handleLoadBlueprint = (project: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("loaded_project_blueprint", JSON.stringify(project.blueprint));
      router.push("/dashboard");
    }
  };

  const handleDeleteBlueprint = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this blueprint from your history?")) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        alert("Failed to delete blueprint.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting blueprint.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-8 shadow-xs flex items-center justify-center gap-3 text-xs text-[#52647A] dark:text-[#A7B6C8] transition-colors">
        <Loader2 className="w-4 h-4 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
        <span>Checking premium credentials...</span>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-8 shadow-xs max-w-md w-full mx-auto text-center flex flex-col items-center gap-6 transition-colors">
          <div className="w-14 h-14 rounded-xl bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D] shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#C5F52D]/40 bg-[#C5F52D]/20 text-[#172033] dark:border-[#C5F52D]/50 dark:bg-[#C5F52D]/15 dark:text-[#C5F52D] mx-auto select-none shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#202D50] dark:text-[#C5F52D]" />
              Pro Feature Locked
            </span>
            <h2 className="text-xl font-display font-semibold tracking-tight text-[#172033] dark:text-[#F1F5F9]">
              Project History & Save
            </h2>
            <p className="text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed">
              Save your generated blueprints, track timeline milestones, and review your historical project builds anytime with the Pro Plan.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/pricing")}
            className="w-full py-2.5 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            Upgrade to Pro for ₹20/mo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-body text-[#172033] dark:text-[#F1F5F9] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-[#202D50] dark:text-[#C5F52D]" />
            My Generated Blueprints
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] mt-1">
            Access, manage, and load your previously compiled academic project plans.
          </p>
        </div>
        {projects.length > 0 && !loadingHistory && (
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blueprint</span>
          </button>
        )}
      </div>

      {loadingHistory ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#52647A] dark:text-[#A7B6C8] text-xs bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs transition-colors">
          <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span>Loading your projects list...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-[#182330] border border-dashed border-[#CBD5E1] dark:border-[#344456] rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 my-2 shadow-xs transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D] shadow-xs">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-sm font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">No projects yet</h3>
            <p className="text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed">
              Your generated project blueprints will appear here.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] hover:border-[#202D50]/40 dark:hover:border-[#C5F52D]/40 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between group relative"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteBlueprint(e, project.id)}
                className="absolute top-4 right-4 text-[#52647A] dark:text-[#A7B6C8] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-[4px] p-1.5 transition-colors cursor-pointer"
                title="Delete blueprint"
                aria-label="Delete blueprint"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                {/* Tags */}
                <div className="flex items-center gap-2 border-b border-[#CBD5E1]/60 dark:border-[#344456] pb-3 pr-8">
                  <span className="bg-[#EEF1F5] dark:bg-[#202D3B] text-[#202D50] dark:text-[#C5F52D] border border-[#CBD5E1] dark:border-[#344456] rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {project.domain || "General"}
                  </span>
                  <span className="bg-[#EEF1F5] dark:bg-[#202D3B] text-[#202D50] dark:text-[#C5F52D] border border-[#CBD5E1] dark:border-[#344456] rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {project.complexity || "Standard"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-sm font-display font-semibold text-[#172033] dark:text-[#F1F5F9] group-hover:text-[#202D50] dark:group-hover:text-[#C5F52D] transition-colors pr-8">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-[#52647A] dark:text-[#CBD5E1] text-xs leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#CBD5E1]/60 dark:border-[#344456] flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] text-[#52647A] dark:text-[#A7B6C8] font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
                    <span>{project.weeks ? `${project.weeks} Weeks` : "Flexible"}</span>
                  </div>
                  {project.date && <span>Saved {project.date}</span>}
                </div>

                <button
                  onClick={() => handleLoadBlueprint(project)}
                  className="w-full bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] rounded-[6px] py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Load Blueprint</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Persistence Note Banner */}
      <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-4 shadow-xs flex gap-3.5 items-start mt-2 transition-colors">
        <div className="p-2 rounded-[6px] bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] text-[#202D50] dark:text-[#C5F52D] shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-[#172033] dark:text-[#F1F5F9]">Supabase Storage Active</span>
          <p className="text-xs text-[#52647A] dark:text-[#A7B6C8] leading-relaxed">
            Your premium project blueprints are fully synced and persisted securely inside your Supabase serverless database tables.
          </p>
        </div>
      </div>
    </div>
  );
}
