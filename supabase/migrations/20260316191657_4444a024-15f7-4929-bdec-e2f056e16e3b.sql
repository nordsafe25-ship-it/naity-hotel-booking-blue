
-- Add last_sync_at to api_companies
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

-- Add external_hotel_id to hotels
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS external_hotel_id integer;

-- Insert ChamSoft company (only if not exists)
INSERT INTO public.api_companies (name, api_key, status)
SELECT 'ChamSoft', 'sk_chamsoft_' || substr(md5(random()::text), 1, 6), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.api_companies WHERE name = 'ChamSoft');
