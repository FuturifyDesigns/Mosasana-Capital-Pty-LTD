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

-- 5. ID document uploads — authenticated users only
DROP POLICY IF EXISTS "Anyone can upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload ID documents" ON storage.objects;
CREATE POLICY "Authenticated can upload ID documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id-documents');

-- 6. Reminder log (for admin “reminders sent” + email job)
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

-- 7. Reload PostgREST schema cache (so new columns are visible immediately)
NOTIFY pgrst, 'reload schema';
