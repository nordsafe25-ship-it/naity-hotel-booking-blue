-- Multi-room bookings table
CREATE TABLE IF NOT EXISTS public.booking_rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  room_category_id UUID REFERENCES public.room_categories(id) ON DELETE SET NULL,
  room_number      TEXT,
  price_per_night  NUMERIC(10,2) NOT NULL DEFAULT 0,
  guests_count     INTEGER NOT NULL DEFAULT 1,
  deposit_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage booking_rooms"
  ON public.booking_rooms FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert booking_rooms"
  ON public.booking_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hotel managers can view their booking_rooms"
  ON public.booking_rooms FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.hotel_id = public.get_manager_hotel_id(auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS booking_rooms_booking_id_idx
  ON public.booking_rooms(booking_id);