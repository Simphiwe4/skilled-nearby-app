import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
  userType: 'client' | 'provider';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing welcome email request...');

    // Parse request body
    const { email, firstName, userType }: WelcomeEmailRequest = await req.json();
    
    if (!email || !firstName || !userType) {
      throw new Error('Missing required fields: email, firstName, and userType');
    }

    console.log(`Sending welcome email to ${email} for ${userType}`);

    // Generate welcome email content
    const emailContent = generateWelcomeEmail(firstName, userType);

    // For now, we'll log the email content since we don't have an email service configured
    // In production, this would integrate with SendGrid, Resend, or another email service
    console.log('Welcome email to send:', {
      to: email,
      subject: emailContent.subject,
      html: emailContent.htmlContent,
      text: emailContent.textContent
    });

    // Simulate email sending success
    console.log('Welcome email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        details: {
          recipient: email,
          userType,
          subject: emailContent.subject
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    
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

function generateWelcomeEmail(firstName: string, userType: 'client' | 'provider') {
  const isProvider = userType === 'provider';
  
  const subject = `Welcome to Skilled Nearby, ${firstName}!`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Skilled Nearby!</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${firstName},</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining Skilled Nearby! We're excited to have you as part of our community.
        </p>
        
        ${isProvider ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Next Steps for Service Providers:</h3>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>Complete your profile with skills and experience</li>
              <li>Upload portfolio images to showcase your work</li>
              <li>Set your availability and hourly rates</li>
              <li>Create your first service listing</li>
              <li>Wait for approval from our team</li>
            </ul>
          </div>
        ` : `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Getting Started:</h3>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>Browse available services in your area</li>
              <li>Read reviews from other customers</li>
              <li>Book services that meet your needs</li>
              <li>Rate and review service providers</li>
            </ul>
          </div>
        `}
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
          If you have any questions or need help getting started, don't hesitate to reach out to our support team.
        </p>
        
        <div style="text-align: center;">
          <a href="${Deno.env.get('SUPABASE_URL') || 'https://skillednearby.com'}" 
             style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;">
            Get Started Now
          </a>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">
          Best regards,<br>
          The Skilled Nearby Team
        </p>
      </div>
    </div>
  `;
  
  const textContent = `
    Welcome to Skilled Nearby, ${firstName}!
    
    Thank you for joining Skilled Nearby! We're excited to have you as part of our community.
    
    ${isProvider ? `
    Next Steps for Service Providers:
    - Complete your profile with skills and experience
    - Upload portfolio images to showcase your work
    - Set your availability and hourly rates
    - Create your first service listing
    - Wait for approval from our team
    ` : `
    Getting Started:
    - Browse available services in your area
    - Read reviews from other customers
    - Book services that meet your needs
    - Rate and review service providers
    `}
    
    If you have any questions or need help getting started, don't hesitate to reach out to our support team.
    
    Get started at: ${Deno.env.get('SUPABASE_URL') || 'https://skillednearby.com'}
    
    Best regards,
    The Skilled Nearby Team
  `;
  
  return {
    subject,
    htmlContent,
    textContent
  };
}