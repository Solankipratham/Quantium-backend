-- 002_courses.sql
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  duration text,
  course_fee numeric(12,2) default 0,
  status text default 'active' check (status in ('active','inactive')),
  is_deleted boolean default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists idx_courses_name_active on public.courses (lower(name)) where is_deleted = false;
drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses for each row execute function public.handle_updated_at();
alter table public.courses enable row level security;
