-- Support partial disbursements while keeping the original requested amount.
-- Existing admin_notes already stores approval/rejection comments shown to clients.
--
-- Run this in Supabase SQL Editor.

ALTER TABLE public.loan_requests
  ADD COLUMN IF NOT EXISTS disbursed_amount NUMERIC(12,2);

ALTER TABLE public.loan_requests
  DROP CONSTRAINT IF EXISTS loan_requests_disbursed_amount_check;

ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_disbursed_amount_check
  CHECK (
    disbursed_amount IS NULL
    OR (
      disbursed_amount > 0
      AND disbursed_amount <= loan_amount
    )
  );

COMMENT ON COLUMN public.loan_requests.disbursed_amount IS
  'Actual amount paid out to the client. Null means use loan_amount.';
