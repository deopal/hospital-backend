/**
 * Email Service
 *
 * Handles email sending using Resend API (recommended for cloud hosting)
 * Falls back to Nodemailer SMTP for local development
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Email configuration from environment variables
const EMAIL_CONFIG = {
  // Resend API (for production/cloud)
  resendApiKey: process.env.RESEND_API_KEY,
  // SMTP fallback (for local development)
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || 'HealOrbit <noreply@healorbit.com>',
};

// Email clients
let resendClient = null;
let nodemailerTransporter = null;

/**
 * Initialize Resend client
 */
const initResend = () => {
  if (!EMAIL_CONFIG.resendApiKey) {
    console.log('[Email Service] Resend API key not configured');
    return null;
  }

  console.log('[Email Service] Initializing Resend client...');
  resendClient = new Resend(EMAIL_CONFIG.resendApiKey);
  return resendClient;
};

/**
 * Initialize Nodemailer transporter (fallback for local dev)
 */
const initNodemailer = () => {
  console.log('[Email Service] Initializing Nodemailer transporter...');
  console.log('[Email Service] EMAIL_USER:', EMAIL_CONFIG.auth.user ? `${EMAIL_CONFIG.auth.user.substring(0, 5)}...` : 'NOT SET');
  console.log('[Email Service] EMAIL_PASS:', EMAIL_CONFIG.auth.pass ? 'SET (hidden)' : 'NOT SET');

  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('[Email Service] SMTP credentials not configured.');
    return null;
  }

  nodemailerTransporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return nodemailerTransporter;
};

/**
 * Check if email service is configured
 */
export const isEmailConfigured = () => {
  return !!(EMAIL_CONFIG.resendApiKey || (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass));
};

/**
 * Send email via Resend API
 */
const sendViaResend = async ({ to, subject, html }) => {
  if (!resendClient) {
    initResend();
  }

  if (!resendClient) {
    return { success: false, message: 'Resend not configured' };
  }

  try {
    console.log('[Email Service] Sending via Resend API...');

    const { data, error } = await resendClient.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Email Service] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Email sent via Resend!');
    console.log('[Email Service] ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[Email Service] Resend failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Nodemailer SMTP
 */
const sendViaNodemailer = async ({ to, subject, html, text }) => {
  if (!nodemailerTransporter) {
    initNodemailer();
  }

  if (!nodemailerTransporter) {
    console.log(`[Email Service] Would send email to: ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    console.log(`[Email Service] Sending via SMTP...`);

    const info = await nodemailerTransporter.sendMail({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    console.log(`[Email Service] Email sent via SMTP!`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] SMTP failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send an email (uses Resend if configured, falls back to Nodemailer)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Email Service] Attempting to send email to: ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);

  // Try Resend first (works on cloud platforms)
  if (EMAIL_CONFIG.resendApiKey) {
    return await sendViaResend({ to, subject, html });
  }

  // Fall back to Nodemailer (local development)
  if (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
    return await sendViaNodemailer({ to, subject, html, text });
  }

  console.log('[Email Service] No email provider configured');
  return { success: false, message: 'Email service not configured' };
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  if (EMAIL_CONFIG.resendApiKey) {
    return { success: true, provider: 'resend', message: 'Resend API configured' };
  }

  if (EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
    if (!nodemailerTransporter) {
      initNodemailer();
    }

    if (!nodemailerTransporter) {
      return { success: false, message: 'SMTP not configured' };
    }

    try {
      await nodemailerTransporter.verify();
      return { success: true, provider: 'smtp', message: 'SMTP configured' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, message: 'No email provider configured' };
};

export default {
  sendEmail,
  isEmailConfigured,
  verifyEmailConfig,
};
