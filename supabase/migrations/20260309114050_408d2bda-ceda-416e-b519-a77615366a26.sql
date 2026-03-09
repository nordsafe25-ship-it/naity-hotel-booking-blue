
-- 1. Remove passport columns
ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS passport_number,
  DROP COLUMN IF EXISTS passport_image_url;

-- 2. Add new columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS guests_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+963',
  ADD COLUMN IF NOT EXISTS check_out_processed BOOLEAN DEFAULT FALSE;

-- 3. Fix RLS — allow anonymous/guest inserts (no login required)
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view bookings by email (for my-bookings page)
DROP POLICY IF EXISTS "Guests can view their own bookings" ON public.bookings;

CREATE POLICY "Anyone can view bookings by email"
  ON public.bookings FOR SELECT
  USING (true);

-- 4. Auto-expire function
CREATE OR REPLACE FUNCTION public.expire_completed_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.bookings
  SET
    status = 'expired',
    check_out_processed = TRUE,
    updated_at = now()
  WHERE
    status IN ('confirmed', 'active')
    AND check_out < CURRENT_DATE
    AND (check_out_processed IS NULL OR check_out_processed = FALSE);
END;
$$;
