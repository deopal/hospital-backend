/**
 * Email Service
 *
 * Handles email sending using Nodemailer.
 * Supports multiple email providers (SMTP, Gmail, etc.)
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || 'HealOrbit <noreply@healorbit.com>',
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
const initTransporter = () => {
  console.log('[Email Service] Initializing transporter...');
  console.log('[Email Service] EMAIL_USER:', EMAIL_CONFIG.auth.user ? `${EMAIL_CONFIG.auth.user.substring(0, 5)}...` : 'NOT SET');
  console.log('[Email Service] EMAIL_PASS:', EMAIL_CONFIG.auth.pass ? 'SET (hidden)' : 'NOT SET');

  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('[Email Service] Email credentials not configured. Email sending is disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth,
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('[Email Service] SMTP connection error:', error.message);
    } else {
      console.log('[Email Service] SMTP server is ready to send emails');
    }
  });

  return transporter;
};

/**
 * Check if email service is configured
 */
export const isEmailConfigured = () => {
  return !!(EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass);
};

/**
 * Send an email
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Email Service] Attempting to send email to: ${to}`);

  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    console.log(`[Email Service] Would send email to: ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    console.log(`[Email Service] Sending email via SMTP...`);
    console.log(`[Email Service] From: ${EMAIL_CONFIG.from}`);
    console.log(`[Email Service] To: ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
    });

    console.log(`[Email Service] Email sent successfully!`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    console.log(`[Email Service] Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error.message);
    console.error('[Email Service] Error code:', error.code);
    console.error('[Email Service] Full error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    return { success: false, message: 'Email service not configured' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  isEmailConfigured,
  verifyEmailConfig,
};
