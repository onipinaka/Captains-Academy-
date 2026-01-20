-- Supabase SQL Schema for Coaching Center ERP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Batches table
CREATE TABLE batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE test_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'present',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- Fee Payments table
CREATE TABLE fee_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'present',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, student_id)
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_tests_batch ON tests(batch_id);
CREATE INDEX idx_tests_date ON tests(date);
CREATE INDEX idx_test_scores_test ON test_scores(test_id);
CREATE INDEX idx_test_scores_student ON test_scores(student_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_batch ON attendance(batch_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Enable Row Level Security
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for anon users - adjust for production)
CREATE POLICY "Allow all on batches" ON batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tests" ON tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on test_scores" ON test_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fee_payments" ON fee_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA (to get started)
-- =====================================================
INSERT INTO batches (name, standard, subject, days, monthly_fee, capacity, status) VALUES
('Class 10 - Batch A', '10', 'All Subjects', ARRAY['Mon', 'Wed', 'Fri'], 2000, 30, 'Active'),
('Class 12 - Science', '12', 'Physics, Chemistry, Math', ARRAY['Tue', 'Thu', 'Sat'], 2500, 25, 'Active'),
('Class 11 - Commerce', '11', 'Accounts, Economics, Business', ARRAY['Mon', 'Wed', 'Fri'], 2000, 25, 'Active');
