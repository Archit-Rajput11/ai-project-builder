import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getProjectTaskBoard,
  updateTrackerTaskStatus,
  createCustomTask,
  updateTaskDetails,
  deleteCustomTask,
  importFeasibilityActionTasks,
} from "@/lib/taskService";

async function authenticateAndVerifyOwnership(
  req: NextRequest,
  projectId: string
): Promise<{ errorResponse?: NextResponse; userId?: string }> {
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
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    };
  }

  // Verify project ownership
  const { data: project, error: projErr } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, title")
    .eq("id", projectId)
    .maybeSingle();

  if (projErr || !project) {
    return {
      errorResponse: NextResponse.json({ error: "Project not found." }, { status: 404 }),
    };
  }

  if (
    project.user_id !== lookupKey &&
    project.user_id !== userId &&
    project.user_id !== userEmail
  ) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: You do not own this project." },
        { status: 403 }
      ),
    };
  }

  return { userId: project.user_id || lookupKey };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId query parameter." },
        { status: 400 }
      );
    }

    const { errorResponse, userId } = await authenticateAndVerifyOwnership(req, projectId);
    if (errorResponse) return errorResponse;

    const board = await getProjectTaskBoard(projectId, userId!);
    if (!board) {
      return NextResponse.json(
        { error: "Failed to load task board from database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ board });
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Failed to load task board." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, action } = body;

    if (!projectId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters: projectId and action." },
        { status: 400 }
      );
    }

    const { errorResponse, userId } = await authenticateAndVerifyOwnership(req, projectId);
    if (errorResponse) return errorResponse;

    switch (action) {
      case "update_status": {
        const { taskId, status } = body;
        if (!taskId || !status) {
          return NextResponse.json(
            { error: "Missing taskId or status for update_status." },
            { status: 400 }
          );
        }
        const updatedBoard = await updateTrackerTaskStatus(projectId, userId!, taskId, status);
        if (!updatedBoard) {
          return NextResponse.json(
            { error: "Failed to update task status in database." },
            { status: 500 }
          );
        }
        return NextResponse.json({ board: updatedBoard, message: "Task status updated." });
      }

      case "create_task": {
        const { task } = body;
        if (!task || !task.title) {
          return NextResponse.json(
            { error: "Task title is required to create a task." },
            { status: 400 }
          );
        }
        const updatedBoard = await createCustomTask(projectId, userId!, task);
        if (!updatedBoard) {
          return NextResponse.json(
            { error: "Failed to create task in database." },
            { status: 500 }
          );
        }
        return NextResponse.json({ board: updatedBoard, message: "Task created successfully." });
      }

      case "update_task": {
        const { taskId, updates } = body;
        if (!taskId || !updates) {
          return NextResponse.json(
            { error: "Missing taskId or updates object." },
            { status: 400 }
          );
        }
        const updatedBoard = await updateTaskDetails(projectId, userId!, taskId, updates);
        if (!updatedBoard) {
          return NextResponse.json(
            { error: "Failed to update task details in database." },
            { status: 500 }
          );
        }
        return NextResponse.json({ board: updatedBoard, message: "Task updated." });
      }

      case "delete_task": {
        const { taskId } = body;
        if (!taskId) {
          return NextResponse.json({ error: "Missing taskId for delete." }, { status: 400 });
        }
        const result = await deleteCustomTask(projectId, userId!, taskId);
        return NextResponse.json(
          {
            board: result.board,
            success: result.success,
            message: result.message || "Task deleted.",
          },
          { status: result.success ? 200 : 400 }
        );
      }

      case "import_feasibility": {
        const result = await importFeasibilityActionTasks(projectId, userId!);
        if (!result.board) {
          return NextResponse.json(
            { error: "Failed to import feasibility tasks into database." },
            { status: 500 }
          );
        }
        return NextResponse.json({
          board: result.board,
          addedCount: result.addedCount,
          message:
            result.addedCount > 0
              ? `Imported ${result.addedCount} actionable tasks from Feasibility Analysis.`
              : "All feasibility recommendations are already tracked on your board.",
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
