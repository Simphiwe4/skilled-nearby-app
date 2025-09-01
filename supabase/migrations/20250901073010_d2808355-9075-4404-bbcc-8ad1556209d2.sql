-- Seed service categories
INSERT INTO public.service_categories (name, description, icon_name) VALUES
('Home Maintenance', 'Plumbing, electrical, handyman services', 'home'),
('Cleaning', 'House cleaning, deep cleaning, office cleaning', 'sparkles'),
('Tutoring', 'Academic tutoring, music lessons, skill development', 'book-open'),
('Beauty & Wellness', 'Hair styling, massage, skincare treatments', 'heart'),
('Photography', 'Event photography, portraits, product photography', 'camera'),
('Fitness', 'Personal training, yoga, sports coaching', 'dumbbell'),
('Pet Care', 'Dog walking, pet sitting, grooming', 'heart'),
('Gardening', 'Landscaping, plant care, garden maintenance', 'flower'),
('Technology', 'Computer repair, IT support, tech setup', 'laptop'),
('Transport', 'Moving services, delivery, ride services', 'truck'),
('Event Planning', 'Party planning, wedding coordination, catering', 'calendar'),
('Automotive', 'Car wash, repairs, maintenance services', 'car')
ON CONFLICT (name) DO NOTHING;