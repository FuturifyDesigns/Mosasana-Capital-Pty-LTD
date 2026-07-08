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

-- ============================================================
-- 9. Interest rate, payment ledger, in-app notifications
-- ============================================================

ALTER TABLE public.loan_requests
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,2);

-- Individual payment records (admin records; customer read-only)
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loan_requests(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loan_payments
  ADD COLUMN IF NOT EXISTS interest_rate_snapshot NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS total_repayable_snapshot NUMERIC(12,2);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);

ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert loan payments" ON public.loan_payments;
CREATE POLICY "Admins can insert loan payments"
  ON public.loan_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all loan payments" ON public.loan_payments;
CREATE POLICY "Admins can view all loan payments"
  ON public.loan_payments FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own loan payments" ON public.loan_payments;
CREATE POLICY "Users can view own loan payments"
  ON public.loan_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loan_requests l
      WHERE l.id = loan_id AND l.user_id = auth.uid()
    )
  );

-- Keep amount_paid in sync with the payment ledger
CREATE OR REPLACE FUNCTION public.sync_loan_amount_paid()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_loan UUID;
BEGIN
  target_loan := COALESCE(NEW.loan_id, OLD.loan_id);
  UPDATE public.loan_requests
  SET amount_paid = COALESCE(
    (SELECT SUM(amount) FROM public.loan_payments WHERE loan_id = target_loan),
    0
  )
  WHERE id = target_loan;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS loan_payments_sync_amount ON public.loan_payments;
CREATE TRIGGER loan_payments_sync_amount
  AFTER INSERT OR DELETE ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_loan_amount_paid();

-- In-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  loan_id UUID REFERENCES public.loan_requests(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notify customer when loan status changes
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, loan_id)
    VALUES (
      NEW.user_id,
      'loan_status',
      'Loan status updated',
      'Your loan application is now: ' || initcap(NEW.status) || '.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_notify_status ON public.loan_requests;
CREATE TRIGGER loan_requests_notify_status
  AFTER UPDATE OF status ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_loan_status_change();

-- Notify admins of new loan applications
CREATE OR REPLACE FUNCTION public.notify_new_loan()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, loan_id)
  SELECT
    p.id,
    'new_loan',
    'New loan application',
    NEW.full_name || ' applied for ' || NEW.loan_amount::text || ' pula.',
    NEW.id
  FROM public.profiles p
  WHERE p.role = 'admin';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_notify_new ON public.loan_requests;
CREATE TRIGGER loan_requests_notify_new
  AFTER INSERT ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_loan();

-- Notify customer when admin records a payment
CREATE OR REPLACE FUNCTION public.notify_loan_payment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loan_row public.loan_requests%ROWTYPE;
BEGIN
  SELECT * INTO loan_row FROM public.loan_requests WHERE id = NEW.loan_id;
  IF loan_row.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, loan_id)
    VALUES (
      loan_row.user_id,
      'payment_received',
      'Payment recorded',
      'A payment of P' || NEW.amount::text || ' was recorded on your loan.',
      NEW.loan_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_payments_notify ON public.loan_payments;
CREATE TRIGGER loan_payments_notify
  AFTER INSERT ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_loan_payment();

-- Record a payment (admin only)
CREATE OR REPLACE FUNCTION public.record_loan_payment(
  p_loan_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.loan_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row public.loan_payments;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  INSERT INTO public.loan_payments (loan_id, amount, notes, recorded_by)
  VALUES (p_loan_id, p_amount, p_notes, auth.uid())
  RETURNING * INTO row;
  RETURN row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_loan_payment(UUID, NUMERIC, TEXT) TO authenticated;

-- Realtime for payments + notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_reminder_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_reminder_log;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 10. Hardening: 0% interest, payment integrity, edge cases
-- ============================================================

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_interest_rate_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_interest_rate_check
  CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

CREATE OR REPLACE FUNCTION public.protect_amount_paid()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.amount_paid IS DISTINCT FROM OLD.amount_paid THEN
    NEW.amount_paid := COALESCE(
      (SELECT SUM(amount) FROM public.loan_payments WHERE loan_id = NEW.id),
      0
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_protect_amount_paid ON public.loan_requests;
CREATE TRIGGER loan_requests_protect_amount_paid
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_amount_paid();

CREATE OR REPLACE FUNCTION public.validate_loan_payment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loan_row public.loan_requests%ROWTYPE;
  outstanding NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO loan_row FROM public.loan_requests WHERE id = NEW.loan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  IF loan_row.status NOT IN ('approved', 'disbursed') THEN
    RAISE EXCEPTION 'Payments can only be recorded on approved or disbursed loans';
  END IF;

  IF loan_row.total_repayable IS NULL OR loan_row.total_repayable <= 0 THEN
    RAISE EXCEPTION 'Set total repayable before recording payments';
  END IF;

  outstanding := loan_row.total_repayable - COALESCE(loan_row.amount_paid, 0);
  IF outstanding <= 0 THEN
    RAISE EXCEPTION 'Loan is already fully repaid';
  END IF;

  IF NEW.amount > outstanding THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance of %', outstanding;
  END IF;

  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  NEW.interest_rate_snapshot := loan_row.interest_rate;
  NEW.total_repayable_snapshot := loan_row.total_repayable;

  NEW.notes := LEFT(TRIM(COALESCE(NEW.notes, '')), 500);
  IF NEW.notes = '' THEN
    NEW.notes := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_payments_validate ON public.loan_payments;
CREATE TRIGGER loan_payments_validate
  BEFORE INSERT ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_loan_payment();

CREATE OR REPLACE FUNCTION public.record_loan_payment(
  p_loan_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.loan_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row public.loan_payments;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.loan_payments (loan_id, amount, notes, recorded_by)
  VALUES (p_loan_id, p_amount, p_notes, auth.uid())
  RETURNING * INTO row;

  RETURN row;
END;
$$;

DROP POLICY IF EXISTS "Users cannot delete loan requests" ON public.loan_requests;
CREATE POLICY "Users cannot delete loan requests"
  ON public.loan_requests FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "No direct notification inserts" ON public.notifications;
CREATE POLICY "No direct notification inserts"
  ON public.notifications FOR INSERT
  WITH CHECK (false);

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 11. Notify customer when interest/fees added; reopen paid loans
-- ============================================================

CREATE OR REPLACE FUNCTION public.loan_adjust_status_on_terms_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.total_repayable IS NOT NULL
     AND COALESCE(NEW.amount_paid, 0) < NEW.total_repayable
     AND OLD.status = 'paid' THEN
    NEW.status := 'disbursed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_reopen_on_terms ON public.loan_requests;
CREATE TRIGGER loan_requests_reopen_on_terms
  BEFORE UPDATE OF total_repayable, interest_rate, due_date ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.loan_adjust_status_on_terms_change();

CREATE OR REPLACE FUNCTION public.notify_loan_terms_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  added NUMERIC;
  outstanding NUMERIC;
  msg TEXT;
  ntype TEXT;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.total_repayable IS NOT DISTINCT FROM OLD.total_repayable
     AND NEW.interest_rate IS NOT DISTINCT FROM OLD.interest_rate
     AND NEW.due_date IS NOT DISTINCT FROM OLD.due_date THEN
    RETURN NEW;
  END IF;

  outstanding := GREATEST(COALESCE(NEW.total_repayable, 0) - COALESCE(NEW.amount_paid, 0), 0);

  IF NEW.total_repayable IS NOT NULL
     AND (OLD.total_repayable IS NULL OR NEW.total_repayable > OLD.total_repayable) THEN
    added := NEW.total_repayable - COALESCE(OLD.total_repayable, 0);
    ntype := 'interest_added';
    msg := 'Additional interest or fees of P' || ROUND(added, 2)::text
      || ' were added to your loan. Outstanding balance is now P'
      || ROUND(outstanding, 2)::text || '.';
  ELSIF NEW.interest_rate IS DISTINCT FROM OLD.interest_rate THEN
    ntype := 'terms_updated';
    msg := 'Your loan interest rate was updated to '
      || COALESCE(NEW.interest_rate::text, '0') || '%. Outstanding: P'
      || ROUND(outstanding, 2)::text || '.';
  ELSIF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
    ntype := 'terms_updated';
    msg := 'Your loan due date was updated. Outstanding balance: P'
      || ROUND(outstanding, 2)::text || '.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, loan_id)
  VALUES (
    NEW.user_id,
    ntype,
    CASE WHEN ntype = 'interest_added' THEN 'Interest or fees added' ELSE 'Loan terms updated' END,
    msg,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_notify_terms ON public.loan_requests;
CREATE TRIGGER loan_requests_notify_terms
  AFTER UPDATE OF total_repayable, interest_rate, due_date ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_loan_terms_change();

NOTIFY pgrst, 'reload schema';
