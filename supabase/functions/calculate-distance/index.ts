import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationRequest {
  userLocation: {
    lat: number;
    lng: number;
  };
  providerLocations: Array<{
    id: string;
    location: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userLocation, providerLocations }: LocationRequest = await req.json();
    
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Create destinations string for Google Distance Matrix API
    const destinations = providerLocations
      .map(provider => encodeURIComponent(provider.location))
      .join('|');

    const origin = `${userLocation.lat},${userLocation.lng}`;
    
    // Call Google Distance Matrix API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&units=metric&key=${googleApiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch distance data from Google');
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google API error: ${data.status}`);
    }

    // Process the results
    const distances = data.rows[0].elements.map((element: any, index: number) => {
      if (element.status === 'OK') {
        return {
          providerId: providerLocations[index].id,
          distance: element.distance.value, // in meters
          distanceText: element.distance.text,
          duration: element.duration.value, // in seconds
          durationText: element.duration.text
        };
      } else {
        return {
          providerId: providerLocations[index].id,
          distance: Infinity,
          distanceText: 'Distance unavailable',
          duration: Infinity,
          durationText: 'Duration unavailable'
        };
      }
    });

    return new Response(
      JSON.stringify({ distances }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Distance calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to calculate distances' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});