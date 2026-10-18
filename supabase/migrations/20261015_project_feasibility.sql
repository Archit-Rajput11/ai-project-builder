-- ==============================================================================
-- Migration: Create project_feasibility_analyses table with RLS
-- Description: Stores structured AI Project Feasibility Analysis results,
--              scoring rubrics, risk evaluations, MVP scopes, and cost estimates.
-- ==============================================================================

-- 1. Create the project_feasibility_analyses table
CREATE TABLE IF NOT EXISTS public.project_feasibility_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_title TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 70,
  classification TEXT NOT NULL DEFAULT 'Feasible with Adjustments',
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_project_feasibility UNIQUE(project_id, user_id)
);

-- 2. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_feasibility_project ON public.project_feasibility_analyses (project_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_user ON public.project_feasibility_analyses (user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.project_feasibility_analyses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow authenticated users to view only their own analyses
DROP POLICY IF EXISTS "Users can view own feasibility analyses" ON public.project_feasibility_analyses;
CREATE POLICY "Users can view own feasibility analyses"
  ON public.project_feasibility_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert their own analyses
DROP POLICY IF EXISTS "Users can insert own feasibility analyses" ON public.project_feasibility_analyses;
CREATE POLICY "Users can insert own feasibility analyses"
  ON public.project_feasibility_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to update their own analyses
DROP POLICY IF EXISTS "Users can update own feasibility analyses" ON public.project_feasibility_analyses;
CREATE POLICY "Users can update own feasibility analyses"
  ON public.project_feasibility_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to delete their own analyses
DROP POLICY IF EXISTS "Users can delete own feasibility analyses" ON public.project_feasibility_analyses;
CREATE POLICY "Users can delete own feasibility analyses"
  ON public.project_feasibility_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
