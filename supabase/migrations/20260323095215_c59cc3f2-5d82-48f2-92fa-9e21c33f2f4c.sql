
-- Add commission columns to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS company_commission_percent numeric DEFAULT 0;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS sales_commission_percent numeric DEFAULT 0;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS sales_name text;

-- Add profit_share_percent to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profit_share_percent numeric DEFAULT 0;

-- Update app_role enum to include 'company' and 'viewer' (viewer already exists)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company';

-- Create company_users junction table
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.api_companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage company_users" ON public.company_users FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Company user can view own record" ON public.company_users FOR SELECT TO authenticated USING (user_id = auth.uid());
