-- 010_full_schema.sql — Complete schema for Quantum Fee Management
-- Run this ONCE to set up all tables, triggers, RLS policies, and auth integration.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
DROP TABLE IF EXISTS public.student_documents CASCADE;
DROP TABLE IF EXISTS public.student_notes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.monthly_fees CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.fee_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin','staff','user')) DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
y
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- COURSES
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  course_fee NUMERIC(12,2) DEFAULT 0,
  monthly_fee NUMERIC(12,2) DEFAULT 0,
  quarterly_fee NUMERIC(12,2) DEFAULT 0,
  half_yearly_fee NUMERIC(12,2) DEFAULT 0,
  yearly_fee NUMERIC(12,2) DEFAULT 0,
  admission_fee NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_name_active
  ON public.courses (lower(name)) WHERE is_deleted = false;

DROP TRIGGER IF EXISTS trg_courses_updated ON public.courses;
CREATE TRIGGER trg_courses_updated
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- BATCHES
-- ============================================
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT,
  faculty_name TEXT,
  days TEXT,
  start_date DATE,
  end_date DATE,
  start_time TEXT,
  end_time TEXT,
  room TEXT,
  capacity INT DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','upcoming','completed','inactive')),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_batches_updated ON public.batches;
CREATE TRIGGER trg_batches_updated
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  alternate_phone TEXT,
  guardian_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male','Female','Other')),
  address TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  batch_name TEXT,
  teacher TEXT,
  subject TEXT,
  joining_date DATE DEFAULT current_date,
  monthly_fee NUMERIC(12,2) DEFAULT 0,
  total_course_fee NUMERIC(12,2) DEFAULT 0,
  admission_fee NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  final_fee NUMERIC(12,2) DEFAULT 0,
  payment_plan TEXT DEFAULT 'Monthly',
  first_due_date DATE,
  monthly_due_day INT DEFAULT 10,
  next_due_date DATE,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  photo_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate student_code
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER AS $$
DECLARE max_num INT; new_code TEXT;
BEGIN
  IF NEW.student_code IS NOT NULL AND NEW.student_code <> '' THEN RETURN NEW; END IF;
  SELECT COALESCE(MAX((REGEXP_MATCH(student_code, 'STU(\d+)'))[1]::INT), 0) INTO max_num FROM public.students;
  new_code := 'STU' || LPAD((max_num + 1)::TEXT, 3, '0');
  NEW.student_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_code ON public.students;
CREATE TRIGGER trg_students_code
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_code();

DROP TRIGGER IF EXISTS trg_students_updated ON public.students;
CREATE TRIGGER trg_students_updated
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- MONTHLY FEES
-- ============================================
CREATE TABLE public.monthly_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  fee_amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  pending_amount NUMERIC(12,2) GENERATED ALWAYS AS (fee_amount - paid_amount) STORED,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','due_soon','due_today','partial','paid','overdue')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, month, year)
);

DROP TRIGGER IF EXISTS trg_monthly_fees_updated ON public.monthly_fees;
CREATE TRIGGER trg_monthly_fees_updated
  BEFORE UPDATE ON public.monthly_fees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-compute monthly fee status
CREATE OR REPLACE FUNCTION public.compute_monthly_fee_status()
RETURNS TRIGGER AS $$
DECLARE d DATE; cur DATE := current_date;
BEGIN
  d := NEW.due_date;
  IF NEW.paid_amount >= NEW.fee_amount THEN NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.fee_amount THEN
    NEW.status := 'partial';
  ELSIF cur > d THEN NEW.status := 'overdue';
  ELSIF cur = d THEN NEW.status := 'due_today';
  ELSIF cur >= d - INTERVAL '5 days' THEN NEW.status := 'due_soon';
  ELSE NEW.status := 'upcoming';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_monthly_fees_status ON public.monthly_fees;
CREATE TRIGGER trg_monthly_fees_status
  BEFORE INSERT OR UPDATE ON public.monthly_fees
  FOR EACH ROW EXECUTE FUNCTION public.compute_monthly_fee_status();

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  monthly_fee_id UUID REFERENCES public.monthly_fees(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT current_date,
  payment_method TEXT CHECK (payment_method IN ('Cash','UPI','Bank Transfer','Card','Other')) DEFAULT 'Cash',
  transaction_id TEXT,
  receipt_number TEXT UNIQUE NOT NULL,
  payment_for TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE max_num INT; new_code TEXT;
BEGIN
  IF NEW.receipt_number IS NOT NULL AND NEW.receipt_number <> '' THEN RETURN NEW; END IF;
  SELECT COALESCE(MAX((REGEXP_MATCH(receipt_number, 'QTM-(\d+)'))[1]::INT), 0) INTO max_num FROM public.payments;
  NEW.receipt_number := 'QTM-' || LPAD((max_num + 1)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_receipt ON public.payments;
CREATE TRIGGER trg_payments_receipt
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

-- After payment, roll up to monthly_fees.paid_amount
CREATE OR REPLACE FUNCTION public.rollup_monthly_fee()
RETURNS TRIGGER AS $$
DECLARE mf_id UUID; sum_paid NUMERIC;
BEGIN
  mf_id := COALESCE(NEW.monthly_fee_id, OLD.monthly_fee_id);
  IF mf_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT COALESCE(SUM(amount), 0) INTO sum_paid FROM public.payments WHERE monthly_fee_id = mf_id;
  UPDATE public.monthly_fees SET paid_amount = sum_paid WHERE id = mf_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_rollup_ins ON public.payments;
CREATE TRIGGER trg_payments_rollup_ins
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.rollup_monthly_fee();
DROP TRIGGER IF EXISTS trg_payments_rollup_upd ON public.payments;
CREATE TRIGGER trg_payments_rollup_upd
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.rollup_monthly_fee();
DROP TRIGGER IF EXISTS trg_payments_rollup_del ON public.payments;
CREATE TRIGGER trg_payments_rollup_del
  AFTER DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.rollup_monthly_fee();

DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDENT NOTES
-- ============================================
CREATE TABLE public.student_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDENT DOCUMENTS
-- ============================================
CREATE TABLE public.student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FEE SETTINGS
-- ============================================
CREATE TABLE public.fee_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_fee_settings_updated ON public.fee_settings;
CREATE TRIGGER trg_fee_settings_updated
  BEFORE UPDATE ON public.fee_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_settings ENABLE ROW LEVEL SECURITY;

-- Policies: service_role bypasses RLS. For anon, restrict. For authenticated, allow.
-- profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
CREATE POLICY "profiles_insert_authenticated" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- students
DROP POLICY IF EXISTS "students_all_authenticated" ON public.students;
CREATE POLICY "students_all_authenticated" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- courses
DROP POLICY IF EXISTS "courses_all_authenticated" ON public.courses;
CREATE POLICY "courses_all_authenticated" ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- batches
DROP POLICY IF EXISTS "batches_all_authenticated" ON public.batches;
CREATE POLICY "batches_all_authenticated" ON public.batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- monthly_fees
DROP POLICY IF EXISTS "monthly_fees_all_authenticated" ON public.monthly_fees;
CREATE POLICY "monthly_fees_all_authenticated" ON public.monthly_fees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- payments
DROP POLICY IF EXISTS "payments_all_authenticated" ON public.payments;
CREATE POLICY "payments_all_authenticated" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_all_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_all_authenticated" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- notifications
DROP POLICY IF EXISTS "notifications_all_authenticated" ON public.notifications;
CREATE POLICY "notifications_all_authenticated" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- student_notes
DROP POLICY IF EXISTS "student_notes_all_authenticated" ON public.student_notes;
CREATE POLICY "student_notes_all_authenticated" ON public.student_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- student_documents
DROP POLICY IF EXISTS "student_documents_all_authenticated" ON public.student_documents;
CREATE POLICY "student_documents_all_authenticated" ON public.student_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- fee_settings
DROP POLICY IF EXISTS "fee_settings_all_authenticated" ON public.fee_settings;
CREATE POLICY "fee_settings_all_authenticated" ON public.fee_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_code ON public.students (student_code);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students (full_name);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students (phone);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (email);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students (batch_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON public.students (course_id);
CREATE INDEX IF NOT EXISTS idx_students_deleted ON public.students (is_deleted);

CREATE INDEX IF NOT EXISTS idx_monthly_student ON public.monthly_fees (student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_year_month ON public.monthly_fees (year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_status ON public.monthly_fees (status);
CREATE INDEX IF NOT EXISTS idx_monthly_due ON public.monthly_fees (due_date);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_monthly ON public.payments (monthly_fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments (receipt_number);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_fee_settings_key ON public.fee_settings (key);

-- ============================================
-- REALTIME (for live updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_fees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
