import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "./supabase";
import {
  FeasibilityAnalysis,
  FeasibilityClassification,
  ComplexityLevel,
  RubricBreakdown,
  TechAssessment,
  CostItem,
  TechnicalRisk,
  ImprovementAction,
  SkillRequirement,
} from "@/types/feasibility";

/**
 * Calculates classification based on explicit rubric score
 */
export function classifyScore(score: number): FeasibilityClassification {
  if (score >= 80) return "Highly Feasible";
  if (score >= 60) return "Feasible with Adjustments";
  return "Needs Significant Simplification";
}

/**
 * Fetches an existing feasibility analysis from Supabase
 */
export async function getProjectFeasibilityAnalysis(
  projectId: string,
  userId: string
): Promise<FeasibilityAnalysis | null> {
  if (!projectId || !userId) return null;

  try {
    // 1. Try dedicated table first
    const { data: tableData, error: tableErr } = await supabaseAdmin
      .from("project_feasibility_analyses")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!tableErr && tableData && tableData.analysis_data) {
      return {
        id: tableData.id,
        projectId: tableData.project_id,
        projectTitle: tableData.project_title,
        overallScore: tableData.overall_score,
        classification: tableData.classification as FeasibilityClassification,
        ...tableData.analysis_data,
        createdAt: tableData.created_at,
        updatedAt: tableData.updated_at,
      };
    }

    // 2. Fallback to projects.blueprint_data.feasibility_analysis
    const { data: projectData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, blueprint_data, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!projErr && projectData?.blueprint_data?.feasibility_analysis) {
      return projectData.blueprint_data.feasibility_analysis as FeasibilityAnalysis;
    }

    return null;
  } catch (err) {
    console.error("Error reading feasibility analysis from Supabase:", err);
    return null;
  }
}

/**
 * Persists a feasibility analysis to Supabase (dedicated table + projects fallback)
 */
export async function saveProjectFeasibilityAnalysis(
  analysis: FeasibilityAnalysis,
  userId: string
): Promise<boolean> {
  if (!analysis.projectId || !userId) return false;

  const now = new Date().toISOString();
  analysis.updatedAt = now;
  if (!analysis.createdAt) analysis.createdAt = now;

  let savedSuccessfully = false;

  // 1. Dedicated table
  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("project_feasibility_analyses")
      .upsert(
        {
          project_id: String(analysis.projectId),
          user_id: userId,
          project_title: analysis.projectTitle || "Project Feasibility",
          overall_score: analysis.overallScore,
          classification: analysis.classification,
          analysis_data: {
            scoringSummary: analysis.scoringSummary,
            rubric: analysis.rubric,
            complexity: analysis.complexity,
            timeline: analysis.timeline,
            skills: analysis.skills,
            techStackAssessment: analysis.techStackAssessment,
            costEstimation: analysis.costEstimation,
            risks: analysis.risks,
            mvp: analysis.mvp,
            improvementPlan: analysis.improvementPlan,
            strengths: analysis.strengths,
            majorConcerns: analysis.majorConcerns,
            recommendedNextSteps: analysis.recommendedNextSteps,
            assumptions: analysis.assumptions,
            previousScore: analysis.previousScore,
          },
          updated_at: now,
        },
        { onConflict: "project_id,user_id" }
      );

    if (!upsertErr) {
      savedSuccessfully = true;
    }
  } catch (tableErr) {
    // If migration not run yet, fallback handles it
  }

  // 2. Fallback in projects table
  try {
    const { data: existingProject } = await supabaseAdmin
      .from("projects")
      .select("blueprint_data")
      .eq("id", analysis.projectId)
      .maybeSingle();

    if (existingProject) {
      const updatedBlueprint = {
        ...(existingProject.blueprint_data || {}),
        feasibility_analysis: analysis,
      };

      const { error: projUpdateErr } = await supabaseAdmin
        .from("projects")
        .update({ blueprint_data: updatedBlueprint })
        .eq("id", analysis.projectId);

      if (!projUpdateErr) {
        savedSuccessfully = true;
      }
    }
  } catch (projErr) {
    console.error("Error saving feasibility analysis to projects table:", projErr);
  }

  return savedSuccessfully;
}

/**
 * Generates structured AI Feasibility Analysis using Gemini 2.5 Flash with fallback
 */
export async function generateFeasibilityAnalysis(
  project: {
    id: string;
    title: string;
    domain?: string;
    complexity?: string;
    blueprint?: any;
  },
  userId: string,
  options?: {
    customNotes?: string;
    previousScore?: number;
  }
): Promise<FeasibilityAnalysis> {
  const bp = project.blueprint || {};
  const projectTitle = project.title || bp.projectTitle || "Academic Project";
  const domain = bp.domain || project.domain || "Web Development";
  const complexity = bp.complexity || project.complexity || "Intermediate";
  const techStack = bp.techStack || { frontend: [], backend: [], database: [], hostingAndTools: [] };
  const allTechs = [
    ...(techStack.frontend || []),
    ...(techStack.backend || []),
    ...(techStack.database || []),
    ...(techStack.hostingAndTools || []),
  ];

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a principal software architect and academic project evaluator.
Your role is to perform an objective, rigorous AI Feasibility Analysis on an engineering student's project blueprint.

SCORING RUBRIC (Total 100 points):
1. Technical Complexity (max 25 pts): Evaluate architecture feasibility, integration challenges, and depth.
2. Tool & Ecosystem Availability (max 20 pts): Evaluate maturity of libraries, frameworks, APIs, and documentation.
3. Scope vs Development Timeline (max 20 pts): Is this deliverable within an academic semester (e.g. 8-16 weeks) by a student or small team?
4. Skill & Learning Curve (max 20 pts): Prerequisite knowledge vs steepness of new tech to master.
5. Technical Risks, Dependencies & Cost (max 15 pts): External API limits, paid dependencies, database concurrency, and deployment obstacles.

CLASSIFICATION RULES:
- Score 80-100: "Highly Feasible"
- Score 60-79: "Feasible with Adjustments"
- Score 0-59: "Needs Significant Simplification"

GUIDELINES:
- Provide concrete, nuanced evaluations based on the specific technologies: ${allTechs.join(", ")}.
- Explicitly state assumptions and identify unknowns rather than declaring projects infeasible.
- Differentiate between free-tier options and estimated expenses. Do not invent exact prices.
- Propose an MVP scope separating core features from non-essential features.
- Connect risks and missing skills to actionable mentor roadmap milestones.`;

      const userPrompt = `Perform a comprehensive Feasibility Analysis for:
Project Title: ${projectTitle}
Domain: ${domain}
Self-Assessed Complexity: ${complexity}
Description: ${bp.description || projectTitle}
Frontend Technologies: ${(techStack.frontend || []).join(", ") || "Standard"}
Backend Technologies: ${(techStack.backend || []).join(", ") || "Standard"}
Database: ${(techStack.database || []).join(", ") || "Standard"}
Hosting & Tools: ${(techStack.hostingAndTools || []).join(", ") || "Standard"}
Roadmap Timeline: ${(bp.roadmapWeeks || []).length || 8} planned weeks
${options?.customNotes ? `User Considerations: "${options.customNotes}"` : ""}
`;

      const responseSchema = {
        type: "OBJECT",
        properties: {
          overallScore: { type: "INTEGER" },
          scoringSummary: { type: "STRING" },
          rubric: {
            type: "OBJECT",
            properties: {
              technicalComplexity: {
                type: "OBJECT",
                properties: { name: { type: "STRING" }, maxScore: { type: "INTEGER" }, score: { type: "INTEGER" }, weight: { type: "STRING" }, rationale: { type: "STRING" } },
                required: ["name", "maxScore", "score", "weight", "rationale"]
              },
              toolAvailability: {
                type: "OBJECT",
                properties: { name: { type: "STRING" }, maxScore: { type: "INTEGER" }, score: { type: "INTEGER" }, weight: { type: "STRING" }, rationale: { type: "STRING" } },
                required: ["name", "maxScore", "score", "weight", "rationale"]
              },
              scopeVsTimeline: {
                type: "OBJECT",
                properties: { name: { type: "STRING" }, maxScore: { type: "INTEGER" }, score: { type: "INTEGER" }, weight: { type: "STRING" }, rationale: { type: "STRING" } },
                required: ["name", "maxScore", "score", "weight", "rationale"]
              },
              skillLearningCurve: {
                type: "OBJECT",
                properties: { name: { type: "STRING" }, maxScore: { type: "INTEGER" }, score: { type: "INTEGER" }, weight: { type: "STRING" }, rationale: { type: "STRING" } },
                required: ["name", "maxScore", "score", "weight", "rationale"]
              },
              riskAndDependencies: {
                type: "OBJECT",
                properties: { name: { type: "STRING" }, maxScore: { type: "INTEGER" }, score: { type: "INTEGER" }, weight: { type: "STRING" }, rationale: { type: "STRING" } },
                required: ["name", "maxScore", "score", "weight", "rationale"]
              }
            },
            required: ["technicalComplexity", "toolAvailability", "scopeVsTimeline", "skillLearningCurve", "riskAndDependencies"]
          },
          complexity: {
            type: "OBJECT",
            properties: {
              level: { type: "STRING" },
              reasons: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["level", "reasons"]
          },
          timeline: {
            type: "OBJECT",
            properties: {
              estimatedWeeks: { type: "INTEGER" },
              timelineSummary: { type: "STRING" },
              teamAssumptions: { type: "STRING" },
              potentialBottlenecks: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["estimatedWeeks", "timelineSummary", "teamAssumptions", "potentialBottlenecks"]
          },
          skills: {
            type: "OBJECT",
            properties: {
              prerequisites: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { skill: { type: "STRING" }, category: { type: "STRING" }, importance: { type: "STRING" }, reason: { type: "STRING" }, mentorPhaseSuggestion: { type: "STRING" } },
                  required: ["skill", "category", "importance", "reason"]
                }
              },
              toLearn: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { skill: { type: "STRING" }, category: { type: "STRING" }, importance: { type: "STRING" }, reason: { type: "STRING" }, mentorPhaseSuggestion: { type: "STRING" } },
                  required: ["skill", "category", "importance", "reason"]
                }
              },
              learningEffortSummary: { type: "STRING" }
            },
            required: ["prerequisites", "toLearn", "learningEffortSummary"]
          },
          techStackAssessment: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                technology: { type: "STRING" },
                category: { type: "STRING" },
                isAppropriate: { type: "BOOLEAN" },
                verdict: { type: "STRING" },
                alternative: { type: "STRING" },
                alternativeReason: { type: "STRING" }
              },
              required: ["technology", "category", "isAppropriate", "verdict"]
            }
          },
          costEstimation: {
            type: "OBJECT",
            properties: {
              estimatedMonthlyTotal: { type: "STRING" },
              hasFreeTierCoverage: { type: "BOOLEAN" },
              freeTierSummary: { type: "STRING" },
              items: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { service: { type: "STRING" }, tier: { type: "STRING" }, estimatedMonthlyCost: { type: "STRING" }, details: { type: "STRING" }, isOptional: { type: "BOOLEAN" } },
                  required: ["service", "tier", "estimatedMonthlyCost", "details", "isOptional"]
                }
              }
            },
            required: ["estimatedMonthlyTotal", "hasFreeTierCoverage", "freeTierSummary", "items"]
          },
          risks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { id: { type: "STRING" }, title: { type: "STRING" }, severity: { type: "STRING" }, description: { type: "STRING" }, mitigation: { type: "STRING" }, mentorMitigationTask: { type: "STRING" } },
              required: ["id", "title", "severity", "description", "mitigation"]
            }
          },
          mvp: {
            type: "OBJECT",
            properties: {
              coreFeatures: { type: "ARRAY", items: { type: "STRING" } },
              omittedFeatures: { type: "ARRAY", items: { type: "STRING" } },
              justification: { type: "STRING" },
              estimatedTimeline: { type: "STRING" }
            },
            required: ["coreFeatures", "omittedFeatures", "justification", "estimatedTimeline"]
          },
          improvementPlan: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { id: { type: "STRING" }, title: { type: "STRING" }, impact: { type: "STRING" }, effort: { type: "STRING" }, description: { type: "STRING" }, actionStep: { type: "STRING" } },
              required: ["id", "title", "impact", "effort", "description", "actionStep"]
            }
          },
          strengths: { type: "ARRAY", items: { type: "STRING" } },
          majorConcerns: { type: "ARRAY", items: { type: "STRING" } },
          recommendedNextSteps: { type: "ARRAY", items: { type: "STRING" } },
          assumptions: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: [
          "overallScore", "scoringSummary", "rubric", "complexity", "timeline",
          "skills", "techStackAssessment", "costEstimation", "risks", "mvp",
          "improvementPlan", "strengths", "majorConcerns", "recommendedNextSteps", "assumptions"
        ]
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);

        // Normalize score and rubric
        const r = parsed.rubric || {};
        const calculatedScore = Math.min(
          100,
          Math.max(
            10,
            (r.technicalComplexity?.score || 18) +
            (r.toolAvailability?.score || 16) +
            (r.scopeVsTimeline?.score || 15) +
            (r.skillLearningCurve?.score || 15) +
            (r.riskAndDependencies?.score || 11)
          )
        );

        const score = typeof parsed.overallScore === "number" ? Math.min(100, Math.max(10, parsed.overallScore)) : calculatedScore;
        const classification = classifyScore(score);

        const analysis: FeasibilityAnalysis = {
          projectId: String(project.id),
          projectTitle,
          overallScore: score,
          classification,
          scoringSummary: parsed.scoringSummary || `Comprehensive feasibility analysis for ${projectTitle}.`,
          rubric: parsed.rubric,
          complexity: {
            level: (["Beginner", "Intermediate", "Advanced"].includes(parsed.complexity?.level)
              ? parsed.complexity.level
              : complexity) as ComplexityLevel,
            reasons: parsed.complexity?.reasons || ["Full-stack architecture with relational database."],
          },
          timeline: {
            estimatedWeeks: parsed.timeline?.estimatedWeeks || (bp.roadmapWeeks?.length || 8),
            timelineSummary: parsed.timeline?.timelineSummary || `Estimated completion timeline: ${bp.roadmapWeeks?.length || 8} weeks.`,
            teamAssumptions: parsed.timeline?.teamAssumptions || "Assuming 1 solo student developer committing 10-15 hours per week.",
            potentialBottlenecks: parsed.timeline?.potentialBottlenecks || ["Authentication flows", "Database schema migrations"],
          },
          skills: parsed.skills || { prerequisites: [], toLearn: [], learningEffortSummary: "" },
          techStackAssessment: parsed.techStackAssessment || [],
          costEstimation: parsed.costEstimation || {
            estimatedMonthlyTotal: "$0/mo (Free Tier)",
            hasFreeTierCoverage: true,
            freeTierSummary: "Entire project can run completely within free developer quotas.",
            items: [],
          },
          risks: (parsed.risks || []).map((risk: any, idx: number) => ({
            id: risk.id || `risk-${idx + 1}`,
            title: risk.title,
            severity: risk.severity || "medium",
            description: risk.description,
            mitigation: risk.mitigation,
            mentorMitigationTask: risk.mentorMitigationTask,
          })),
          mvp: parsed.mvp,
          improvementPlan: (parsed.improvementPlan || []).map((act: any, idx: number) => ({
            id: act.id || `action-${idx + 1}`,
            title: act.title,
            impact: act.impact || "medium",
            effort: act.effort || "medium",
            description: act.description,
            actionStep: act.actionStep,
          })),
          strengths: parsed.strengths || [],
          majorConcerns: parsed.majorConcerns || [],
          recommendedNextSteps: parsed.recommendedNextSteps || [],
          assumptions: parsed.assumptions || ["Local development environment with modern Node.js and Git."],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          previousScore: options?.previousScore,
        };

        await saveProjectFeasibilityAnalysis(analysis, userId);
        return analysis;
      }
    } catch (genError) {
      console.warn("Gemini Feasibility generation failed, utilizing domain-adaptive fallback:", genError);
    }
  }

  // Adaptive domain-specific fallback generator
  const fallbackAnalysis = generateAdaptiveFallbackFeasibility(project, options?.previousScore);
  await saveProjectFeasibilityAnalysis(fallbackAnalysis, userId);
  return fallbackAnalysis;
}

/**
 * Creates domain-tailored feasibility analysis when offline or API key is absent
 */
function generateAdaptiveFallbackFeasibility(
  project: {
    id: string;
    title: string;
    domain?: string;
    complexity?: string;
    blueprint?: any;
  },
  previousScore?: number
): FeasibilityAnalysis {
  const bp = project.blueprint || {};
  const projectTitle = project.title || bp.projectTitle || "Academic Project";
  const domain = (bp.domain || project.domain || "Web Development").toLowerCase();
  const complexity = (project.complexity || bp.complexity || "Intermediate") as ComplexityLevel;
  const tech = bp.techStack || {};
  const primaryFe = tech.frontend?.[0] || "React / Next.js";
  const primaryBe = tech.backend?.[0] || "Node.js / Express";
  const primaryDb = tech.database?.[0] || "PostgreSQL";

  const isAi = domain.includes("ai") || domain.includes("machine") || domain.includes("ml");

  const rubric: RubricBreakdown = {
    technicalComplexity: {
      name: "Technical Complexity & Architecture",
      maxScore: 25,
      score: isAi ? 19 : 21,
      weight: "25%",
      rationale: isAi
        ? "AI/ML pipelines involve model training, tensor conversions, and vector stores requiring solid mathematical grounding."
        : "Standard client-server architectural boundaries with clear relational schema boundaries.",
    },
    toolAvailability: {
      name: "Tool & Library Ecosystem Availability",
      maxScore: 20,
      score: 18,
      weight: "20%",
      rationale: `Strong open-source ecosystem support with battle-tested libraries for ${primaryFe} and ${primaryBe}.`,
    },
    scopeVsTimeline: {
      name: "Scope Relative to Semester Timeline",
      maxScore: 20,
      score: 16,
      weight: "20%",
      rationale: "Project scope is achievable within an 8-12 week semester timeframe if core MVP features are prioritized.",
    },
    skillLearningCurve: {
      name: "Skill Requirements & Learning Curve",
      maxScore: 20,
      score: 15,
      weight: "20%",
      rationale: "Requires transitioning from fundamental scripting to production state management, async calls, and authentication.",
    },
    riskAndDependencies: {
      name: "Dependencies, Costs & Technical Risks",
      maxScore: 15,
      score: 12,
      weight: "15%",
      rationale: "Minimal paid external dependencies; database and backend can operate comfortably within free tiers.",
    },
  };

  const overallScore = rubric.technicalComplexity.score +
    rubric.toolAvailability.score +
    rubric.scopeVsTimeline.score +
    rubric.skillLearningCurve.score +
    rubric.riskAndDependencies.score;

  const classification = classifyScore(overallScore);

  const techStackAssessment: TechAssessment[] = [
    {
      technology: primaryFe,
      category: "frontend",
      isAppropriate: true,
      verdict: `Excellent developer velocity, strong component reusability, and comprehensive documentation for ${primaryFe}.`,
    },
    {
      technology: primaryBe,
      category: "backend",
      isAppropriate: true,
      verdict: `Proven runtime for RESTful APIs and asynchronous I/O; highly appropriate for student capstones.`,
    },
    {
      technology: primaryDb,
      category: "database",
      isAppropriate: true,
      verdict: `ACID compliance and relational integrity make ${primaryDb} an ideal fit for academic evaluation defense.`,
      alternative: primaryDb.toLowerCase().includes("mongo") ? "PostgreSQL with Supabase" : undefined,
      alternativeReason: primaryDb.toLowerCase().includes("mongo")
        ? "PostgreSQL provides stronger schema enforcement for academic project viva defense."
        : undefined,
    },
  ];

  const costItems: CostItem[] = [
    {
      service: "Frontend & API Hosting (Vercel / Render)",
      tier: "Free Tier Available",
      estimatedMonthlyCost: "$0/mo",
      details: "Hobby/Free tiers on Vercel or Render provide automated CI/CD and HTTPS without credit card requirements.",
      isOptional: false,
    },
    {
      service: "Database Hosting (Supabase / Neon)",
      tier: "Free Tier Available",
      estimatedMonthlyCost: "$0/mo",
      details: "500MB free PostgreSQL storage with instant REST/GraphQL APIs and auth.",
      isOptional: false,
    },
    {
      service: "AI Inference (Gemini Developer API)",
      tier: "Free Tier Available",
      estimatedMonthlyCost: "$0/mo",
      details: "Generous free rate limits (up to 15 RPM) suitable for academic prototypes and evaluation demonstrations.",
      isOptional: !isAi,
    },
  ];

  const risks: TechnicalRisk[] = [
    {
      id: "risk-1",
      title: "Scope Creep & Over-Engineering",
      severity: "medium",
      description: "Attempting too many auxiliary features (e.g. notifications, complex analytics) before finishing core user CRUD workflows.",
      mitigation: "Strictly adhere to the designated MVP scope before adding secondary UI widgets.",
      mentorMitigationTask: "Review Phase 1 & 2 tasks in AI Project Mentor before expanding specifications.",
    },
    {
      id: "risk-2",
      title: "State Synchronization & API Race Conditions",
      severity: "medium",
      description: "Concurrent client updates or unhandled promise rejections causing UI inconsistencies.",
      mitigation: "Implement centralized query caching, optimistic UI updates, and clear error banners.",
      mentorMitigationTask: "Check off frontend state management tasks in your Mentor Roadmap.",
    },
    {
      id: "risk-3",
      title: "CORS and Environment Secret Leakage",
      severity: "low",
      description: "Exposing secret API tokens on client builds or experiencing cross-origin blocking on local ports.",
      mitigation: "Use server-side route proxies and .env.local with strict Git ignores.",
    },
  ];

  const improvementPlan: ImprovementAction[] = [
    {
      id: "action-1",
      title: "Define Strict Database Schema Baseline",
      impact: "high",
      effort: "low",
      description: "Lock down table relations, foreign keys, and indexes before writing frontend consumer code.",
      actionStep: "Write migration scripts and generate database types using Supabase CLI.",
    },
    {
      id: "action-2",
      title: "Prune Non-Essential Features for Prototype Defense",
      impact: "high",
      effort: "low",
      description: "Focus 80% of development effort on the central value loop and core database operations.",
      actionStep: "Move advanced reporting and complex customization into Phase 5 post-MVP wishlist.",
    },
    {
      id: "action-3",
      title: "Establish Automated Deployment from Week 2",
      impact: "medium",
      effort: "low",
      description: "Avoid demo-day panics by deploying your scaffolding directly to a live staging URL.",
      actionStep: "Link your GitHub repository to Vercel or Render with continuous preview builds.",
    },
  ];

  return {
    projectId: String(project.id),
    projectTitle,
    overallScore,
    classification,
    scoringSummary: `Systematic feasibility analysis for ${projectTitle} (${complexity} tier). Overall score is ${overallScore}/100, placing this project in the "${classification}" category.`,
    rubric,
    complexity: {
      level: complexity,
      reasons: [
        `Architecture leverages ${primaryFe} and ${primaryBe} with distinct client-server responsibilities.`,
        `Data persistence managed via ${primaryDb} with structured relations.`,
        isAi ? "Includes algorithmic machine learning pipeline with tensor transformations." : "Standard full-stack authenticated web service.",
      ],
    },
    timeline: {
      estimatedWeeks: bp.roadmapWeeks?.length || 8,
      timelineSummary: `Estimated development timeline is ${bp.roadmapWeeks?.length || 8} weeks based on standard academic milestones.`,
      teamAssumptions: "Assuming 1 solo student developer committing ~12 hours weekly, or a 2-person pair team.",
      potentialBottlenecks: [
        "Setting up authenticated route guards",
        "Configuring external API rate limit handling",
        "Ensuring mobile responsive layout consistency",
      ],
    },
    skills: {
      prerequisites: [
        {
          skill: "Git & Version Control",
          category: "prerequisite",
          importance: "high",
          reason: "Essential for feature branching, collaboration, and deployment automation.",
          mentorPhaseSuggestion: "Phase 1: Project Scaffolding",
        },
        {
          skill: "TypeScript / JavaScript ES6+",
          category: "prerequisite",
          importance: "high",
          reason: "Core programming language for modern frontend and backend development.",
        },
        {
          skill: "Basic SQL & Relational Models",
          category: "prerequisite",
          importance: "medium",
          reason: "Needed to design table schemas and avoid data anomalies.",
          mentorPhaseSuggestion: "Phase 2: Database Schema",
        },
      ],
      toLearn: [
        {
          skill: "Asynchronous API & Hook Architecture",
          category: "to_learn",
          importance: "high",
          reason: "Handling loading states, mutations, and backend error responses gracefully in the UI.",
          mentorPhaseSuggestion: "Phase 3: Core API Integration",
        },
        {
          skill: "Authentication Tokens & RLS Policies",
          category: "to_learn",
          importance: "medium",
          reason: "Ensuring private user data cannot be accessed by unauthorized clients.",
        },
      ],
      learningEffortSummary: "Moderate learning curve. Students with basic programming foundations will require approximately 15-20 hours of focused study on asynchronous data fetching and relational state.",
    },
    techStackAssessment,
    costEstimation: {
      estimatedMonthlyTotal: "$0/mo (100% Free Tier Viable)",
      hasFreeTierCoverage: true,
      freeTierSummary: "The entire application architecture can be built, tested, and deployed for academic presentation using free developer plans without recurring infrastructure costs.",
      items: costItems,
    },
    risks,
    mvp: {
      coreFeatures: [
        "User authentication and profile management",
        "Primary entity CRUD workflow (Create, Read, Update, Delete)",
        "Persistent database storage with relational constraints",
        "Responsive, high-contrast dashboard interface",
      ],
      omittedFeatures: [
        "Real-time push notifications",
        "Complex payment gateway webhooks (unless central to concept)",
        "Multi-tenant team permission matrices",
        "Custom analytics export engines",
      ],
      justification: "Focusing strictly on core data flow ensures a solid working prototype for evaluation day while preventing unfinished features from degrading presentation score.",
      estimatedTimeline: "Est. 3 - 4 weeks for functional MVP",
    },
    improvementPlan,
    strengths: [
      "Well-defined technology stack with strong open-source community documentation",
      "No mandatory paid enterprise licenses or credit card requirements",
      "Modular separation of concerns allowing incremental testing and defense",
    ],
    majorConcerns: [
      "Risk of over-engineering secondary features before validating primary user journey",
      "Handling database errors and loading spinners cleanly in UI",
    ],
    recommendedNextSteps: [
      "Review the AI Project Mentor roadmap to verify prerequisite development environment tools.",
      "Build the minimal viable schema in Supabase before coding visual frontend pages.",
      "Deploy initial scaffolding to a live hosting URL to guarantee examiner accessibility.",
    ],
    assumptions: [
      "Developer has access to a modern computer running Node.js 18+ and Git.",
      "College evaluators have internet access to view the live deployment during defense.",
      "Development follows an estimated 10-15 hour weekly commitment over the semester.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    previousScore,
  };
}
