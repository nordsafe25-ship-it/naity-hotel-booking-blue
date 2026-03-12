
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'hotel';

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, blocked_date)
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT USING (true);

CREATE POLICY "Admins can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel managers can manage their blocked dates"
  ON public.blocked_dates FOR ALL
  USING (hotel_id = public.get_manager_hotel_id(auth.uid()));
