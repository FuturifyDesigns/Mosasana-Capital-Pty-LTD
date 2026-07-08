-- Run in Supabase SQL Editor to align live DB with P10,000 loan cap.
-- Step 1: Review any rows that break the new rule (optional — run alone first)
-- SELECT id, loan_amount, status, created_at
-- FROM public.loan_requests
-- WHERE loan_amount > 10000 OR loan_amount < 500
-- ORDER BY created_at DESC;

-- Step 2: Fix rows above P10,000
-- Active/historical loans: cap at 10,000 (preserves the record; adjust manually if needed)
UPDATE public.loan_requests
SET loan_amount = 10000
WHERE loan_amount > 10000;

-- Step 3: Fix rows below P500 (unlikely; bump to minimum)
UPDATE public.loan_requests
SET loan_amount = 500
WHERE loan_amount < 500;

-- Step 4: Apply the new check constraint
ALTER TABLE public.loan_requests
  DROP CONSTRAINT IF EXISTS loan_requests_loan_amount_check;

ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_loan_amount_check
  CHECK (loan_amount >= 500 AND loan_amount <= 10000);

-- Step 5: Google sign-in — profile names from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
