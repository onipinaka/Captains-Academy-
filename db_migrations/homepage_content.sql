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

-- Features Section (Why Choose Us cards)
INSERT INTO homepage_content (section, content) VALUES (
  'features',
  '[
    { "title": "Expert Faculty", "description": "Learn from experienced teachers with proven track records" },
    { "title": "Small Batches", "description": "Personalized attention with limited batch sizes" },
    { "title": "Regular Tests", "description": "Weekly tests to track progress and identify weak areas" },
    { "title": "Study Material", "description": "Comprehensive notes and practice materials provided" }
  ]'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Achievers Section
INSERT INTO homepage_content (section, content) VALUES (
  'achievers',
  '[
    { "name": "Priya Sharma", "exam": "Class 12 Boards", "score": "98.6%", "year": "2024" },
    { "name": "Rahul Verma", "exam": "JEE Main", "score": "99.2 percentile", "year": "2024" },
    { "name": "Ananya Patel", "exam": "NEET", "score": "685/720", "year": "2024" },
    { "name": "Vikram Singh", "exam": "Class 10 Boards", "score": "97.8%", "year": "2024" },
    { "name": "Sneha Gupta", "exam": "JEE Advanced", "score": "AIR 1250", "year": "2024" },
    { "name": "Arjun Kumar", "exam": "Class 12 Commerce", "score": "96.4%", "year": "2024" }
  ]'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Testimonials Section
INSERT INTO homepage_content (section, content) VALUES (
  'testimonials',
  '[
    { "name": "Parent of Priya S.", "text": "The faculty here is exceptional. My daughter improved from 70% to 95% in just 6 months. Highly recommended!" },
    { "name": "Rahul V., IIT Delhi", "text": "The systematic approach and regular tests helped me score 93% in 12th. The teachers are always available for doubts." },
    { "name": "Parent of Arjun K.", "text": "Small batch sizes mean personal attention for each student. Worth every rupee!" }
  ]'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Timings Section
INSERT INTO homepage_content (section, content) VALUES (
  'timings',
  '[
    { "batch": "Class 10 Morning", "days": "Mon, Wed, Fri", "time": "7:00 AM - 9:00 AM" },
    { "batch": "Class 10 Evening", "days": "Mon, Wed, Fri", "time": "5:00 PM - 7:00 PM" },
    { "batch": "Class 12 Science", "days": "Tue, Thu, Sat", "time": "4:00 PM - 7:00 PM" },
    { "batch": "Class 11 Commerce", "days": "Mon, Wed, Fri", "time": "3:00 PM - 5:00 PM" },
    { "batch": "JEE/NEET Weekend", "days": "Sat, Sun", "time": "9:00 AM - 1:00 PM" }
  ]'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- Footer Section
INSERT INTO homepage_content (section, content) VALUES (
  'footer',
  '{
    "description": "Empowering students with quality education since 2014. Join us and achieve academic excellence.",
    "weekdayHours": "Mon - Sat: 7:00 AM - 9:00 PM",
    "weekendHours": "Sunday: 9:00 AM - 1:00 PM"
  }'::jsonb
) ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

-- =====================================================
-- Verify setup
-- =====================================================
SELECT section, content FROM homepage_content;
