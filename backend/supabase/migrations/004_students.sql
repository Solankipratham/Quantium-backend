-- 004_students.sql
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  student_code text unique not null,
  full_name text not null,
  email text,
  phone text,
  alternate_phone text,
  date_of_birth date,
  gender text check (gender in ('Male','Female','Other')),
  address text,
  course_id uuid references public.courses(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  course_name text,
  batch_name text,
  joining_date date default current_date,
  monthly_fee numeric(12,2) default 0,
  total_course_fee numeric(12,2) default 0,
  status text default 'active' check (status in ('active','inactive')),
  notes text,
  photo_url text,
  is_deleted boolean default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.generate_student_code() returns trigger as $$
declare max_num int; new_code text;
begin
  if new.student_code is not null and new.student_code <> '' then return new; end if;
  select coalesce(max((regexp_match(student_code, 'STU(\d+)'))[1]::int),0) into max_num from public.students;
  new_code := 'STU' || lpad((max_num+1)::text,3,'0');
  new.student_code := new_code;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_students_code on public.students;
create trigger trg_students_code before insert on public.students for each row execute function public.generate_student_code();

drop trigger if exists trg_students_updated on public.students;
create trigger trg_students_updated before update on public.students for each row execute function public.handle_updated_at();

alter table public.students enable row level security;
