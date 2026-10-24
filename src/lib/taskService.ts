import { supabaseAdmin } from "./supabase";
import { getProjectMentorRoadmap, updateMentorTaskProgress } from "./mentorService";
import { getProjectFeasibilityAnalysis } from "./feasibilityService";
import {
  ProjectTask,
  TaskBoardData,
  TrackerTaskStatus,
  TrackerTaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/tasks";

interface StoredTrackerRecord {
  id?: string;
  project_id: string;
  user_id: string;
  custom_tasks: ProjectTask[];
  task_metadata: Record<
    string,
    {
      priority?: TrackerTaskPriority;
      dueDate?: string;
      tags?: string[];
      notes?: string;
      order?: number;
    }
  >;
  created_at?: string;
  updated_at?: string;
}

/**
 * Reads the task tracker record from Supabase table or projects fallback
 */
async function getStoredTrackerRecord(
  projectId: string,
  userId: string
): Promise<StoredTrackerRecord> {
  const defaultRecord: StoredTrackerRecord = {
    project_id: projectId,
    user_id: userId,
    custom_tasks: [],
    task_metadata: {},
  };

  try {
    // 1. Try dedicated project_task_tracker table
    const { data: tableData, error: tableErr } = await supabaseAdmin
      .from("project_task_tracker")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!tableErr && tableData) {
      return {
        id: tableData.id,
        project_id: tableData.project_id,
        user_id: tableData.user_id,
        custom_tasks: Array.isArray(tableData.custom_tasks) ? tableData.custom_tasks : [],
        task_metadata: tableData.task_metadata || {},
        created_at: tableData.created_at,
        updated_at: tableData.updated_at,
      };
    }

    // 2. Fallback to projects.blueprint_data.task_tracker with ownership verification
    const { data: projectData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, blueprint_data, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!projErr && projectData) {
      // Confirm ownership matches before returning fallback data
      if (projectData.user_id && projectData.user_id !== userId) {
        console.warn(`[TaskTracker] User ownership mismatch in getStoredTrackerRecord: project owner ${projectData.user_id} !== caller ${userId}`);
        return defaultRecord;
      }

      if (projectData.blueprint_data?.task_tracker) {
        const stored = projectData.blueprint_data.task_tracker;
        return {
          ...defaultRecord,
          custom_tasks: Array.isArray(stored.custom_tasks) ? stored.custom_tasks : [],
          task_metadata: stored.task_metadata || {},
        };
      }
    }
  } catch (err) {
    console.error("Error reading task tracker from Supabase:", err);
  }

  return defaultRecord;
}

/**
 * Persists the custom tasks & metadata to Supabase table + projects fallback.
 * Strictly preserves all other keys in blueprint_data and enforces ownership.
 */
async function saveStoredTrackerRecord(
  record: StoredTrackerRecord,
  userId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  let saved = false;

  // 1. Dedicated table
  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("project_task_tracker")
      .upsert(
        {
          project_id: String(record.project_id),
          user_id: userId,
          custom_tasks: record.custom_tasks || [],
          task_metadata: record.task_metadata || {},
          updated_at: now,
        },
        { onConflict: "project_id,user_id" }
      );

    if (!upsertErr) {
      saved = true;
    } else if (upsertErr.code !== "42P01") {
      // 42P01 = undefined_table (migration not run yet). Log any other unexpected DB errors
      console.warn("[TaskTracker] Notice on project_task_tracker upsert:", upsertErr.message);
    }
  } catch (tableErr) {
    // Migration might not have run yet, fallback handles it
  }

  // 2. Fallback in projects table (preserves all existing keys in blueprint_data)
  try {
    const { data: existingProject, error: fetchErr } = await supabaseAdmin
      .from("projects")
      .select("id, blueprint_data, user_id")
      .eq("id", record.project_id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[TaskTracker] Error fetching project for fallback save:", fetchErr.message);
    } else if (existingProject) {
      // Enforce ownership: do not overwrite project data belonging to another user
      if (existingProject.user_id && existingProject.user_id !== userId) {
        console.error(`[TaskTracker] Security check failed: project owner ${existingProject.user_id} !== caller ${userId}`);
        return saved;
      }

      const updatedBlueprint = {
        ...(existingProject.blueprint_data || {}),
        task_tracker: {
          custom_tasks: record.custom_tasks || [],
          task_metadata: record.task_metadata || {},
          updated_at: now,
        },
      };

      const { error: projUpdateErr } = await supabaseAdmin
        .from("projects")
        .update({ blueprint_data: updatedBlueprint })
        .eq("id", record.project_id)
        .eq("user_id", userId);

      if (projUpdateErr) {
        console.error("[TaskTracker] Error updating projects.blueprint_data:", projUpdateErr.message);
      } else {
        saved = true;
      }
    }
  } catch (projErr) {
    console.error("[TaskTracker] Exception saving task tracker to projects table:", projErr);
  }

  return saved;
}

/**
 * Compiles a unified TaskBoardData combining Mentor tasks, Feasibility actions, and Custom tasks
 */
export async function getProjectTaskBoard(
  projectId: string,
  userId: string
): Promise<TaskBoardData | null> {
  if (!projectId || !userId) return null;

  try {
    // 1. Fetch project title
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) return null;

    // 2. Fetch Mentor Roadmap & Feasibility Analysis
    const [mentorRoadmap, feasibilityAnalysis, trackerRecord] = await Promise.all([
      getProjectMentorRoadmap(projectId, userId),
      getProjectFeasibilityAnalysis(projectId, userId),
      getStoredTrackerRecord(projectId, userId),
    ]);

    const tasks: ProjectTask[] = [];

    // 3. Project Mentor Roadmap tasks (Source of Truth for curriculum)
    if (mentorRoadmap && Array.isArray(mentorRoadmap.phases)) {
      mentorRoadmap.phases.forEach((phase, phaseIdx) => {
        if (!Array.isArray(phase.tasks)) return;

        phase.tasks.forEach((task, taskIdx) => {
          const progressEntry = mentorRoadmap.taskProgress?.[task.id];
          const rawStatus = progressEntry?.status || "not_started";

          // Map mentor status: 'completed' -> 'completed', 'in_progress' -> 'in_progress', 'not_started' -> 'todo'
          let status: TrackerTaskStatus = "todo";
          if (rawStatus === "completed") status = "completed";
          else if (rawStatus === "in_progress") status = "in_progress";

          const meta = trackerRecord.task_metadata[task.id] || {};

          // Default priority: earlier phases have higher initial priority
          const defaultPriority: TrackerTaskPriority =
            phaseIdx === 0 ? "high" : phaseIdx === 1 ? "medium" : "low";

          tasks.push({
            id: task.id,
            projectId,
            title: task.title,
            description: task.explanation || "",
            status,
            priority: meta.priority || defaultPriority,
            source: "mentor",
            sourceId: task.id,
            phaseTitle: phase.title,
            estimatedEffort: task.estimatedEffort,
            dueDate: meta.dueDate,
            tags: meta.tags || [phase.title.split(":")[0]?.trim() || `Phase ${phaseIdx + 1}`],
            notes: progressEntry?.notes || meta.notes,
            order: meta.order ?? (phaseIdx * 100 + taskIdx),
            createdAt: mentorRoadmap.createdAt || new Date().toISOString(),
            updatedAt: progressEntry?.updatedAt || mentorRoadmap.updatedAt || new Date().toISOString(),
          });
        });
      });
    }

    // 4. Append Custom & Feasibility tasks stored in trackerRecord
    if (Array.isArray(trackerRecord.custom_tasks)) {
      trackerRecord.custom_tasks.forEach((ct, ctIdx) => {
        const meta = trackerRecord.task_metadata[ct.id] || {};
        tasks.push({
          ...ct,
          projectId,
          priority: meta.priority || ct.priority || "medium",
          dueDate: meta.dueDate || ct.dueDate,
          tags: meta.tags || ct.tags || ["Custom"],
          notes: meta.notes || ct.notes,
          order: ct.order ?? (1000 + ctIdx),
        });
      });
    }

    // Sort tasks by order
    tasks.sort((a, b) => a.order - b.order);

    // Group into columns
    const columns: { todo: string[]; in_progress: string[]; completed: string[] } = {
      todo: [],
      in_progress: [],
      completed: [],
    };

    tasks.forEach((t) => {
      if (columns[t.status]) {
        columns[t.status].push(t.id);
      } else {
        columns.todo.push(t.id);
      }
    });

    // Calculate metrics
    const total = tasks.length;
    const completedCount = columns.completed.length;
    const inProgressCount = columns.in_progress.length;
    const todoCount = columns.todo.length;
    const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      projectId,
      projectTitle: project.title,
      tasks,
      columns,
      metrics: {
        total,
        todoCount,
        inProgressCount,
        completedCount,
        completionPercentage,
      },
      hasMentorRoadmap: Boolean(mentorRoadmap),
      hasFeasibilityAnalysis: Boolean(feasibilityAnalysis),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error in getProjectTaskBoard:", err);
    return null;
  }
}

/**
 * Updates a task's status with atomic source synchronization.
 * Throws an explicit error if the database write fails.
 */
export async function updateTrackerTaskStatus(
  projectId: string,
  userId: string,
  taskId: string,
  newStatus: TrackerTaskStatus
): Promise<TaskBoardData | null> {
  const trackerRecord = await getStoredTrackerRecord(projectId, userId);

  // Check if it's a custom task
  const customTaskIdx = trackerRecord.custom_tasks.findIndex((t) => t.id === taskId);

  if (customTaskIdx !== -1) {
    trackerRecord.custom_tasks[customTaskIdx].status = newStatus;
    trackerRecord.custom_tasks[customTaskIdx].updatedAt = new Date().toISOString();
    const saved = await saveStoredTrackerRecord(trackerRecord, userId);
    if (!saved) {
      throw new Error("Database error: Failed to update task status in database.");
    }
  } else {
    // It's a Mentor Roadmap task: sync with Mentor Roadmap source of truth
    const mentorStatus =
      newStatus === "completed"
        ? "completed"
        : newStatus === "in_progress"
        ? "in_progress"
        : "not_started";

    const updatedRoadmap = await updateMentorTaskProgress(projectId, userId, taskId, {
      status: mentorStatus,
    });
    if (!updatedRoadmap) {
      throw new Error("Database error: Failed to update mentor task progress in database.");
    }
  }

  return getProjectTaskBoard(projectId, userId);
}

/**
 * Adds a new custom task to the tracker.
 * Throws an explicit error if the database write fails.
 */
export async function createCustomTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput
): Promise<TaskBoardData | null> {
  const trackerRecord = await getStoredTrackerRecord(projectId, userId);
  const now = new Date().toISOString();

  const newTask: ProjectTask = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    projectId,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    status: input.status || "todo",
    priority: input.priority || "medium",
    source: "custom",
    estimatedEffort: input.estimatedEffort || "Est. 1 - 2 hours",
    dueDate: input.dueDate,
    tags: input.tags && input.tags.length > 0 ? input.tags : ["Student Task"],
    order: trackerRecord.custom_tasks.length + 1000,
    createdAt: now,
    updatedAt: now,
  };

  trackerRecord.custom_tasks.push(newTask);
  const saved = await saveStoredTrackerRecord(trackerRecord, userId);
  if (!saved) {
    throw new Error("Database error: Failed to persist new task to database.");
  }

  return getProjectTaskBoard(projectId, userId);
}

/**
 * Updates properties (priority, effort, dueDate, notes, tags) for any task.
 * Throws an explicit error if the database write fails.
 */
export async function updateTaskDetails(
  projectId: string,
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskBoardData | null> {
  const trackerRecord = await getStoredTrackerRecord(projectId, userId);
  const customTaskIdx = trackerRecord.custom_tasks.findIndex((t) => t.id === taskId);

  if (customTaskIdx !== -1) {
    // Update custom task
    const t = trackerRecord.custom_tasks[customTaskIdx];
    if (input.title !== undefined) t.title = input.title.trim();
    if (input.description !== undefined) t.description = input.description.trim();
    if (input.status !== undefined) t.status = input.status;
    if (input.priority !== undefined) t.priority = input.priority;
    if (input.estimatedEffort !== undefined) t.estimatedEffort = input.estimatedEffort;
    if (input.dueDate !== undefined) t.dueDate = input.dueDate;
    if (input.tags !== undefined) t.tags = input.tags;
    if (input.notes !== undefined) t.notes = input.notes;
    t.updatedAt = new Date().toISOString();
  } else {
    // Store metadata overrides for Mentor/Feasibility tasks without breaking roadmap schema
    const currentMeta = trackerRecord.task_metadata[taskId] || {};
    trackerRecord.task_metadata[taskId] = {
      ...currentMeta,
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };

    // If status changed on mentor task, update Mentor progress
    if (input.status !== undefined) {
      const mentorStatus =
        input.status === "completed"
          ? "completed"
          : input.status === "in_progress"
          ? "in_progress"
          : "not_started";

      const updatedRoadmap = await updateMentorTaskProgress(projectId, userId, taskId, {
        status: mentorStatus,
        notes: input.notes,
      });
      if (!updatedRoadmap) {
        throw new Error("Database error: Failed to update mentor task progress in database.");
      }
    }
  }

  const saved = await saveStoredTrackerRecord(trackerRecord, userId);
  if (!saved) {
    throw new Error("Database error: Failed to save updated task details to database.");
  }

  return getProjectTaskBoard(projectId, userId);
}

/**
 * Deletes a custom task from the board.
 * Returns explicit failure if the database write fails.
 */
export async function deleteCustomTask(
  projectId: string,
  userId: string,
  taskId: string
): Promise<{ success: boolean; board: TaskBoardData | null; message?: string }> {
  const trackerRecord = await getStoredTrackerRecord(projectId, userId);
  const exists = trackerRecord.custom_tasks.some((t) => t.id === taskId);

  if (!exists) {
    return {
      success: false,
      board: await getProjectTaskBoard(projectId, userId),
      message: "Mentor Roadmap curriculum tasks cannot be deleted, but you can mark them completed.",
    };
  }

  trackerRecord.custom_tasks = trackerRecord.custom_tasks.filter((t) => t.id !== taskId);
  delete trackerRecord.task_metadata[taskId];
  const saved = await saveStoredTrackerRecord(trackerRecord, userId);
  if (!saved) {
    return {
      success: false,
      board: await getProjectTaskBoard(projectId, userId),
      message: "Database error: Failed to delete task from database.",
    };
  }

  const updatedBoard = await getProjectTaskBoard(projectId, userId);
  return { success: true, board: updatedBoard };
}

/**
 * Imports actionable risk mitigations and MVP items from Feasibility Analysis without duplication.
 * Throws an explicit error if the database write fails.
 */
export async function importFeasibilityActionTasks(
  projectId: string,
  userId: string
): Promise<{ addedCount: number; board: TaskBoardData | null }> {
  const feasibility = await getProjectFeasibilityAnalysis(projectId, userId);
  if (!feasibility) {
    return { addedCount: 0, board: await getProjectTaskBoard(projectId, userId) };
  }

  const trackerRecord = await getStoredTrackerRecord(projectId, userId);
  const existingSourceIds = new Set(
    trackerRecord.custom_tasks.map((t) => t.sourceId).filter(Boolean)
  );

  let added = 0;
  const now = new Date().toISOString();

  // 1. Convert risk mitigations
  if (Array.isArray(feasibility.risks)) {
    feasibility.risks.forEach((risk) => {
      const sourceId = `feasibility-risk-${risk.id}`;
      if (!existingSourceIds.has(sourceId) && risk.mitigation) {
        existingSourceIds.add(sourceId);
        trackerRecord.custom_tasks.push({
          id: `custom-${Date.now()}-${added + 1}`,
          projectId,
          title: `Mitigate: ${risk.title}`,
          description: risk.mitigation,
          status: "todo",
          priority: risk.severity === "high" ? "urgent" : risk.severity === "medium" ? "high" : "medium",
          source: "feasibility",
          sourceId,
          phaseTitle: "Feasibility Risk Mitigation",
          estimatedEffort: "Est. 2 - 3 hours",
          tags: ["Risk Mitigation", `${risk.severity.toUpperCase()} Severity`],
          order: 2000 + added,
          createdAt: now,
          updatedAt: now,
        });
        added++;
      }
    });
  }

  // 2. Convert improvement plan items
  if (Array.isArray(feasibility.improvementPlan)) {
    feasibility.improvementPlan.forEach((action) => {
      const sourceId = `feasibility-improvement-${action.id}`;
      if (!existingSourceIds.has(sourceId)) {
        existingSourceIds.add(sourceId);
        trackerRecord.custom_tasks.push({
          id: `custom-${Date.now()}-${added + 1}`,
          projectId,
          title: `Action: ${action.title}`,
          description: action.actionStep || action.description,
          status: "todo",
          priority: action.impact === "high" ? "high" : "medium",
          source: "feasibility",
          sourceId,
          phaseTitle: "Feasibility Improvement",
          estimatedEffort: action.effort === "high" ? "Est. 4 - 6 hours" : "Est. 1 - 2 hours",
          tags: ["Feasibility Action", `${action.impact} Impact`],
          order: 2000 + added,
          createdAt: now,
          updatedAt: now,
        });
        added++;
      }
    });
  }

  if (added > 0) {
    const saved = await saveStoredTrackerRecord(trackerRecord, userId);
    if (!saved) {
      throw new Error("Database error: Failed to persist imported feasibility tasks.");
    }
  }

  const updatedBoard = await getProjectTaskBoard(projectId, userId);
  return { addedCount: added, board: updatedBoard };
}
