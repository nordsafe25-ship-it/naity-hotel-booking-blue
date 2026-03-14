
-- 1. Tech Partners table
CREATE TABLE IF NOT EXISTS public.tech_partners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  name_ar          TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  commission_rate  NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tech_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tech_partners"
  ON public.tech_partners FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Partner user accounts (for future partner login)
CREATE TABLE IF NOT EXISTS public.partner_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id  UUID NOT NULL REFERENCES public.tech_partners(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner_users"
  ON public.partner_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner views own user row"
  ON public.partner_users FOR SELECT
  USING (user_id = auth.uid());

-- 3. Link hotels (and apartments) to tech partners
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS tech_partner_id UUID
  REFERENCES public.tech_partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hotels_tech_partner
  ON public.hotels (tech_partner_id);
