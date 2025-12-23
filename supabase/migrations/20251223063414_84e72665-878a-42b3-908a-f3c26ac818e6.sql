-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Allow viewing approved service provider profiles (for marketplace browsing)
CREATE POLICY "Users can view service provider profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.profile_id = profiles.id
    AND sp.verification_status = 'approved'
  )
);

-- Allow viewing profiles of booking participants (clients viewing providers, providers viewing clients)
CREATE POLICY "Users can view booking participant profiles" 
ON public.profiles FOR SELECT 
USING (
  -- Clients can view profiles of providers they've booked
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    JOIN profiles client_profile ON b.client_id = client_profile.id
    WHERE client_profile.user_id = auth.uid()
    AND sp.profile_id = profiles.id
  )
  OR
  -- Providers can view profiles of clients who booked them
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    JOIN profiles provider_profile ON sp.profile_id = provider_profile.id
    WHERE provider_profile.user_id = auth.uid()
    AND b.client_id = profiles.id
  )
);

-- Allow viewing profiles of message participants
CREATE POLICY "Users can view message participant profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN profiles sender ON m.sender_id = sender.id
    WHERE sender.user_id = auth.uid()
    AND m.receiver_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1 FROM messages m
    JOIN profiles receiver ON m.receiver_id = receiver.id
    WHERE receiver.user_id = auth.uid()
    AND m.sender_id = profiles.id
  )
);