-- ============================================================
-- FIX LIVE DATABASE — run this entire file once in Supabase SQL Editor
-- https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/sql
-- ============================================================

-- 1. site_content (fixes 404 on /rest/v1/site_content)
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image')),
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site content" ON public.site_content;
CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert site content" ON public.site_content;
CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update site content" ON public.site_content;
CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. loan_requests — columns added in recent updates
ALTER TABLE public.loan_requests
  ADD COLUMN IF NOT EXISTS id_type TEXT NOT NULL DEFAULT 'national_id',
  ADD COLUMN IF NOT EXISTS term_months INTEGER,
  ADD COLUMN IF NOT EXISTS total_repayable NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_id_type_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_id_type_check CHECK (id_type IN ('national_id', 'passport'));

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_term_months_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_term_months_check CHECK (term_months IS NULL OR term_months BETWEEN 1 AND 12);

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_status_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_status_check
  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed', 'paid'));

-- 3. profiles — banned flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- 4. Loan insert policy — signed-in users submit for themselves
DROP POLICY IF EXISTS "Anyone can submit loan request" ON public.loan_requests;
DROP POLICY IF EXISTS "Users can submit own loan request" ON public.loan_requests;
CREATE POLICY "Users can submit own loan request"
  ON public.loan_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. ID document storage bucket + upload policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read ID documents" ON storage.objects;

-- Users upload ID documents (any authenticated user)
CREATE POLICY "Authenticated can upload ID documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id-documents');

CREATE POLICY "Admins can read ID documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'id-documents' AND public.is_admin());

-- 6. Admin user management RPCs (fixes 404 on admin_list_users)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
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

-- Admins can list all profiles (fallback if RPC missing)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 7. Reminder log (for admin “reminders sent” + email job)
CREATE TABLE IF NOT EXISTS public.loan_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loan_requests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  channel TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, kind, channel)
);

ALTER TABLE public.loan_reminder_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reminder log" ON public.loan_reminder_log;
CREATE POLICY "Admins can view reminder log"
  ON public.loan_reminder_log FOR SELECT
  USING (public.is_admin());

-- 8. Reload PostgREST schema cache (so new columns/functions are visible immediately)
NOTIFY pgrst, 'reload schema';
