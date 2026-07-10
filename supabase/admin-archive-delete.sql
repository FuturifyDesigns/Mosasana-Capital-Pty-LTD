-- Admin cleanup: delete archived loans and enquiries from the portal.

-- Remove settled / closed loan records (paid, rejected, discontinued).
CREATE OR REPLACE FUNCTION public.admin_delete_archived_loan(p_loan_id UUID)
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

  IF loan_row.status NOT IN ('paid', 'rejected', 'discontinued') THEN
    RAISE EXCEPTION 'Only archived loans (paid, rejected, or discontinued) can be removed this way.';
  END IF;

  DELETE FROM public.loan_requests WHERE id = p_loan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_archived_loan(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_archived_loan(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_archived_loan(UUID) FROM anon;

-- Remove contact enquiries (no client notification).
CREATE OR REPLACE FUNCTION public.admin_delete_enquiry(p_enquiry_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.contact_enquiries WHERE id = p_enquiry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enquiry not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_enquiry(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_enquiry(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_enquiry(UUID) FROM anon;

NOTIFY pgrst, 'reload schema';
