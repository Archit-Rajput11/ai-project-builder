export type FeasibilityClassification =
  | "Highly Feasible"
  | "Feasible with Adjustments"
  | "Needs Significant Simplification";

export type ComplexityLevel = "Beginner" | "Intermediate" | "Advanced";

export interface RubricCategory {
  name: string;
  maxScore: number;
  score: number;
  weight: string;
  rationale: string;
}

export interface RubricBreakdown {
  technicalComplexity: RubricCategory;
  toolAvailability: RubricCategory;
  scopeVsTimeline: RubricCategory;
  skillLearningCurve: RubricCategory;
  riskAndDependencies: RubricCategory;
}

export interface SkillRequirement {
  skill: string;
  category: "prerequisite" | "core" | "to_learn";
  importance: "high" | "medium" | "low";
  reason: string;
  mentorPhaseSuggestion?: string;
}

export interface TechAssessment {
  technology: string;
  category: "frontend" | "backend" | "database" | "tools" | "ai_ml";
  isAppropriate: boolean;
  verdict: string;
  alternative?: string;
  alternativeReason?: string;
}

export interface CostItem {
  service: string;
  tier: "Free Tier Available" | "Estimated Cost" | "Verified Price";
  estimatedMonthlyCost: string;
  details: string;
  isOptional: boolean;
}

export interface TechnicalRisk {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  description: string;
  mitigation: string;
  mentorMitigationTask?: string;
}

export interface MvpScope {
  coreFeatures: string[];
  omittedFeatures: string[];
  justification: string;
  estimatedTimeline: string;
}

export interface ImprovementAction {
  id: string;
  title: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  description: string;
  actionStep: string;
}

export interface FeasibilityAnalysis {
  id?: string;
  projectId: string;
  projectTitle: string;
  overallScore: number; // 0 - 100
  classification: FeasibilityClassification;
  scoringSummary: string;
  rubric: RubricBreakdown;

  complexity: {
    level: ComplexityLevel;
    reasons: string[];
  };

  timeline: {
    estimatedWeeks: number;
    timelineSummary: string;
    teamAssumptions: string;
    potentialBottlenecks: string[];
  };

  skills: {
    prerequisites: SkillRequirement[];
    toLearn: SkillRequirement[];
    learningEffortSummary: string;
  };

  techStackAssessment: TechAssessment[];

  costEstimation: {
    estimatedMonthlyTotal: string;
    hasFreeTierCoverage: boolean;
    freeTierSummary: string;
    items: CostItem[];
  };

  risks: TechnicalRisk[];
  mvp: MvpScope;
  improvementPlan: ImprovementAction[];

  strengths: string[];
  majorConcerns: string[];
  recommendedNextSteps: string[];
  assumptions: string[];

  createdAt: string;
  updatedAt: string;
  previousScore?: number;
}
