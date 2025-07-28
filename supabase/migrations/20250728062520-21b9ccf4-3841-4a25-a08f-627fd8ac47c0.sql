-- Add availability table for service providers
CREATE TABLE public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for availability
CREATE POLICY "Anyone can view provider availability" 
ON public.provider_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Providers can manage their own availability" 
ON public.provider_availability 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM service_providers sp
  JOIN profiles p ON sp.profile_id = p.id
  WHERE sp.id = provider_availability.provider_id AND p.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_provider_availability_updated_at
BEFORE UPDATE ON public.provider_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to prevent duplicate availability slots
CREATE UNIQUE INDEX idx_provider_availability_unique 
ON public.provider_availability(provider_id, day_of_week, start_time, end_time);

-- Add average rating column to service_providers table
ALTER TABLE public.service_providers 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Create function to update provider ratings
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the provider's average rating and total reviews
  UPDATE public.service_providers
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    )
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings when reviews are added
CREATE TRIGGER update_rating_on_review_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_rating();

-- Add search indexes for better performance
CREATE INDEX idx_service_listings_search ON public.service_listings USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_service_providers_rating ON public.service_providers(average_rating DESC);
CREATE INDEX idx_service_listings_price ON public.service_listings(price);
CREATE INDEX idx_profiles_location ON public.profiles USING GIN(to_tsvector('english', location));