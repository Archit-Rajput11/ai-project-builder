"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Layers,
  ChevronDown,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Loader2,
  FolderGit2,
  ShieldAlert,
  Zap,
  TrendingUp,
  DollarSign,
  Compass,
  Check,
  Info,
  X,
  Plus,
  ListTodo
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  FeasibilityAnalysis,
  FeasibilityClassification,
  ComplexityLevel,
  SkillRequirement,
  TechAssessment,
  CostItem,
  TechnicalRisk,
  ImprovementAction
} from "@/types/feasibility";

function FeasibilityPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Project selection states
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [projectsError, setProjectsError] = React.useState<string | null>(null);

  // Analysis states
  const [analysis, setAnalysis] = React.useState<FeasibilityAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "rubric" | "skills" | "tech" | "costs" | "risks" | "mvp" | "improvements"
  >("overview");

  // Regenerate / Refine modal states
  const [refineModalOpen, setRefineModalOpen] = React.useState(false);
  const [customNotes, setCustomNotes] = React.useState("");

  // Load user's projects
  const fetchProjects = React.useCallback(async () => {
    try {
      setLoadingProjects(true);
      setProjectsError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/projects", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : (data?.projects || []);
        setProjects(list);

        // Select project from query param if provided
        const queryProjId = searchParams.get("projectId");
        if (queryProjId && list.some((p: any) => String(p.id) === queryProjId)) {
          setSelectedProjectId(queryProjId);
        } else if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setProjectsError(errJson.error || "Failed to load saved projects. Please verify your connection.");
      }
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setProjectsError(err.message || "Network error loading saved projects.");
    } finally {
      setLoadingProjects(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load analysis for selected project
  const fetchAnalysis = React.useCallback(async (projId: string) => {
    if (!projId) {
      setAnalysis(null);
      return;
    }

    try {
      setLoadingAnalysis(true);
      setAnalysisError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch(`/api/feasibility/analysis?projectId=${encodeURIComponent(projId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis || null);
      } else {
        setAnalysis(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch feasibility analysis:", err);
      setAnalysisError("Failed to load feasibility analysis. Please try again.");
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedProjectId) {
      fetchAnalysis(selectedProjectId);
    }
  }, [selectedProjectId, fetchAnalysis]);

  const selectedProject = React.useMemo(() => {
    return projects.find((p) => String(p.id) === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Trigger analysis generation
  const handleRunAnalysis = async (notes = "") => {
    if (!selectedProjectId) return;

    try {
      setAnalyzing(true);
      setAnalysisError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/feasibility/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          customNotes: notes || undefined,
          forceRegenerate: Boolean(analysis),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
          setRefineModalOpen(false);
          setCustomNotes("");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setAnalysisError(errJson.error || "Failed to analyze project feasibility.");
      }
    } catch (err: any) {
      console.error("Analysis generation error:", err);
      setAnalysisError(err.message || "Network error while running feasibility analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Score badge helper
  const getClassificationBadge = (classification: FeasibilityClassification) => {
    switch (classification) {
      case "Highly Feasible":
        return {
          bg: "bg-[#C5F52D]/15 dark:bg-[#C5F52D]/15 text-[#172033] dark:text-[#C5F52D] border-[#C5F52D]/40 dark:border-[#C5F52D]/50",
          icon: CheckCircle2,
          color: "text-emerald-500 dark:text-[#C5F52D]",
        };
      case "Feasible with Adjustments":
        return {
          bg: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
          icon: AlertTriangle,
          color: "text-amber-500",
        };
      case "Needs Significant Simplification":
      default:
        return {
          bg: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
          icon: ShieldAlert,
          color: "text-rose-500",
        };
    }
  };

  // Severity badge helper
  const getSeverityBadge = (sev: "high" | "medium" | "low") => {
    switch (sev) {
      case "high":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "medium":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "low":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
  };

  if (loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
        <span className="text-xs text-[#405169] dark:text-[#CBD5E1]">Loading your saved projects...</span>
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center gap-4 p-6 bg-white dark:bg-[#111A25] border border-rose-300 dark:border-rose-900/40 rounded-xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">
            Unable to Load Projects
          </h2>
          <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-1 leading-relaxed">
            {projectsError}
          </p>
        </div>
        <button
          onClick={() => fetchProjects()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center gap-4 p-6 bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-[#EEF1F5] dark:bg-[#182330] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D]">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold text-[#172033] dark:text-[#F1F5F9]">
            No Saved Projects Found
          </h2>
          <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-1 leading-relaxed">
            Generate and save a project blueprint first to run an automated AI Feasibility Analysis.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          Generate New Blueprint
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16 font-body text-[#172033] dark:text-[#F1F5F9] transition-colors">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#CBD5E1] dark:border-[#344456] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#C5F52D]/40 bg-[#C5F52D]/15 text-[#172033] dark:text-[#C5F52D]">
              <Activity className="w-3 h-3 text-[#202D50] dark:text-[#C5F52D]" />
              Architectural Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9] tracking-tight mt-1.5 flex items-center gap-2.5">
            AI Project Feasibility Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-[#405169] dark:text-[#CBD5E1] mt-1">
            Rigorous 100-point rubric assessing architecture, timeline viability, tech stack, skill curves, and costs.
          </p>
        </div>

        {/* Project Switcher Dropdown */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <label htmlFor="feasibilityProjectSelect" className="text-[11px] font-semibold text-[#405169] dark:text-[#CBD5E1]">
            Active Saved Project
          </label>
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <select
              id="feasibilityProjectSelect"
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                router.replace(`/dashboard/feasibility?projectId=${e.target.value}`);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs font-semibold text-[#172033] dark:text-[#F1F5F9] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] cursor-pointer shadow-2xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)} className="bg-white dark:bg-[#182330]">
                  {p.title} ({p.domain || "Project"})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#405169] dark:text-[#CBD5E1] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {analysisError && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <button
            onClick={() => setAnalysisError(null)}
            className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading analysis state */}
      {loadingAnalysis && (
        <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <p className="text-xs text-[#405169] dark:text-[#CBD5E1]">
            Retrieving feasibility assessment for <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">{selectedProject?.title}</span>...
          </p>
        </div>
      )}

      {/* Empty State: No Analysis Generated Yet */}
      {!loadingAnalysis && !analysis && (
        <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-8 sm:p-10 shadow-xs flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF1F5] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D] shadow-xs">
            <Activity className="w-8 h-8" />
          </div>

          <div className="max-w-md flex flex-col gap-2">
            <h2 className="text-xl font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
              Analyze Project Feasibility
            </h2>
            <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
              Run an objective architecture check on <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">{selectedProject?.title}</span>. 
              Our evaluator grades technical complexity, scope vs semester weeks, tool ecosystem, skill prerequisites, and infrastructure costs.
            </p>
          </div>

          {/* Scoring Rubric Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
            <div className="p-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330]">
              <span className="text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] uppercase tracking-wider">1. Architecture</span>
              <h4 className="text-xs font-semibold mt-1 text-[#172033] dark:text-[#F1F5F9]">Complexity & Scale</h4>
              <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] mt-1">Evaluates multi-tier design, data flows, and concurrency.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330]">
              <span className="text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] uppercase tracking-wider">2. Timeline</span>
              <h4 className="text-xs font-semibold mt-1 text-[#172033] dark:text-[#F1F5F9]">Scope vs Semester</h4>
              <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] mt-1">Realistic milestones for a solo student or small team.</p>
            </div>
            <div className="p-3.5 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330]">
              <span className="text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] uppercase tracking-wider">3. Cost & Risks</span>
              <h4 className="text-xs font-semibold mt-1 text-[#172033] dark:text-[#F1F5F9]">Zero-Dollar Viability</h4>
              <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] mt-1">Ensures project can be defended on free developer tiers.</p>
            </div>
          </div>

          <button
            onClick={() => handleRunAnalysis()}
            disabled={analyzing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Project Architecture...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Run Feasibility Analysis</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Analysis Display */}
      {!loadingAnalysis && analysis && (
        <div className="flex flex-col gap-6">
          {/* Top Score Summary Banner */}
          <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
            {/* Score & Classification */}
            <div className="flex items-center gap-5">
              {/* Circular / Box Score Gauge */}
              <div className="relative w-20 h-20 rounded-2xl bg-[#EEF1F5] dark:bg-[#182330] border-2 border-[#CBD5E1] dark:border-[#344456] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <span className="text-2xl font-display font-extrabold text-[#172033] dark:text-[#F1F5F9] tracking-tight">
                  {analysis.overallScore}
                </span>
                <span className="text-[10px] text-[#405169] dark:text-[#CBD5E1] font-bold uppercase tracking-wider">
                  / 100
                </span>
              </div>

              {/* Title & Classification Details */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const badge = getClassificationBadge(analysis.classification);
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {analysis.classification}
                      </span>
                    );
                  })()}

                  {analysis.previousScore !== undefined && (
                    <span className="text-[11px] font-semibold text-[#405169] dark:text-[#CBD5E1]">
                      Previous Score: {analysis.previousScore}/100 
                      ({analysis.overallScore >= analysis.previousScore ? `+${analysis.overallScore - analysis.previousScore}` : `${analysis.overallScore - analysis.previousScore}`})
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-display font-bold text-[#172033] dark:text-[#F1F5F9] tracking-tight">
                  {analysis.projectTitle}
                </h2>
                <p className="text-xs text-[#405169] dark:text-[#CBD5E1] max-w-2xl leading-relaxed">
                  {analysis.scoringSummary}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setRefineModalOpen(true)}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-evaluate</span>
              </button>

              <Link
                href={`/dashboard/mentor?projectId=${selectedProjectId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open in AI Mentor</span>
              </Link>

              <Link
                href={`/dashboard/tasks?projectId=${selectedProjectId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] transition-all cursor-pointer shadow-2xs"
                title="View Task Board"
              >
                <ListTodo className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
                <span>Task Tracker</span>
              </Link>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#CBD5E1] dark:border-[#344456] pb-px select-none">
            {[
              { id: "overview", label: "Executive Summary" },
              { id: "rubric", label: "Scoring Rubric (100 pts)" },
              { id: "skills", label: "Skill Learning Curve" },
              { id: "tech", label: "Tech Stack Fit" },
              { id: "costs", label: "Cost & Free Tier" },
              { id: "risks", label: "Technical Risks" },
              { id: "mvp", label: "Recommended MVP" },
              { id: "improvements", label: "Improvement Plan" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? "border-[#202D50] dark:border-[#C5F52D] text-[#202D50] dark:text-[#C5F52D]"
                      : "border-transparent text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths Card */}
              <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-[#C5F52D] font-display font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3>Architectural Strengths</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {analysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#C5F52D] mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Major Concerns Card */}
              <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-display font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <h3>Primary Potential Pitfalls</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {analysis.majorConcerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Next Steps */}
              <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#202D50] dark:text-[#C5F52D] font-display font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <h3>Recommended Next Steps</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {analysis.recommendedNextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      <span className="text-[11px] font-bold text-[#202D50] dark:text-[#C5F52D] font-mono mt-0.5">
                        {idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stated Assumptions */}
              <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#405169] dark:text-[#CBD5E1] font-display font-bold text-sm">
                  <Info className="w-4 h-4" />
                  <h3>Evaluator Assumptions</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {analysis.assumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] dark:bg-[#4B5E74] mt-1.5 shrink-0" />
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: RUBRIC BREAKDOWN */}
          {activeTab === "rubric" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] text-xs text-[#405169] dark:text-[#CBD5E1]">
                Scores are calculated using a strict 5-pillar academic rubric. Total score is the sum of all categories (out of 100).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.rubric).map(([key, cat]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#405169] dark:text-[#CBD5E1] uppercase tracking-wider">
                          Weight: {cat.weight}
                        </span>
                        <span className="text-xs font-display font-bold text-[#202D50] dark:text-[#C5F52D]">
                          {cat.score} / {cat.maxScore} pts
                        </span>
                      </div>

                      <h4 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] mt-1">
                        {cat.name}
                      </h4>

                      {/* Progress Meter */}
                      <div className="w-full h-2 rounded-full bg-[#EEF1F5] dark:bg-[#182330] mt-2.5 overflow-hidden">
                        <div
                          className="h-full bg-[#202D50] dark:bg-[#C5F52D] rounded-full transition-all duration-300"
                          style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                        />
                      </div>

                      <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-3 leading-relaxed">
                        {cat.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS & LEARNING CURVE */}
          {activeTab === "skills" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] shadow-xs">
                <span className="text-xs font-bold text-[#202D50] dark:text-[#C5F52D] uppercase tracking-wider">
                  Learning Effort Assessment
                </span>
                <p className="text-xs text-[#172033] dark:text-[#F1F5F9] mt-1 leading-relaxed font-medium">
                  {analysis.skills.learningEffortSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prerequisites */}
                <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                  <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-[#C5F52D]" />
                    Prerequisite Knowledge Expected
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {analysis.skills.prerequisites.map((req, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9]">
                            {req.skill}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#405169] dark:text-[#CBD5E1]">
                            {req.importance} Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                          {req.reason}
                        </p>
                        {req.mentorPhaseSuggestion && (
                          <Link
                            href={`/dashboard/mentor?projectId=${selectedProjectId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#202D50] dark:text-[#C5F52D] hover:underline mt-1"
                          >
                            <span>Mapped to: {req.mentorPhaseSuggestion}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills to Learn */}
                <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                  <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    New Skills to Acquire
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {analysis.skills.toLearn.map((req, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9]">
                            {req.skill}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                            {req.importance} Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                          {req.reason}
                        </p>
                        {req.mentorPhaseSuggestion && (
                          <Link
                            href={`/dashboard/mentor?projectId=${selectedProjectId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#202D50] dark:text-[#C5F52D] hover:underline mt-1"
                          >
                            <span>Learn in: {req.mentorPhaseSuggestion}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK ASSESSMENT */}
          {activeTab === "tech" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.techStackAssessment.map((tech, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1]">
                          {tech.category}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          tech.isAppropriate
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-[#C5F52D]"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}>
                          {tech.isAppropriate ? "Appropriate" : "Caution"}
                        </span>
                      </div>

                      <h4 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] mt-1.5">
                        {tech.technology}
                      </h4>

                      <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-2 leading-relaxed">
                        {tech.verdict}
                      </p>
                    </div>

                    {tech.alternative && (
                      <div className="pt-2.5 border-t border-[#CBD5E1] dark:border-[#344456] text-[11px] text-[#405169] dark:text-[#CBD5E1]">
                        <span className="font-semibold text-[#172033] dark:text-[#F1F5F9]">Alternative: </span>
                        <span>{tech.alternative}</span>
                        {tech.alternativeReason && (
                          <p className="mt-0.5 text-[10px] text-[#52647A] dark:text-[#94A3B8]">{tech.alternativeReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COST & FREE TIER VIABILITY */}
          {activeTab === "costs" && (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1]">
                    Overall Cost Feasibility
                  </span>
                  <h3 className="text-base font-display font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5">
                    {analysis.costEstimation.estimatedMonthlyTotal}
                  </h3>
                  <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-1 max-w-xl leading-relaxed">
                    {analysis.costEstimation.freeTierSummary}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-[#C5F52D]/40 bg-[#C5F52D]/15 text-[#172033] dark:text-[#C5F52D]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Zero Out-of-Pocket Viable
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.costEstimation.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1]">
                          {item.tier}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#202D50] dark:text-[#C5F52D]">
                          {item.estimatedMonthlyCost}
                        </span>
                      </div>

                      <h4 className="text-xs font-display font-bold text-[#172033] dark:text-[#F1F5F9] mt-1.5">
                        {item.service}
                      </h4>

                      <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-2 leading-relaxed">
                        {item.details}
                      </p>
                    </div>

                    <div className="text-[10px] text-[#405169] dark:text-[#CBD5E1] font-semibold">
                      {item.isOptional ? "Optional Enhancement" : "Core Architecture"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TECHNICAL RISKS & MITIGATION */}
          {activeTab === "risks" && (
            <div className="flex flex-col gap-3">
              {analysis.risks.map((risk) => (
                <div
                  key={risk.id}
                  className="p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] shadow-xs flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(risk.severity)}`}>
                        {risk.severity} Severity
                      </span>
                      <h4 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                        {risk.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                    {risk.description}
                  </p>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] flex flex-col gap-1 text-xs">
                    <span className="font-bold text-[#202D50] dark:text-[#C5F52D] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Recommended Mitigation
                    </span>
                    <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      {risk.mitigation}
                    </p>
                    {risk.mentorMitigationTask && (
                      <Link
                        href={`/dashboard/mentor?projectId=${selectedProjectId}`}
                        className="inline-flex items-center gap-1 font-bold text-[#202D50] dark:text-[#C5F52D] hover:underline mt-1"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Mitigate via AI Project Mentor: {risk.mentorMitigationTask}</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: RECOMMENDED MVP */}
          {activeTab === "mvp" && (
            <div className="flex flex-col gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1]">
                    Minimum Viable Scope
                  </span>
                  <span className="text-xs font-bold text-[#202D50] dark:text-[#C5F52D]">
                    {analysis.mvp.estimatedTimeline}
                  </span>
                </div>
                <h3 className="text-base font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                  Why Build an MVP First?
                </h3>
                <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                  {analysis.mvp.justification}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Core Features */}
                <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-[#C5F52D] font-display font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4>Core MVP Features (Build First)</h4>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {analysis.mvp.coreFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C5F52D] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Omitted Features */}
                <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#405169] dark:text-[#CBD5E1] font-display font-bold text-sm">
                    <X className="w-4 h-4 text-rose-500" />
                    <h4>Deferred Features (Post-MVP Wishlist)</h4>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {analysis.mvp.omittedFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] dark:bg-[#4B5E74] mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: IMPROVEMENT PLAN */}
          {activeTab === "improvements" && (
            <div className="flex flex-col gap-3">
              {analysis.improvementPlan.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111A25] shadow-xs flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                      {act.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-[#C5F52D] border border-emerald-500/30">
                        {act.impact} Impact
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EEF1F5] dark:bg-[#182330] text-[#172033] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#344456]">
                        {act.effort} Effort
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                    {act.description}
                  </p>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] text-xs">
                    <span className="font-bold text-[#202D50] dark:text-[#C5F52D]">Action Step: </span>
                    <span className="text-[#334155] dark:text-[#CBD5E1]">{act.actionStep}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refine / Re-evaluate Modal */}
      {refineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
                <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                  Re-evaluate Feasibility
                </h3>
              </div>
              <button
                onClick={() => setRefineModalOpen(false)}
                className="text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
              Have you simplified your tech stack, increased team size, or shifted requirements? Add custom notes below to re-evaluate the project without losing historical scores.
            </p>

            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Switched from self-hosted Redis to PostgreSQL notifications; added 1 more team member; 12 weeks remaining..."
              rows={4}
              className="w-full p-3 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9] placeholder-[#566880] dark:placeholder-[#A3B3C7] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D]"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRefineModalOpen(false)}
                className="px-3.5 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRunAnalysis(customNotes)}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-evaluating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeasibilityPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] gap-3 text-xs text-[#405169] dark:text-[#CBD5E1]">
          <Loader2 className="w-5 h-5 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span>Loading AI Project Feasibility Analyzer...</span>
        </div>
      }
    >
      <FeasibilityPageContent />
    </React.Suspense>
  );
}
