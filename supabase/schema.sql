-- Mosasana Capital Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/sql

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  physical_address TEXT,
  disbursement_type TEXT CHECK (disbursement_type IS NULL OR disbursement_type IN ('bank', 'mobile')),
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  bank_branch_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan requests
CREATE TABLE IF NOT EXISTS public.loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_type TEXT NOT NULL DEFAULT 'national_id' CHECK (id_type IN ('national_id', 'passport')),
  id_photo_path TEXT,
  physical_address TEXT NOT NULL,
  loan_amount NUMERIC(12,2) NOT NULL CHECK (loan_amount >= 500 AND loan_amount <= 10000),
  loan_purpose TEXT NOT NULL,
  term_months INTEGER CHECK (term_months BETWEEN 1 AND 12),
  employment_status TEXT NOT NULL,
  monthly_income NUMERIC(12,2),
  disbursement_type TEXT CHECK (disbursement_type IS NULL OR disbursement_type IN ('bank', 'mobile')),
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  bank_branch_name TEXT,
  status TEXT NOT NULL DEFAULT 'reviewing' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed', 'paid')),
  total_repayable NUMERIC(12,2),
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  admin_notes TEXT,
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact enquiries
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER loan_requests_updated_at
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contact_enquiries_updated_at
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
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
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Loan requests policies
-- Applying requires a signed-in account, and the row must belong to that user.
CREATE POLICY "Users can submit own loan request"
  ON public.loan_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own loan requests"
  ON public.loan_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update loan requests"
  ON public.loan_requests FOR UPDATE
  USING (public.is_admin());

-- Contact enquiries policies
CREATE POLICY "Anyone can submit enquiry"
  ON public.contact_enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view enquiries"
  ON public.contact_enquiries FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update enquiries"
  ON public.contact_enquiries FOR UPDATE
  USING (public.is_admin());

-- Storage bucket for ID documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated can upload ID documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id-documents');

CREATE POLICY "Admins can read ID documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'id-documents' AND public.is_admin());

-- ============================================================
-- Editable site content (CMS) — lets admins edit text & images
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image')),
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read published site content
CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT
  USING (true);

-- Only admins can create / edit content
CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public storage bucket for editable site images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view site images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());

CREATE POLICY "Admins can update site images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loan_requests_user_id ON public.loan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON public.loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_created_at ON public.loan_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_status ON public.contact_enquiries(status);

-- ============================================================
-- Loan repayment tracking + one-active-loan-at-a-time rule
-- ============================================================

-- Auto-mark a loan as fully paid once the amount paid covers the total repayable.
CREATE OR REPLACE FUNCTION public.loan_auto_mark_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_repayable IS NOT NULL
     AND NEW.total_repayable > 0
     AND COALESCE(NEW.amount_paid, 0) >= NEW.total_repayable THEN
    NEW.status := 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS loan_requests_auto_paid ON public.loan_requests;
CREATE TRIGGER loan_requests_auto_paid
  BEFORE INSERT OR UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.loan_auto_mark_paid();

-- Block a new loan while the same user still has an unsettled (active) loan.
-- Closed = paid, rejected, or discontinued.
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

DROP FUNCTION IF EXISTS public.prevent_multiple_active_loans();

-- ------------------------------------------------------------
-- MIGRATION for databases created before repayment tracking.
-- Safe to run repeatedly.
-- ------------------------------------------------------------
ALTER TABLE public.loan_requests
  ADD COLUMN IF NOT EXISTS total_repayable NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_status_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_status_check
  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed', 'paid'));

ALTER TABLE public.loan_requests
  ADD COLUMN IF NOT EXISTS id_type TEXT NOT NULL DEFAULT 'national_id';
ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_id_type_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_id_type_check CHECK (id_type IN ('national_id', 'passport'));

-- ============================================================
-- Unique phone numbers: one account per phone number
-- ============================================================

-- Normalise a phone number (strip spaces/symbols and a leading 267 country code)
CREATE OR REPLACE FUNCTION public.normalize_phone(p TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(regexp_replace(COALESCE(p, ''), '\D', '', 'g'), '^267', '')
$$;

-- Enforce uniqueness at the database level (hard guarantee)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (public.normalize_phone(phone))
  WHERE phone IS NOT NULL AND phone <> '';

-- Callable by the sign-up form (anon) to check availability without exposing data
CREATE OR REPLACE FUNCTION public.normalize_id_number(p_id TEXT, p_type TEXT DEFAULT 'national_id')
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(p_type, 'national_id') = 'passport' THEN
      upper(regexp_replace(trim(COALESCE(p_id, '')), '\s', '', 'g'))
    ELSE regexp_replace(COALESCE(p_id, ''), '\D', '', 'g')
  END
$$;

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

-- ============================================================
-- Admin user management + loan term + realtime
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
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
ALTER TABLE public.loan_requests ADD COLUMN IF NOT EXISTS term_months INTEGER;
ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_term_months_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_term_months_check CHECK (term_months IS NULL OR term_months BETWEEN 1 AND 12);

-- List every user (admins only) with email + loan counts. Uses the auth schema,
-- so it must run as a definer with access to auth.users.
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

-- Ban / unban a user (blocks their ability to sign in).
CREATE OR REPLACE FUNCTION public.admin_set_ban(target UUID, ban BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'You cannot ban your own account';
  END IF;
  UPDATE public.profiles SET banned = ban WHERE id = target;
  UPDATE auth.users
    SET banned_until = CASE WHEN ban THEN 'infinity'::timestamptz ELSE NULL END
    WHERE id = target;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_ban(UUID, BOOLEAN) TO authenticated;

-- Permanently delete a user account (cascades to their profile).
CREATE OR REPLACE FUNCTION public.admin_delete_user(target UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;
  DELETE FROM auth.users WHERE id = target;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- Enable realtime so the admin portal & dashboards update live.
ALTER TABLE public.loan_requests REPLICA IDENTITY FULL;
ALTER TABLE public.contact_enquiries REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_enquiries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_enquiries;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_reminder_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_reminder_log;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================
-- Repayment reminders (email via Brevo SMTP) — see supabase/functions/loan-reminders
-- ============================================================

-- Logs each reminder we send so the scheduled job never sends the same
-- milestone twice per channel.
CREATE TABLE IF NOT EXISTS public.loan_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loan_requests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,      -- e.g. d-7, d-3, d-1, d-0, overdue
  channel TEXT NOT NULL,   -- email
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, kind, channel)
);

ALTER TABLE public.loan_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder log"
  ON public.loan_reminder_log FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------
-- Schedule the reminder Edge Function to run once a day (08:00 UTC).
-- The endpoint is protected by a shared secret (CRON_SECRET) which we store in
-- Supabase Vault (encrypted at rest) rather than inline in the job definition.
-- Enable the pg_cron and pg_net extensions first, then run this ONCE.
-- ------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- -- Store the cron secret in Vault (use the same value you set as the
-- -- CRON_SECRET function secret). Run once:
-- SELECT vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret');
--
-- SELECT cron.schedule(
--   'loan-reminders-daily',
--   '0 8 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/loan-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'reminders_cron_secret')
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- To promote users to admin, run AFTER they have registered (so the account exists):
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('tnkile@mosasanacapital.com', 'ondiweni@mosasanacapital.com')
);
