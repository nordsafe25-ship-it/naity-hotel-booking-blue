
-- Create api_companies table
CREATE TABLE IF NOT EXISTS public.api_companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  name_ar           TEXT,
  base_url          TEXT NOT NULL DEFAULT '',
  api_key           TEXT NOT NULL DEFAULT '',
  api_token         TEXT,
  auth_type         TEXT DEFAULT 'none',
  username          TEXT,
  password          TEXT,
  get_rooms_path    TEXT DEFAULT '',
  post_booking_path TEXT DEFAULT '',
  contact_email     TEXT,
  contact_phone     TEXT,
  notes             TEXT,
  status            TEXT DEFAULT 'active',
  last_sync_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage api_companies"
  ON public.api_companies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create api_sync_logs table
CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES public.api_companies(id) ON DELETE CASCADE,
  hotel_id     UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  event_type   TEXT NOT NULL,
  direction    TEXT DEFAULT 'outbound',
  status       TEXT NOT NULL DEFAULT 'success',
  request_url  TEXT,
  payload      JSONB DEFAULT '{}'::jsonb,
  response     JSONB DEFAULT '{}'::jsonb,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage api_sync_logs"
  ON public.api_sync_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add company_id and external_hotel_id to hotels
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS company_id        UUID REFERENCES public.api_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_hotel_id INTEGER;
