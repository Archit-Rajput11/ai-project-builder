import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getProjectFeasibilityAnalysis,
  generateFeasibilityAnalysis,
} from "@/lib/feasibilityService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, customNotes, forceRegenerate } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing required parameter: projectId." }, { status: 400 });
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

    // 2. Fetch project and verify ownership
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.user_id !== lookupKey && project.user_id !== userId && project.user_id !== userEmail) {
      return NextResponse.json({ error: "Forbidden: You do not own this project." }, { status: 403 });
    }

    // 3. Avoid unnecessary duplicate generation if analysis already exists
    const existingAnalysis = await getProjectFeasibilityAnalysis(projectId, lookupKey);
    if (existingAnalysis && !customNotes && !forceRegenerate) {
      return NextResponse.json({
        analysis: existingAnalysis,
        message: "Loaded existing feasibility analysis.",
      });
    }

    // 4. Generate feasibility analysis with Gemini (or adaptive fallback)
    const formattedProject = {
      id: project.id,
      title: project.title,
      domain: project.blueprint_data?.domain || project.domain,
      complexity: project.blueprint_data?.complexity || project.complexity,
      blueprint: project.blueprint_data || {},
    };

    const previousScore = existingAnalysis?.overallScore;

    const analysis = await generateFeasibilityAnalysis(formattedProject, lookupKey, {
      customNotes,
      previousScore,
    });

    return NextResponse.json({
      analysis,
      message: forceRegenerate ? "Feasibility analysis updated." : "Feasibility analysis generated.",
    });
  } catch (err: any) {
    console.error("POST /api/feasibility/generate error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze project feasibility." },
      { status: 500 }
    );
  }
}
