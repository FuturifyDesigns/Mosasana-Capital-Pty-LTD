-- ============================================================
-- Mosasana Capital — Banking & wallet details migration
-- Run this entire script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/sql
--
-- Safe to run more than once (uses IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- 1) Add columns to profiles (bank accounts + Orange Money / MyZaka)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disbursement_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_branch_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_branch_name TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_disbursement_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_disbursement_type_check
  CHECK (disbursement_type IS NULL OR disbursement_type IN ('bank', 'mobile'));

-- 2) Copy banking details from auth metadata when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    disbursement_type,
    bank_name,
    bank_account_name,
    bank_account_number,
    bank_branch_code,
    bank_branch_name,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'disbursement_type', ''),
    NULLIF(NEW.raw_user_meta_data->>'bank_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'bank_account_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'bank_account_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'bank_branch_code', ''),
    NULLIF(NEW.raw_user_meta_data->>'bank_branch_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Admin user list — includes bank / wallet details
-- Must drop first when adding new OUT columns (PostgreSQL cannot change return type in-place).
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  disbursement_type TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  bank_branch_name TEXT,
  role TEXT,
  banned BOOLEAN,
  created_at TIMESTAMPTZ,
  email TEXT,
  loan_count BIGINT,
  active_loan_count BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT
    p.id,
    p.full_name,
    p.phone,
    p.disbursement_type,
    p.bank_name,
    p.bank_account_name,
    p.bank_account_number,
    p.bank_branch_code,
    p.bank_branch_name,
    p.role,
    p.banned,
    p.created_at,
    u.email::text,
    (SELECT count(*) FROM public.loan_requests l WHERE l.user_id = p.id),
    (SELECT count(*) FROM public.loan_requests l WHERE l.user_id = p.id AND l.status NOT IN ('rejected', 'paid'))
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE public.is_admin()
  ORDER BY p.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- ============================================================
-- Provider values stored in bank_name (for reference):
--
-- Banks:
--   absa, access, bancabc, bank-gaborone, bank-of-baroda,
--   bank-of-india, bbs, first-capital, fnb, stanbic, standard-chartered
--
-- Mobile money:
--   orange-money  → Orange Money (8-digit mobile number)
--   myzaka        → MyZaka wallet (8-digit mobile number)
--
-- disbursement_type:
--   bank   → traditional bank account (branch code + name required)
--   mobile → Orange Money or MyZaka
-- ============================================================
