import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: {},
  };

  try {
    // Step 1: Check if supabaseAdmin is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    diagnostics.steps["1_config"] = {
      supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "NOT SET",
      hasServiceRoleKey: hasServiceKey,
      hasAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    };

    // Step 2: Check Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    diagnostics.steps["2_auth_header"] = {
      hasAuthHeader: !!authHeader,
      tokenLength: token.length,
      tokenPreview: token ? token.substring(0, 20) + "..." : "EMPTY",
    };

    // Step 3: Verify token with supabaseAdmin
    if (token) {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        diagnostics.steps["3_token_verify"] = {
          success: !!data?.user && !error,
          userId: data?.user?.id || null,
          email: data?.user?.email || null,
          error: error?.message || null,
        };

        // Step 4: Query user profile from database
        if (data?.user) {
          const { data: profile, error: dbError } = await supabaseAdmin
            .from("users")
            .select("id, email, is_pro, is_premium, current_period_end, expires_at, premium_expires_at, created_at")
            .eq("id", data.user.id)
            .maybeSingle();

          diagnostics.steps["4_db_query_by_id"] = {
            found: !!profile,
            profile: profile || null,
            error: dbError?.message || null,
          };

          // Also try by email
          if (!profile && data.user.email) {
            const { data: profileByEmail, error: emailErr } = await supabaseAdmin
              .from("users")
              .select("id, email, is_pro, is_premium, current_period_end, expires_at, premium_expires_at, created_at")
              .eq("email", data.user.email)
              .maybeSingle();

            diagnostics.steps["4b_db_query_by_email"] = {
              found: !!profileByEmail,
              profile: profileByEmail || null,
              error: emailErr?.message || null,
            };
          }

          // Step 5: List ALL users in the table for comparison
          const { data: allUsers, error: allErr } = await supabaseAdmin
            .from("users")
            .select("id, email, is_pro, current_period_end, created_at")
            .limit(10);

          diagnostics.steps["5_all_users"] = {
            count: allUsers?.length || 0,
            users: allUsers || [],
            error: allErr?.message || null,
          };
        }
      } catch (verifyErr: any) {
        diagnostics.steps["3_token_verify"] = {
          success: false,
          error: verifyErr.message,
        };
      }
    } else {
      diagnostics.steps["3_token_verify"] = { skipped: true, reason: "No token provided" };
    }
  } catch (err: any) {
    diagnostics.error = err.message;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
