ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS amenity_wifi boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_breakfast boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_electricity_24h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_hot_water_24h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_parking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_pool boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenity_ac_heating boolean NOT NULL DEFAULT false;