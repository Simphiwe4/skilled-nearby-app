-- Create enum types
CREATE TYPE user_type AS ENUM ('client', 'provider');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE provider_status AS ENUM ('pending', 'approved', 'suspended');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type user_type NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service categories table
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service providers table
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  description TEXT,
  skills TEXT[],
  experience_years INTEGER,
  hourly_rate DECIMAL(10,2),
  availability_hours JSONB,
  service_radius INTEGER DEFAULT 10,
  verification_status provider_status DEFAULT 'pending',
  portfolio_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service listings table
CREATE TABLE public.service_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2),
  price_type TEXT DEFAULT 'hourly', -- hourly, fixed, negotiable
  duration_minutes INTEGER,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_price DECIMAL(10,2),
  status booking_status DEFAULT 'pending',
  client_notes TEXT,
  provider_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service categories policies (public read)
CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);

-- Service providers policies
CREATE POLICY "Anyone can view approved providers" ON public.service_providers 
  FOR SELECT USING (verification_status = 'approved');
CREATE POLICY "Providers can update their own profile" ON public.service_providers 
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()));
CREATE POLICY "Providers can insert their own profile" ON public.service_providers 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()));

-- Service listings policies
CREATE POLICY "Anyone can view active listings" ON public.service_listings 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Providers can manage their own listings" ON public.service_listings 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.service_providers sp 
    JOIN public.profiles p ON sp.profile_id = p.id 
    WHERE sp.id = provider_id AND p.user_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = client_id AND user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.service_providers sp 
      JOIN public.profiles p ON sp.profile_id = p.id 
      WHERE sp.id = provider_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "Clients can create bookings" ON public.bookings 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own bookings" ON public.bookings 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = client_id AND user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.service_providers sp 
      JOIN public.profiles p ON sp.profile_id = p.id 
      WHERE sp.id = provider_id AND p.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews for their bookings" ON public.reviews 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      JOIN public.profiles p ON b.client_id = p.id 
      WHERE b.id = booking_id AND p.user_id = auth.uid() AND b.status = 'completed'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON public.service_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample service categories
INSERT INTO public.service_categories (name, description, icon_name) VALUES
  ('Home Services', 'Plumbing, electrical, cleaning, repairs', 'Home'),
  ('Tutoring', 'Academic tutoring and educational support', 'BookOpen'),
  ('Beauty & Wellness', 'Hairdressing, makeup, massage, fitness', 'Sparkles'),
  ('Technology', 'Computer repair, web design, tech support', 'Laptop'),
  ('Transportation', 'Delivery, moving, rideshare services', 'Car'),
  ('Events', 'Photography, catering, entertainment', 'Camera'),
  ('Gardening', 'Landscaping, garden maintenance, tree services', 'TreePine'),
  ('Childcare', 'Babysitting, nanny services, after-school care', 'Baby');

-- Create function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, first_name, last_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::user_type, 'client'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();