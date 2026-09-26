import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    let userEmail = session?.user?.email;

    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    let userId: string | null = null;

    // Support Supabase token authentication if Bearer token present
    if (token && isSupabaseConfigured) {
      try {
        const { data: { user }, error: supError } = await supabaseAdmin.auth.getUser(token);
        if (user && !supError) {
          userId = user.id;
          if (user.email) userEmail = user.email;
        }
      } catch (tokenErr) {
        console.error("Token user verification in GET /api/projects failed:", tokenErr);
      }
    }

    if (!userId && userEmail && isSupabaseConfigured) {
      try {
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .maybeSingle();
        if (dbUser?.id) userId = dbUser.id;
      } catch (dbErr) {
        console.error("User lookup failed in GET /api/projects:", dbErr);
      }
    }

    const lookupKey = userId || userEmail;

    if (!lookupKey || !isSupabaseConfigured) {
      // Gracefully return empty array if unauthenticated or DB not configured
      return NextResponse.json([]);
    }

    const { data: dbProjects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_id", lookupKey)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase projects fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch project histories." },
        { status: 500 }
      );
    }

    // Map database fields to the format expected by the frontend
    const projects = (dbProjects || []).map((project: any) => {
      const bp = project.blueprint_data || project.blueprint || {};
      return {
        id: project.id,
        title: project.title,
        domain: bp.domain || project.domain || "Web Development",
        complexity: bp.complexity || project.complexity || "Intermediate",
        weeks: bp.roadmapWeeks?.length || 6,
        date: new Date(project.created_at).toISOString().split("T")[0],
        description: bp.description || project.title,
        blueprint: bp,
        status: project.status || "Ready",
      };
    });

    return NextResponse.json(projects);
  } catch (err: any) {
    console.error("Projects GET endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    let userEmail = session?.user?.email;
    let userId: string | null = null;
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (token) {
      try {
        const { data: { user }, error: supError } = await supabaseAdmin.auth.getUser(token);
        if (user && !supError) {
          userId = user.id;
          if (user.email) userEmail = user.email;
        }
      } catch (tokenErr) {}
    }

    if (!userId && userEmail) {
      try {
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .maybeSingle();
        if (dbUser?.id) userId = dbUser.id;
      } catch (dbErr) {}
    }

    const lookupKey = userId || userEmail;

    if (!lookupKey) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID parameter." },
        { status: 400 }
      );
    }

    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", lookupKey);

    if (error) {
      console.error("Supabase project delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete project blueprint." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully." });
  } catch (err: any) {
    console.error("Projects DELETE endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
