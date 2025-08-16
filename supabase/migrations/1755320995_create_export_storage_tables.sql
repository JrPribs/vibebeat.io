-- Migration: create_export_storage_tables
-- Created at: 1755320995

-- Phase 7: Export & Storage Database Schema

-- Projects table for storing user projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table for managing user uploads and recordings
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('recording', 'upload', 'export')),
  path TEXT NOT NULL,
  size_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shares table for public project sharing
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project UUID REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- AI logs table for tracking AI feature usage
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('beat', 'melody')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner);
CREATE INDEX IF NOT EXISTS idx_shares_slug ON shares(slug);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_owner ON ai_logs(owner);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
DROP POLICY IF EXISTS "Users can access their own projects" ON projects;
CREATE POLICY "Users can access their own projects" ON projects
  FOR ALL USING (auth.uid() = owner);

-- RLS Policies for assets table
DROP POLICY IF EXISTS "Users can access their own assets" ON assets;
CREATE POLICY "Users can access their own assets" ON assets
  FOR ALL USING (auth.uid() = owner);

-- RLS Policies for shares table (public read, owner write/delete)
DROP POLICY IF EXISTS "Public can read shares" ON shares;
CREATE POLICY "Public can read shares" ON shares
  FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can manage their project shares" ON shares;
CREATE POLICY "Users can manage their project shares" ON shares
  FOR ALL USING (auth.uid() = (SELECT owner FROM projects WHERE id = project));

-- RLS Policies for ai_logs table
DROP POLICY IF EXISTS "Users can access their own AI logs" ON ai_logs;
CREATE POLICY "Users can access their own AI logs" ON ai_logs
  FOR ALL USING (auth.uid() = owner);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();;