-- 005_monthly_fees.sql
create table if not exists public.monthly_fees (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year between 2000 and 2100),
  fee_amount numeric(12,2) not null,
  due_date date not null,
  paid_amount numeric(12,2) default 0,
  pending_amount numeric(12,2) generated always as (fee_amount - paid_amount) stored,
  status text default 'upcoming' check (status in ('upcoming','due_soon','due_today','partial','paid','overdue')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (student_id, month, year)
);

drop trigger if exists trg_monthly_fees_updated on public.monthly_fees;
create trigger trg_monthly_fees_updated before update on public.monthly_fees for each row execute function public.handle_updated_at();

create or replace function public.compute_monthly_fee_status() returns trigger as $$
declare d date; cur date := current_date;
begin
  d := new.due_date;
  if new.paid_amount >= new.fee_amount then new.status := 'paid';
  elsif new.paid_amount > 0 and new.paid_amount < new.fee_amount then
    if cur > d then new.status := 'partial'; -- partial but overdue still partial
    else new.status := 'partial'; end if;
  elsif cur > d then new.status := 'overdue';
  elsif cur = d then new.status := 'due_today';
  elsif cur >= d - interval '5 days' then new.status := 'due_soon';
  else new.status := 'upcoming'; end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_monthly_fees_status on public.monthly_fees;
create trigger trg_monthly_fees_status before insert or update on public.monthly_fees for each row execute function public.compute_monthly_fee_status();

alter table public.monthly_fees enable row level security;
