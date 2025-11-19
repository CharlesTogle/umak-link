interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend API
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @param from - Sender email address (optional, defaults to onboarding@resend.dev)
 * @returns Promise with the send result
 */
export async function sendEmail ({
  to,
  subject,
  html,
  from = 'umath.noreply@gmail.com'
}: SendEmailParams) {
  try {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY

    if (!apiKey) {
      console.error('VITE_RESEND_API_KEY not set in environment variables')
      return { success: false, error: 'API key not configured' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error sending email:', data)
      return { success: false, error: data }
    }

    console.log('Email sent successfully:', data.id)
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
