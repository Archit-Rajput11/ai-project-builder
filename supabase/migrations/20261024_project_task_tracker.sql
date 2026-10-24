-- ==============================================================================
-- Migration: Create project_task_tracker table with RLS
-- Description: Stores custom student tasks, board column layouts, priorities,
--              and task metadata linked to authenticated users and saved projects.
-- ==============================================================================

-- 1. Create the project_task_tracker table
CREATE TABLE IF NOT EXISTS public.project_task_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  custom_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_project_task_tracker UNIQUE(project_id, user_id)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_task_tracker_project ON public.project_task_tracker (project_id);
CREATE INDEX IF NOT EXISTS idx_task_tracker_user ON public.project_task_tracker (user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.project_task_tracker ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow authenticated users to view only their own task tracker boards
DROP POLICY IF EXISTS "Users can view own task tracker boards" ON public.project_task_tracker;
CREATE POLICY "Users can view own task tracker boards"
  ON public.project_task_tracker
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow authenticated users to insert their own task tracker boards
DROP POLICY IF EXISTS "Users can insert own task tracker boards" ON public.project_task_tracker;
CREATE POLICY "Users can insert own task tracker boards"
  ON public.project_task_tracker
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to update their own task tracker boards
DROP POLICY IF EXISTS "Users can update own task tracker boards" ON public.project_task_tracker;
CREATE POLICY "Users can update own task tracker boards"
  ON public.project_task_tracker
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to delete their own task tracker boards
DROP POLICY IF EXISTS "Users can delete own task tracker boards" ON public.project_task_tracker;
CREATE POLICY "Users can delete own task tracker boards"
  ON public.project_task_tracker
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
