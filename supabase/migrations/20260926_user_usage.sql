-- ==============================================================================
-- Migration: Create user_usage table with RLS and atomic increment procedure
-- Description: Tracks blueprint generation usage per authenticated Supabase user
-- ==============================================================================

-- 1. Create the user_usage table
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id TEXT PRIMARY KEY,
  blueprints_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow authenticated users to view only their own usage row
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
CREATE POLICY "Users can view own usage"
  ON public.user_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert their own initial usage row
DROP POLICY IF EXISTS "Users can insert own usage" ON public.user_usage;
CREATE POLICY "Users can insert own usage"
  ON public.user_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to update their own usage row
DROP POLICY IF EXISTS "Users can update own usage" ON public.user_usage;
CREATE POLICY "Users can update own usage"
  ON public.user_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 4. Stored Procedure for Atomic Increment & Race Condition Protection
-- Returns the new blueprints_used count, or -1 if the limit was reached
CREATE OR REPLACE FUNCTION public.increment_blueprint_usage(
  p_user_id TEXT,
  p_max_limit INT DEFAULT 1
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INT;
BEGIN
  -- Insert default row with 0 usage if none exists yet
  INSERT INTO public.user_usage (user_id, blueprints_used, created_at, updated_at)
  VALUES (p_user_id, 0, timezone('utc'::text, now()), timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO NOTHING;

  -- Atomically increment blueprints_used only if currently below limit
  UPDATE public.user_usage
  SET blueprints_used = blueprints_used + 1,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id AND blueprints_used < p_max_limit
  RETURNING blueprints_used INTO v_new_count;

  -- If no row was updated, the user has reached or exceeded their limit
  IF NOT FOUND THEN
    SELECT blueprints_used INTO v_new_count FROM public.user_usage WHERE user_id = p_user_id;
    RETURN -1;
  END IF;

  RETURN v_new_count;
END;
$$;
