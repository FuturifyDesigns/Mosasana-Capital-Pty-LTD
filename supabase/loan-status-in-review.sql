-- New applications start in review; legacy "pending" rows are upgraded.
-- Run in Supabase SQL Editor (safe to re-run).

-- The protect trigger blocks UPDATE from the SQL editor — drop it for this migration.
DROP TRIGGER IF EXISTS loan_requests_protect_fields ON public.loan_requests;

UPDATE public.loan_requests
SET status = 'reviewing'
WHERE status = 'pending';

ALTER TABLE public.loan_requests
  ALTER COLUMN status SET DEFAULT 'reviewing';

-- Client inserts always land in review; only admins may UPDATE via the API.
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

CREATE TRIGGER loan_requests_protect_fields
  BEFORE INSERT OR UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_loan_request_fields();

NOTIFY pgrst, 'reload schema';
