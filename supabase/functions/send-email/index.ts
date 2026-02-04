// Supabase Edge Function for sending emails via Resend API
// Deploy to: supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  console.log('=== Email Function Started ===');
  console.log('Request method:', req.method);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Parse request body
    console.log('Step 1: Parsing request body');
    const body = await req.json();
    console.log('Request body received:', {
      to: body.to,
      subject: body.subject,
      hasHtml: !!body.html,
      htmlLength: body.html?.length,
      from: body.from,
      senderUuid: body.senderUuid
    });
    const { to, subject, html, senderUuid } = body;
    // Validate required fields
    console.log('Step 2: Validating required fields');
    if (!to || !subject || !html || !senderUuid) {
      console.error('Validation failed - missing fields:', {
        hasTo: !!to,
        hasSubject: !!subject,
        hasHtml: !!html,
        hasSenderUuid: !!senderUuid
      });
      return new Response(JSON.stringify({
        error: 'Missing required fields: to, subject, html, senderUuid'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✓ All required fields present');
    // Initialize Supabase client
    console.log('Step 3: Initializing Supabase client');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Supabase not configured');
    }
    console.log('✓ Supabase credentials found');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✓ Supabase client created');
    // Verify sender is staff
    console.log('Step 4: Verifying sender authorization');
    console.log('Looking up user with UUID:', senderUuid);
    const { data: user, error: userError } = await supabase.from('user_table').select('user_type').eq('user_id', senderUuid).single();
    if (userError) {
      console.error('Database error looking up user:', userError);
      return new Response(JSON.stringify({
        error: 'User not found',
        message: 'The sender UUID does not exist in the database',
        details: userError.message
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!user) {
      console.error('User not found in database');
      return new Response(JSON.stringify({
        error: 'User not found',
        message: 'The sender UUID does not exist in the database'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✓ User found:', {
      user_type: user.user_type
    });
    if (user.user_type !== 'Staff') {
      console.error('Authorization failed - user is not Staff:', user.user_type);
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Only Staff members can send emails'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✓ User authorized as Staff');
    // Validate email format
    console.log('Step 5: Validating email format');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email format:', to);
      return new Response(JSON.stringify({
        error: 'Invalid email address'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✓ Email format valid');
    // Get Resend API key from environment variables
    console.log('Step 6: Getting Resend API key');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Resend API key not configured');
      return new Response(JSON.stringify({
        error: 'Email service not configured. Please set RESEND_API_KEY.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✓ Resend API key found');
    // Send email via Resend API
    console.log('Step 7: Sending email via Resend API');
    const emailPayload = {
      from: "umak-link.noreply@umak-link.xyz",
      to: [
        to
      ],
      subject: subject,
      html: html
    };
    console.log('Email payload:', {
      from: "umak-link.noreply@umak-link.xyz",
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length
    });
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });
      const resendData = await resendResponse.json();
      console.log('Resend API response status:', resendResponse.status);
      console.log('Resend API response:', resendData);
      if (!resendResponse.ok) {
        console.error('Resend API error:', resendData);
        throw new Error(`Resend API error: ${resendData.message || 'Unknown error'}`);
      }
      console.log('✓ Email sent successfully via Resend');
      console.log('Email ID:', resendData.id);
    } catch (sendError) {
      console.error('Failed to send email:', sendError);
      throw new Error(`Email send failed: ${sendError.message}`);
    }
    // Success response
    console.log('=== Email Function Completed Successfully ===');
    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      to: to
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('=== Email Function Failed ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error.constructor.name
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); /* 
SETUP INSTRUCTIONS:

1. Sign up for Resend:
   - Go to https://resend.com
   - Create a free account (100 emails/day free)
   - Get your API key from the dashboard

2. Verify your domain (or use Resend's test domain):
   - Add DNS records to verify your domain
   - Or use onboarding@resend.dev for testing

3. Set Supabase secrets:
   supabase secrets set RESEND_API_KEY=re_123456789
   supabase secrets set DEFAULT_FROM_EMAIL=noreply@yourdomain.com

4. Ensure your user_table has columns:
   - id (uuid, primary key)
   - user_type (text, with value 'staff' for authorized users)

5. Deploy function:
   supabase functions deploy send-email

6. View logs:
   supabase functions logs send-email --follow

7. Usage example:
   
   const { data, error } = await supabase.functions.invoke('send-email', {
     body: {
       senderUuid: 'user-uuid-here',
       to: 'recipient@example.com',
       subject: 'Hello from Supabase',
       html: '<h1>Welcome!</h1><p>This is a test email.</p>',
       from: 'sender@yourdomain.com' // optional
     }
   });

ALTERNATIVE EMAIL SERVICES:
- SendGrid: https://sendgrid.com (100 emails/day free)
- Mailgun: https://www.mailgun.com (5,000 emails/month free)
- Postmark: https://postmarkapp.com (100 emails/month free)
*/ 
