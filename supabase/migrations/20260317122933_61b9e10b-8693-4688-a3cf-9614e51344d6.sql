
-- Add missing columns to api_companies
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS base_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS api_token TEXT;
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'none';
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS get_rooms_path TEXT DEFAULT '';
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS post_booking_path TEXT DEFAULT '';
ALTER TABLE public.api_companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add missing columns to api_sync_logs
ALTER TABLE public.api_sync_logs ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';
ALTER TABLE public.api_sync_logs ADD COLUMN IF NOT EXISTS request_url TEXT;
ALTER TABLE public.api_sync_logs ADD COLUMN IF NOT EXISTS response JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.api_sync_logs ADD COLUMN IF NOT EXISTS error_msg TEXT;

-- Update ChamSoft with base_url if it exists
UPDATE public.api_companies
SET base_url = 'https://naity.net/old/API/ChamSoft/Hotel_api.php',
    name_ar = 'شام سوفت',
    auth_type = 'none',
    notes = COALESCE(notes, 'Hotel management system — GET rooms / POST bookings')
WHERE name = 'ChamSoft' AND (base_url IS NULL OR base_url = '');
