-- Drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view service provider profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view booking participant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view message participant profiles" ON public.profiles;

-- Create helper function to check if a profile is an approved service provider
CREATE OR REPLACE FUNCTION public.is_approved_provider(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.profile_id = $1
    AND sp.verification_status = 'approved'
  );
$$;

-- Create helper function to check if user has booking relationship with profile
CREATE OR REPLACE FUNCTION public.has_booking_relationship(viewer_user_id uuid, target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Viewer is a client who booked a provider (target is provider's profile)
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.client_id IN (SELECT id FROM profiles WHERE user_id = viewer_user_id)
    AND sp.profile_id = target_profile_id
  ) OR EXISTS (
    -- Viewer is a provider who was booked by client (target is client's profile)
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE sp.profile_id IN (SELECT id FROM profiles WHERE user_id = viewer_user_id)
    AND b.client_id = target_profile_id
  );
$$;

-- Create helper function to check if user has messaging relationship with profile
CREATE OR REPLACE FUNCTION public.has_message_relationship(viewer_user_id uuid, target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM messages m
    WHERE (m.sender_id IN (SELECT id FROM profiles WHERE user_id = viewer_user_id) AND m.receiver_id = target_profile_id)
    OR (m.receiver_id IN (SELECT id FROM profiles WHERE user_id = viewer_user_id) AND m.sender_id = target_profile_id)
  );
$$;

-- Create new policies using the helper functions
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view approved provider profiles" 
ON public.profiles FOR SELECT 
USING (public.is_approved_provider(id));

CREATE POLICY "Users can view booking related profiles" 
ON public.profiles FOR SELECT 
USING (public.has_booking_relationship(auth.uid(), id));

CREATE POLICY "Users can view message related profiles" 
ON public.profiles FOR SELECT 
USING (public.has_message_relationship(auth.uid(), id));