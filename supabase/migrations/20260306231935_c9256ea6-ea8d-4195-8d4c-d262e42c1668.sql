
-- Add missing columns to bookings for international travel & sync
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Add contact and manual mode columns to hotels
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS manual_mode boolean DEFAULT false;

-- Create webhook_logs table for tracking local system sync events
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'received',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all webhook logs"
  ON public.webhook_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel managers can view their webhook logs"
  ON public.webhook_logs FOR SELECT
  USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

-- Create local_sync_settings table
CREATE TABLE IF NOT EXISTS public.local_sync_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_endpoint text,
  secret_key text,
  is_active boolean DEFAULT false,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.local_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sync settings"
  ON public.local_sync_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hotel managers can manage their sync settings"
  ON public.local_sync_settings FOR ALL
  USING (hotel_id = public.get_manager_hotel_id(auth.uid()));
