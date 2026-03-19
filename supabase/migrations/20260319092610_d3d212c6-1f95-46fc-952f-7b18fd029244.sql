
-- Breakfast fields on hotels
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS breakfast_available    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS breakfast_type         TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS breakfast_season_start DATE,
  ADD COLUMN IF NOT EXISTS breakfast_season_end   DATE,
  ADD COLUMN IF NOT EXISTS breakfast_price        NUMERIC(10,2) DEFAULT 0;

-- Children ages on bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS children_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS children_ages   INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS breakfast_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS breakfast_total    NUMERIC(10,2) DEFAULT 0;

-- Validation trigger for breakfast_type
CREATE OR REPLACE FUNCTION public.validate_breakfast_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.breakfast_type NOT IN ('none', 'all_year', 'seasonal') THEN
    RAISE EXCEPTION 'Invalid breakfast_type: %', NEW.breakfast_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_breakfast_type ON public.hotels;
CREATE TRIGGER trg_validate_breakfast_type
  BEFORE INSERT OR UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.validate_breakfast_type();
