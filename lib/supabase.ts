import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";

const rawAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key-here";
const supabaseAnonKey = (rawAnonKey && !rawAnonKey.includes("your-supabase-anon-key")) ? rawAnonKey : "your-supabase-anon-key-here";

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseServiceRoleKey = (rawServiceKey && !rawServiceKey.includes("your-supabase-service-role-key")) ? rawServiceKey : "";

// Standard client for client-side interactions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Secure admin client for server-side operations (uses service role key to bypass RLS safely)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
