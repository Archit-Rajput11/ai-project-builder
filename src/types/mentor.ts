export type TaskStatus = "not_started" | "in_progress" | "completed";

export interface LearningResource {
  title: string;
  url?: string;
  type?: "documentation" | "tutorial" | "video" | "article" | "guide";
  description?: string;
}

export interface MentorTask {
  id: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  whatToLearn: string;
  prerequisites: string[];
  estimatedEffort: string; // e.g. "Est. 1 - 2 hours"
  learningResources?: LearningResource[];
}

export interface MentorPhase {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  tasks: MentorTask[];
}

export interface TaskProgressEntry {
  status: TaskStatus;
  notes?: string;
  updatedAt?: string;
}

export type TaskProgressMap = Record<string, TaskProgressEntry>;

export interface MentorRoadmap {
  id?: string;
  projectId: string;
  projectTitle: string;
  summary: string;
  phases: MentorPhase[];
  taskProgress: TaskProgressMap;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  timestamp: string;
  relatedTaskId?: string;
}
