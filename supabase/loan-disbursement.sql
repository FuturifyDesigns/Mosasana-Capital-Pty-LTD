-- Loan disbursement details on loan_requests (per application, not sign-up)
-- Run in Supabase SQL Editor after banking-details.sql

ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS disbursement_type TEXT;
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS bank_branch_code TEXT;
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS bank_branch_name TEXT;

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_disbursement_type_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_disbursement_type_check
  CHECK (disbursement_type IS NULL OR disbursement_type IN ('bank', 'mobile'));

-- Stop copying banking fields from sign-up metadata into profiles
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- disbursement_type: 'bank' | 'mobile'
-- bank_name: provider slug (e.g. fnb, orange-money, myzaka)
