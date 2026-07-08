-- Loan lifecycle: auto-paid, lock paid records, enquiry notifications, realtime fixes.
-- Run in Supabase SQL Editor after fix-live-db.sql

-- Auto-mark fully repaid loans as paid
CREATE OR REPLACE FUNCTION public.loan_auto_mark_paid()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.total_repayable IS NOT NULL
     AND NEW.total_repayable > 0
     AND COALESCE(NEW.amount_paid, 0) >= NEW.total_repayable THEN
    NEW.status := 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_auto_paid ON public.loan_requests;
CREATE TRIGGER loan_requests_auto_paid
  BEFORE INSERT OR UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.loan_auto_mark_paid();

-- Block manual "paid" unless fully repaid; lock paid/rejected records
CREATE OR REPLACE FUNCTION public.validate_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'paid' THEN
    IF NEW.status <> 'paid' THEN
      RAISE EXCEPTION 'Paid loans are locked and cannot be reopened.';
    END IF;
    IF NEW.total_repayable IS DISTINCT FROM OLD.total_repayable
       OR NEW.interest_rate IS DISTINCT FROM OLD.interest_rate
       OR NEW.due_date IS DISTINCT FROM OLD.due_date
       OR NEW.loan_amount IS DISTINCT FROM OLD.loan_amount
       OR NEW.term_months IS DISTINCT FROM OLD.term_months
       OR NEW.loan_purpose IS DISTINCT FROM OLD.loan_purpose THEN
      RAISE EXCEPTION 'Paid loans are locked and cannot be edited.';
    END IF;
  END IF;

  IF OLD.status = 'rejected' AND NEW.status <> 'rejected' THEN
    RAISE EXCEPTION 'Rejected applications cannot be changed.';
  END IF;

  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    IF NEW.total_repayable IS NULL OR NEW.total_repayable <= 0
       OR COALESCE(NEW.amount_paid, 0) < NEW.total_repayable THEN
      RAISE EXCEPTION 'Loan can only become paid when the full repayable amount has been recorded.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_validate_status ON public.loan_requests;
CREATE TRIGGER loan_requests_validate_status
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_loan_status_change();

-- Remove reopen-on-terms for paid loans (paid records stay locked)
DROP TRIGGER IF EXISTS loan_requests_reopen_on_terms ON public.loan_requests;
DROP FUNCTION IF EXISTS public.loan_adjust_status_on_terms_change();

-- Richer client notifications on status change
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  msg TEXT;
  ntype TEXT := 'loan_status';
  ntitle TEXT := 'Loan status updated';
BEGIN
  IF NEW.user_id IS NULL OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'pending' THEN msg := 'Your loan application has been received and is pending review.';
    WHEN 'reviewing' THEN msg := 'Your loan application is now being reviewed by our team.';
    WHEN 'approved' THEN msg := 'Great news — your loan application has been approved.';
    WHEN 'disbursed' THEN msg := 'Your loan has been disbursed. Repayments can now be recorded against your account.';
    WHEN 'paid' THEN
      ntype := 'loan_paid';
      ntitle := 'Loan fully repaid!';
      msg := 'Congratulations! Your loan is fully repaid. You can apply for a new loan whenever you are ready.';
    WHEN 'rejected' THEN msg := 'Your loan application was not approved. Contact us if you have any questions.';
    ELSE msg := 'Your loan application is now: ' || initcap(NEW.status) || '.';
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, loan_id)
  VALUES (NEW.user_id, ntype, ntitle, msg, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_notify_status ON public.loan_requests;
CREATE TRIGGER loan_requests_notify_status
  AFTER UPDATE OF status ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_loan_status_change();

-- Notify admins when a new contact enquiry arrives
CREATE OR REPLACE FUNCTION public.notify_new_enquiry()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, loan_id)
  SELECT
    p.id,
    'new_enquiry',
    'New contact enquiry',
    NEW.full_name || ': ' || LEFT(NEW.subject, 120),
    NULL
  FROM public.profiles p
  WHERE p.role = 'admin';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_enquiries_notify_new ON public.contact_enquiries;
CREATE TRIGGER contact_enquiries_notify_new
  AFTER INSERT ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_enquiry();

-- Realtime: full row data for UPDATE events
ALTER TABLE public.contact_enquiries REPLICA IDENTITY FULL;
ALTER TABLE public.loan_requests REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_enquiries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_enquiries;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
