-- Add warranty_months column (safe to run even if it already exists)
alter table public.receipts
  add column if not exists warranty_months int;
