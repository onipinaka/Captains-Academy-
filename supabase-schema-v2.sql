-- =====================================================
-- Multi-Tenant Coaching Center ERP - Database Schema v2
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- This creates a multi-tenant system with isolated workspaces

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE MULTI-TENANCY TABLES
-- =====================================================

-- Profiles table (user metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table (coaching center workspaces)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- =====================================================
-- DATA TABLES (with organization_id for isolation)
-- =====================================================

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  standard VARCHAR(20),
  subject VARCHAR(100),
  days TEXT[] DEFAULT '{}',
  start_time TIME,
  end_time TIME,
  start_date DATE,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  capacity INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  dob DATE,
  gender VARCHAR(20),
  contact VARCHAR(20),
  parent_name VARCHAR(200),
  parent_contact VARCHAR(20),
  email VARCHAR(200),
  address TEXT,
  photo_url TEXT,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  joining_date DATE DEFAULT CURRENT_DATE,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  last_paid_month VARCHAR(7),
  due_amount DECIMAL(10,2) DEFAULT 0,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  next_due_date DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  topic VARCHAR(200),
  total_marks INTEGER NOT NULL,
  test_type VARCHAR(50) DEFAULT 'Weekly',
  duration INTEGER,
  notes TEXT,
  scores_entered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Scores table
CREATE TABLE IF NOT EXISTS test_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'present',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- Fee Payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  months_covered TEXT[] DEFAULT '{}',
  receipt_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, student_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_organizations(organization_id);

CREATE INDEX IF NOT EXISTS idx_batches_org ON batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_org ON students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_tests_org ON tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_tests_batch ON tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_tests_date ON tests(date);
CREATE INDEX IF NOT EXISTS idx_test_scores_org ON test_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_test ON test_scores(test_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_student ON test_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_org ON fee_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_attendance_org ON attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant all privileges on tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Specific table grants for safety
ALTER TABLE profiles OWNER TO postgres;
ALTER TABLE organizations OWNER TO postgres;
ALTER TABLE user_organizations OWNER TO postgres;
ALTER TABLE batches OWNER TO postgres;
ALTER TABLE students OWNER TO postgres;
ALTER TABLE tests OWNER TO postgres;
ALTER TABLE test_scores OWNER TO postgres;
ALTER TABLE fee_payments OWNER TO postgres;
ALTER TABLE attendance OWNER TO postgres;
ALTER TABLE expenses OWNER TO postgres;

-- Grant permissions to anon and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON batches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON test_scores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_payments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO anon, authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can view own organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can manage own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can join organizations" ON user_organizations;
DROP POLICY IF EXISTS "Authenticated users can create org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can update own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can delete own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage own org memberships" ON user_organizations;

DROP POLICY IF EXISTS "Allow all on batches" ON batches;
DROP POLICY IF EXISTS "Allow all on students" ON students;
DROP POLICY IF EXISTS "Allow all on tests" ON tests;
DROP POLICY IF EXISTS "Allow all on test_scores" ON test_scores;
DROP POLICY IF EXISTS "Allow all on fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "Allow all on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view own org batches" ON batches;
DROP POLICY IF EXISTS "Users can manage own org batches" ON batches;
DROP POLICY IF EXISTS "Users can view own org students" ON students;
DROP POLICY IF EXISTS "Users can manage own org students" ON students;
DROP POLICY IF EXISTS "Users can view own org tests" ON tests;
DROP POLICY IF EXISTS "Users can manage own org tests" ON tests;
DROP POLICY IF EXISTS "Users can view own org test_scores" ON test_scores;
DROP POLICY IF EXISTS "Users can manage own org test_scores" ON test_scores;
DROP POLICY IF EXISTS "Users can view own org fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "Users can manage own org fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "Users can view own org attendance" ON attendance;
DROP POLICY IF EXISTS "Users can manage own org attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own org expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own org expenses" ON expenses;

-- Profiles policies
-- Users can create their own profile during signup
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Organizations policies
-- Users can create organizations they own
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT 
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Owners can view their organizations (PRIMARY - ensures INSERT visibility)
CREATE POLICY "Owners can view own organizations" ON organizations
  FOR SELECT USING (owner_id = auth.uid());

-- Members can view organizations they're part of (SECONDARY - for team access)
CREATE POLICY "Members can view organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users can update/delete organizations they own OR are members of
CREATE POLICY "Users can update own organizations" ON organizations
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own organizations" ON organizations
  FOR DELETE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- User-Organizations policies
-- Users can only create memberships for themselves
CREATE POLICY "Users can join organizations" ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own memberships
CREATE POLICY "Users can view own org memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- Users can update/delete their own memberships
CREATE POLICY "Users can update own org memberships" ON user_organizations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own org memberships" ON user_organizations
  FOR DELETE USING (user_id = auth.uid());

-- Batches policies
CREATE POLICY "Users can view own org batches" ON batches
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org batches" ON batches
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Students policies
CREATE POLICY "Users can view own org students" ON students
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org students" ON students
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Tests policies
CREATE POLICY "Users can view own org tests" ON tests
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org tests" ON tests
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Test Scores policies
CREATE POLICY "Users can view own org test_scores" ON test_scores
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org test_scores" ON test_scores
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Fee Payments policies
CREATE POLICY "Users can view own org fee_payments" ON fee_payments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org fee_payments" ON fee_payments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Attendance policies
CREATE POLICY "Users can view own org attendance" ON attendance
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org attendance" ON attendance
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Expenses policies
CREATE POLICY "Users can view own org expenses" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org expenses" ON expenses
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_batches_updated_at ON batches;
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tests_updated_at ON tests;
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
