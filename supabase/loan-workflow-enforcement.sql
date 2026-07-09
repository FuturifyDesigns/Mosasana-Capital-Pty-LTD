-- Enforce admin loan workflow on the database (matches app gates).
-- Run in Supabase SQL Editor after prior migrations.
-- Safe to re-run: does not change record_loan_payment return type.

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

  IF NEW.status = 'disbursed' AND OLD.status IS DISTINCT FROM 'disbursed' THEN
    IF NEW.total_repayable IS NULL OR NEW.total_repayable <= 0 OR NEW.due_date IS NULL THEN
      RAISE EXCEPTION 'Save repayment terms before marking as disbursed.';
    END IF;
    IF NEW.interest_rate IS NULL THEN
      RAISE EXCEPTION 'Save the interest rate before marking as disbursed.';
    END IF;
  END IF;

  IF OLD.status = 'disbursed' AND NEW.status = 'rejected' THEN
    RAISE EXCEPTION 'Disbursed loans cannot be rejected. Use Discontinue if needed.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_validate_status ON public.loan_requests;
CREATE TRIGGER loan_requests_validate_status
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_loan_status_change();

-- Payments only after disbursement (runs on loan_payments insert via record_loan_payment RPC)
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

  IF loan_row.status <> 'disbursed' THEN
    RAISE EXCEPTION 'Payments can only be recorded after the loan has been disbursed.';
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

NOTIFY pgrst, 'reload schema';
