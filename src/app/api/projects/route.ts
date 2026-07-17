import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { supabaseAdmin } from "../../../utils/supabase";

export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-supabase-project.supabase.co" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isSupabaseConfigured) {
      // Return empty array if DB is not configured yet
      return NextResponse.json([]);
    }

    const { data: dbProjects, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase projects fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch project histories." },
        { status: 500 }
      );
    }

    // Map database fields to the format expected by the frontend ProjectsPage
    const projects = (dbProjects || []).map((project: any) => ({
      id: project.id,
      title: project.title,
      domain: project.domain,
      complexity: project.complexity,
      weeks: project.blueprint?.roadmapWeeks?.length || 6,
      date: new Date(project.created_at).toISOString().split("T")[0],
      description: project.blueprint?.description || project.title,
      blueprint: project.blueprint,
    }));

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
    const userEmail = session?.user?.email;

    if (!userEmail) {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-supabase-project.supabase.co" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      .eq("user_email", userEmail);

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
