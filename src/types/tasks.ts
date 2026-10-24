export type TrackerTaskStatus = "todo" | "in_progress" | "completed";
export type TrackerTaskPriority = "low" | "medium" | "high" | "urgent";
export type TrackerTaskSource = "mentor" | "feasibility" | "custom";

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TrackerTaskStatus;
  priority: TrackerTaskPriority;
  source: TrackerTaskSource;
  sourceId?: string; // Links back to mentor taskId (e.g. task-1-1) or feasibility riskId
  phaseTitle?: string;
  estimatedEffort?: string;
  dueDate?: string;
  tags?: string[];
  notes?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  id: TrackerTaskStatus;
  title: string;
  taskIds: string[];
}

export interface TaskBoardData {
  projectId: string;
  projectTitle: string;
  tasks: ProjectTask[];
  columns: {
    todo: string[];
    in_progress: string[];
    completed: string[];
  };
  metrics: {
    total: number;
    todoCount: number;
    inProgressCount: number;
    completedCount: number;
    completionPercentage: number;
  };
  hasMentorRoadmap: boolean;
  hasFeasibilityAnalysis: boolean;
  updatedAt: string;
}

export interface TaskFilterOptions {
  searchQuery?: string;
  status?: "all" | TrackerTaskStatus;
  priority?: "all" | TrackerTaskPriority;
  source?: "all" | TrackerTaskSource;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TrackerTaskStatus;
  priority?: TrackerTaskPriority;
  estimatedEffort?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TrackerTaskStatus;
  priority?: TrackerTaskPriority;
  estimatedEffort?: string;
  dueDate?: string;
  tags?: string[];
  notes?: string;
}
