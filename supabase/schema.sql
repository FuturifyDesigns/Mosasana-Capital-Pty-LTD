-- Mosasana Capital Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pwcootcdrbnadsbwduxi/sql

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  physical_address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan requests
CREATE TABLE IF NOT EXISTS public.loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_photo_path TEXT,
  physical_address TEXT NOT NULL,
  loan_amount NUMERIC(12,2) NOT NULL CHECK (loan_amount >= 500 AND loan_amount <= 50000),
  loan_purpose TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  monthly_income NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed')),
  admin_notes TEXT,
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact enquiries
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER loan_requests_updated_at
  BEFORE UPDATE ON public.loan_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contact_enquiries_updated_at
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Loan requests policies
CREATE POLICY "Anyone can submit loan request"
  ON public.loan_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own loan requests"
  ON public.loan_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update loan requests"
  ON public.loan_requests FOR UPDATE
  USING (public.is_admin());

-- Contact enquiries policies
CREATE POLICY "Anyone can submit enquiry"
  ON public.contact_enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view enquiries"
  ON public.contact_enquiries FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update enquiries"
  ON public.contact_enquiries FOR UPDATE
  USING (public.is_admin());

-- Storage bucket for ID documents (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload ID documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'id-documents');

CREATE POLICY "Admins can read ID documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'id-documents' AND public.is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loan_requests_user_id ON public.loan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON public.loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_created_at ON public.loan_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_status ON public.contact_enquiries(status);

-- To promote a user to admin, run after they register:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'tnkile@mosasanacapital.com');
