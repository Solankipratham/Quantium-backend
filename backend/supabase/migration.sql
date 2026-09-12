-- Quantium Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT DEFAULT '',
  phone TEXT NOT NULL,
  guardian_name TEXT DEFAULT '',
  alternate_phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  course_name TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  batch_name TEXT DEFAULT '',
  teacher TEXT DEFAULT '',
  joining_date TEXT,
  total_course_fee NUMERIC DEFAULT 0,
  monthly_fee NUMERIC DEFAULT 0,
  admission_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  final_fee NUMERIC DEFAULT 0,
  payment_plan TEXT DEFAULT 'Monthly',
  first_due_date TEXT,
  monthly_due_day NUMERIC DEFAULT 10,
  next_due_date TEXT,
  status TEXT DEFAULT 'Active',
  notes TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TEXT,
  deleted_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  payment_date TEXT,
  payment_method TEXT DEFAULT '',
  payment_for TEXT DEFAULT '',
  receipt_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_name TEXT DEFAULT '',
  faculty_name TEXT DEFAULT '',
  days TEXT DEFAULT '',
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  room TEXT DEFAULT '',
  capacity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Courses / Fee Plans table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_fee NUMERIC DEFAULT 0,
  quarterly_fee NUMERIC DEFAULT 0,
  half_yearly_fee NUMERIC DEFAULT 0,
  yearly_fee NUMERIC DEFAULT 0,
  admission_fee NUMERIC DEFAULT 0,
  course_fee NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT '',
  date TEXT,
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  action TEXT DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT '',
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fee settings table
CREATE TABLE IF NOT EXISTS fee_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly fees table
CREATE TABLE IF NOT EXISTS monthly_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  expected NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  pending NUMERIC DEFAULT 0,
  status TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (admin users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_batch_name ON students(batch_name);
CREATE INDEX IF NOT EXISTS idx_students_course_name ON students(course_name);
CREATE INDEX IF NOT EXISTS idx_students_is_deleted ON students(is_deleted);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_fee_settings_key ON fee_settings(key);

-- Enable Row Level Security (RLS) - disabled for backend service role access
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service role (backend) full access
-- The backend uses the service-role key which bypasses RLS by default
-- These policies allow the anon key to read for any public needs
CREATE POLICY "Service role full access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON fee_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON monthly_fees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true) WITH CHECK (true);
