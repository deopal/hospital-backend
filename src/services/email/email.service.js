/**
 * Email Service
 *
 * Handles email sending using Brevo (formerly Sendinblue) API
 * Free tier: 300 emails/day, no credit card required
 */

// Email configuration from environment variables
const EMAIL_CONFIG = {
  brevoApiKey: process.env.BREVO_API_KEY,
  from: {
    email: process.env.EMAIL_FROM_ADDRESS || 'healorbit.noreply@gmail.com',
    name: process.env.EMAIL_FROM_NAME || 'HealOrbit'
  }
};

/**
 * Check if email service is configured
 */
export const isEmailConfigured = () => {
  return !!EMAIL_CONFIG.brevoApiKey;
};

/**
 * Send email via Brevo API
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Email Service] Attempting to send email to: ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);

  if (!EMAIL_CONFIG.brevoApiKey) {
    console.log('[Email Service] Brevo API key not configured');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    console.log('[Email Service] Sending via Brevo API...');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': EMAIL_CONFIG.brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: EMAIL_CONFIG.from,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]*>/g, '')
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email Service] Brevo API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('[Email Service] Email sent via Brevo!');
    console.log('[Email Service] Message ID:', data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('[Email Service] Brevo failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  if (!EMAIL_CONFIG.brevoApiKey) {
    return { success: false, message: 'Brevo API key not configured' };
  }

  try {
    // Test API key by fetching account info
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': EMAIL_CONFIG.brevoApiKey
      }
    });

    if (!response.ok) {
      return { success: false, message: 'Invalid Brevo API key' };
    }

    const data = await response.json();
    return {
      success: true,
      provider: 'brevo',
      message: `Brevo configured for ${data.email}`,
      plan: data.plan?.[0]?.type || 'free'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  isEmailConfigured,
  verifyEmailConfig,
};
