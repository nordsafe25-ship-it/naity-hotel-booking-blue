ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS passport_image_url text;

-- Add last_heartbeat column to local_sync_settings for connectivity tracking
ALTER TABLE public.local_sync_settings ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;