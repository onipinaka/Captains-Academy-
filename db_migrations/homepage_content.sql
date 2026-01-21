-- =====================================================
-- Homepage Content Management System
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create homepage_content table
CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (for homepage display)
CREATE POLICY "Public read access" ON homepage_content
  FOR SELECT USING (true);

-- Policy: Only owner can insert/update/delete
CREATE POLICY "Owner can modify" ON homepage_content
  FOR ALL USING (auth.email() = 'admingormi@gmail.com');

-- =====================================================
-- Seed initial content with current homepage data
-- =====================================================

-- Hero Section
INSERT INTO homepage_content (section, content) VALUES (
  'hero',
  '{
    "title": "Excel in Your",
    "highlightedWord": "Academics",
    "titleSuffix": "with Expert Guidance",
    "subtitle": "Join the leading coaching center with 3+ years of excellence. We provide personalized coaching for Class 3-12 and competitive exams like Army, Airforce, Navy, Police, Bank, SSC, and more.",
    "bannerImage": "/banner.png"
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Stats Section
INSERT INTO homepage_content (section, content) VALUES (
  'stats',
  '[
    { "label": "Students Enrolled", "value": "500+", "icon": "Users" },
    { "label": "Success Rate", "value": "95%", "icon": "Award" },
    { "label": "Years Experience", "value": "3+", "icon": "Clock" },
    { "label": "Expert Faculty", "value": "5+", "icon": "GraduationCap" }
  ]'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- About Section
INSERT INTO homepage_content (section, content) VALUES (
  'about',
  '{
    "title": "Why Choose Us?",
    "subtitle": "We provide the best learning environment with experienced faculty and proven results"
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Contact Section
INSERT INTO homepage_content (section, content) VALUES (
  'contact',
  '{
    "address": "Captains Academy Gormi, Porsa Road, Gormi, Bhind",
    "phone": "+91 73546 20062",
    "email": "captainsacademybhind@gmail.com"
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- =====================================================
-- Verify setup
-- =====================================================
SELECT section, content FROM homepage_content;
