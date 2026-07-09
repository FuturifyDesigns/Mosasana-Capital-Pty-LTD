-- Security hardening: storage scoping, RPC lockdown, enquiry validation.
-- Run in Supabase SQL Editor after fix-live-db.sql and fix-loan-discontinue.sql

-- ============================================================
-- 1. ID document storage — users may only write to their own folder
-- ============================================================
DROP POLICY IF EXISTS "Anyone can upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read ID documents" ON storage.objects;

CREATE POLICY "Users can upload own ID documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'id-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own ID documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'id-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'id-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can read ID documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'id-documents' AND public.is_admin());

CREATE POLICY "Admins can delete ID documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'id-documents' AND public.is_admin());

-- ============================================================
-- 2. Contact enquiries — length limits at DB layer
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_contact_enquiry()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.full_name := LEFT(TRIM(COALESCE(NEW.full_name, '')), 120);
  NEW.email := LEFT(TRIM(COALESCE(NEW.email, '')), 255);
  NEW.phone := LEFT(TRIM(COALESCE(NEW.phone, '')), 20);
  NEW.subject := LEFT(TRIM(COALESCE(NEW.subject, '')), 200);
  NEW.message := LEFT(TRIM(COALESCE(NEW.message, '')), 2000);

  IF NEW.full_name = '' OR NEW.email = '' OR NEW.subject = '' OR NEW.message = '' THEN
    RAISE EXCEPTION 'Invalid enquiry data';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_enquiries_validate ON public.contact_enquiries;
CREATE TRIGGER contact_enquiries_validate
  BEFORE INSERT OR UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_enquiry();

-- ============================================================
-- 3. Profiles — never allow self-promotion to admin via UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ============================================================
-- 4. Loan requests — users cannot change status or link to another user
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_loan_request_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid();
    NEW.status := 'reviewing';
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized to modify loan requests';
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_protect_fields ON public.loan_requests;
CREATE TRIGGER loan_requests_protect_fields
  BEFORE INSERT OR UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_loan_request_fields();

-- ============================================================
-- 5. Lock down admin RPCs — authenticated only, not anonymous
-- ============================================================
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_list_users',
        'admin_set_ban',
        'admin_delete_user',
        'admin_discontinue_loan',
        'admin_delete_loan_request',
        'record_loan_payment'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
  END LOOP;
END $$;

-- ============================================================
-- 6. Block direct inserts into loan_payments (use record_loan_payment RPC)
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert loan payments" ON public.loan_payments;
CREATE POLICY "No direct loan payment inserts"
  ON public.loan_payments FOR INSERT
  WITH CHECK (false);

NOTIFY pgrst, 'reload schema';
