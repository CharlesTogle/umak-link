alter table public.user_table
  add column if not exists claim_manual_entry_code_expires_at timestamp with time zone;

comment on column public.user_table.claim_manual_entry_code_expires_at is
  'Expiration timestamp for the short student claim QR/manual entry code.';
