-- Complete Supabase Setup for scmgtoqilbkakxikigtz Project
-- Run this in Supabase SQL Editor to create all necessary tables

-- ============================================================================
-- STEP 1: Create Base Tables and Types
-- ============================================================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hotel_manager');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create hotels table
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  city TEXT NOT NULL,
  address TEXT,
  stars INTEGER NOT NULL DEFAULT 3 CHECK (stars >= 1 AND stars <= 5),
  cover_image TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  amenities TEXT[] DEFAULT '{}',
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create room_categories table
CREATE TABLE public.room_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 2,
  total_rooms INTEGER NOT NULL DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hotel_photos table
CREATE TABLE public.hotel_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id),
  room_category_id UUID NOT NULL REFERENCES public.room_categories(id),
  guest_user_id UUID REFERENCES auth.users(id),
  guest_first_name TEXT NOT NULL,
  guest_last_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  stripe_payment_id TEXT,
  room_number TEXT,
  hotel_booking_id TEXT,
  hotel_notified_at TIMESTAMPTZ,
  hotel_notification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create room_availability table (for sync)
CREATE TABLE public.room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_category_id UUID REFERENCES public.room_categories(id),
  room_number TEXT NOT NULL,
  category_name TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  price_per_night DECIMAL(10,2),
  occupied_check_in DATE,
  occupied_check_out DATE,
  last_updated_by_hotel TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

-- ============================================================================
-- STEP 2: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create Helper Functions
-- ============================================================================

-- Security definer function for role checking (if not exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's hotel_id
CREATE OR REPLACE FUNCTION public.get_manager_hotel_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.hotels WHERE manager_id = _user_id LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- STEP 4: Create Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_categories_updated_at BEFORE UPDATE ON public.room_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_availability_updated_at BEFORE UPDATE ON public.room_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Create Policies
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Hotels policies
CREATE POLICY "Anyone can view active hotels" ON public.hotels
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all hotels" ON public.hotels
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hotel managers can update their hotel" ON public.hotels
  FOR UPDATE USING (manager_id = auth.uid());
CREATE POLICY "Hotel managers can view their hotel" ON public.hotels
  FOR SELECT USING (manager_id = auth.uid());

-- Room categories policies
CREATE POLICY "Anyone can view active room categories" ON public.room_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all room categories" ON public.room_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hotel managers can manage their room categories" ON public.room_categories
  FOR ALL USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

-- Hotel photos policies
CREATE POLICY "Anyone can view hotel photos" ON public.hotel_photos
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage all photos" ON public.hotel_photos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hotel managers can manage their photos" ON public.hotel_photos
  FOR ALL USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

-- Bookings policies
CREATE POLICY "Guests can view their own bookings" ON public.bookings
  FOR SELECT USING (guest_user_id = auth.uid());
CREATE POLICY "Guests can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hotel managers can view their hotel bookings" ON public.bookings
  FOR SELECT USING (hotel_id = public.get_manager_hotel_id(auth.uid()));
CREATE POLICY "Hotel managers can update their hotel bookings" ON public.bookings
  FOR UPDATE USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

-- Room availability policies
CREATE POLICY "Anyone can view room availability" ON public.room_availability
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage room availability" ON public.room_availability
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Hotel managers can manage their room availability" ON public.room_availability
  FOR ALL USING (hotel_id = public.get_manager_hotel_id(auth.uid()));

-- ============================================================================
-- DONE! Your Supabase database is ready for sync
-- ============================================================================
