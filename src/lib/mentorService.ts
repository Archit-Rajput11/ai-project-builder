import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "./supabase";
import { MentorRoadmap, MentorPhase, MentorTask, TaskProgressEntry, LearningResource } from "@/types/mentor";

// Tech stack documentation repository for verified, real learning resources
const TECH_RESOURCES: Record<string, LearningResource> = {
  nextjs: { title: "Next.js Documentation", url: "https://nextjs.org/docs", type: "documentation", description: "Official App Router guides, Server Components, and API handlers" },
  react: { title: "React Official Docs", url: "https://react.dev/learn", type: "documentation", description: "Modern React state hooks, effect management, and component architecture" },
  typescript: { title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", type: "documentation", description: "Type safety, interfaces, generics, and strict configurations" },
  tailwind: { title: "Tailwind CSS Docs", url: "https://tailwindcss.com/docs", type: "documentation", description: "Utility-first CSS styling, dark mode variants, and responsive design" },
  nodejs: { title: "Node.js Developer Guides", url: "https://nodejs.org/en/docs/guides", type: "documentation", description: "Asynchronous runtime, event loop, and modular architecture" },
  express: { title: "Express.js Routing Guide", url: "https://expressjs.com/en/guide/routing.html", type: "documentation", description: "RESTful endpoints, middleware chains, and error handlers" },
  python: { title: "Python Standard Library Docs", url: "https://docs.python.org/3/", type: "documentation", description: "Core data structures, modules, and virtual environments" },
  fastapi: { title: "FastAPI Official Tutorial", url: "https://fastapi.tiangolo.com/tutorial/", type: "documentation", description: "Pydantic validation, async endpoints, and auto-generated Swagger UI" },
  pytorch: { title: "PyTorch Learning Tutorials", url: "https://pytorch.org/tutorials/", type: "documentation", description: "Tensors, autograd, custom neural network layers, and training loops" },
  tensorflow: { title: "TensorFlow Guide", url: "https://www.tensorflow.org/guide", type: "documentation", description: "Model definitions, loss functions, and inference pipelines" },
  postgresql: { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/", type: "documentation", description: "Relational queries, ACID transactions, indexes, and constraints" },
  supabase: { title: "Supabase Architecture Guide", url: "https://supabase.com/docs", type: "documentation", description: "Database tables, Row Level Security (RLS), and authentication tokens" },
  mongodb: { title: "MongoDB Manual", url: "https://www.mongodb.com/docs/manual/", type: "documentation", description: "Document schemas, Mongoose models, and aggregation pipelines" },
  prisma: { title: "Prisma ORM Getting Started", url: "https://www.prisma.io/docs/getting-started", type: "documentation", description: "Schema modeling, migrations, and type-safe database queries" },
  git: { title: "Pro Git Handbook", url: "https://git-scm.com/book/en/v2", type: "guide", description: "Branching strategies, commit conventions, and repository structure" },
  jest: { title: "Jest Testing Framework", url: "https://jestjs.io/docs/getting-started", type: "documentation", description: "Unit tests, mocking, and assertion best practices" },
  docker: { title: "Docker Getting Started", url: "https://docs.docker.com/get-started/", type: "documentation", description: "Containerization, Dockerfile configuration, and port mappings" },
  razorpay: { title: "Razorpay Standard Checkout Docs", url: "https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/", type: "documentation", description: "Order creation, signature verification, and webhook handling" },
};

function resolveTechResources(techArray: string[] = []): LearningResource[] {
  const resources: LearningResource[] = [];
  const lowerStrings = techArray.map((t) => t.toLowerCase());

  for (const [key, resource] of Object.entries(TECH_RESOURCES)) {
    if (lowerStrings.some((t) => t.includes(key))) {
      resources.push(resource);
    }
  }

  // Ensure Git and general testing resources are present if list is small
  if (!resources.some((r) => r.title.includes("Git"))) {
    resources.push(TECH_RESOURCES.git);
  }
  return resources.slice(0, 3);
}

/**
 * Fetches an existing mentor roadmap from Supabase
 */
export async function getProjectMentorRoadmap(
  projectId: string,
  userId: string
): Promise<MentorRoadmap | null> {
  if (!projectId || !userId) return null;

  try {
    // 1. Try dedicated table first
    const { data: tableData, error: tableErr } = await supabaseAdmin
      .from("project_mentor_roadmaps")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!tableErr && tableData) {
      return {
        id: tableData.id,
        projectId: tableData.project_id,
        projectTitle: tableData.project_title,
        summary: tableData.summary || "",
        phases: tableData.phases || [],
        taskProgress: tableData.task_progress || {},
        createdAt: tableData.created_at,
        updatedAt: tableData.updated_at,
      };
    }

    // 2. Fallback to projects table blueprint_data.mentor_roadmap
    const { data: projectData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, blueprint_data, user_id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!projErr && projectData?.blueprint_data?.mentor_roadmap) {
      return projectData.blueprint_data.mentor_roadmap as MentorRoadmap;
    }

    return null;
  } catch (err) {
    console.error("Error reading mentor roadmap from Supabase:", err);
    return null;
  }
}

/**
 * Persists a mentor roadmap to Supabase (both dedicated table and projects table)
 */
export async function saveProjectMentorRoadmap(
  roadmap: MentorRoadmap,
  userId: string
): Promise<boolean> {
  if (!roadmap.projectId || !userId) return false;

  const now = new Date().toISOString();
  roadmap.updatedAt = now;
  if (!roadmap.createdAt) roadmap.createdAt = now;

  let savedSuccessfully = false;

  // 1. Attempt writing to project_mentor_roadmaps table
  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("project_mentor_roadmaps")
      .upsert(
        {
          project_id: String(roadmap.projectId),
          user_id: userId,
          project_title: roadmap.projectTitle || "Project Roadmap",
          summary: roadmap.summary || "",
          phases: roadmap.phases || [],
          task_progress: roadmap.taskProgress || {},
          updated_at: now,
        },
        { onConflict: "project_id,user_id" }
      );

    if (!upsertErr) {
      savedSuccessfully = true;
    }
  } catch (tableErr) {
    // Dedicated table might not be migrated yet; fallback handles it
  }

  // 2. Also persist inside projects table (blueprint_data.mentor_roadmap)
  try {
    const { data: existingProject } = await supabaseAdmin
      .from("projects")
      .select("blueprint_data")
      .eq("id", roadmap.projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProject) {
      const updatedBlueprint = {
        ...(existingProject.blueprint_data || {}),
        mentor_roadmap: roadmap,
      };

      const { error: projUpdateErr } = await supabaseAdmin
        .from("projects")
        .update({ blueprint_data: updatedBlueprint })
        .eq("id", roadmap.projectId)
        .eq("user_id", userId);

      if (!projUpdateErr) {
        savedSuccessfully = true;
      }
    }
  } catch (projErr) {
    console.error("Error saving mentor roadmap to projects table:", projErr);
  }

  return savedSuccessfully;
}

/**
 * Updates status or notes for a single task in the roadmap
 */
export async function updateMentorTaskProgress(
  projectId: string,
  userId: string,
  taskId: string,
  progress: TaskProgressEntry
): Promise<MentorRoadmap | null> {
  const currentRoadmap = await getProjectMentorRoadmap(projectId, userId);
  if (!currentRoadmap) return null;

  const updatedProgress = {
    ...(currentRoadmap.taskProgress || {}),
    [taskId]: {
      ...progress,
      updatedAt: new Date().toISOString(),
    },
  };

  currentRoadmap.taskProgress = updatedProgress;
  await saveProjectMentorRoadmap(currentRoadmap, userId);
  return currentRoadmap;
}

/**
 * Generates an adaptive, highly-tailored roadmap using Gemini 2.5 Flash,
 * with resilient fallback to an intelligent domain-specific generator.
 */
export async function generateMentorRoadmap(
  project: {
    id: string;
    title: string;
    domain?: string;
    complexity?: string;
    blueprint?: any;
  },
  userId: string,
  refineInstructions?: string,
  existingProgress?: Record<string, TaskProgressEntry>
): Promise<MentorRoadmap> {
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

      const systemInstruction = `You are an elite, pedagogical AI Project Mentor for engineering students.
Your job is to generate a comprehensive, personalized, step-by-step development roadmap for the student's project.

GUIDELINES:
1. Adapt the phases specifically to the project's domain (${domain}) and stack (${allTechs.join(", ")}).
2. Create 5 to 6 practical phases with 2 to 4 actionable tasks per phase.
3. Every task must explain:
   - What the task accomplishes (clear, beginner-friendly).
   - Why it matters for their overall project architecture.
   - What the user should learn before starting (specific concepts, not generic advice).
   - Concrete prerequisites (e.g. tools installed, previous task completed).
   - Estimated effort, clearly labelled as an estimate (e.g. "Est. 1 - 2 hours", "Est. 3 - 4 hours").
   - Recommended learning resources with descriptive titles and URLs when applicable.
4. Keep technical explanations clear and encouraging. Do not assume prior production expertise.
5. Never state that code has been executed or verified unless it has.
${refineInstructions ? `6. Incorporate this specific refinement requested by the student: "${refineInstructions}"` : ""}`;

      const userPrompt = `Generate the complete AI Project Mentor roadmap for:
Project Title: ${projectTitle}
Domain: ${domain}
Complexity: ${complexity}
Project Description: ${bp.description || projectTitle}
Frontend: ${(techStack.frontend || []).join(", ") || "Standard"}
Backend: ${(techStack.backend || []).join(", ") || "Standard"}
Database: ${(techStack.database || []).join(", ") || "Standard"}
Tools & Hosting: ${(techStack.hostingAndTools || []).join(", ") || "Standard"}
Existing Weekly Focus Goals: ${(bp.roadmapWeeks || []).map((w: any) => `Week ${w.weekNumber}: ${w.focusGoal}`).join("; ")}
`;

      const roadmapSchema = {
        type: "OBJECT",
        properties: {
          projectTitle: { type: "STRING" },
          summary: { type: "STRING" },
          phases: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                phaseNumber: { type: "INTEGER" },
                title: { type: "STRING" },
                description: { type: "STRING" },
                tasks: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      id: { type: "STRING" },
                      title: { type: "STRING" },
                      explanation: { type: "STRING" },
                      whyItMatters: { type: "STRING" },
                      whatToLearn: { type: "STRING" },
                      prerequisites: { type: "ARRAY", items: { type: "STRING" } },
                      estimatedEffort: { type: "STRING" },
                      learningResources: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            title: { type: "STRING" },
                            url: { type: "STRING" },
                            type: { type: "STRING" },
                            description: { type: "STRING" },
                          },
                          required: ["title"],
                        },
                      },
                    },
                    required: ["id", "title", "explanation", "whyItMatters", "whatToLearn", "prerequisites", "estimatedEffort"],
                  },
                },
              },
              required: ["id", "phaseNumber", "title", "description", "tasks"],
            },
          },
        },
        required: ["projectTitle", "summary", "phases"],
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: roadmapSchema as any,
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          const newRoadmap: MentorRoadmap = {
            projectId: String(project.id),
            projectTitle: parsed.projectTitle || projectTitle,
            summary: parsed.summary || `Personalized implementation roadmap for ${projectTitle}.`,
            phases: parsed.phases.map((p: any, pIdx: number) => ({
              id: p.id || `phase-${pIdx + 1}`,
              phaseNumber: p.phaseNumber || pIdx + 1,
              title: p.title,
              description: p.description,
              tasks: (p.tasks || []).map((t: any, tIdx: number) => ({
                id: t.id || `task-${pIdx + 1}-${tIdx + 1}`,
                title: t.title,
                explanation: t.explanation,
                whyItMatters: t.whyItMatters,
                whatToLearn: t.whatToLearn,
                prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
                estimatedEffort: t.estimatedEffort.startsWith("Est.") ? t.estimatedEffort : `Est. ${t.estimatedEffort}`,
                learningResources: Array.isArray(t.learningResources) && t.learningResources.length > 0
                  ? t.learningResources
                  : resolveTechResources(allTechs),
              })),
            })),
            taskProgress: existingProgress || {},
          };

          await saveProjectMentorRoadmap(newRoadmap, userId);
          return newRoadmap;
        }
      }
    } catch (genError) {
      console.warn("Gemini generation failed or throttled, utilizing domain-adaptive generator:", genError);
    }
  }

  // Adaptive domain-specific fallback generator
  const fallbackRoadmap = generateAdaptiveFallbackRoadmap(project, existingProgress);
  await saveProjectMentorRoadmap(fallbackRoadmap, userId);
  return fallbackRoadmap;
}

/**
 * Creates a rich, domain-tailored roadmap when offline or API key is absent
 */
function generateAdaptiveFallbackRoadmap(
  project: { id: string; title: string; domain?: string; complexity?: string; blueprint?: any },
  existingProgress?: Record<string, TaskProgressEntry>
): MentorRoadmap {
  const bp = project.blueprint || {};
  const projectTitle = project.title || bp.projectTitle || "Academic Project";
  const domain = (bp.domain || project.domain || "Web Development").toLowerCase();
  const complexity = project.complexity || bp.complexity || "Intermediate";
  const tech = bp.techStack || {};
  const primaryFrontend = tech.frontend?.[0] || "React / Next.js";
  const primaryBackend = tech.backend?.[0] || "Node.js / Express";
  const primaryDatabase = tech.database?.[0] || "PostgreSQL";
  const allTechs = [...(tech.frontend || []), ...(tech.backend || []), ...(tech.database || [])];

  const defaultResources = resolveTechResources(allTechs);

  let phases: MentorPhase[] = [];

  if (domain.includes("ai") || domain.includes("machine") || domain.includes("ml")) {
    phases = [
      {
        id: "phase-1",
        phaseNumber: 1,
        title: "Phase 1: Problem Definition & Data Pipeline",
        description: "Formulate the machine learning hypothesis, source datasets, and establish data ingestion benchmarks.",
        tasks: [
          {
            id: "task-1-1",
            title: "Define Target Metrics & Ingest Raw Dataset",
            explanation: "Collect and validate clean data distributions (CSV, images, or audio) and determine validation metrics like F1-Score or RMSE.",
            whyItMatters: "Garbage in equals garbage out; a sound dataset baseline avoids data leakage and biased models.",
            whatToLearn: "Pandas dataframe cleaning, missing value imputations, and train/test stratified split ratios.",
            prerequisites: ["Python 3.10+ installed", "Kaggle/OpenML data access"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-1-2",
            title: "Exploratory Data Analysis (EDA) & Feature Engineering",
            explanation: "Generate correlation matrices, detect outliers, and engineer domain-specific input vectors.",
            whyItMatters: "Visualizing anomalies early ensures your model learns real predictive patterns rather than dataset noise.",
            whatToLearn: "Matplotlib/Seaborn visualization, feature normalization, and vectorization.",
            prerequisites: ["Task 1.1 Complete"],
            estimatedEffort: "Est. 3 - 4 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-2",
        phaseNumber: 2,
        title: "Phase 2: Baseline Model Architecture & Training",
        description: "Implement initial baseline algorithms before escalating to deep networks or transfer learning models.",
        tasks: [
          {
            id: "task-2-1",
            title: "Implement Benchmark Baseline Model",
            explanation: "Train a simple deterministic model (e.g. Logistic Regression or Random Forest) as a benchmark yardstick.",
            whyItMatters: "College evaluators require a baseline comparison to prove your complex model delivers measurable gains.",
            whatToLearn: "Scikit-Learn estimators, cross-validation scoring, and confusion matrix interpretation.",
            prerequisites: ["Cleaned training split from Phase 1"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-2-2",
            title: "Build & Train Deep Neural Architecture",
            explanation: "Construct your primary model architecture using PyTorch or TensorFlow with early stopping criteria.",
            whyItMatters: "The core algorithmic innovation of your engineering dissertation rests on this model's predictive ability.",
            whatToLearn: "Loss functions (Cross-Entropy, MSE), Adam optimizer learning rate scheduling, and tensor batching.",
            prerequisites: ["Baseline performance benchmarked"],
            estimatedEffort: "Est. 4 - 6 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-3",
        phaseNumber: 3,
        title: "Phase 3: Model Evaluation & Hyperparameter Tuning",
        description: "Rigorously validate model generalization on unseen test data and fine-tune hyperparameters.",
        tasks: [
          {
            id: "task-3-1",
            title: "Cross-Validation & Error Analysis",
            explanation: "Examine misclassified instances to understand boundary conditions and false-positive tendencies.",
            whyItMatters: "Understanding failure modes allows you to defend your viva questions with scientific confidence.",
            whatToLearn: "Precision-Recall trade-offs, ROC-AUC curves, and error categorization.",
            prerequisites: ["Trained model weights checkpointed"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-4",
        phaseNumber: 4,
        title: "Phase 4: Inference API & Demonstration Web UI",
        description: "Wrap model weights into a live REST/WebSocket microservice accessible via an interactive dashboard.",
        tasks: [
          {
            id: "task-4-1",
            title: "FastAPI / Flask Model Serving Endpoint",
            explanation: "Construct a POST endpoint that parses input JSON, executes inference, and returns formatted confidence probabilities.",
            whyItMatters: "Academic evaluators want to see models working live in a browser rather than just inside static Jupyter notebooks.",
            whatToLearn: "Async request parsing, model serialization (ONNX/Pickle), and latency optimization.",
            prerequisites: ["Trained model artifact (.pt / .h5)"],
            estimatedEffort: "Est. 3 - 4 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-4-2",
            title: "Client Interface & Prediction Visualizer",
            explanation: "Build a frontend form where users can upload test inputs and visualize predictions in real-time.",
            whyItMatters: "Provides the tangible demonstration artifact for your final project presentation day.",
            whatToLearn: "Asynchronous fetch state, chart visualization, and loading skeleton states.",
            prerequisites: ["Inference API running locally"],
            estimatedEffort: "Est. 3 - 5 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-5",
        phaseNumber: 5,
        title: "Phase 5: Academic Report, Viva Preparation & Deployment",
        description: "Format the methodology write-up, export model metrics, and containerize the application.",
        tasks: [
          {
            id: "task-5-1",
            title: "Compile Methodology & Comparative Tables",
            explanation: "Summarize dataset stats, training loss plots, and baseline vs final model accuracy comparisons.",
            whyItMatters: "Ensures full IEEE or university format compliance for your dissertation chapters.",
            whatToLearn: "Technical documentation drafting and academic chart plotting.",
            prerequisites: ["Validation metrics logged"],
            estimatedEffort: "Est. 3 - 4 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-5-2",
            title: "Dockerize Service & Prepare Project Demo Script",
            explanation: "Package backend and frontend dependencies into a clean container and rehearse the 5-minute project defense script.",
            whyItMatters: "Eliminates 'it worked on my machine' panic during the examiner demonstration.",
            whatToLearn: "Dockerfile commands, environment variable protection, and viva presentation flow.",
            prerequisites: ["Working local prototype"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
        ],
      },
    ];
  } else {
    // Default Full-Stack / Web / Mobile project roadmap
    phases = [
      {
        id: "phase-1",
        phaseNumber: 1,
        title: "Phase 1: Project Scaffolding & Environment Setup",
        description: `Initialize the ${primaryFrontend} and ${primaryBackend} workspaces with linting, version control, and core packages.`,
        tasks: [
          {
            id: "task-1-1",
            title: "Initialize Git Repository & Directory Architecture",
            explanation: `Create the application repository, establish .gitignore rules, and configure the project directory structure following standard conventions.`,
            whyItMatters: "Clean separation of concerns from day one prevents monolithic spaghetti code and merge headaches.",
            whatToLearn: "Git branching conventions, environment file (.env.example) setup, and modular folder patterns.",
            prerequisites: ["Node.js and Git installed locally"],
            estimatedEffort: "Est. 1 - 2 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-1-2",
            title: `Configure ${primaryFrontend} & Styling Framework`,
            explanation: `Set up the client application with styling configurations, font loaders, and responsive layout shells.`,
            whyItMatters: "Gives you a visual canvas immediately so you can verify routing and theme switching without layout breakage.",
            whatToLearn: "Component hierarchy, CSS utility tokens, and global layout wrappers.",
            prerequisites: ["Task 1.1 Complete"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-2",
        phaseNumber: 2,
        title: "Phase 2: Database Modeling & Server Architecture",
        description: `Design relational entities in ${primaryDatabase}, establish migrations, and wire secure connection pooling.`,
        tasks: [
          {
            id: "task-2-1",
            title: `Design Entity Relational Schema in ${primaryDatabase}`,
            explanation: "Construct database tables with primary keys, foreign key constraints, indexes, and automated timestamps.",
            whyItMatters: "Your database structure dictates how easily features can be queried and scaled later.",
            whatToLearn: "Relational normalization (3NF), one-to-many relationships, and cascade deletion rules.",
            prerequisites: ["Database instance provisioned (e.g. Supabase or local PostgreSQL)"],
            estimatedEffort: "Est. 2 - 4 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-2-2",
            title: "Implement Authentication & Session Guards",
            explanation: "Wire user sign-in/sign-up flows and verify that private routes reject unauthenticated requests.",
            whyItMatters: "Protects student user data and fulfills security audit criteria in your academic project evaluation.",
            whatToLearn: "JWT tokens vs session cookies, password hashing, and server middleware interceptors.",
            prerequisites: ["Database schema created"],
            estimatedEffort: "Est. 3 - 4 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-3",
        phaseNumber: 3,
        title: "Phase 3: Core Business Logic & CRUD Implementations",
        description: `Develop the primary functional modules that define ${projectTitle}.`,
        tasks: [
          {
            id: "task-3-1",
            title: "Build RESTful API Endpoints & Input Validation",
            explanation: "Implement server handlers to create, read, update, and delete the project's core domain models with strict payload validation.",
            whyItMatters: "Provides the resilient engine powering all interactive features in your client application.",
            whatToLearn: "HTTP response codes (200, 201, 400, 401, 403, 500), input sanitization, and error handling.",
            prerequisites: ["Authentication guards active"],
            estimatedEffort: "Est. 4 - 6 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-3-2",
            title: "Connect Frontend State to Backend Services",
            explanation: "Bind frontend form submissions and data tables to live backend API routes with optimistic updates and loading states.",
            whyItMatters: "Transforms static UI templates into a dynamic, data-driven application.",
            whatToLearn: "React asynchronous state hooks, fetch error catch blocks, and user feedback toast alerts.",
            prerequisites: ["API endpoints tested via Postman / curl"],
            estimatedEffort: "Est. 4 - 5 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-4",
        phaseNumber: 4,
        title: "Phase 4: Advanced Features, Polish & UX Hardening",
        description: "Add filtering, analytics, performance enhancements, and edge-case error prevention.",
        tasks: [
          {
            id: "task-4-1",
            title: "Search, Filtering & Pagination Controls",
            explanation: "Implement client-side or server-side query filters to allow smooth navigation through large datasets.",
            whyItMatters: "Examiners will test how your app behaves when loaded with real user data or irregular search queries.",
            whatToLearn: "Query string parameters (URLSearchParams), debounce algorithms, and SQL LIMIT/OFFSET.",
            prerequisites: ["Core CRUD functioning"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-4-2",
            title: "Zero-State Screens, Form Validation & Responsive Audit",
            explanation: "Ensure that empty states, mobile screens, and network error dialogs look professional and intentional.",
            whyItMatters: "First impressions on the evaluator's tablet or projector directly impact your interface design grades.",
            whatToLearn: "Mobile breakpoints, visual hierarchy, and accessible form labels.",
            prerequisites: ["Core features wired"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
        ],
      },
      {
        id: "phase-5",
        phaseNumber: 5,
        title: "Phase 5: Quality Assurance, Documentation & Deployment",
        description: "Execute regression tests, deploy to cloud hosting, and format academic viva defense materials.",
        tasks: [
          {
            id: "task-5-1",
            title: "End-to-End Workflow Verification & Bug Fixes",
            explanation: "Walk through the full end-to-end user story from registration to final output export, resolving console warnings and bugs.",
            whyItMatters: "Prevents embarrassing runtime errors during your live thesis evaluation.",
            whatToLearn: "Browser DevTools performance profiling, network payload inspection, and regression testing.",
            prerequisites: ["All functional modules completed"],
            estimatedEffort: "Est. 3 - 4 hours",
            learningResources: defaultResources,
          },
          {
            id: "task-5-2",
            title: "Cloud Production Deployment (Vercel / Supabase)",
            explanation: "Deploy web assets, configure production environment secrets, and ensure database connectivity over HTTPS.",
            whyItMatters: "Having a live, public URL that examiners can open on their own phones immediately sets your project apart.",
            whatToLearn: "Production builds, environment variable management, and DNS records.",
            prerequisites: ["All tests passing in local production build"],
            estimatedEffort: "Est. 2 - 3 hours",
            learningResources: defaultResources,
          },
        ],
      },
    ];
  }

  return {
    projectId: String(project.id),
    projectTitle,
    summary: `Personalized, phase-by-phase implementation roadmap designed specifically for ${projectTitle} (${complexity} tier).`,
    phases,
    taskProgress: existingProgress || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
