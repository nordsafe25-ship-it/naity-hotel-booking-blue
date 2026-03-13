ALTER TABLE public.hotels
  ADD CONSTRAINT hotels_property_type_check CHECK (property_type IN ('hotel', 'apartment'));

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS house_rules_ar TEXT,
  ADD COLUMN IF NOT EXISTS house_rules_en TEXT,
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS area_sqm INTEGER;