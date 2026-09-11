-- 003_batches.sql
create table if not exists public.batches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  course_id uuid references public.courses(id) on delete set null,
  faculty_name text,
  start_date date,
  end_date date,
  start_time text,
  end_time text,
  capacity int default 30,
  status text default 'active' check (status in ('active','upcoming','completed','inactive')),
  is_deleted boolean default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_batches_updated on public.batches;
create trigger trg_batches_updated before update on public.batches for each row execute function public.handle_updated_at();
alter table public.batches enable row level security;
