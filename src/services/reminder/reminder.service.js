/**
 * Appointment Reminder Service
 *
 * Handles automated appointment reminders via email.
 * Sends reminders to patients for upcoming appointments.
 */

import { appointmentRepository } from '../../repositories/index.js';
import { sendEmail, isEmailConfigured } from '../email/email.service.js';
import { AppointmentStatus } from '../../config/constants.js';

// Store interval reference for cleanup
let reminderInterval = null;

/**
 * Email template for appointment reminder
 */
const appointmentReminderTemplate = ({ patientName, doctorName, speciality, scheduledDate, scheduledTime, appointmentId }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Appointment Reminder - CareSync</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 24px;">Appointment Reminder</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Don't forget your upcoming appointment!</p>
      </div>

      <div style="padding: 30px;">
        <p style="color: #6b7280; font-size: 16px; margin-bottom: 20px;">Hello ${patientName},</p>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px; color: #92400e; font-size: 18px;">Your Appointment Details</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Doctor:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Dr. ${doctorName}</td>
            </tr>
            ${speciality ? `
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Speciality:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${speciality}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Date:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${scheduledDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Time:</td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${scheduledTime || 'To be confirmed'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Reference:</td>
              <td style="padding: 8px 0; color: #6b7280; font-size: 12px;">#${appointmentId}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px; color: #166534; font-size: 14px;">Preparation Tips:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 13px; line-height: 1.6;">
            <li>Arrive 10-15 minutes before your scheduled time</li>
            <li>Bring any relevant medical records or reports</li>
            <li>Prepare a list of your current medications</li>
            <li>Note down any questions you want to ask</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you need to reschedule or cancel your appointment, please do so at least 24 hours in advance through the CareSync portal.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This is an automated reminder from CareSync Hospital Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  </body>
</html>
`;

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Get appointments scheduled for the next N hours
 */
export const getUpcomingAppointments = async (hoursAhead = 24) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  try {
    // Get all approved appointments with scheduled dates
    const appointments = await appointmentRepository.model
      .find({
        status: AppointmentStatus.APPROVED,
        scheduledDate: {
          $gte: now,
          $lte: futureDate
        },
        reminderSent: { $ne: true } // Only get appointments where reminder hasn't been sent
      })
      .populate('patientId', 'fullName email number')
      .populate('doctorId', 'firstName lastName email speciality')
      .lean();

    return appointments;
  } catch (error) {
    console.error('[Reminder Service] Error fetching upcoming appointments:', error);
    return [];
  }
};

/**
 * Send reminder email for an appointment
 */
export const sendAppointmentReminder = async (appointment) => {
  try {
    const patient = appointment.patientId;
    const doctor = appointment.doctorId;
    const patientDetails = appointment.patientDetails;

    if (!patient?.email) {
      console.log(`[Reminder Service] No email for patient in appointment ${appointment._id}`);
      return { success: false, error: 'No patient email' };
    }

    const patientName = patientDetails?.name || patient?.fullName || 'Patient';
    const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Doctor';

    const emailContent = appointmentReminderTemplate({
      patientName,
      doctorName,
      speciality: doctor?.speciality,
      scheduledDate: formatDate(appointment.scheduledDate),
      scheduledTime: appointment.scheduledTime,
      appointmentId: appointment._id.toString().slice(-8).toUpperCase()
    });

    const result = await sendEmail({
      to: patient.email,
      subject: `Reminder: Your appointment with Dr. ${doctorName} is coming up!`,
      html: emailContent
    });

    if (result.success) {
      // Mark reminder as sent
      await appointmentRepository.model.findByIdAndUpdate(appointment._id, {
        reminderSent: true,
        reminderSentAt: new Date()
      });
      console.log(`[Reminder Service] Reminder sent for appointment ${appointment._id}`);
    }

    return result;
  } catch (error) {
    console.error(`[Reminder Service] Error sending reminder for appointment ${appointment._id}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Process all upcoming appointments and send reminders
 */
export const processReminders = async () => {
  if (!isEmailConfigured()) {
    console.log('[Reminder Service] Email not configured, skipping reminders');
    return { processed: 0, sent: 0, failed: 0 };
  }

  console.log('[Reminder Service] Processing appointment reminders...');

  const appointments = await getUpcomingAppointments(24); // 24 hours ahead

  let sent = 0;
  let failed = 0;

  for (const appointment of appointments) {
    const result = await sendAppointmentReminder(appointment);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    // Add small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[Reminder Service] Processed ${appointments.length} appointments: ${sent} sent, ${failed} failed`);

  return { processed: appointments.length, sent, failed };
};

/**
 * Start the reminder scheduler
 * Runs every hour to check for upcoming appointments
 */
export const startReminderScheduler = () => {
  if (!isEmailConfigured()) {
    console.log('[Reminder Service] Email not configured, reminder scheduler disabled');
    return;
  }

  // Run immediately on startup
  processReminders();

  // Then run every hour
  const ONE_HOUR = 60 * 60 * 1000;
  reminderInterval = setInterval(processReminders, ONE_HOUR);

  console.log('[Reminder Service] Reminder scheduler started (runs every hour)');
};

/**
 * Stop the reminder scheduler
 */
export const stopReminderScheduler = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[Reminder Service] Reminder scheduler stopped');
  }
};

/**
 * Manually trigger reminder processing (for testing/admin)
 */
export const triggerReminders = async () => {
  return await processReminders();
};

export default {
  getUpcomingAppointments,
  sendAppointmentReminder,
  processReminders,
  startReminderScheduler,
  stopReminderScheduler,
  triggerReminders
};
