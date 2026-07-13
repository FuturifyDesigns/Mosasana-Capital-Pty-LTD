-- Email alerts for new loan applications and contact enquiries.
-- In-app admin notifications are unchanged; this queues Brevo emails via the
-- Email-notifications Edge Function (ondiweni@ + tnkile@ by default).
--
-- Prerequisites (Supabase Dashboard → Database → Extensions):
--   1. Enable pg_net
--   2. Enable vault (usually on by default)
--
-- Edge function name in Supabase: Email-notifications
-- Reminder function name in Supabase: Reminder
--
-- Secrets (Edge Functions → Secrets):
--   BREVO_API_KEY       - Brevo v3 API key (xkeysib-...) — NOT the SMTP key
--   BREVO_SENDER_EMAIL  - verified sender in Brevo
--   CRON_SECRET         - must match vault secret below
-- Optional: BREVO_SENDER_NAME, ADMIN_ALERT_EMAILS
--
-- Vault (SQL Editor, run once):
--   SELECT vault.create_secret('<CRON_SECRET>', 'admin_alerts_cron_secret');
--
-- If JWT verification is ON for Email-notifications, also store service role:
--   SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');

CREATE OR REPLACE FUNCTION public.queue_admin_alert_email(p_type TEXT, p_payload JSONB)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  project_url TEXT := 'https://pwcootcdrbnadsbwduxi.supabase.co';
  cron_secret TEXT;
  service_role TEXT;
  headers JSONB;
BEGIN
  IF p_type IS NULL OR p_payload IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO cron_secret
    FROM vault.decrypted_secrets
    WHERE name = 'admin_alerts_cron_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    cron_secret := NULL;
  END;

  IF cron_secret IS NULL THEN
    BEGIN
      SELECT decrypted_secret INTO cron_secret
      FROM vault.decrypted_secrets
      WHERE name = 'reminders_cron_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      cron_secret := NULL;
    END;
  END IF;

  IF cron_secret IS NULL THEN
    RAISE WARNING 'admin alert email skipped: vault secret admin_alerts_cron_secret not configured';
    RETURN;
  END IF;

  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', cron_secret
  );

  BEGIN
    SELECT decrypted_secret INTO service_role
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    service_role := NULL;
  END;

  IF service_role IS NOT NULL THEN
    headers := headers || jsonb_build_object(
      'Authorization', 'Bearer ' || service_role,
      'apikey', service_role
    );
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/Email-notifications',
    headers := headers,
    body := jsonb_build_object('type', p_type, 'data', p_payload)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'admin alert email failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_admin_alert_email(TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.queue_admin_alert_email(TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.queue_admin_alert_email(TEXT, JSONB) FROM authenticated;

-- Notify admins in-app + email when a new loan is submitted.
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

  PERFORM public.queue_admin_alert_email(
    'new_loan',
    jsonb_build_object(
      'loan_id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'loan_amount', NEW.loan_amount,
      'loan_purpose', NEW.loan_purpose
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_requests_notify_new ON public.loan_requests;
CREATE TRIGGER loan_requests_notify_new
  AFTER INSERT ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_loan();

-- Notify admins in-app + email when a new enquiry is submitted.
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

  PERFORM public.queue_admin_alert_email(
    'new_enquiry',
    jsonb_build_object(
      'enquiry_id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'phone', NEW.phone,
      'subject', NEW.subject,
      'message', NEW.message
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_enquiries_notify_new ON public.contact_enquiries;
CREATE TRIGGER contact_enquiries_notify_new
  AFTER INSERT ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_enquiry();

NOTIFY pgrst, 'reload schema';
