-- Add some sample service categories
INSERT INTO public.service_categories (name, description, icon_name) VALUES
('Handyman', 'General home repairs and maintenance', 'wrench'),
('Tutoring', 'Academic support and educational services', 'graduation-cap'),
('Hair Styling', 'Professional hair care and styling services', 'scissors'),
('Auto Repair', 'Vehicle maintenance and repair services', 'car'),
('Cleaning', 'Professional cleaning services for homes and offices', 'sparkles'),
('Plumbing', 'Plumbing installation and repair services', 'droplet'),
('Electrical', 'Electrical installation and repair services', 'zap'),
('Painting', 'Interior and exterior painting services', 'paintbrush'),
('Gardening', 'Landscaping and garden maintenance services', 'flower'),
('Moving', 'Professional moving and relocation services', 'truck')
ON CONFLICT (name) DO NOTHING;

-- Create sample service providers with proper verification status
INSERT INTO public.service_providers (
  profile_id, 
  business_name, 
  description, 
  hourly_rate, 
  experience_years, 
  skills, 
  verification_status,
  average_rating,
  total_reviews
) VALUES 
-- Mbali (Handyman)
(
  (SELECT id FROM public.profiles WHERE first_name = 'Mbali' LIMIT 1),
  'Mbali''s Home Repairs',
  'Professional handyman with 5+ years experience in home repairs, installations, and maintenance.',
  350.00,
  5,
  ARRAY['Home repairs', 'Furniture assembly', 'Electrical basics', 'Plumbing basics'],
  'approved',
  4.8,
  15
),
-- Bafana (Auto Repair)
(
  (SELECT id FROM public.profiles WHERE first_name = 'Bafana' LIMIT 1),
  'Bafana Auto Solutions',
  'Certified auto mechanic specializing in both domestic and imported vehicles.',
  450.00,
  8,
  ARRAY['Engine repair', 'Brake service', 'Electrical systems', 'Diagnostics'],
  'approved',
  4.9,
  25
),
-- Kgotso (Tutoring)
(
  (SELECT id FROM public.profiles WHERE first_name = 'Kgotso' LIMIT 1),
  'Kgotso Academic Support',
  'Math and Science tutor with university degree and passion for teaching.',
  250.00,
  3,
  ARRAY['Mathematics', 'Physics', 'Chemistry', 'Engineering'],
  'approved',
  4.7,
  12
)
ON CONFLICT (profile_id) DO NOTHING;

-- Create service listings
INSERT INTO public.service_listings (
  provider_id,
  title,
  description,
  price,
  price_type,
  duration_minutes,
  category_id,
  location,
  is_active
) VALUES
-- Mbali's listings
(
  (SELECT sp.id FROM public.service_providers sp 
   JOIN public.profiles p ON sp.profile_id = p.id 
   WHERE p.first_name = 'Mbali' LIMIT 1),
  'Home Repair & Maintenance',
  'Professional home repairs including fixing leaks, broken fixtures, and general maintenance tasks.',
  350.00,
  'hourly',
  120,
  (SELECT id FROM public.service_categories WHERE name = 'Handyman' LIMIT 1),
  'Centurion, Pretoria',
  true
),
-- Bafana's listings
(
  (SELECT sp.id FROM public.service_providers sp 
   JOIN public.profiles p ON sp.profile_id = p.id 
   WHERE p.first_name = 'Bafana' LIMIT 1),
  'Complete Auto Repair Services',
  'Full-service auto repair including engine diagnostics, brake service, and electrical repairs.',
  450.00,
  'hourly',
  180,
  (SELECT id FROM public.service_categories WHERE name = 'Auto Repair' LIMIT 1),
  'Brooklyn, Pretoria',
  true
),
-- Kgotso's listings
(
  (SELECT sp.id FROM public.service_providers sp 
   JOIN public.profiles p ON sp.profile_id = p.id 
   WHERE p.first_name = 'Kgotso' LIMIT 1),
  'Math & Science Tutoring',
  'One-on-one tutoring for high school and university level mathematics and sciences.',
  250.00,
  'hourly',
  60,
  (SELECT id FROM public.service_categories WHERE name = 'Tutoring' LIMIT 1),
  'Hatfield, Pretoria',
  true
)
ON CONFLICT DO NOTHING;

-- Add some sample reviews
INSERT INTO public.reviews (
  booking_id,
  reviewer_id,
  provider_id,
  rating,
  comment
) VALUES
-- Reviews for Mbali (need to create dummy booking IDs first)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE first_name = 'Sarah' LIMIT 1),
  (SELECT sp.id FROM public.service_providers sp 
   JOIN public.profiles p ON sp.profile_id = p.id 
   WHERE p.first_name = 'Mbali' LIMIT 1),
  5,
  'Excellent work! Mbali fixed our leaky faucet and installed new shelves. Very professional and efficient.'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE first_name = 'John' LIMIT 1),
  (SELECT sp.id FROM public.service_providers sp 
   JOIN public.profiles p ON sp.profile_id = p.id 
   WHERE p.first_name = 'Mbali' LIMIT 1),
  4,
  'Great handyman service. Fixed multiple issues around the house in one visit.'
)
ON CONFLICT DO NOTHING;