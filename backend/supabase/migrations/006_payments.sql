-- 006_payments.sql
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  monthly_fee_id uuid references public.monthly_fees(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text check (payment_method in ('Cash','UPI','Bank Transfer','Card','Other')) default 'Cash',
  transaction_id text,
  receipt_number text unique not null,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.generate_receipt_number() returns trigger as $$
declare max_num int; new_code text;
begin
  if new.receipt_number is not null and new.receipt_number <> '' then return new; end if;
  select coalesce(max((regexp_match(receipt_number, 'QTM-(\d+)'))[1]::int),0) into max_num from public.payments;
  new.receipt_number := 'QTM-' || lpad((max_num+1)::text,4,'0');
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_payments_receipt on public.payments;
create trigger trg_payments_receipt before insert on public.payments for each row execute function public.generate_receipt_number();

-- after payment, roll up to monthly_fees.paid_amount
create or replace function public.rollup_monthly_fee() returns trigger as $$
declare mf_id uuid; sum_paid numeric;
begin
  mf_id := coalesce(new.monthly_fee_id, old.monthly_fee_id);
  if mf_id is null then return coalesce(new, old); end if;
  select coalesce(sum(amount),0) into sum_paid from public.payments where monthly_fee_id = mf_id;
  update public.monthly_fees set paid_amount = sum_paid where id = mf_id;
  return coalesce(new, old);
end; $$ language plpgsql;

drop trigger if exists trg_payments_rollup_ins on public.payments;
create trigger trg_payments_rollup_ins after insert on public.payments for each row execute function public.rollup_monthly_fee();
drop trigger if exists trg_payments_rollup_upd on public.payments;
create trigger trg_payments_rollup_upd after update on public.payments for each row execute function public.rollup_monthly_fee();
drop trigger if exists trg_payments_rollup_del on public.payments;
create trigger trg_payments_rollup_del after delete on public.payments for each row execute function public.rollup_monthly_fee();

drop trigger if exists trg_payments_updated on public.payments;
create trigger trg_payments_updated before update on public.payments for each row execute function public.handle_updated_at();

alter table public.payments enable row level security;
