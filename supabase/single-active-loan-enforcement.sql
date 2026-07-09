-- Single active loan enforcement — diagnose + deploy
-- Run in Supabase SQL Editor (safe to re-run)

-- ============================================================
-- 1. DIAGNOSTICS (read results in the query output)
-- ============================================================

-- A) Is the block trigger installed?
SELECT
  t.tgname AS trigger_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE t.tgenabled::text
  END AS state,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.loan_requests'::regclass
  AND NOT t.tgisinternal
  AND t.tgname = 'loan_requests_single_active';

-- B) Which enforcement function exists?
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('prevent_multiple_active_loans', 'enforce_single_active_loan')
ORDER BY proname;

-- C) Clients with more than one open loan (should return zero rows when enforced)
SELECT
  lr.user_id,
  MAX(lr.full_name) AS full_name,
  MAX(lr.email) AS email,
  COUNT(*) AS open_loans,
  array_agg(lr.status ORDER BY lr.created_at) AS statuses,
  array_agg(lr.created_at::date ORDER BY lr.created_at) AS dates
FROM public.loan_requests lr
WHERE lr.user_id IS NOT NULL
  AND lr.status NOT IN ('rejected', 'paid', 'discontinued')
GROUP BY lr.user_id
HAVING COUNT(*) > 1
ORDER BY open_loans DESC;

-- ============================================================
-- 2. FIX — block a second application while a loan is still open
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_single_active_loan()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.loan_requests
    WHERE user_id = NEW.user_id
      AND id IS DISTINCT FROM NEW.id
      AND status NOT IN ('rejected', 'paid', 'discontinued')
  ) THEN
    RAISE EXCEPTION 'You already have an active loan application or open loan.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_single_active ON public.loan_requests;

CREATE TRIGGER loan_requests_single_active
  BEFORE INSERT ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_loan();

-- Retire legacy function name (optional cleanup)
DROP FUNCTION IF EXISTS public.prevent_multiple_active_loans();

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 3. VERIFY (should show trigger + zero duplicate rows)
-- ============================================================

SELECT
  t.tgname AS trigger_name,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.loan_requests'::regclass
  AND NOT t.tgisinternal
  AND t.tgname = 'loan_requests_single_active';

SELECT
  lr.user_id,
  MAX(lr.full_name) AS full_name,
  COUNT(*) AS open_loans
FROM public.loan_requests lr
WHERE lr.user_id IS NOT NULL
  AND lr.status NOT IN ('rejected', 'paid', 'discontinued')
GROUP BY lr.user_id
HAVING COUNT(*) > 1;
