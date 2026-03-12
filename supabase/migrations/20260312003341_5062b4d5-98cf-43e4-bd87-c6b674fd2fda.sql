
-- جدول حالة الغرف الفعلية
CREATE TABLE IF NOT EXISTS public.room_availability (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_category_id  UUID REFERENCES public.room_categories(id),
  room_number       TEXT NOT NULL,
  category_name     TEXT,
  status            TEXT NOT NULL DEFAULT 'available',
  price_per_night   DECIMAL(10,2),
  occupied_check_in  DATE,
  occupied_check_out DATE,
  last_updated_by_hotel TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room availability"
  ON public.room_availability FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage room availability"
  ON public.room_availability FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hotel managers can manage their room availability"
  ON public.room_availability FOR ALL
  TO public
  USING (hotel_id = get_manager_hotel_id(auth.uid()));

-- إضافة أعمدة جديدة لجدول bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_number TEXT,
  ADD COLUMN IF NOT EXISTS hotel_booking_id TEXT,
  ADD COLUMN IF NOT EXISTS hotel_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hotel_notification_status TEXT DEFAULT 'pending';

-- trigger لتحديث updated_at
CREATE TRIGGER update_room_availability_updated_at
  BEFORE UPDATE ON public.room_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
