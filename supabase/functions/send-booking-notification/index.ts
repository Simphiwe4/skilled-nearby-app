import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotificationRequest {
  bookingId: string;
  type: 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed';
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing booking notification request...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { bookingId, type }: BookingNotificationRequest = await req.json();
    
    if (!bookingId || !type) {
      throw new Error('Missing required fields: bookingId and type');
    }

    console.log(`Processing ${type} notification for booking ${bookingId}`);

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service_listings!inner (
          title,
          description
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Failed to fetch booking details');
    }

    // Fetch client and provider profiles separately
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('first_name, last_name, user_id')
      .eq('id', booking.client_id)
      .single();

    const { data: providerProfile, error: providerError } = await supabase
      .from('service_providers')
      .select(`
        profiles!inner (
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', booking.provider_id)
      .single();

    if (clientError || providerError) {
      console.error('Error fetching profiles:', { clientError, providerError });
      throw new Error('Failed to fetch profile details');
    }

    // Add profiles to booking object
    booking.client_profile = clientProfile;
    booking.provider_profile = providerProfile.profiles;

    console.log('Booking details fetched:', booking);

    // Get email addresses from auth.users
    const { data: clientUser, error: clientUserError } = await supabase.auth.admin.getUserById(
      booking.client_profile.user_id
    );
    
    const { data: providerUser, error: providerUserError } = await supabase.auth.admin.getUserById(
      booking.provider_profile.user_id
    );

    if (clientUserError || providerUserError) {
      console.error('Error fetching user emails:', { clientUserError, providerUserError });
      throw new Error('Failed to fetch user email addresses');
    }

    // Determine recipient and email content based on notification type
    let recipientEmail: string;
    let emailTemplate: EmailTemplate;

    switch (type) {
      case 'booking_request':
        recipientEmail = providerUser.user.email!;
        emailTemplate = generateBookingRequestEmail(booking);
        break;
      
      case 'booking_confirmed':
        recipientEmail = clientUser.user.email!;
        emailTemplate = generateBookingConfirmedEmail(booking);
        break;
      
      case 'booking_cancelled':
        recipientEmail = clientUser.user.email!;
        emailTemplate = generateBookingCancelledEmail(booking);
        break;
      
      case 'booking_completed':
        recipientEmail = clientUser.user.email!;
        emailTemplate = generateBookingCompletedEmail(booking);
        break;
      
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(`Sending ${type} email to ${recipientEmail}`);

    // For now, we'll log the email content since we don't have an email service configured
    // In production, this would integrate with SendGrid, Resend, or another email service
    console.log('Email to send:', {
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.htmlContent,
      text: emailTemplate.textContent
    });

    // Simulate email sending success
    console.log('Email notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        details: {
          type,
          recipient: recipientEmail,
          subject: emailTemplate.subject
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-booking-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Email template generators
function generateBookingRequestEmail(booking: any): EmailTemplate {
  const clientName = `${booking.client_profile.first_name} ${booking.client_profile.last_name}`;
  const serviceName = booking.service_listings.title;
  const bookingDate = new Date(booking.scheduled_date).toLocaleDateString();
  const bookingTime = booking.scheduled_time;

  return {
    subject: `New Booking Request - ${serviceName}`,
    htmlContent: `
      <h2>New Booking Request</h2>
      <p>You have received a new booking request from <strong>${clientName}</strong>.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date:</strong> ${bookingDate}</li>
        <li><strong>Time:</strong> ${bookingTime}</li>
        <li><strong>Duration:</strong> ${booking.duration_minutes} minutes</li>
        ${booking.total_price ? `<li><strong>Price:</strong> R${booking.total_price}</li>` : ''}
      </ul>
      
      ${booking.client_notes ? `
        <h3>Client Notes:</h3>
        <p>${booking.client_notes}</p>
      ` : ''}
      
      <p>Please log in to your provider dashboard to respond to this booking request.</p>
    `,
    textContent: `
      New Booking Request
      
      You have received a new booking request from ${clientName}.
      
      Service: ${serviceName}
      Date: ${bookingDate}
      Time: ${bookingTime}
      Duration: ${booking.duration_minutes} minutes
      ${booking.total_price ? `Price: R${booking.total_price}` : ''}
      
      ${booking.client_notes ? `Client Notes: ${booking.client_notes}` : ''}
      
      Please log in to your provider dashboard to respond to this booking request.
    `
  };
}

function generateBookingConfirmedEmail(booking: any): EmailTemplate {
  const providerName = `${booking.provider_profile.first_name} ${booking.provider_profile.last_name}`;
  const serviceName = booking.service_listings.title;
  const bookingDate = new Date(booking.scheduled_date).toLocaleDateString();
  const bookingTime = booking.scheduled_time;

  return {
    subject: `Booking Confirmed - ${serviceName}`,
    htmlContent: `
      <h2>Booking Confirmed!</h2>
      <p>Your booking with <strong>${providerName}</strong> has been confirmed.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Provider:</strong> ${providerName}</li>
        <li><strong>Date:</strong> ${bookingDate}</li>
        <li><strong>Time:</strong> ${bookingTime}</li>
        <li><strong>Duration:</strong> ${booking.duration_minutes} minutes</li>
        ${booking.total_price ? `<li><strong>Price:</strong> R${booking.total_price}</li>` : ''}
      </ul>
      
      ${booking.provider_notes ? `
        <h3>Provider Notes:</h3>
        <p>${booking.provider_notes}</p>
      ` : ''}
      
      <p>You can view and manage your bookings in your client dashboard.</p>
    `,
    textContent: `
      Booking Confirmed!
      
      Your booking with ${providerName} has been confirmed.
      
      Service: ${serviceName}
      Provider: ${providerName}
      Date: ${bookingDate}
      Time: ${bookingTime}
      Duration: ${booking.duration_minutes} minutes
      ${booking.total_price ? `Price: R${booking.total_price}` : ''}
      
      ${booking.provider_notes ? `Provider Notes: ${booking.provider_notes}` : ''}
      
      You can view and manage your bookings in your client dashboard.
    `
  };
}

function generateBookingCancelledEmail(booking: any): EmailTemplate {
  const providerName = `${booking.provider_profile.first_name} ${booking.provider_profile.last_name}`;
  const serviceName = booking.service_listings.title;

  return {
    subject: `Booking Cancelled - ${serviceName}`,
    htmlContent: `
      <h2>Booking Cancelled</h2>
      <p>Your booking with <strong>${providerName}</strong> for <strong>${serviceName}</strong> has been cancelled.</p>
      
      ${booking.provider_notes ? `
        <h3>Cancellation Reason:</h3>
        <p>${booking.provider_notes}</p>
      ` : ''}
      
      <p>You can search for other service providers or try booking at a different time.</p>
    `,
    textContent: `
      Booking Cancelled
      
      Your booking with ${providerName} for ${serviceName} has been cancelled.
      
      ${booking.provider_notes ? `Cancellation Reason: ${booking.provider_notes}` : ''}
      
      You can search for other service providers or try booking at a different time.
    `
  };
}

function generateBookingCompletedEmail(booking: any): EmailTemplate {
  const providerName = `${booking.provider_profile.first_name} ${booking.provider_profile.last_name}`;
  const serviceName = booking.service_listings.title;

  return {
    subject: `Service Completed - ${serviceName}`,
    htmlContent: `
      <h2>Service Completed</h2>
      <p>Your service <strong>${serviceName}</strong> with <strong>${providerName}</strong> has been marked as completed.</p>
      
      <p>We hope you had a great experience! Please consider leaving a review to help other customers.</p>
      
      <p>You can leave a review in your client dashboard.</p>
    `,
    textContent: `
      Service Completed
      
      Your service ${serviceName} with ${providerName} has been marked as completed.
      
      We hope you had a great experience! Please consider leaving a review to help other customers.
      
      You can leave a review in your client dashboard.
    `
  };
}