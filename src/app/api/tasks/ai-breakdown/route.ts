import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, taskTitle, taskDescription } = body;

    if (!projectId || !taskTitle) {
      return NextResponse.json(
        { error: "Missing required parameters: projectId and taskTitle." },
        { status: 400 }
      );
    }

    // Authenticate user
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (token) {
      try {
        const {
          data: { user },
          error: supError,
        } = await supabaseAdmin.auth.getUser(token);
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

    // Verify project ownership
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, user_id, title, blueprint_data")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (
      project.user_id !== lookupKey &&
      project.user_id !== userId &&
      project.user_id !== userEmail
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const bp = project.blueprint_data || {};
    const tech = bp.techStack || {};
    const allTechs = [
      ...(tech.frontend || []),
      ...(tech.backend || []),
      ...(tech.database || []),
    ].join(", ") || "Standard Full-Stack";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are an expert technical lead for engineering students.
The student has this task in their project "${project.title}" (Tech Stack: ${allTechs}):
Task: "${taskTitle}"
Context: "${taskDescription || taskTitle}"

Break this task down into 3 to 4 actionable, bite-sized subtasks that can each be completed in 1 to 3 hours.
Each subtask must be specific to their stack and provide a clear, beginner-friendly explanation.`;

        const responseSchema = {
          type: "OBJECT",
          properties: {
            subtasks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  estimatedEffort: { type: "STRING" },
                  priority: { type: "STRING" },
                },
                required: ["title", "description", "estimatedEffort"],
              },
            },
          },
          required: ["subtasks"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema as any,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0) {
            return NextResponse.json({ subtasks: parsed.subtasks });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini subtask generation failed, falling back:", geminiErr);
      }
    }

    // Adaptive fallback subtasks
    const fallbackSubtasks = [
      {
        title: `Research and scaffold ${taskTitle.split(" ")[0]} module`,
        description: `Review official documentation and establish required starter files or helper utilities.`,
        estimatedEffort: "Est. 1 - 2 hours",
        priority: "high",
      },
      {
        title: `Implement core logic for ${taskTitle}`,
        description: `Write the primary function or component handler with basic error handling.`,
        estimatedEffort: "Est. 2 - 3 hours",
        priority: "medium",
      },
      {
        title: `Verify and test ${taskTitle} edge cases`,
        description: `Perform manual or automated checks to ensure expected responses and avoid regressions.`,
        estimatedEffort: "Est. 1 hour",
        priority: "medium",
      },
    ];

    return NextResponse.json({ subtasks: fallbackSubtasks });
  } catch (err: any) {
    console.error("POST /api/tasks/ai-breakdown error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate subtasks." },
      { status: 500 }
    );
  }
}
