-- Add service categories first
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