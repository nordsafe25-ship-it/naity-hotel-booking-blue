
-- 1. Create api_companies table
CREATE TABLE public.api_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  contact_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_companies" ON public.api_companies
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create api_sync_logs table
CREATE TABLE public.api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.api_companies(id) ON DELETE CASCADE,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_sync_logs" ON public.api_sync_logs
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add company_id column to hotels table
ALTER TABLE public.hotels ADD COLUMN company_id uuid REFERENCES public.api_companies(id) ON DELETE SET NULL;
