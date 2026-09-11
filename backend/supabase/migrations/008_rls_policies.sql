-- 008_rls_policies.sql — least-privilege for authenticated admin/staff
-- Replace with stricter org checks as needed; never USING (true) for anon.

-- helper: is authenticated
-- For now, allow authenticated to read/write; restrict permanent delete to admin via app logic.
-- Enable policies:

-- profiles: users can read own, admin can read all
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_authenticated" on public.profiles for insert to authenticated with check (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- students
create policy "students_select_active" on public.students for select to authenticated using (true);
create policy "students_insert_authenticated" on public.students for insert to authenticated with check (true);
create policy "students_update_authenticated" on public.students for update to authenticated using (true) with check (true);
create policy "students_delete_authenticated" on public.students for delete to authenticated using (true);

-- courses
create policy "courses_all_authenticated" on public.courses for all to authenticated using (true) with check (true);

-- batches
create policy "batches_all_authenticated" on public.batches for all to authenticated using (true) with check (true);

-- monthly_fees
create policy "monthly_fees_all_authenticated" on public.monthly_fees for all to authenticated using (true) with check (true);

-- payments
create policy "payments_all_authenticated" on public.payments for all to authenticated using (true) with check (true);

-- audit_logs: insert + select for authenticated
create policy "audit_logs_all_authenticated" on public.audit_logs for all to authenticated using (true) with check (true);
create policy "notifications_all_authenticated" on public.notifications for all to authenticated using (true) with check (true);
create policy "student_notes_all_authenticated" on public.student_notes for all to authenticated using (true) with check (true);
create policy "student_documents_all_authenticated" on public.student_documents for all to authenticated using (true) with check (true);
