-- Admin + dashboard realtime (postgres_changes)
-- Run in Supabase SQL Editor after fix-live-db.sql (safe to re-run)

-- Full row payloads on UPDATE/DELETE
ALTER TABLE public.loan_requests REPLICA IDENTITY FULL;
ALTER TABLE public.contact_enquiries REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.loan_payments REPLICA IDENTITY FULL;
ALTER TABLE public.loan_reminder_log REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.site_content REPLICA IDENTITY FULL;

-- Add all admin-relevant tables to the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_enquiries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_enquiries;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_payments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loan_reminder_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_reminder_log;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
