-- 007_audit_logs.sql
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  title text not null,
  message text,
  entity_type text,
  entity_id text,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

create table if not exists public.student_notes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.student_notes enable row level security;

create table if not exists public.student_documents (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size int,
  mime_type text,
  created_at timestamptz default now()
);
alter table public.student_documents enable row level security;
