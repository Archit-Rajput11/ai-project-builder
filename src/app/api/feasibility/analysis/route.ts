import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getProjectFeasibilityAnalysis } from "@/lib/feasibilityService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId query parameter." }, { status: 400 });
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
      .select("id, user_id, title")
      .eq("id", projectId)
      .maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.user_id !== lookupKey && project.user_id !== userId && project.user_id !== userEmail) {
      return NextResponse.json({ error: "Forbidden: You do not own this project." }, { status: 403 });
    }

    // 3. Fetch feasibility analysis
    const analysis = await getProjectFeasibilityAnalysis(projectId, lookupKey);

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("GET /api/feasibility/analysis error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
