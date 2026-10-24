"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Loader2,
  FolderGit2,
  Search,
  Filter,
  Trash2,
  Calendar,
  Tag,
  Compass,
  Activity,
  X,
  Layers,
  ArrowUpDown,
  Kanban,
  List,
  Flame,
  Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ProjectTask,
  TaskBoardData,
  TrackerTaskStatus,
  TrackerTaskPriority,
  TrackerTaskSource,
} from "@/types/tasks";

// Dynamically import hello-pangea/dnd to prevent SSR hydration errors
const DragDropContext = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.DragDropContext),
  { ssr: false }
);
const Droppable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Droppable),
  { ssr: false }
);
const Draggable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Draggable),
  { ssr: false }
);

function TaskTrackerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Project selection states
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [projectsError, setProjectsError] = React.useState<string | null>(null);

  // Board state
  const [board, setBoard] = React.useState<TaskBoardData | null>(null);
  const [loadingBoard, setLoadingBoard] = React.useState(false);
  const [boardError, setBoardError] = React.useState<string | null>(null);

  // UI view mode: Kanban vs List
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban");

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDesc, setNewTaskDesc] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<TrackerTaskPriority>("medium");
  const [newTaskEffort, setNewTaskEffort] = React.useState("Est. 1 - 2 hours");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState("");
  const [creatingTask, setCreatingTask] = React.useState(false);

  // AI Breakdown modal states
  const [breakdownModalOpen, setBreakdownModalOpen] = React.useState(false);
  const [selectedTaskForBreakdown, setSelectedTaskForBreakdown] = React.useState<ProjectTask | null>(null);
  const [breakdownSubtasks, setBreakdownSubtasks] = React.useState<any[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = React.useState(false);

  // Import feasibility feedback state
  const [importingFeasibility, setImportingFeasibility] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState<string | null>(null);

  // 1. Fetch user's saved projects
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

        const queryProjId = searchParams.get("projectId");
        if (queryProjId && list.some((p: any) => String(p.id) === queryProjId)) {
          setSelectedProjectId(queryProjId);
        } else if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setProjectsError(errJson.error || "Failed to load projects.");
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

  // 2. Fetch Board data for selected project
  const fetchBoard = React.useCallback(async (projId: string) => {
    if (!projId) {
      setBoard(null);
      return;
    }

    try {
      setLoadingBoard(true);
      setBoardError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch(`/api/tasks?projectId=${encodeURIComponent(projId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setBoard(data.board || null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setBoardError(errJson.error || "Failed to load task board.");
      }
    } catch (err: any) {
      console.error("Fetch board error:", err);
      setBoardError(err.message || "Network error fetching task tracker.");
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedProjectId) {
      fetchBoard(selectedProjectId);
    }
  }, [selectedProjectId, fetchBoard]);

  // Handle Drag and Drop
  const onDragEnd = async (result: any) => {
    if (!result.destination || !board) return;

    const { source, destination, draggableId } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TrackerTaskStatus;

    // Optimistic UI update
    const updatedTasks = board.tasks.map((t) =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    );

    const updatedColumns = {
      todo: updatedTasks.filter((t) => t.status === "todo").map((t) => t.id),
      in_progress: updatedTasks.filter((t) => t.status === "in_progress").map((t) => t.id),
      completed: updatedTasks.filter((t) => t.status === "completed").map((t) => t.id),
    };

    setBoard({
      ...board,
      tasks: updatedTasks,
      columns: updatedColumns,
      metrics: {
        total: updatedTasks.length,
        todoCount: updatedColumns.todo.length,
        inProgressCount: updatedColumns.in_progress.length,
        completedCount: updatedColumns.completed.length,
        completionPercentage:
          updatedTasks.length > 0
            ? Math.round((updatedColumns.completed.length / updatedTasks.length) * 100)
            : 0,
      },
    });

    // Server-side sync
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "update_status",
          taskId: draggableId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.error("Failed to sync drag status to server:", err);
      fetchBoard(selectedProjectId);
    }
  };

  // Status dropdown toggle in list/card view
  const handleStatusChange = async (taskId: string, newStatus: TrackerTaskStatus) => {
    if (!board) return;

    // Optimistic update
    const updatedTasks = board.tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );

    const updatedColumns = {
      todo: updatedTasks.filter((t) => t.status === "todo").map((t) => t.id),
      in_progress: updatedTasks.filter((t) => t.status === "in_progress").map((t) => t.id),
      completed: updatedTasks.filter((t) => t.status === "completed").map((t) => t.id),
    };

    setBoard({
      ...board,
      tasks: updatedTasks,
      columns: updatedColumns,
      metrics: {
        total: updatedTasks.length,
        todoCount: updatedColumns.todo.length,
        inProgressCount: updatedColumns.in_progress.length,
        completedCount: updatedColumns.completed.length,
        completionPercentage:
          updatedTasks.length > 0
            ? Math.round((updatedColumns.completed.length / updatedTasks.length) * 100)
            : 0,
      },
    });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "update_status",
          taskId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchBoard(selectedProjectId);
    }
  };

  // Create custom task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    try {
      setCreatingTask(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "create_task",
          task: {
            title: newTaskTitle.trim(),
            description: newTaskDesc.trim(),
            priority: newTaskPriority,
            estimatedEffort: newTaskEffort,
            dueDate: newTaskDueDate || undefined,
            status: "todo",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
        setCreateModalOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskDueDate("");
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to remove this custom task?")) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "delete_task",
          taskId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.board) setBoard(data.board);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Import Feasibility actions
  const handleImportFeasibility = async () => {
    if (!selectedProjectId) return;

    try {
      setImportingFeasibility(true);
      setImportMessage(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "import_feasibility",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.board) setBoard(data.board);
        setImportMessage(data.message || "Feasibility action items updated.");
        setTimeout(() => setImportMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to import feasibility tasks:", err);
    } finally {
      setImportingFeasibility(false);
    }
  };

  // AI Task Breakdown
  const handleOpenAiBreakdown = async (task: ProjectTask) => {
    setSelectedTaskForBreakdown(task);
    setBreakdownSubtasks([]);
    setBreakdownModalOpen(true);
    setLoadingBreakdown(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/tasks/ai-breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          taskTitle: task.title,
          taskDescription: task.description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBreakdownSubtasks(data.subtasks || []);
      }
    } catch (err) {
      console.error("AI Breakdown error:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Add an AI subtask to board
  const handleAddSubtaskToBoard = async (subtask: any) => {
    if (!selectedProjectId) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          action: "create_task",
          task: {
            title: subtask.title,
            description: subtask.description,
            priority: subtask.priority || "medium",
            estimatedEffort: subtask.estimatedEffort,
            status: "todo",
            tags: ["AI Subtask", selectedTaskForBreakdown?.title.substring(0, 15) || "Subtask"],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.board) setBoard(data.board);
        setBreakdownSubtasks((prev) => prev.filter((s) => s.title !== subtask.title));
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    if (!board) return [];

    return board.tasks.filter((task) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || "").toLowerCase().includes(q);
        const matchesTag = (task.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Source
      if (sourceFilter !== "all" && task.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [board, searchQuery, priorityFilter, sourceFilter]);

  const priorityBadge = (p: TrackerTaskPriority) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "high":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "medium":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "low":
      default:
        return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
    }
  };

  const sourceBadge = (s: TrackerTaskSource) => {
    switch (s) {
      case "mentor":
        return "bg-[#202D50]/10 dark:bg-[#C5F52D]/15 text-[#202D50] dark:text-[#C5F52D] border-[#CBD5E1] dark:border-[#344456]";
      case "feasibility":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "custom":
      default:
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
  };

  if (loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
        <span className="text-xs text-[#405169] dark:text-[#CBD5E1]">Loading your projects...</span>
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
            Generate and save a project blueprint first to manage tasks in the AI Task Tracker.
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-body text-[#172033] dark:text-[#F1F5F9] transition-colors">
      {/* Top Header & Project Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#CBD5E1] dark:border-[#344456] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#C5F52D]/40 bg-[#C5F52D]/15 text-[#172033] dark:text-[#C5F52D]">
              <ListTodo className="w-3 h-3 text-[#202D50] dark:text-[#C5F52D]" />
              Implementation Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-[#172033] dark:text-[#F1F5F9] tracking-tight mt-1.5 flex items-center gap-2.5">
            AI Project Task Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#405169] dark:text-[#CBD5E1] mt-1">
            Dynamic Kanban & sprint tracker synchronized with your AI Mentor Roadmap and Feasibility analysis.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-end">
          <div className="relative min-w-[220px]">
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                router.replace(`/dashboard/tasks?projectId=${e.target.value}`);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs font-semibold text-[#172033] dark:text-[#F1F5F9] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D] cursor-pointer shadow-2xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)} className="bg-white dark:bg-[#182330]">
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#405169] dark:text-[#CBD5E1] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#202D50] hover:bg-[#15203C] text-white dark:bg-[#C5F52D] dark:hover:bg-[#B3E325] dark:text-[#0F1720] text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importMessage && (
        <div className="p-3.5 rounded-lg border border-[#C5F52D]/40 bg-[#C5F52D]/15 text-[#172033] dark:text-[#C5F52D] text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4" />
            <span>{importMessage}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Progress & Metrics Summary Banner */}
      {board && (
        <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#EEF1F5] dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                {board.metrics.completionPercentage}%
              </span>
              <span className="text-[9px] uppercase font-bold text-[#405169] dark:text-[#CBD5E1]">Done</span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                {board.metrics.completedCount} of {board.metrics.total} Tasks Completed
              </h3>
              {/* Progress bar */}
              <div className="w-64 max-w-full h-2 rounded-full bg-[#EEF1F5] dark:bg-[#182330] overflow-hidden">
                <div
                  className="h-full bg-[#202D50] dark:bg-[#C5F52D] rounded-full transition-all duration-300"
                  style={{ width: `${board.metrics.completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#405169] dark:text-[#CBD5E1] mt-0.5">
                <span>To Do: <strong className="text-[#172033] dark:text-[#F1F5F9]">{board.metrics.todoCount}</strong></span>
                <span>In Progress: <strong className="text-[#172033] dark:text-[#F1F5F9]">{board.metrics.inProgressCount}</strong></span>
                <span>Done: <strong className="text-[#172033] dark:text-[#F1F5F9]">{board.metrics.completedCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Cross-Nav Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {board.hasFeasibilityAnalysis && (
              <button
                onClick={handleImportFeasibility}
                disabled={importingFeasibility}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] hover:bg-[#EEF1F5] dark:hover:bg-[#202D3B] text-[11px] font-bold text-[#172033] dark:text-[#F1F5F9] cursor-pointer shadow-2xs"
                title="Convert Feasibility risk mitigations into tracking tasks"
              >
                {importingFeasibility ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
                )}
                <span>Import Feasibility Actions</span>
              </button>
            )}

            <Link
              href={`/dashboard/mentor?projectId=${selectedProjectId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] hover:bg-[#F8FAFC] dark:hover:bg-[#202D3B] text-[11px] font-bold text-[#172033] dark:text-[#F1F5F9] shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#202D50] dark:text-[#C5F52D]" />
              <span>AI Mentor Roadmap</span>
            </Link>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-3 shadow-xs">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#405169] dark:text-[#CBD5E1] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tags..."
              className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-xs text-[#172033] dark:text-[#F1F5F9] placeholder-[#405169] dark:placeholder-[#CBD5E1] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D]"
            />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-xs font-semibold text-[#172033] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#405169] dark:text-[#CBD5E1] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Source filter */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#182330] text-xs font-semibold text-[#172033] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="mentor">Mentor Roadmap</option>
              <option value="feasibility">Feasibility Actions</option>
              <option value="custom">Custom Tasks</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#405169] dark:text-[#CBD5E1] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* View Mode Toggle: Kanban vs List */}
        <div className="flex items-center gap-1 border border-[#CBD5E1] dark:border-[#344456] rounded-lg p-0.5 bg-[#F8FAFC] dark:bg-[#182330] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white dark:bg-[#202D3B] text-[#202D50] dark:text-[#C5F52D] shadow-xs"
                : "text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-[#202D3B] text-[#202D50] dark:text-[#C5F52D] shadow-xs"
                : "text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Loading state for board */}
      {loadingBoard && (
        <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span className="text-xs text-[#405169] dark:text-[#CBD5E1]">Loading task board...</span>
        </div>
      )}

      {/* Error state for board */}
      {boardError && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{boardError}</span>
          </div>
          <button
            onClick={() => fetchBoard(selectedProjectId)}
            className="px-3 py-1 rounded bg-rose-600 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {!loadingBoard && board && viewMode === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(
              [
                { id: "todo", title: "To Do", count: board.metrics.todoCount },
                { id: "in_progress", title: "In Progress", count: board.metrics.inProgressCount },
                { id: "completed", title: "Completed", count: board.metrics.completedCount },
              ] as const
            ).map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);

              return (
                <div
                  key={column.id}
                  className="flex flex-col rounded-xl border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111A25] p-3.5 min-h-[560px] shadow-xs transition-colors"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#344456] pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                        {column.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EEF1F5] dark:bg-[#182330] text-[#405169] dark:text-[#CBD5E1]">
                        {columnTasks.length}
                      </span>
                    </div>

                    {column.id === "todo" && (
                      <button
                        onClick={() => setCreateModalOpen(true)}
                        className="p-1 rounded hover:bg-[#EEF1F5] dark:hover:bg-[#182330] text-[#405169] dark:text-[#CBD5E1] cursor-pointer"
                        title="Add task to To Do"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Droppable Container */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5 transition-colors ${
                          snapshot.isDraggingOver ? "bg-[#EEF1F5]/40 dark:bg-[#182330]/40 rounded-lg" : ""
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`p-4 rounded-xl border bg-white dark:bg-[#182330] cursor-grab active:cursor-grabbing hover:border-[#202D50]/50 dark:hover:border-[#C5F52D]/50 transition-all select-none shadow-xs flex flex-col gap-2.5 ${
                                  dragSnapshot.isDragging
                                    ? "border-[#202D50] dark:border-[#C5F52D] shadow-xl rotate-1"
                                    : "border-[#CBD5E1] dark:border-[#344456]"
                                }`}
                              >
                                {/* Task Card Badges */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${priorityBadge(
                                        task.priority
                                      )}`}
                                    >
                                      {task.priority}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${sourceBadge(
                                        task.source
                                      )}`}
                                    >
                                      {task.source === "mentor" ? "Mentor" : task.source === "feasibility" ? "Feasibility" : "Custom"}
                                    </span>
                                  </div>

                                  {task.source === "custom" && (
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-[#405169] dark:text-[#CBD5E1] hover:text-rose-600 dark:hover:text-rose-400 p-1"
                                      title="Delete custom task"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Title & Description */}
                                <div>
                                  <h4 className="text-xs font-display font-bold text-[#172033] dark:text-[#F1F5F9] leading-snug">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] mt-1 line-clamp-2 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}
                                </div>

                                {/* Phase or Effort */}
                                <div className="flex items-center justify-between text-[10px] text-[#405169] dark:text-[#CBD5E1] pt-2 border-t border-[#CBD5E1] dark:border-[#344456]">
                                  <span className="truncate max-w-[150px]">
                                    {task.phaseTitle || "General"}
                                  </span>
                                  {task.estimatedEffort && (
                                    <span className="font-semibold">{task.estimatedEffort}</span>
                                  )}
                                </div>

                                {/* Quick AI Action on card */}
                                <div className="flex items-center justify-between pt-1">
                                  <button
                                    onClick={() => handleOpenAiBreakdown(task)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] hover:underline cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI Subtasks</span>
                                  </button>

                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      handleStatusChange(task.id, e.target.value as TrackerTaskStatus)
                                    }
                                    className="appearance-none pl-2 pr-5 py-0.5 rounded text-[10px] font-semibold border border-[#CBD5E1] dark:border-[#344456] bg-[#F8FAFC] dark:bg-[#111B27] text-[#172033] dark:text-[#F1F5F9] cursor-pointer"
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnTasks.length === 0 && (
                          <div className="flex-1 flex items-center justify-center border border-dashed border-[#CBD5E1] dark:border-[#344456] rounded-xl py-12 text-center text-xs text-[#405169] dark:text-[#CBD5E1]">
                            No tasks in this column
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* VIEW 2: LIST VIEW */}
      {!loadingBoard && board && viewMode === "list" && (
        <div className="bg-white dark:bg-[#111A25] border border-[#CBD5E1] dark:border-[#344456] rounded-xl shadow-xs overflow-hidden">
          <div className="divide-y divide-[#CBD5E1] dark:divide-[#344456]">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] dark:hover:bg-[#182330] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === "completed" ? "todo" : "completed"
                      )
                    }
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                      task.status === "completed"
                        ? "bg-[#202D50] border-[#202D50] text-white dark:bg-[#C5F52D] dark:border-[#C5F52D] dark:text-[#0F1720]"
                        : "border-[#CBD5E1] dark:border-[#344456]"
                    }`}
                  >
                    {task.status === "completed" && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-display font-bold text-[#172033] dark:text-[#F1F5F9] ${
                          task.status === "completed" ? "line-through opacity-70" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${priorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${sourceBadge(
                          task.source
                        )}`}
                      >
                        {task.source}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#405169] dark:text-[#CBD5E1] line-clamp-2 max-w-2xl">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-[#405169] dark:text-[#CBD5E1]">
                      <span>Phase: {task.phaseTitle || "General"}</span>
                      {task.estimatedEffort && <span>Effort: {task.estimatedEffort}</span>}
                      {task.dueDate && <span>Due: {task.dueDate}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenAiBreakdown(task)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] hover:bg-[#EEF1F5] dark:hover:bg-[#182330] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Subtasks</span>
                  </button>

                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value as TrackerTaskStatus)
                    }
                    className="pl-2 pr-6 py-1 rounded-[6px] text-xs font-semibold border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] text-[#172033] dark:text-[#F1F5F9] cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  {task.source === "custom" && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-[#405169] dark:text-[#CBD5E1] hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="p-12 text-center text-xs text-[#405169] dark:text-[#CBD5E1]">
                No tasks match your search or filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CUSTOM TASK MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#344456] pb-3">
              <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
                Create Custom Project Task
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#405169] dark:text-[#CBD5E1]">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Set up OAuth redirect URI in Supabase"
                  className="w-full mt-1 p-2.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#405169] dark:text-[#CBD5E1]">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Additional context or acceptance criteria..."
                  rows={2}
                  className="w-full mt-1 p-2.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9] focus:outline-none focus:border-[#202D50] dark:focus:border-[#C5F52D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#405169] dark:text-[#CBD5E1]">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TrackerTaskPriority)}
                    className="w-full mt-1 p-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#405169] dark:text-[#CBD5E1]">Estimated Effort</label>
                  <input
                    type="text"
                    value={newTaskEffort}
                    onChange={(e) => setNewTaskEffort(e.target.value)}
                    placeholder="Est. 1 - 2 hours"
                    className="w-full mt-1 p-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#405169] dark:text-[#CBD5E1]">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full mt-1 p-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#111B27] text-xs text-[#172033] dark:text-[#F1F5F9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#CBD5E1] dark:border-[#344456] mt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-[#344456] text-xs font-bold text-[#172033] dark:text-[#F1F5F9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-1.5 rounded-[6px] bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {creatingTask ? "Adding..." : "Add to Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SUBTASK BREAKDOWN MODAL */}
      {breakdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#182330] border border-[#CBD5E1] dark:border-[#344456] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#344456] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#202D50] dark:text-[#C5F52D]" />
                <h3 className="text-sm font-display font-bold text-[#172033] dark:text-[#F1F5F9]">
                  AI Subtask Breakdown
                </h3>
              </div>
              <button
                onClick={() => setBreakdownModalOpen(false)}
                className="text-[#405169] dark:text-[#CBD5E1] hover:text-[#172033] dark:hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#111B27] p-3 rounded-lg border border-[#CBD5E1] dark:border-[#344456]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#405169] dark:text-[#CBD5E1]">
                Parent Task
              </span>
              <h4 className="text-xs font-display font-bold text-[#172033] dark:text-[#F1F5F9] mt-0.5">
                {selectedTaskForBreakdown?.title}
              </h4>
            </div>

            {loadingBreakdown ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#405169] dark:text-[#CBD5E1]">
                <Loader2 className="w-5 h-5 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
                <span>Generating bite-sized technical subtasks...</span>
              </div>
            ) : breakdownSubtasks.length > 0 ? (
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {breakdownSubtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#CBD5E1] dark:border-[#344456] bg-white dark:bg-[#182330] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#172033] dark:text-[#F1F5F9]">
                        {st.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#405169] dark:text-[#CBD5E1]">
                        {st.estimatedEffort}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#405169] dark:text-[#CBD5E1] leading-relaxed">
                      {st.description}
                    </p>
                    <button
                      onClick={() => handleAddSubtaskToBoard(st)}
                      className="inline-flex items-center gap-1 self-start mt-1 text-[10px] font-bold text-[#202D50] dark:text-[#C5F52D] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add as Board Task</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#405169] dark:text-[#CBD5E1] text-center py-6">
                All suggested subtasks added to your board.
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-[#CBD5E1] dark:border-[#344456]">
              <button
                onClick={() => setBreakdownModalOpen(false)}
                className="px-4 py-1.5 rounded-[6px] bg-[#202D50] text-white dark:bg-[#C5F52D] dark:text-[#0F1720] text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskTrackerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] gap-3 text-xs text-[#405169] dark:text-[#CBD5E1]">
          <Loader2 className="w-5 h-5 animate-spin text-[#202D50] dark:text-[#C5F52D]" />
          <span>Loading AI Project Task Tracker...</span>
        </div>
      }
    >
      <TaskTrackerPageContent />
    </React.Suspense>
  );
}
