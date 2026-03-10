
-- Fix: Make anonymous access policies PERMISSIVE instead of RESTRICTIVE
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings by email" ON public.bookings;

CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings by email"
  ON public.bookings FOR SELECT
  TO public
  USING (true);
