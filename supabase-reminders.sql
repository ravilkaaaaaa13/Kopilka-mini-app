create extension if not exists pgcrypto;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  title text not null,
  amount numeric(14, 2) not null default 0,
  reminder_datetime timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint reminders_status_check check (status in ('active', 'done', 'deleted'))
);

create index if not exists reminders_user_datetime_idx
  on public.reminders (telegram_user_id, reminder_datetime);

create index if not exists reminders_status_idx
  on public.reminders (status);
