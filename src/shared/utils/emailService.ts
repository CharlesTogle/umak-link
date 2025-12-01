import { supabase } from '@/shared/lib/supabase'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  senderUuid: string
  from?: string
}

interface EmailResponse {
  success: boolean
  message?: string
  error?: string
  to?: string
}

/**
 * Send an email via the Supabase Edge Function
 * @param params Email parameters
 * @returns Promise with success status and message
 */
export async function sendEmail (
  params: SendEmailParams
): Promise<EmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        subject: params.subject,
        html: params.html,
        senderUuid: params.senderUuid,
        from: params.from
      }
    })

    if (error) {
      console.error('Error invoking send-email function:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }

    if (data?.error) {
      console.error('Email function returned error:', data.error)
      return {
        success: false,
        error: data.message || data.error
      }
    }

    return {
      success: true,
      message: data?.message || 'Email sent successfully',
      to: data?.to
    }
  } catch (err) {
    console.error('Exception sending email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    }
  }
}

/**
 * Generate HTML email template for fraud report acceptance notification to claimer
 */
export function generateFraudReportAcceptedEmail (params: {
  claimerName: string
  postTitle: string
  reporterName: string
  staffName: string
  acceptedDate: string
}): string {
  const { claimerName, postTitle, reporterName, staffName, acceptedDate } =
    params

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Item Claim Report - Action Required</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1e2b87;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #1e2b87;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #1e2b87;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 8px 0;
    }
    .info-label {
      font-weight: 600;
      color: #1e2b87;
      display: inline-block;
      min-width: 120px;
    }
    .alert-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .urgent-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .urgent-box strong {
      color: #dc3545;
    }
    .location-box {
      background-color: #d1ecf1;
      border-left: 4px solid #0c5460;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .location-box strong {
      color: #0c5460;
      font-size: 18px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #dee2e6;
    }
    .footer p {
      margin: 5px 0;
    }
    .no-reply {
      color: #dc3545;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .info-label {
        display: block;
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Item Claim Report - Action Required</h1>
    </div>
    
    <div class="content">
      <h2>Dear ${claimerName},</h2>
      
      <p>We are writing to inform you that an item you claimed through the UMak LINK Lost and Found System has been reported as a fraudulent claim.</p>
      
      <div class="info-box">
        <p><span class="info-label">Claimed Item:</span> ${postTitle}</p>
        <p><span class="info-label">Reported By:</span> ${reporterName}</p>
        <p><span class="info-label">Reviewed By:</span> ${staffName}</p>
        <p><span class="info-label">Date Reviewed:</span> ${acceptedDate}</p>
      </div>
      
      <div class="urgent-box">
        <p><strong>IMMEDIATE ACTION REQUIRED</strong></p>
        <p>Your presence is requested to address this matter and provide verification of your claim.</p>
      </div>

      <div class="location-box">
        <p><strong>Report to:</strong></p>
        <p style="margin: 10px 0; font-size: 16px;">
          <strong>UMak Security Office</strong><br>
          Behind the Oval Stadium<br>
          University of Makati
        </p>
      </div>
      
      <div class="alert-box">
        <p><strong>Important Deadline:</strong></p>
        <p>You must report to the Security Office <strong>within one (1) week</strong> from the date of this email. Failure to appear within this timeframe will result in your case being escalated to the <strong>UMak Community Standards and Formation Department (CSFD)</strong> for further disciplinary action.</p>
      </div>
      
      <p><strong>What to bring:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Valid University ID</li>
        <li>Any proof of ownership for the claimed item</li>
        <li>This email notification (digital or printed)</li>
      </ul>
      
      <p>We take fraudulent claims very seriously as they undermine the integrity of our lost and found system and prevent items from being returned to their rightful owners.</p>
      
      <p style="margin-top: 30px;">If you have any questions or concerns, please contact the UMak Security Office directly.</p>
      
      <p style="margin-top: 30px;">Respectfully,<br>
      <strong>UMak Security Office</strong><br>
      University of Makati</p>
    </div>
    
    <div class="footer">
      <p class="no-reply">⚠️ This is a no-reply email. Please do not respond to this message.</p>
      <p>For inquiries, please visit the UMak Security Office behind the Oval Stadium.</p>
      <p>© ${new Date().getFullYear()} UMak LINK - Lost and Found Management System</p>
      <p>University of Makati</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send fraud report accepted notification email to the claimer
 */
export async function sendFraudReportAcceptedEmail (params: {
  claimerEmail: string
  claimerName: string
  postTitle: string
  reporterName: string
  staffName: string
  staffUuid: string
}): Promise<EmailResponse> {
  const {
    claimerEmail,
    claimerName,
    postTitle,
    reporterName,
    staffName,
    staffUuid
  } = params

  const acceptedDate = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila'
  })

  const htmlContent = generateFraudReportAcceptedEmail({
    claimerName,
    postTitle,
    reporterName,
    staffName,
    acceptedDate
  })

  return await sendEmail({
    to: claimerEmail,
    subject: `URGENT: Claim Verification Required - ${postTitle}`,
    html: htmlContent,
    senderUuid: staffUuid
  })
}
