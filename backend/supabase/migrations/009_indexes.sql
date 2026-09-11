-- 009_indexes.sql
create index if not exists idx_students_code on public.students (student_code);
create index if not exists idx_students_name on public.students (full_name);
create index if not exists idx_students_phone on public.students (phone);
create index if not exists idx_students_email on public.students (email);
create index if not exists idx_students_batch on public.students (batch_id);
create index if not exists idx_students_course on public.students (course_id);
create index if not exists idx_students_deleted on public.students (is_deleted);

create index if not exists idx_monthly_student on public.monthly_fees (student_id);
create index if not exists idx_monthly_year_month on public.monthly_fees (year, month);
create index if not exists idx_monthly_status on public.monthly_fees (status);
create index if not exists idx_monthly_due on public.monthly_fees (due_date);

create index if not exists idx_payments_student on public.payments (student_id);
create index if not exists idx_payments_monthly on public.payments (monthly_fee_id);
create index if not exists idx_payments_date on public.payments (payment_date);
create index if not exists idx_payments_receipt on public.payments (receipt_number);

create index if not exists idx_audit_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_user on public.audit_logs (user_id);
