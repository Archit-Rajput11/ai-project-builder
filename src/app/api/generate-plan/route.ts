import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../../auth";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  let domain = "Web Development";
  let complexity = "Intermediate";
  let skillLevel = "Competent";
  let customKeywords = "";

  try {
    // 1. Fetch selections and quota count from request body
    const body = await req.json().catch(() => ({}));
    let clientGeneratedCount = 0;
    if (body) {
      if (body.domain) domain = body.domain;
      if (body.complexity) complexity = body.complexity;
      if (body.skillLevel) skillLevel = body.skillLevel;
      if (body.customKeywords) customKeywords = body.customKeywords;
      if (body.generatedCount !== undefined) {
        clientGeneratedCount = typeof body.generatedCount === "string" 
          ? parseInt(body.generatedCount, 10) 
          : Number(body.generatedCount);
      }
    }

    if (!domain || !complexity || !skillLevel) {
      return NextResponse.json(
        { error: "Missing required selection parameters: domain, complexity, and skillLevel" },
        { status: 400 }
      );
    }

    // 2. Fetch logged-in user session and bearer token
    const session = await auth();
    let userEmail = session?.user?.email;

    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-supabase-service-role"));

    const dbClient = hasServiceRoleKey
      ? supabaseAdmin
      : createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        });

    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    let isPremiumUser = false;

    // Helper function to check if DB user object indicates active Pro status
    const checkDbUserIsPro = (dbUser: any): boolean => {
      if (!dbUser) return false;
      const isPro = Boolean(dbUser.is_pro || dbUser.is_premium);
      if (!isPro) return false;
      const expiryString = dbUser.current_period_end || dbUser.expires_at || dbUser.premium_expires_at;
      if (!expiryString) return true; // Active Pro if is_pro is true and no explicit expiry date is set
      return new Date(expiryString).getTime() > Date.now();
    };

    // 3. Verify user profile status from Supabase Auth & Database
    if (token && isSupabaseConfigured) {
      try {
        const { data: { user }, error: supError } = await dbClient.auth.getUser(token);
        if (user && !supError) {
          if (!userEmail) userEmail = user.email;

          // Fetch user profile status from the Supabase users table using user ID or email
          const { data: dbUsers } = await dbClient
            .from("users")
            .select("is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
            .or(`id.eq.${user.id},email.eq.${user.email}`);

          if (dbUsers && dbUsers.some(checkDbUserIsPro)) {
            isPremiumUser = true;
            console.log(`Supabase token premium validation succeeded for user: ${user.email}`);
          }
        }
      } catch (supErr) {
        console.error("Supabase token user verification failed:", supErr);
      }
    }

    // Fallback: Fetch user profile status from Supabase users table using email
    if (!isPremiumUser && userEmail && isSupabaseConfigured) {
      try {
        const { data: dbUsers } = await supabaseAdmin
          .from("users")
          .select("is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
          .eq("email", userEmail);

        if (dbUsers && dbUsers.some(checkDbUserIsPro)) {
          isPremiumUser = true;
          console.log(`Database email premium validation succeeded for: ${userEmail}`);
        }
      } catch (dbErr) {
        console.error("Database email premium check failed:", dbErr);
      }
    }

    // Fallback: Verify custom JWT token if passed
    if (!isPremiumUser && token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        if (decoded && decoded.isPro === true) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (!decoded.exp || currentTime < decoded.exp) {
            isPremiumUser = true;
          }
        }
      } catch (err: any) {
        console.error("JWT verification failed:", err.message);
      }
    }

    // 4. Daily Generation Limit Check:
    // If the user is a Premium/Pro member, completely bypass the 1-project-per-day restriction.
    // If they are a free tier user and have reached the limit (generatedCount >= 1), block generation.
    if (!isPremiumUser && clientGeneratedCount >= 1) {
      return NextResponse.json(
        { error: "Daily project generation limit reached. Please upgrade to Pro for unlimited project generations." },
        { status: 403 }
      );
    }

    const saveProjectToDb = async (planData: any) => {
      const isSupabaseConfigured = 
        (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

      if (userEmail && isSupabaseConfigured) {
        try {
          const { error: dbError } = await supabaseAdmin
            .from("projects")
            .insert({
              user_email: userEmail,
              title: planData.projectTitle || "Untitled Project",
              domain: domain,
              complexity: complexity,
              skill_level: skillLevel,
              custom_keywords: customKeywords || null,
              blueprint: planData,
            });

          if (dbError) {
            console.error("Supabase project history storage error:", dbError.message);
          } else {
            console.log(`Successfully saved blueprint history for ${userEmail}`);
          }
        } catch (dbErr) {
          console.error("Database storage catch block error:", dbErr);
        }
      }
    };

    // 4. Extract GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("GEMINI_API_KEY is not configured. Returning local mock project plan for demonstration.");
      const mockPlan = generateMockPlan(domain, complexity, skillLevel, customKeywords);
      await saveProjectToDb(mockPlan);
      return NextResponse.json(mockPlan);
    }

    // 4. Initialize Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey });

    // 5. Structure prompt rules
    const systemPrompt = `You are a Senior Engineering Professor who specializes in designing and structuring unique, high-quality college project blueprints.
Your task is to generate a comprehensive, production-ready college project plan for the student based on their input domain, complexity, and skill level.
Incorporate the user's custom keywords/focus into the project theme if provided. Ensure every generated project title and repository outline is distinctly tailored and highly unique.
For each week in the implementation roadmap, you must also recommend a matching AI tool (e.g. v0 by Vercel, Bolt.new, Cursor, Claude 3.7 Sonnet), justify the tool selection, and compile a detailed, copy-pasteable system master prompt the student can plug directly into that AI to generate that week's code.
You must output a single JSON response that strictly adheres to the requested JSON schema layout. Do not wrap the JSON output in markdown codeblocks (such as \`\`\`json) or include any extra out-of-band conversational text.`;

    const userPrompt = `Generate a detailed project plan with the following requirements:
- Domain: ${domain}
- Complexity: ${complexity}
- Student Skill Level: ${skillLevel}
${customKeywords ? `- Focus/Keywords: ${customKeywords}` : ""}`;

    // 6. Schema specification for Structured Output
    const projectSchema = {
      type: "OBJECT",
      properties: {
        projectTitle: { type: "STRING" },
        description: { type: "STRING" },
        difficultyRating: { type: "STRING" },
        techStack: {
          type: "OBJECT",
          properties: {
            frontend: { type: "ARRAY", items: { type: "STRING" } },
            backend: { type: "ARRAY", items: { type: "STRING" } },
            database: { type: "ARRAY", items: { type: "STRING" } },
            hostingAndTools: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["frontend", "backend", "database", "hostingAndTools"],
        },
        roadmapWeeks: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              weekNumber: { type: "INTEGER" },
              focusGoal: { type: "STRING" },
              tasks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    title: { type: "STRING" },
                    week: { type: "INTEGER" },
                    description: { type: "STRING" },
                  },
                  required: ["id", "title", "week", "description"],
                },
              },
              aiToolGuide: {
                type: "OBJECT",
                properties: {
                  recommendedAiTool: { type: "STRING" },
                  toolJustification: { type: "STRING" },
                  masterPrompt: { type: "STRING" },
                },
                required: ["recommendedAiTool", "toolJustification", "masterPrompt"],
              },
            },
            required: ["weekNumber", "focusGoal", "tasks", "aiToolGuide"],
          },
        },
        githubStructure: { type: "STRING" },
        reportOutline: {
          type: "OBJECT",
          properties: {
            abstract: { type: "STRING" },
            chapters: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  chapterNumber: { type: "INTEGER" },
                  title: { type: "STRING" },
                  subsections: { type: "ARRAY", items: { type: "STRING" } },
                },
                required: ["chapterNumber", "title", "subsections"],
              },
            },
          },
          required: ["abstract", "chapters"],
        },
        vivaQuestions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              idealAnswer: { type: "STRING" },
            },
            required: ["question", "idealAnswer"],
          },
        },
      },
      required: [
        "projectTitle",
        "description",
        "difficultyRating",
        "techStack",
        "roadmapWeeks",
        "githubStructure",
        "reportOutline",
        "vivaQuestions",
      ],
    };

    // 7. Request structured JSON from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: projectSchema as any,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No textual response received from Gemini.");
    }

    const result = JSON.parse(text);
    await saveProjectToDb(result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gemini API call failed, falling back to local mock data:", error);
    const mockPlan = generateMockPlan(domain, complexity, skillLevel, customKeywords);
    // Since saveProjectToDb was defined in the outer try block, let's call it here
    const session = await auth();
    const userEmail = session?.user?.email;
    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    if (userEmail && isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from("projects")
          .insert({
            user_email: userEmail,
            title: mockPlan.projectTitle || "Untitled Project",
            domain: domain,
            complexity: complexity,
            skill_level: skillLevel,
            custom_keywords: customKeywords || null,
            blueprint: mockPlan,
          });
      } catch (dbErr) {
        console.error("Error saving fallback plan to Supabase:", dbErr);
      }
    }
    return NextResponse.json(mockPlan);
  }
}

// Fallback high-quality mock data generator
function generateMockPlan(domain: string, complexity: string, skillLevel: string, customKeywords?: string) {
  const titleFocus = customKeywords ? `Focused on ${customKeywords}` : "Management Scaffolding";
  return {
    projectTitle: `${domain} - ${titleFocus}`,
    description: `A customized, comprehensive project blueprint mapping out a ${complexity} grade application ${
      customKeywords ? `incorporating "${customKeywords}" elements` : ""
    }. It is tailored for students at a ${skillLevel} level, detailing folder models, setup checklists, report headings, and viva questions.`,
    difficultyRating: `${complexity} / ${skillLevel}`,
    techStack: {
      frontend: ["Next.js (React)", "Tailwind CSS", "TypeScript"],
      backend: ["Node.js", "Express APIs", "Server Route Handlers"],
      database: ["PostgreSQL (Supabase)", "Prisma ORM Scaffolds"],
      hostingAndTools: ["Vercel", "GitHub Actions CI/CD", "ESLint & Biome"]
    },
    roadmapWeeks: [
      {
        weekNumber: 1,
        focusGoal: "System Scaffolding & Initial Setup",
        tasks: [
          { id: "task-1-1", title: "Initialize next repository", week: 1, description: "Set up the Next.js scaffold and workspace path directories." },
          { id: "task-1-2", title: "Configure styling tokens", week: 1, description: "Configure class-based dark mode colors and print media stylesheets." },
          { id: "task-1-3", title: "Verify build compilation", week: 1, description: "Run npm run build to check compilation safety and bundler rules." }
        ],
        aiToolGuide: {
          recommendedAiTool: "v0 by Vercel",
          toolJustification: "v0 is the optimal tool for rapidly generating the initial UI shell, layouts, and responsive global navigation headers.",
          masterPrompt: "System Role: Senior Next.js Developer\nCreate a Next.js 16 landing page and dashboard shell. Use Tailwind CSS dark mode and class-based toggle controls. Design a clean Header component with logo placeholders, dynamic theme toggles, and navigation elements. Provide type-safe interfaces for user profiles."
        }
      },
      {
        weekNumber: 2,
        focusGoal: "Database Connections & Schema Definition",
        tasks: [
          { id: "task-2-1", title: "Setup database tables", week: 2, description: "Provision relational tables for core schemas." },
          { id: "task-2-2", title: "Write database migrations", week: 2, description: "Run migration scripts to map models correctly." },
          { id: "task-2-3", title: "Configure Prisma models", week: 2, description: "Generate schema types matching the workspace logic." }
        ],
        aiToolGuide: {
          recommendedAiTool: "Claude 3.7 Sonnet",
          toolJustification: "Claude Sonnet excels at reasoning about database schema designs, SQL queries, and ORM migrations.",
          masterPrompt: "System Role: Principal Database Administrator\nGenerate PostgreSQL schema scripts and Prisma ORM models. Create relational tables mapping users, projects, and Kanban task statuses. Configure UUID identifiers and indices. Provide seeding migration files with mock records."
        }
      },
      {
        weekNumber: 3,
        focusGoal: "Authentication Middleware & Secure Intercepts",
        tasks: [
          { id: "task-3-1", title: "Configure NextAuth routes", week: 3, description: "Expose GET/POST handlers at standard api endpoints." },
          { id: "task-3-2", title: "Set up edge proxy.ts", week: 3, description: "Configure Edge authorization checks to redirect secure dashboards." },
          { id: "task-3-3", title: "Build client redirects", week: 3, description: "Implement signin submit pushes with cookie bypass validations." }
        ],
        aiToolGuide: {
          recommendedAiTool: "Claude 3.7 Sonnet",
          toolJustification: "Claude Sonnet provides excellent step-by-step guidance on complex auth setups like NextAuth Edge compatibility configurations.",
          masterPrompt: "System Role: Web Security Engineer\nSet up NextAuth (Auth.js v5) route handlers for Google, GitHub, and Credentials providers. Separate Edge-runtime routes. Create an edge proxy middleware file that intercepts secure routes and pushes unauthorized sessions to /auth."
        }
      },
      {
        weekNumber: 4,
        focusGoal: "Core API Development & Client Interfaces",
        tasks: [
          { id: "task-4-1", title: "Write Server Route Handlers", week: 4, description: "Integrate Google Gen AI structured outputs." },
          { id: "task-4-2", title: "Implement parameter form grid", week: 4, description: "Add selector dropdown selections with active spinners." },
          { id: "task-4-3", title: "Develop multi-tab panel displays", week: 4, description: "Build interactive visual panels for blueprints." }
        ],
        aiToolGuide: {
          recommendedAiTool: "Cursor",
          toolJustification: "Cursor is the best tool for context-aware coding, integrating backend API handlers and frontend rendering layers.",
          masterPrompt: "System Role: Full-Stack Architect\nImplement server route handlers using the Google Gen AI SDK. Integrate structured output schemas. Develop client-side selectors, spinner indicators, and dynamic tabs rendering overview cards, timeline roadmaps, and accordions."
        }
      },
      {
        weekNumber: 5,
        focusGoal: "Reports & Project Documentation Drafting",
        tasks: [
          { id: "task-5-1", title: "Draft thesis abstract outline", week: 5, description: "Formulate core scope and theoretical backgrounds." },
          { id: "task-5-2", title: "Setup chapters accordions", week: 5, description: "Construct disclosure views showing details of chapters." },
          { id: "task-5-3", title: "Review viva questions sheet", week: 5, description: "Organize viva practice boards with ideal answers." }
        ],
        aiToolGuide: {
          recommendedAiTool: "Cursor",
          toolJustification: "Cursor's composer feature makes it extremely easy to build multi-file document skeletons and thesis content maps.",
          masterPrompt: "System Role: Technical Writer & Academic Mentor\nDraft thesis outline structures including Abstract chapters, implementation methods, and evaluation metrics. Design practice sheets listing typical viva exam questions and defense model answers."
        }
      },
      {
        weekNumber: 6,
        focusGoal: "Testing, Scaffolding Audits & Deployment",
        tasks: [
          { id: "task-6-1", title: "Run end-to-end user checks", week: 6, description: "Verify form input constraints and email validity." },
          { id: "task-6-2", title: "Audit accessibility features", week: 6, description: "Confirm color contrast ratios for dark theme and print layouts." },
          { id: "task-6-3", title: "Deploy blueprint to Vercel", week: 6, description: "Execute final production scans and deploy live links." }
        ],
        aiToolGuide: {
          recommendedAiTool: "Bolt.new",
          toolJustification: "Bolt.new handles compiling, launching, auditing, and single-click cloud deployment pipelines instantly in-browser.",
          masterPrompt: "System Role: DevOps Engineer\nConfigure linting rules and accessibility contrast audits. Set up CI/CD pipeline scripts using GitHub Actions. Package web apps and deploy to production hosting servers (like Vercel)."
        }
      }
    ],
    githubStructure: `college-project-repo/
├── .env.local
├── package.json
├── tsconfig.json
├── auth.ts
├── proxy.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── auth/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       └── generate-plan/
│   │           └── route.ts
│   └── components/
│       ├── Header.tsx
│       └── ThemeProvider.tsx`,
    reportOutline: {
      abstract: `This thesis describes a production-grade ${domain} implementation built using robust architecture principles. The system addresses common student bottlenecks by scaffolding clear database mappings, dynamic client validations, and Edge middleware route protection.`,
      chapters: [
        {
          chapterNumber: 1,
          title: "Introduction & Theoretical Background",
          subsections: ["Academic Goals", "Domain Challenges", "Project Objectives & Specifications"]
        },
        {
          chapterNumber: 2,
          title: "System Architecture & Security Protocols",
          subsections: ["NextAuth Edge Proxies", "Client Validations", "Gemini AI Core Generation Pipelines"]
        },
        {
          chapterNumber: 3,
          title: "Implementation Details & Evaluation",
          subsections: ["TypeScript Theme Wrappers", "Interactive Multi-Tab Layouts", "Testing & Compile verifications"]
        }
      ]
    },
    vivaQuestions: [
      {
        question: "Why did you implement a split NextAuth configuration?",
        idealAnswer: "It separates edge-compatible auth settings from providers utilizing node-specific packages, preventing runtime crashes in proxy.ts."
      },
      {
        question: "Explain the purpose of the RFC 5322 regex validation.",
        idealAnswer: "It strictly verifies standard prefixes, the @ symbol, secondary subdomains, and ending extensions to secure input fields."
      },
      {
        question: "How does class-based dark mode operate in Tailwind v4?",
        idealAnswer: "We declare a custom variant dark pointing to .dark, applying dark: rules recursively when parent elements bear the .dark class."
      },
      {
        question: "What role does the proxy.ts file play in Next.js 16?",
        idealAnswer: "It acts as the edge-runtime routing interceptor, validating session cookies and redirecting unauthorized traffic to /auth."
      },
      {
        question: "Explain the advantage of structured JSON outputs in AI models.",
        idealAnswer: "It guarantees that responses match JSON schemas exactly, avoiding out-of-band text and allowing direct client parsing."
      }
    ]
  };
}
