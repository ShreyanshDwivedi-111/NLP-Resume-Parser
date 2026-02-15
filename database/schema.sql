-- Resume Parser Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    
    -- Parsed Data
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    skills TEXT[],
    experience TEXT,
    education TEXT,
    raw_text TEXT,
    parsed_data JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT resumes_user_id_idx UNIQUE (user_id, filename, created_at)
);

-- Job Searches Table
CREATE TABLE IF NOT EXISTS job_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Job Details
    job_title VARCHAR(255),
    job_description TEXT,
    keywords TEXT[],
    use_keywords BOOLEAN DEFAULT FALSE,
    
    -- Extracted Requirements
    required_skills TEXT[],
    required_roles TEXT[],
    required_experience TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Results Table
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_search_id UUID REFERENCES job_searches(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- Match Details
    match_score DECIMAL(5,2) NOT NULL,
    matched_skills TEXT[],
    missing_skills TEXT[],
    experience_match BOOLEAN,
    
    -- Additional Info
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Resumes
CREATE POLICY "Users can view their own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for Job Searches
CREATE POLICY "Users can view their own job searches"
    ON job_searches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job searches"
    ON job_searches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job searches"
    ON job_searches FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for Match Results
CREATE POLICY "Users can view their own match results"
    ON match_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match results"
    ON match_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own match results"
    ON match_results FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_name ON resumes(name);
CREATE INDEX IF NOT EXISTS idx_resumes_skills ON resumes USING GIN(skills);
