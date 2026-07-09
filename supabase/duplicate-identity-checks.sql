-- Duplicate identity checks (email, phone, ID number)
-- Run in Supabase SQL Editor (safe to re-run)

-- Remove legacy overload that ignored the current user
DROP FUNCTION IF EXISTS public.phone_taken(TEXT);

-- Normalise Botswana phone: digits only, strip leading 267 country code
CREATE OR REPLACE FUNCTION public.normalize_phone(p TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(regexp_replace(COALESCE(p, ''), '\D', '', 'g'), '^267', '')
$$;

GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO anon, authenticated;

-- Passport: uppercase, no spaces. National ID: digits only.
CREATE OR REPLACE FUNCTION public.normalize_id_number(p_id TEXT, p_type TEXT DEFAULT 'national_id')
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(p_type, 'national_id') = 'passport' THEN
      upper(regexp_replace(trim(COALESCE(p_id, '')), '\s', '', 'g'))
    ELSE regexp_replace(COALESCE(p_id, ''), '\D', '', 'g')
  END
$$;

-- Treat orphan loan rows (no user_id) as owned when email/phone matches the excluded user
CREATE OR REPLACE FUNCTION public.loan_request_owned_by_user(
  p_loan_user_id UUID,
  p_loan_email TEXT,
  p_loan_phone TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT
    p_user_id IS NOT NULL
    AND (
      p_loan_user_id = p_user_id
      OR (
        p_loan_user_id IS NULL
        AND (
          lower(trim(COALESCE(p_loan_email, ''))) = (
            SELECT lower(trim(email))
            FROM auth.users
            WHERE id = p_user_id
          )
          OR public.normalize_phone(p_loan_phone) = (
            SELECT public.normalize_phone(phone)
            FROM public.profiles
            WHERE id = p_user_id
          )
        )
      )
    )
$$;

-- Phone: profiles + prior loan applications (exclude same user when updating)
CREATE OR REPLACE FUNCTION public.phone_taken(
  p_phone TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE phone IS NOT NULL
      AND phone <> ''
      AND public.normalize_phone(phone) = public.normalize_phone(p_phone)
      AND (p_exclude_user_id IS NULL OR id <> p_exclude_user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.loan_requests lr
    WHERE lr.phone IS NOT NULL
      AND lr.phone <> ''
      AND public.normalize_phone(lr.phone) = public.normalize_phone(p_phone)
      AND NOT public.loan_request_owned_by_user(lr.user_id, lr.email, lr.phone, p_exclude_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.email_taken(
  p_email TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(trim(email)) = lower(trim(p_email))
      AND (p_exclude_user_id IS NULL OR id <> p_exclude_user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.loan_requests lr
    WHERE lower(trim(lr.email)) = lower(trim(p_email))
      AND NOT public.loan_request_owned_by_user(lr.user_id, lr.email, lr.phone, p_exclude_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.id_number_taken(
  p_id_number TEXT,
  p_id_type TEXT DEFAULT 'national_id',
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.loan_requests lr
    WHERE lr.id_number IS NOT NULL
      AND trim(lr.id_number) <> ''
      AND public.normalize_id_number(lr.id_number, lr.id_type)
        = public.normalize_id_number(p_id_number, p_id_type)
      AND NOT public.loan_request_owned_by_user(lr.user_id, lr.email, lr.phone, p_exclude_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.loan_request_owned_by_user(UUID, TEXT, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_id_number(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_taken(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_taken(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.id_number_taken(TEXT, TEXT, UUID) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
