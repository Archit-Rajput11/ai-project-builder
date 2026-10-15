import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getProjectMentorRoadmap } from "@/lib/mentorService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, message, messageHistory, currentTaskId } = body;

    if (!projectId || !message) {
      return NextResponse.json({ error: "Missing required parameters: projectId and message." }, { status: 400 });
    }

    // 1. Authenticate user
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (token) {
      try {
        const { data: { user }, error: supError } = await supabaseAdmin.auth.getUser(token);
        if (user && !supError) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch (tokenErr) {}
    }

    if (!userId) {
      const session = await auth();
      if (session?.user?.email) {
        userEmail = session.user.email;
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", session.user.email)
          .maybeSingle();
        if (dbUser?.id) userId = dbUser.id;
      }
    }

    const lookupKey = userId || userEmail;
    if (!lookupKey) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Fetch project context
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const bp = project.blueprint_data || {};
    const roadmap = await getProjectMentorRoadmap(projectId, lookupKey);

    // Compute progress stats
    let completedCount = 0;
    let totalTasks = 0;
    let nextTaskTitle = "";

    if (roadmap && roadmap.phases) {
      for (const phase of roadmap.phases) {
        for (const task of phase.tasks) {
          totalTasks++;
          const status = roadmap.taskProgress?.[task.id]?.status || "not_started";
          if (status === "completed") {
            completedCount++;
          } else if (!nextTaskTitle) {
            nextTaskTitle = `Phase ${phase.phaseNumber}: ${task.title}`;
          }
        }
      }
    }

    // 3. Structured system prompt for Mentor
    const techStackSummary = bp.techStack
      ? `Frontend: ${(bp.techStack.frontend || []).join(", ") || "None"}
Backend: ${(bp.techStack.backend || []).join(", ") || "None"}
Database: ${(bp.techStack.database || []).join(", ") || "None"}
Tools: ${(bp.techStack.hostingAndTools || []).join(", ") || "None"}`
      : "Standard Stack";

    const systemInstruction = `You are the dedicated AI Project Mentor for a student working on their academic engineering project.
Your tone is encouraging, pedagogical, patient, and practically technical.

Project Context:
- Title: ${project.title}
- Domain: ${bp.domain || project.domain || "Engineering"}
- Complexity: ${bp.complexity || project.complexity || "Intermediate"}
- Description: ${bp.description || project.title}
- Technology Stack:
${techStackSummary}
- Current Roadmap Progress: ${completedCount} of ${totalTasks} tasks completed.
${nextTaskTitle ? `- Next Recommended Task: ${nextTaskTitle}` : ""}
${currentTaskId ? `- Currently Focused Task ID: ${currentTaskId}` : ""}

GUIDELINES:
1. Explain technical concepts in beginner-friendly, clear language. Use analogies when helpful.
2. When the student asks about implementation, provide concrete, well-commented code snippets directly using their chosen tech stack.
3. If they ask what to do next, suggest the next logical milestone based on their completed tasks.
4. Keep answers focused on this specific project.
5. Format code blocks with language identifiers. Never claim that code has been tested unless verified.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const history = Array.isArray(messageHistory) ? messageHistory : [];
        const contents = history.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction,
          },
        });

        const reply = response.text;
        if (reply) {
          return NextResponse.json({ reply });
        }
      } catch (geminiErr) {
        console.warn("Gemini Mentor chat error, using adaptive fallback:", geminiErr);
      }
    }

    // High quality contextual fallback reply
    const fallbackReply = generateFallbackMentorChat(message, project.title, bp, nextTaskTitle);
    return NextResponse.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error("POST /api/mentor/chat error:", err);
    return NextResponse.json({ error: err.message || "Chat failed" }, { status: 500 });
  }
}

function generateFallbackMentorChat(message: string, title: string, bp: any, nextTask: string): string {
  const q = message.toLowerCase();
  const tech = bp.techStack || {};
  const primaryFe = tech.frontend?.[0] || "Frontend framework";
  const primaryBe = tech.backend?.[0] || "Backend runtime";
  const primaryDb = tech.database?.[0] || "Database";

  if (q.includes("next") || q.includes("start") || q.includes("where") || q.includes("first")) {
    if (nextTask) {
      return `Welcome! Based on your current roadmap progress for **${title}**, here is your recommended next milestone:

👉 **${nextTask}**

To tackle this effectively:
1. Review the prerequisite checklist on the task card.
2. Read through the "What you should learn" section.
3. Check off tasks as you build them, and feel free to write personal notes in the task card!

Would you like me to walk you through sample code or configuration files for this step?`;
    }
    return `To kick off **${title}**, I recommend starting with **Phase 1: Project Scaffolding & Environment Setup**. 

Initialize your Git repository, set up your \`${primaryFe}\` workspace, and verify your local runtime before connecting database endpoints. Let me know if you'd like a starter file layout!`;
  }

  if (q.includes("database") || q.includes("db") || q.includes("schema") || q.includes("table")) {
    return `For **${title}**, you are using **${primaryDb}**. 

Here is how I recommend structuring your primary tables:
1. **Users table**: ID, email, hashed credentials, and role.
2. **Core Domain table**: The main entity for ${title} with foreign key relationships.
3. **Audit/Log table**: Timestamps and activity tracking.

Remember to add indexes to foreign keys and unique constraints on email or unique identifiers to maintain relational integrity!`;
  }

  if (q.includes("viva") || q.includes("exam") || q.includes("evaluat") || q.includes("present")) {
    return `Here are top 3 questions examiners frequently ask about projects like **${title}**:

1. *"Why did you choose ${primaryFe} and ${primaryBe} over alternatives?"*
   - Focus on developer velocity, type safety, and ecosystem support.
2. *"How does your application handle race conditions or concurrent writes?"*
   - Discuss database transactions and server validation.
3. *"What would you improve if given 3 more months?"*
   - Mention automated CI/CD pipelines, caching layers (e.g. Redis), or microservice decoupling.`;
  }

  return `I'm here to guide you through building **${title}** step by step!

You're working with **${primaryFe}**, **${primaryBe}**, and **${primaryDb}**. 

Feel free to ask me to:
- Explain any task or architectural concept in simple terms
- Provide starter boilerplate and code snippets
- Review schema designs or troubleshoot error messages
- Suggest the next milestone based on your progress`;
}
