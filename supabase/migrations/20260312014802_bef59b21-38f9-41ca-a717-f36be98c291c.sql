
-- 1. Add slug to hotels (auto-generated from name_en)
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Generate slugs for existing hotels
UPDATE public.hotels SET slug = lower(regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

-- 2. Add Sham Soft fields to room_availability
ALTER TABLE public.room_availability 
  ADD COLUMN IF NOT EXISTS sham_soft_room_id text,
  ADD COLUMN IF NOT EXISTS room_kind text;

-- Create unique index for sham_soft_room_id per hotel
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_availability_sham_soft 
  ON public.room_availability (hotel_id, sham_soft_room_id) 
  WHERE sham_soft_room_id IS NOT NULL;

-- 3. Create sync_history table
CREATE TABLE IF NOT EXISTS public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'inventory_sync',
  direction text NOT NULL DEFAULT 'inbound',
  records_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync history" ON public.sync_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel managers can view their sync history" ON public.sync_history
  FOR SELECT USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_sync_history_hotel_created 
  ON public.sync_history (hotel_id, created_at DESC);
