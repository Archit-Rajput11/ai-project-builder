"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  FolderGit2,
  RefreshCw,
  Plus,
  HelpCircle,
  X,
  FileText,
  Lightbulb,
  Check,
  AlertCircle,
  ListTodo,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MentorRoadmap, MentorPhase, MentorTask, TaskStatus, TaskProgressEntry, MentorChatMessage } from "@/types/mentor";

function MentorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Project selection states
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [loadingProjects, setLoadingProjects] = React.useState(true);

  // Roadmap states
  const [roadmap, setRoadmap] = React.useState<MentorRoadmap | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [roadmapError, setRoadmapError] = React.useState<string | null>(null);

  // UI state
  const [expandedTasks, setExpandedTasks] = React.useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = React.useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = React.useState<string | null>(null);
  const [activePhaseFilter, setActivePhaseFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Refine / Regenerate modal
  const [refineModalOpen, setRefineModalOpen] = React.useState(false);
  const [refineInput, setRefineInput] = React.useState("");

  // Chat panel states
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<MentorChatMessage[]>([
    {
      id: "welcome",
      sender: "mentor",
      text: "Hello! I am your AI Project Mentor. I have full context on your project's technology stack, requirements, and roadmap milestones. How can I assist your development today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // 1. Fetch user's projects on mount
  React.useEffect(() => {
    async function loadProjects() {
      try {
        setLoadingProjects(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || "";

        const res = await fetch("/api/projects", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          const list: any[] = Array.isArray(data) ? data : (data?.projects || []);
          setProjects(list);

          // Check for projectId in query params
          const queryId = searchParams.get("projectId");
          if (queryId && list.some((p: any) => String(p.id) === queryId)) {
            setSelectedProjectId(queryId);
          } else if (list.length > 0) {
            setSelectedProjectId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [searchParams]);

  // 2. Fetch roadmap when selected project changes
  const fetchRoadmap = React.useCallback(async (projId: string) => {
    if (!projId) {
      setRoadmap(null);
      return;
    }

    try {
      setLoadingRoadmap(true);
      setRoadmapError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch(`/api/mentor/roadmap?projectId=${encodeURIComponent(projId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data.roadmap) {
          setRoadmap(data.roadmap);
          // Initialize notes state from roadmap
          const notesMap: Record<string, string> = {};
          if (data.roadmap.taskProgress) {
            Object.entries(data.roadmap.taskProgress).forEach(([tid, entry]: [string, any]) => {
              if (entry.notes) notesMap[tid] = entry.notes;
            });
          }
          setTaskNotes(notesMap);

          // Auto-expand first phase by default
          if (data.roadmap.phases?.[0]?.tasks?.[0]) {
            setExpandedTasks((prev) => ({
              ...prev,
              [data.roadmap.phases[0].tasks[0].id]: true,
            }));
          }
        } else {
          setRoadmap(null);
        }
      } else {
        setRoadmap(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch roadmap:", err);
      setRoadmapError("Failed to connect to mentor service. Please try again.");
    } finally {
      setLoadingRoadmap(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedProjectId) {
      fetchRoadmap(selectedProjectId);
    }
  }, [selectedProjectId, fetchRoadmap]);

  // Scroll chat to bottom when messages update
  React.useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  // Selected project helper
  const selectedProject = React.useMemo(() => {
    return projects.find((p) => String(p.id) === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Generate roadmap action
  const handleGenerateRoadmap = async (refinement = "") => {
    if (!selectedProjectId) return;

    try {
      setGenerating(true);
      setRoadmapError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/mentor/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          refineInstructions: refinement || undefined,
          forceRegenerate: Boolean(refinement),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.roadmap) {
          setRoadmap(data.roadmap);
          const notesMap: Record<string, string> = {};
          if (data.roadmap.taskProgress) {
            Object.entries(data.roadmap.taskProgress).forEach(([tid, entry]: [string, any]) => {
              if (entry.notes) notesMap[tid] = entry.notes;
            });
          }
          setTaskNotes(notesMap);
          setRefineModalOpen(false);
          setRefineInput("");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setRoadmapError(errJson.error || "Failed to generate roadmap.");
      }
    } catch (err: any) {
      console.error("Roadmap generation error:", err);
      setRoadmapError(err.message || "Network error while generating roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  // Toggle task status
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!selectedProjectId || !roadmap) return;

    // Optimistic UI update
    const previousProgress = { ...roadmap.taskProgress };
    const currentEntry = previousProgress[taskId] || { status: "not_started" };
    const updatedEntry: TaskProgressEntry = {
      ...currentEntry,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setRoadmap({
      ...roadmap,
      taskProgress: {
        ...previousProgress,
        [taskId]: updatedEntry,
      },
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      await fetch("/api/mentor/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          taskId,
          status: newStatus,
          notes: taskNotes[taskId] || currentEntry.notes,
        }),
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  // Save personal notes for a task
  const handleSaveNote = async (taskId: string) => {
    if (!selectedProjectId || !roadmap) return;

    setSavingNoteId(taskId);
    const noteText = taskNotes[taskId] || "";
    const currentEntry = roadmap.taskProgress?.[taskId] || { status: "not_started" };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      await fetch("/api/mentor/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          taskId,
          status: currentEntry.status,
          notes: noteText,
        }),
      });

      setRoadmap({
        ...roadmap,
        taskProgress: {
          ...roadmap.taskProgress,
          [taskId]: {
            ...currentEntry,
            notes: noteText,
          },
        },
      });
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setTimeout(() => setSavingNoteId(null), 800);
    }
  };

  // Toggle task card expansion
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Send message in Ask Project Mentor chat
  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput.trim();
    if (!textToSend || !selectedProjectId) return;

    const userMessage: MentorChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (!customMessage) setChatInput("");
    setChatLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          message: textToSend,
          messageHistory: chatMessages.slice(-8), // Send recent context
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const mentorReply: MentorChatMessage = {
          id: "mentor-" + Date.now(),
          sender: "mentor",
          text: data.reply || "I am analyzing your project context. How else can I guide you?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, mentorReply]);
      } else {
        throw new Error("Chat response failed");
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: "mentor-err-" + Date.now(),
          sender: "mentor",
          text: "I experienced a brief connection hiccup. Let's try again, or you can ask me specifically about any task on your roadmap!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Ask Mentor quick-prompt for specific task
  const handleAskAboutTask = (task: MentorTask) => {
    setChatOpen(true);
    handleSendMessage(`How do I start and implement this milestone: "${task.title}"? Please give me clear step-by-step guidance.`);
  };

  // Progress calculations
  const progressStats = React.useMemo(() => {
    if (!roadmap || !roadmap.phases) {
      return { total: 0, completed: 0, inProgress: 0, percent: 0, nextTask: null as MentorTask | null };
    }

    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let nextTask: MentorTask | null = null;

    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        total++;
        const status = roadmap.taskProgress?.[task.id]?.status || "not_started";
        if (status === "completed") {
          completed++;
        } else if (status === "in_progress") {
          inProgress++;
          if (!nextTask) nextTask = task; // Prioritize in-progress task
        } else if (!nextTask) {
          nextTask = task; // First unstarted task
        }
      }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, percent, nextTask };
  }, [roadmap]);

  // Jump to task action
  const jumpToTask = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: true }));
    const element = document.getElementById(`task-card-${taskId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-[#C5F52D]");
      setTimeout(() => element.classList.remove("ring-2", "ring-[#C5F52D]"), 2000);
    }
  };

  // Filtered phases & tasks
  const filteredPhases = React.useMemo(() => {
    if (!roadmap || !roadmap.phases) return [];

    return roadmap.phases
      .filter((phase) => {
        if (activePhaseFilter === "all") return true;
        return phase.id === activePhaseFilter;
      })
      .map((phase) => {
        const tasks = phase.tasks.filter((task) => {
          if (statusFilter === "all") return true;
          const status = roadmap.taskProgress?.[task.id]?.status || "not_started";
          return status === statusFilter;
        });
        return { ...phase, tasks };
      })
      .filter((phase) => phase.tasks.length > 0);
  }, [roadmap, activePhaseFilter, statusFilter]);

  // Render loading project state
  if (loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-xs text-[#405169] dark:text-[#CBD5E1]">
        <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
        <span>Loading your projects and mentoring records...</span>
      </div>
    );
  }

  // Render empty state if user has no projects
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] max-w-lg mx-auto text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D] shadow-xs mb-4">
          <Compass className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-display font-bold text-[#172033] dark:text-[#F1F5F9] tracking-tight">
          No Saved Projects Yet
        </h2>
        <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-1.5 mb-6 leading-relaxed">
          The AI Project Mentor generates personalized, task-by-task roadmaps tailored to your specific project specifications. Create or save your first project to unlock the mentor.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Your First Project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16 font-body text-[#172033] dark:text-[#F1F5F9] transition-colors relative">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CBD5E1] dark:border-[#344456]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] flex items-center justify-center shadow-xs">
              <Compass className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-[#172033] dark:text-[#F1F5F9]">
              AI Project Mentor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] mt-1">
            Personalized, phase-by-phase implementation guidance and contextual technical support.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown to pick saved project */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-9 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D] cursor-pointer shadow-2xs"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-white dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9]">
                  {proj.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#405169] dark:text-[#CBD5E1] pointer-events-none" />
          </div>

          {/* Ask Mentor Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-bold transition-all cursor-pointer shadow-xs ${
              chatOpen
                ? "bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720]"
                : "border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{chatOpen ? "Close Mentor Chat" : "Ask Mentor"}</span>
          </button>

          {/* Feasibility Analyzer Link */}
          {selectedProjectId && (
            <Link
              href={`/dashboard/feasibility?projectId=${selectedProjectId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Open AI Feasibility Analyzer for this project"
            >
              <Activity className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
              <span>Feasibility</span>
            </Link>
          )}

          {/* Task Tracker Link */}
          {selectedProjectId && (
            <Link
              href={`/dashboard/tasks?projectId=${selectedProjectId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Open Task Tracker for this project"
            >
              <ListTodo className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
              <span>Tasks</span>
            </Link>
          )}

          {/* Refine / Regenerate Button (if roadmap exists) */}
          {roadmap && (
            <button
              onClick={() => setRefineModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[#172033] dark:text-[#F1F5F9] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Refine or customize roadmap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
              <span>Refine</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loadingRoadmap ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] gap-3 text-xs text-[#405169] dark:text-[#CBD5E1] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span>Loading roadmap milestones...</span>
        </div>
      ) : roadmapError ? (
        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{roadmapError}</span>
          </div>
          <button
            onClick={() => handleGenerateRoadmap()}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] font-bold text-xs self-start sm:self-auto cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : !roadmap ? (
        /* Empty State: Project has no roadmap yet */
        <div className="rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] p-8 md:p-12 text-center flex flex-col items-center gap-5 shadow-xs transition-colors">
          <div className="w-14 h-14 rounded-xl bg-[#EEF1F5] dark:bg-[#202D3B] border border-[#CBD5E1] dark:border-[#344456] flex items-center justify-center text-[#202D50] dark:text-[#C5F52D] shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-2 max-w-lg">
            <h2 className="text-xl font-display font-bold text-[#172033] dark:text-[#F1F5F9] tracking-tight">
              Ready to Build {selectedProject?.title}?
            </h2>
            <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
              Generate a custom, task-by-task engineering roadmap adapted to your selected domain ({selectedProject?.domain || "Engineering"}), complexity tier ({selectedProject?.complexity || "Standard"}), and technology stack.
            </p>
          </div>

          {/* Project spec preview pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27] text-[#172033] dark:text-[#F1F5F9]">
              Domain: {selectedProject?.domain || "General"}
            </span>
            <span className="px-2.5 py-1 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27] text-[#172033] dark:text-[#F1F5F9]">
              Complexity: {selectedProject?.complexity || "Standard"}
            </span>
          </div>

          <button
            onClick={() => handleGenerateRoadmap()}
            disabled={generating}
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Architecting Your Roadmap...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Generate Mentor Roadmap</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Active Roadmap Layout */
        <div className="flex flex-col gap-6">
          {/* Progress Overview & Suggested Next Task */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left: Overall Progress Card */}
            <div className="md:col-span-6 p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs flex flex-col justify-between gap-4 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#405169] dark:text-[#CBD5E1] uppercase tracking-wider">
                    Roadmap Completion
                  </span>
                  <span className="text-base font-display font-bold text-[#202D50] dark:text-[#C5F52D]">
                    {progressStats.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-[#EEF1F5] dark:bg-[#111B27] border border-[#CBD5E1] dark:border-[#344456] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-[#202D50] dark:bg-[#C5F52D] transition-all duration-300"
                    style={{ width: `${progressStats.percent}%` }}
                  />
                </div>
              </div>

              {/* Milestone Breakdown Counters */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#CBD5E1] dark:border-[#344456] text-center">
                <div className="flex flex-col">
                  <span className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                    {progressStats.completed}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                    Completed
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                    {progressStats.inProgress}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                    In Progress
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                    {progressStats.total - progressStats.completed - progressStats.inProgress}
                  </span>
                  <span className="text-[10px] font-semibold text-[#405169] dark:text-[#CBD5E1] uppercase">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Suggested Next Milestone */}
            <div className="md:col-span-6 p-5 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs flex flex-col justify-between gap-3 transition-colors">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202D50] dark:text-[#C5F52D] uppercase tracking-wider mb-1.5">
                  <Lightbulb className="w-4 h-4" />
                  <span>
                    {progressStats.inProgress > 0 ? "Current Active Milestone" : "Recommended Next Milestone"}
                  </span>
                </div>

                {progressStats.nextTask ? (
                  <>
                    <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] leading-snug line-clamp-1">
                      {progressStats.nextTask.title}
                    </h3>
                    <p className="text-xs text-[#334155] dark:text-[#CBD5E1] line-clamp-2 mt-1 leading-relaxed">
                      {progressStats.nextTask.explanation}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All milestones completed! Your project is ready for viva evaluation.</span>
                  </div>
                )}
              </div>

              {progressStats.nextTask && (
                <div className="flex items-center justify-between pt-2 border-t border-[#CBD5E1] dark:border-[#344456]">
                  <span className="text-[11px] font-semibold text-[#405169] dark:text-[#CBD5E1]">
                    {progressStats.nextTask.estimatedEffort}
                  </span>
                  <button
                    onClick={() => jumpToTask(progressStats.nextTask!.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#202D50] hover:text-[#15203C] dark:text-[#C5F52D] dark:hover:text-[#B3E325] cursor-pointer"
                  >
                    <span>Focus Milestone</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
              <span className="text-[#405169] dark:text-[#CBD5E1] text-[11px] uppercase font-bold shrink-0">
                Phase Filter:
              </span>
              <button
                onClick={() => setActivePhaseFilter("all")}
                className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer shrink-0 ${
                  activePhaseFilter === "all"
                    ? "bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] font-bold"
                    : "text-[#334155] dark:text-[#CBD5E1] hover:bg-[#EEF1F5] dark:hover:bg-[#111B27]"
                }`}
              >
                All Phases ({roadmap.phases?.length || 0})
              </button>
              {roadmap.phases?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePhaseFilter(p.id)}
                  className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer shrink-0 ${
                    activePhaseFilter === p.id
                      ? "bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] font-bold"
                      : "text-[#334155] dark:text-[#CBD5E1] hover:bg-[#EEF1F5] dark:hover:bg-[#111B27]"
                  }`}
                >
                  Phase {p.phaseNumber}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
              <span className="text-[#405169] dark:text-[#CBD5E1] text-[11px] uppercase font-bold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Phase Cards List */}
          <div className="flex flex-col gap-6">
            {filteredPhases.map((phase) => {
              // Calculate phase progress
              const phaseTasks = phase.tasks;
              const phaseCompleted = phaseTasks.filter(
                (t) => roadmap.taskProgress?.[t.id]?.status === "completed"
              ).length;

              return (
                <section
                  key={phase.id}
                  className="rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] overflow-hidden shadow-xs transition-colors"
                >
                  {/* Phase Header */}
                  <div className="p-5 border-b border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111A25] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] flex items-center justify-center font-display font-bold text-xs shrink-0 mt-0.5">
                        {phase.phaseNumber}
                      </div>
                      <div>
                        <h2 className="text-base font-display font-bold text-[#172033] dark:text-[#F1F5F9] leading-snug">
                          {phase.title}
                        </h2>
                        <p className="text-xs text-[#405169] dark:text-[#CBD5E1] mt-0.5 leading-relaxed">
                          {phase.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9]">
                        {phaseCompleted} of {phaseTasks.length} Done
                      </span>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="divide-y divide-[#CBD5E1] dark:divide-[#344456]">
                    {phaseTasks.map((task) => {
                      const taskProgress = roadmap.taskProgress?.[task.id] || { status: "not_started" };
                      const isExpanded = expandedTasks[task.id] ?? false;

                      return (
                        <div
                          key={task.id}
                          id={`task-card-${task.id}`}
                          className={`p-5 transition-all ${
                            taskProgress.status === "completed"
                              ? "bg-white/60 dark:bg-[#182330]/60 opacity-95"
                              : "bg-white dark:bg-[#182330]"
                          }`}
                        >
                          {/* Task Top Summary Line */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Status Quick Checkbox */}
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    task.id,
                                    taskProgress.status === "completed" ? "not_started" : "completed"
                                  )
                                }
                                className="mt-0.5 text-[#405169] hover:text-[#202D50] dark:text-[#CBD5E1] dark:hover:text-[#C5F52D] transition-colors cursor-pointer shrink-0"
                                title={taskProgress.status === "completed" ? "Mark incomplete" : "Mark completed"}
                              >
                                {taskProgress.status === "completed" ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                ) : taskProgress.status === "in_progress" ? (
                                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              {/* Task Title & Estimate */}
                              <div className="flex-1 cursor-pointer" onClick={() => toggleTaskExpand(task.id)}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3
                                    className={`text-sm font-display font-bold transition-colors ${
                                      taskProgress.status === "completed"
                                        ? "line-through text-[#405169] dark:text-[#CBD5E1]"
                                        : "text-[#172033] dark:text-[#F1F5F9]"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  <span className="text-[10px] font-semibold text-[#405169] dark:text-[#CBD5E1] px-2 py-0.5 rounded border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27]">
                                    {task.estimatedEffort}
                                  </span>
                                </div>
                                <p className="text-xs text-[#334155] dark:text-[#CBD5E1] mt-1 leading-relaxed line-clamp-1">
                                  {task.explanation}
                                </p>
                              </div>
                            </div>

                            {/* Actions Right: Status selector & Expand button */}
                            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                              <select
                                value={taskProgress.status}
                                onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] focus:outline-none cursor-pointer ${
                                  taskProgress.status === "completed"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                    : taskProgress.status === "in_progress"
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-white dark:bg-[#111B27] text-[#172033] dark:text-[#F1F5F9]"
                                }`}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>

                              <button
                                onClick={() => toggleTaskExpand(task.id)}
                                className="p-1 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] cursor-pointer"
                                aria-label="Toggle task details"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Task Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#CBD5E1] dark:border-[#344456] flex flex-col gap-4 animate-fade-in pl-8">
                              {/* Why It Matters */}
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#202D50] dark:text-[#C5F52D] block mb-1">
                                  Why This Task Matters:
                                </span>
                                <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                                  {task.whyItMatters}
                                </p>
                              </div>

                              {/* What To Learn Before Starting */}
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1] block mb-1">
                                  What You Should Understand / Learn:
                                </span>
                                <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                                  {task.whatToLearn}
                                </p>
                              </div>

                              {/* Prerequisites */}
                              {task.prerequisites && task.prerequisites.length > 0 && (
                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1] block mb-1.5">
                                    Prerequisites:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {task.prerequisites.map((prereq, pIdx) => (
                                      <span
                                        key={pIdx}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27] text-[#172033] dark:text-[#F1F5F9]"
                                      >
                                        ✓ {prereq}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Learning Resources */}
                              {task.learningResources && task.learningResources.length > 0 && (
                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1] block mb-1.5">
                                    Curated Documentation & Learning Guides:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {task.learningResources.map((res, rIdx) => (
                                      <a
                                        key={rIdx}
                                        href={res.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27] hover:border-[#202D50] dark:hover:border-[#C5F52D] transition-colors flex items-center justify-between gap-2 group"
                                      >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <BookOpen className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D] shrink-0" />
                                          <span className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9] truncate group-hover:underline">
                                            {res.title}
                                          </span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-[#405169] dark:text-[#CBD5E1] shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Personal Task Notes */}
                              <div className="mt-1">
                                <div className="flex items-center justify-between mb-1.5">
                                  <label
                                    htmlFor={`note-${task.id}`}
                                    className="text-[11px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1] flex items-center gap-1.5"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
                                    <span>Personal Development Notes / Implementation Log</span>
                                  </label>
                                  {savingNoteId === task.id && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      <span>Saved to Supabase</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    id={`note-${task.id}`}
                                    value={taskNotes[task.id] ?? ""}
                                    onChange={(e) =>
                                      setTaskNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                                    }
                                    placeholder="Write your personal notes, bugs encountered, snippets, or files modified for this milestone..."
                                    rows={2}
                                    className="w-full p-2.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9] placeholder-[#566880] dark:placeholder-[#A3B3C7] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D] font-mono leading-relaxed"
                                  />
                                  <div className="flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => handleAskAboutTask(task)}
                                      className="text-[11px] font-bold text-[#202D50] hover:text-[#15203C] dark:text-[#C5F52D] dark:hover:text-[#B3E325] flex items-center gap-1 cursor-pointer"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      <span>Ask Mentor about this step</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSaveNote(task.id)}
                                      className="px-3 py-1 rounded-[4px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                    >
                                      Save Note
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-over "Ask Project Mentor" Chat Panel */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#111A25] border-l border-[#CBD5E1] dark:border-[#344456] shadow-2xl flex flex-col transition-all duration-200 animate-fade-in font-body">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#202D50] dark:bg-[#C5F52D] text-white dark:text-[#0F1720] flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                  Project Mentor Chat
                </h3>
                <p className="text-[10px] text-[#405169] dark:text-[#CBD5E1] line-clamp-1">
                  Context: {selectedProject?.title}
                </p>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-[4px] border border-[#CBD5E1] dark:border-[#344456] text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9] cursor-pointer"
              aria-label="Close mentor chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Recommendation Chips */}
          <div className="p-3 border-b border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold shrink-0">
            <button
              onClick={() => handleSendMessage("What should be my immediate next step for this project?")}
              className="px-2.5 py-1 rounded-full border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] hover:border-[#202D50] dark:hover:border-[#C5F52D] whitespace-nowrap cursor-pointer transition-colors"
            >
              What to do next?
            </button>
            <button
              onClick={() => handleSendMessage("Can you explain how to set up the database schema for this project?")}
              className="px-2.5 py-1 rounded-full border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] hover:border-[#202D50] dark:hover:border-[#C5F52D] whitespace-nowrap cursor-pointer transition-colors"
            >
              Explain Database
            </button>
            <button
              onClick={() => handleSendMessage("What viva defense questions should I prepare for regarding this tech stack?")}
              className="px-2.5 py-1 rounded-full border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] hover:border-[#202D50] dark:hover:border-[#C5F52D] whitespace-nowrap cursor-pointer transition-colors"
            >
              Viva Questions
            </button>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white dark:bg-[#111A25]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[88%] text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] font-medium"
                      : "bg-[#F8FAFC] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] text-[#172033] dark:text-[#F1F5F9] shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[9px] text-[#405169] dark:text-[#CBD5E1] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] text-xs text-[#405169] dark:text-[#CBD5E1]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
                <span>Mentor is analyzing your project context...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a technical or roadmap question..."
              className="flex-1 px-3 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9] placeholder-[#566880] dark:placeholder-[#A3B3C7] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] focus:ring-1 focus:ring-[#202D50] dark:focus:ring-[#C5F52D]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="p-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors shadow-xs"
              aria-label="Send message to mentor"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Refine / Customize Roadmap Modal */}
      {refineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1720]/60 backdrop-blur-sm animate-fade-in font-body">
          <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
                <h3 className="text-base font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                  Refine Your Roadmap
                </h3>
              </div>
              <button
                onClick={() => setRefineModalOpen(false)}
                className="p-1 rounded-[4px] text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
              Tell the AI Mentor how to tailor your milestones (e.g. <em>&quot;I only have 3 weeks&quot;</em>, <em>&quot;Focus heavily on building custom neural network layers&quot;</em>, or <em>&quot;Include Docker deployment steps&quot;</em>). Your existing notes and completed task statuses will be preserved.
            </p>

            <textarea
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder="Enter your custom instructions or time constraints..."
              rows={3}
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
                onClick={() => handleGenerateRoadmap(refineInput)}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Refinements</span>
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

export default function MentorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] gap-3 text-xs text-[#405169] dark:text-[#CBD5E1]">
          <Loader2 className="w-5 h-5 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span>Loading AI Project Mentor...</span>
        </div>
      }
    >
      <MentorPageContent />
    </React.Suspense>
  );
}
