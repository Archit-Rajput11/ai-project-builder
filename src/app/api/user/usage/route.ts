import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "../../../../../auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    let userId: string | null = null;
    let userEmail: string | null = null;

    // 1. Authenticate user from Supabase Bearer token
    if (token) {
      try {
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (user && !authErr) {
          userId = user.id;
          userEmail = user.email || null;
        }
      } catch (tokenErr) {
        console.error("Token verification failed in GET /api/user/usage:", tokenErr);
      }
    }

    // 2. Fallback to NextAuth session if available
    if (!userId) {
      try {
        const session = await auth();
        if (session?.user?.email) {
          userEmail = session.user.email;
          // Look up user id from public.users table or auth admin
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", session.user.email)
            .maybeSingle();
          if (dbUser?.id) {
            userId = dbUser.id;
          }
        }
      } catch (sessionErr) {
        console.error("Session check failed in GET /api/user/usage:", sessionErr);
      }
    }

    if (!userId && !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user row exists in public.users to satisfy foreign key relationships
    if (userId && userEmail) {
      try {
        await supabaseAdmin
          .from("users")
          .upsert(
            { id: userId, email: userEmail },
            { onConflict: "id", ignoreDuplicates: true }
          );
      } catch (upsertErr) {}
    }

    // 3. Check Pro subscription status
    let isPro = false;
    try {
      const orFilter = userId && userEmail 
        ? `id.eq.${userId},email.eq.${userEmail}`
        : userId 
          ? `id.eq.${userId}` 
          : `email.eq.${userEmail}`;

      const { data: dbUsers } = await supabaseAdmin
        .from("users")
        .select("is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
        .or(orFilter);

      if (dbUsers && dbUsers.length > 0) {
        isPro = dbUsers.some((u: any) => {
          const active = u.is_pro === true || u.is_premium === true;
          if (!active) return false;
          const expiry = u.current_period_end || u.expires_at || u.premium_expires_at;
          if (!expiry) return true;
          return new Date(expiry).getTime() > Date.now();
        });
      }
    } catch (proErr) {
      console.error("Failed to verify Pro status in usage route:", proErr);
    }

    // 4. Retrieve or initialize usage from Supabase
    let blueprintsUsed = 0;
    const lookupKey = userId || userEmail;

    if (lookupKey) {
      try {
        const { data: usageRow, error: usageErr } = await supabaseAdmin
          .from("user_usage")
          .select("blueprints_used")
          .eq("user_id", lookupKey)
          .maybeSingle();

        if (usageRow) {
          blueprintsUsed = usageRow.blueprints_used ?? 0;
        } else if (!usageErr) {
          // Row does not exist yet for this account -> initialize safely with 0
          try {
            await supabaseAdmin
              .from("user_usage")
              .insert({
                user_id: lookupKey,
                blueprints_used: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          } catch (initErr) {}
          blueprintsUsed = 0;
        } else {
          // Fallback: If user_usage table does not exist in schema cache yet,
          // count actual blueprint projects generated in database
          const { count } = await supabaseAdmin
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("user_id", lookupKey);

          blueprintsUsed = count ?? 0;
        }
      } catch (dbErr) {
        console.error("Database query failed in /api/user/usage:", dbErr);
      }
    }

    return NextResponse.json({
      userId: lookupKey,
      blueprintsUsed,
      limit: isPro ? 999999 : 1,
      remaining: isPro ? 999999 : Math.max(0, 1 - blueprintsUsed),
      isPro,
    });
  } catch (err: any) {
    console.error("GET /api/user/usage unhandled error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
