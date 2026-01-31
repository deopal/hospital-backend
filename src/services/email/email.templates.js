/**
 * Email Templates
 *
 * Professional HTML email templates for HealOrbit notifications.
 * Uses inline styles for maximum email client compatibility.
 */

// Brand colors
const BRAND_COLOR = '#0d9488'; // Teal
const BRAND_COLOR_DARK = '#0f766e';
const TEXT_COLOR = '#1f2937';
const TEXT_SECONDARY = '#6b7280';
const BG_COLOR = '#f8fafc';

/**
 * Base email template wrapper
 */
const baseTemplate = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>HealOrbit Notification</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .content { width: 600px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BG_COLOR};">
  <!-- Preheader text (hidden preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BG_COLOR};">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%); padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      HealOrbit
                    </h1>
                    <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Your Healthcare Partner
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px; color: ${TEXT_SECONDARY}; font-size: 13px;">
                This is an automated message from HealOrbit Hospital Management System.
              </p>
              <p style="margin: 0; color: ${TEXT_SECONDARY}; font-size: 13px;">
                123 Healthcare Avenue, Medical District, City - 400001
              </p>
              <p style="margin: 10px 0 0; color: ${TEXT_SECONDARY}; font-size: 12px;">
                &copy; ${new Date().getFullYear()} HealOrbit. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Info box component
 */
const infoBox = (items) => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BG_COLOR}; border-radius: 8px; margin: 20px 0;">
  <tr>
    <td style="padding: 20px;">
      ${items.map(item => `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
          <tr>
            <td style="width: 120px; color: ${TEXT_SECONDARY}; font-size: 14px; vertical-align: top;">${item.label}:</td>
            <td style="color: ${TEXT_COLOR}; font-size: 14px; font-weight: 500;">${item.value}</td>
          </tr>
        </table>
      `).join('')}
    </td>
  </tr>
</table>
`;

/**
 * Button component
 */
const button = (text, url) => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px auto;">
  <tr>
    <td style="background-color: ${BRAND_COLOR}; border-radius: 8px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 30px; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

// ============================================
// Email Templates
// ============================================

/**
 * New Appointment Request - Email to Doctor
 */
export const appointmentRequestTemplate = (data) => {
  const { doctorName, patientName, healthProblems, appointmentDate, appointmentId } = data;

  const content = `
    <h2 style="margin: 0 0 10px; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
      New Appointment Request
    </h2>
    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello Dr. ${doctorName},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      You have received a new appointment request. Please review the details below and approve or reschedule the appointment.
    </p>

    ${infoBox([
      { label: 'Patient Name', value: patientName },
      { label: 'Health Concerns', value: healthProblems || 'Not specified' },
      { label: 'Requested Date', value: appointmentDate || 'To be scheduled' },
    ])}

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Please log in to your dashboard to review and respond to this appointment request.
    </p>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `New appointment request from ${patientName}`);
};

/**
 * Appointment Approved - Email to Patient
 */
export const appointmentApprovedTemplate = (data) => {
  const { patientName, doctorName, speciality, scheduledDate, scheduledTime, appointmentId } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; background-color: #10b981; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
        <span style="font-size: 30px;">&#10003;</span>
      </div>
      <h2 style="margin: 0; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
        Appointment Confirmed!
      </h2>
    </div>

    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${patientName},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Great news! Your appointment has been approved. Here are your appointment details:
    </p>

    ${infoBox([
      { label: 'Doctor', value: `Dr. ${doctorName}` },
      { label: 'Speciality', value: speciality || 'General Physician' },
      { label: 'Date', value: scheduledDate || 'To be confirmed' },
      { label: 'Time', value: scheduledTime || 'To be confirmed' },
    ])}

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Reminder:</strong> Please arrive 15 minutes before your scheduled appointment time.
      </p>
    </div>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your appointment with Dr. ${doctorName} is confirmed!`);
};

/**
 * Appointment Completed - Email to Patient
 */
export const appointmentCompletedTemplate = (data) => {
  const { patientName, doctorName, diagnosis, prescription, notes, appointmentId } = data;

  const content = `
    <h2 style="margin: 0 0 10px; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
      Appointment Completed
    </h2>
    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${patientName},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Your appointment with Dr. ${doctorName} has been marked as completed. Here's a summary:
    </p>

    ${diagnosis || prescription || notes ? infoBox([
      ...(diagnosis ? [{ label: 'Diagnosis', value: diagnosis }] : []),
      ...(prescription ? [{ label: 'Prescription', value: prescription }] : []),
      ...(notes ? [{ label: 'Notes', value: notes }] : []),
    ]) : ''}

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      You can view your complete appointment details and medical records in your patient dashboard.
    </p>

    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        <strong>Follow-up:</strong> If you have any questions about your diagnosis or prescription, please don't hesitate to contact us.
      </p>
    </div>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Wishing you good health,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your appointment with Dr. ${doctorName} is complete`);
};

/**
 * Appointment Cancelled - Email to Patient or Doctor
 */
export const appointmentCancelledTemplate = (data) => {
  const { recipientName, otherPartyName, isDoctor, reason, appointmentDate } = data;

  const cancelledBy = isDoctor ? 'patient' : 'doctor';

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; background-color: #ef4444; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
        <span style="font-size: 30px; color: white;">&#10005;</span>
      </div>
      <h2 style="margin: 0; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
        Appointment Cancelled
      </h2>
    </div>

    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${isDoctor ? 'Dr. ' : ''}${recipientName},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      We regret to inform you that the appointment ${appointmentDate ? `scheduled for ${appointmentDate}` : ''} has been cancelled${otherPartyName ? ` by ${isDoctor ? '' : 'Dr. '}${otherPartyName}` : ''}.
    </p>

    ${reason ? `
    ${infoBox([
      { label: 'Reason', value: reason },
    ])}
    ` : ''}

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      ${isDoctor
        ? 'The patient may contact you to reschedule at a later time.'
        : 'You can book a new appointment with another available doctor from our platform.'}
    </p>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, 'Your appointment has been cancelled');
};

/**
 * Welcome Email - New User Registration
 */
export const welcomeTemplate = (data) => {
  const { name, isDoctor } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <h2 style="margin: 0; color: ${TEXT_COLOR}; font-size: 24px; font-weight: 600;">
        Welcome to HealOrbit! 🎉
      </h2>
    </div>

    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${isDoctor ? 'Dr. ' : ''}${name},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Thank you for joining HealOrbit! We're excited to have you as part of our healthcare community.
    </p>

    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      ${isDoctor
        ? 'As a healthcare provider on our platform, you can now manage your appointments, connect with patients, and grow your practice.'
        : 'You can now browse our network of qualified doctors, book appointments, and manage your healthcare journey all in one place.'}
    </p>

    <h3 style="margin: 25px 0 15px; color: ${TEXT_COLOR}; font-size: 16px; font-weight: 600;">
      Getting Started:
    </h3>
    <ul style="margin: 0; padding-left: 20px; color: ${TEXT_COLOR}; font-size: 14px; line-height: 1.8;">
      <li>Complete your profile to help ${isDoctor ? 'patients find you' : 'us serve you better'}</li>
      <li>${isDoctor ? 'Set your availability for appointments' : 'Browse available doctors'}</li>
      <li>${isDoctor ? 'Start accepting appointment requests' : 'Book your first appointment'}</li>
    </ul>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Welcome aboard!<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `Welcome to HealOrbit, ${isDoctor ? 'Dr. ' : ''}${name}!`);
};

/**
 * Password Reset Email
 */
export const passwordResetTemplate = (data) => {
  const { name, resetToken, isDoctor } = data;
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&role=${isDoctor ? 'doctor' : 'patient'}`;

  const content = `
    <h2 style="margin: 0 0 10px; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
      Reset Your Password
    </h2>
    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${isDoctor ? 'Dr. ' : ''}${name},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>

    ${button('Reset Password', resetUrl)}

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      This link will expire in 1 hour for security reasons.
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      </p>
    </div>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, 'Reset your HealOrbit password');
};

/**
 * Email Verification Email (with link only - legacy)
 */
export const emailVerificationTemplate = (data) => {
  const { name, verificationToken, isDoctor } = data;
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&role=${isDoctor ? 'doctor' : 'patient'}`;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; background-color: ${BRAND_COLOR}; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
        <span style="font-size: 30px; color: white;">✉</span>
      </div>
      <h2 style="margin: 0; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
        Verify Your Email Address
      </h2>
    </div>

    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${isDoctor ? 'Dr. ' : ''}${name},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Thank you for signing up with HealOrbit! Please verify your email address to complete your registration and access all features.
    </p>

    ${button('Verify Email Address', verifyUrl)}

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      This verification link will expire in 24 hours.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        <strong>Why verify?</strong> Verifying your email helps us ensure the security of your account and allows us to send you important updates about your appointments.
      </p>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Didn't sign up?</strong> If you didn't create an account with HealOrbit, please ignore this email.
      </p>
    </div>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `Verify your email to complete registration at HealOrbit`);
};

/**
 * Email Verification with Code and Link
 */
export const emailVerificationCodeTemplate = (data) => {
  const { name, code, verificationToken, isDoctor, email } = data;
  const verifyUrl = verificationToken
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&role=${isDoctor ? 'doctor' : 'patient'}&email=${encodeURIComponent(email || '')}`
    : null;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; background-color: ${BRAND_COLOR}; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
        <span style="font-size: 30px; color: white;">✉</span>
      </div>
      <h2 style="margin: 0; color: ${TEXT_COLOR}; font-size: 22px; font-weight: 600;">
        Verify Your Email Address
      </h2>
    </div>

    <p style="margin: 0 0 20px; color: ${TEXT_SECONDARY}; font-size: 16px;">
      Hello ${isDoctor ? 'Dr. ' : ''}${name},
    </p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
      Thank you for signing up with HealOrbit! Use the verification code below to complete your registration:
    </p>

    <!-- Verification Code Box -->
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: ${BG_COLOR}; border: 2px dashed ${BRAND_COLOR}; border-radius: 12px; padding: 20px 40px;">
        <p style="margin: 0 0 8px; color: ${TEXT_SECONDARY}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
          Your Verification Code
        </p>
        <p style="margin: 0; color: ${BRAND_COLOR}; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
          ${code}
        </p>
      </div>
    </div>

    <p style="margin: 20px 0; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6; text-align: center;">
      Enter this code on the verification page to confirm your email.
    </p>

    ${verifyUrl ? `
    <div style="text-align: center; margin: 25px 0;">
      <p style="margin: 0 0 15px; color: ${TEXT_SECONDARY}; font-size: 14px;">
        Or click the button below to verify directly:
      </p>
      ${button('Verify Email Address', verifyUrl)}
    </div>
    ` : ''}

    <p style="margin: 20px 0; color: ${TEXT_SECONDARY}; font-size: 14px; text-align: center;">
      This code will expire in 24 hours.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        <strong>Why verify?</strong> Verifying your email helps us ensure the security of your account and allows us to send you important updates about your appointments.
      </p>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Didn't sign up?</strong> If you didn't create an account with HealOrbit, please ignore this email.
      </p>
    </div>

    <p style="margin: 30px 0 0; color: ${TEXT_COLOR}; font-size: 15px;">
      Best regards,<br>
      <strong style="color: ${BRAND_COLOR};">HealOrbit Team</strong>
    </p>
  `;

  return baseTemplate(content, `Your HealOrbit verification code is ${code}`);
};

export default {
  appointmentRequestTemplate,
  appointmentApprovedTemplate,
  appointmentCompletedTemplate,
  appointmentCancelledTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  emailVerificationTemplate,
  emailVerificationCodeTemplate,
};
