CREATE OR REPLACE FUNCTION public.unlist_stale_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.room_availability
  SET status = 'unlisted',
      updated_at = now()
  WHERE last_updated_by_hotel IS NOT NULL
    AND last_updated_by_hotel < now() - interval '24 hours'
    AND status NOT IN ('unlisted');
END;
$$;