-- Discontinued loans, admin discontinue/delete, and pipeline updates.
-- Run in Supabase SQL Editor after fix-live-db.sql

ALTER TABLE public.loan_requests DROP CONSTRAINT IF EXISTS loan_requests_status_check;
ALTER TABLE public.loan_requests
  ADD CONSTRAINT loan_requests_status_check
  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed', 'paid', 'discontinued'));

-- Lock discontinued records like paid/rejected
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

  IF OLD.status IN ('rejected', 'discontinued') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Closed loan requests cannot be changed.';
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

-- One active loan: discontinued does not block a new application
CREATE OR REPLACE FUNCTION public.enforce_single_active_loan()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.loan_requests
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND status NOT IN ('rejected', 'paid', 'discontinued')
  ) THEN
    RAISE EXCEPTION 'You already have an active loan application or open loan.';
  END IF;
  RETURN NEW;
END;
$$;

-- Notify client when status becomes discontinued (if set via update)
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
    WHEN 'discontinued' THEN
      ntype := 'loan_discontinued';
      ntitle := 'Loan request discontinued';
      msg := 'Your loan request has been discontinued by Mosasana Capital. You may apply again when ready, or contact us if you have questions.';
    ELSE msg := 'Your loan application is now: ' || initcap(NEW.status) || '.';
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, loan_id)
  VALUES (NEW.user_id, ntype, ntitle, msg, NEW.id);

  RETURN NEW;
END;
$$;

-- Discontinue an in-progress request (keeps record in client history)
CREATE OR REPLACE FUNCTION public.admin_discontinue_loan(p_loan_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loan_row public.loan_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO loan_row FROM public.loan_requests WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan request not found';
  END IF;

  IF loan_row.status IN ('paid', 'discontinued', 'rejected') THEN
    RAISE EXCEPTION 'This loan request is already closed.';
  END IF;

  IF loan_row.status = 'disbursed' AND COALESCE(loan_row.amount_paid, 0) > 0 THEN
    RAISE EXCEPTION 'Cannot discontinue a loan that already has payments recorded.';
  END IF;

  UPDATE public.loan_requests SET status = 'discontinued' WHERE id = p_loan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_discontinue_loan(UUID) TO authenticated;

-- Permanently remove early-stage requests (after notifying the client)
CREATE OR REPLACE FUNCTION public.admin_delete_loan_request(p_loan_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  loan_row public.loan_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO loan_row FROM public.loan_requests WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan request not found';
  END IF;

  IF loan_row.status IN ('paid', 'disbursed') THEN
    RAISE EXCEPTION 'Funded or settled loans cannot be deleted. They remain in client records.';
  END IF;

  IF loan_row.status = 'approved' AND loan_row.total_repayable IS NOT NULL THEN
    RAISE EXCEPTION 'Approved loans with repayment terms cannot be deleted. Discontinue instead.';
  END IF;

  IF loan_row.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, loan_id)
    VALUES (
      loan_row.user_id,
      'loan_discontinued',
      'Loan request removed',
      'Your loan request has been discontinued and removed by Mosasana Capital. Contact us if you have any questions.',
      p_loan_id
    );
  END IF;

  DELETE FROM public.loan_requests WHERE id = p_loan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_loan_request(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
