import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  address: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address }: GeocodeRequest = await req.json();
    
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Call Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch geocoding data from Google');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const location = data.results[0].geometry.location;
    
    return new Response(
      JSON.stringify({ 
        lat: location.lat, 
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to geocode address' 
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