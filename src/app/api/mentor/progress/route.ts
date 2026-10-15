import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";
import { updateMentorTaskProgress } from "@/lib/mentorService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, taskId, status, notes } = body;

    if (!projectId || !taskId || !status) {
      return NextResponse.json(
        { error: "Missing required parameters: projectId, taskId, and status." },
        { status: 400 }
      );
    }

    if (!["not_started", "in_progress", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'not_started', 'in_progress', or 'completed'." },
        { status: 400 }
      );
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

    // 2. Verify project ownership
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.user_id !== lookupKey && project.user_id !== userId && project.user_id !== userEmail) {
      return NextResponse.json({ error: "Forbidden: You do not own this project." }, { status: 403 });
    }

    // 3. Update task progress
    const updatedRoadmap = await updateMentorTaskProgress(projectId, lookupKey, taskId, {
      status,
      notes: typeof notes === "string" ? notes : undefined,
    });

    if (!updatedRoadmap) {
      return NextResponse.json({ error: "Roadmap not found for this project." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      taskProgress: updatedRoadmap.taskProgress,
    });
  } catch (err: any) {
    console.error("POST /api/mentor/progress error:", err);
    return NextResponse.json({ error: err.message || "Failed to update progress." }, { status: 500 });
  }
}
