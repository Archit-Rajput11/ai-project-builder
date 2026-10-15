-- ==============================================================================
-- Migration: Create project_mentor_roadmaps table with RLS
-- Description: Stores personalized AI Project Mentor roadmaps, task progress,
--              learning notes, and milestones per user and saved project.
-- ==============================================================================

-- 1. Create the project_mentor_roadmaps table
CREATE TABLE IF NOT EXISTS public.project_mentor_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_title TEXT NOT NULL,
  summary TEXT,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_project_mentor UNIQUE(project_id, user_id)
);

-- 2. Indexes for high performance lookups
CREATE INDEX IF NOT EXISTS idx_mentor_roadmaps_project ON public.project_mentor_roadmaps (project_id);
CREATE INDEX IF NOT EXISTS idx_mentor_roadmaps_user ON public.project_mentor_roadmaps (user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.project_mentor_roadmaps ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow authenticated users to view only their own mentor roadmaps
DROP POLICY IF EXISTS "Users can view own mentor roadmaps" ON public.project_mentor_roadmaps;
CREATE POLICY "Users can view own mentor roadmaps"
  ON public.project_mentor_roadmaps
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert their own mentor roadmaps
DROP POLICY IF EXISTS "Users can insert own mentor roadmaps" ON public.project_mentor_roadmaps;
CREATE POLICY "Users can insert own mentor roadmaps"
  ON public.project_mentor_roadmaps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to update their own mentor roadmaps
DROP POLICY IF EXISTS "Users can update own mentor roadmaps" ON public.project_mentor_roadmaps;
CREATE POLICY "Users can update own mentor roadmaps"
  ON public.project_mentor_roadmaps
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to delete their own mentor roadmaps
DROP POLICY IF EXISTS "Users can delete own mentor roadmaps" ON public.project_mentor_roadmaps;
CREATE POLICY "Users can delete own mentor roadmaps"
  ON public.project_mentor_roadmaps
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
