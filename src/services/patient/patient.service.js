/**
 * Patient Service
 * Business logic for patient-specific operations
 */

import { patientRepository, appointmentRepository } from '../../repositories/index.js';
import { AppointmentStatus } from '../../config/constants.js';

/**
 * Get patient profile
 */
export const getPatientProfile = async (patientId) => {
  const patient = await patientRepository.findByIdSafe(patientId);

  if (!patient) {
    return { error: 'Patient not found' };
  }

  return { success: true, patient };
};

/**
 * Update patient settings
 */
export const updatePatientSettings = async (patientId, settings) => {
  const patient = await patientRepository.updateProfile(patientId, settings);

  if (!patient) {
    return { error: 'Patient not found' };
  }

  return {
    success: true,
    message: 'Settings updated successfully',
    patient
  };
};

/**
 * Update patient profile image
 */
export const updatePatientImage = async (patientId, imageUrl) => {
  const patient = await patientRepository.updateImage(patientId, imageUrl);

  if (!patient) {
    return { error: 'Patient not found' };
  }

  return {
    success: true,
    message: 'Profile picture updated',
    patient
  };
};

/**
 * Get patient's medical history (completed appointments with diagnoses)
 */
export const getMedicalHistory = async (patientId) => {
  const appointments = await appointmentRepository.find(
    {
      patientId,
      status: AppointmentStatus.COMPLETED,
      diagnosis: { $exists: true, $ne: null }
    },
    {
      populate: { path: 'doctorId', select: 'firstName lastName speciality image' },
      sort: { completedAt: -1 }
    }
  );

  return {
    success: true,
    medicalHistory: appointments.map(apt => ({
      _id: apt._id,
      doctor: apt.doctorId,
      diagnosis: apt.diagnosis,
      prescription: apt.prescription,
      notes: apt.notes,
      healthProblems: apt.healthProblems,
      reports: apt.reports || [],
      completedAt: apt.completedAt,
      scheduledDate: apt.scheduledDate
    }))
  };
};

/**
 * Get patient's appointment timeline (all status changes)
 */
export const getTimeline = async (patientId) => {
  const appointments = await appointmentRepository.find(
    { patientId },
    {
      populate: { path: 'doctorId', select: 'firstName lastName speciality' },
      sort: { createdAt: -1 }
    }
  );

  // Build timeline events from appointments
  const timeline = [];

  appointments.forEach(apt => {
    const doctorName = apt.doctorId
      ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
      : 'Unknown Doctor';

    // Appointment created
    timeline.push({
      type: 'appointment_created',
      title: 'Appointment Requested',
      description: `Requested appointment with ${doctorName}`,
      doctor: apt.doctorId,
      appointmentId: apt._id,
      status: 'pending',
      healthProblems: apt.healthProblems,
      timestamp: apt.createdAt
    });

    // If approved
    if (apt.scheduledDate || apt.status === AppointmentStatus.APPROVED ||
        apt.status === AppointmentStatus.COMPLETED) {
      timeline.push({
        type: 'appointment_approved',
        title: 'Appointment Approved',
        description: `Appointment with ${doctorName} scheduled${apt.scheduledDate ? ` for ${new Date(apt.scheduledDate).toLocaleDateString()}` : ''}`,
        doctor: apt.doctorId,
        appointmentId: apt._id,
        status: 'approved',
        scheduledDate: apt.scheduledDate,
        scheduledTime: apt.scheduledTime,
        timestamp: apt.scheduledDate || apt.updatedAt
      });
    }

    // If completed
    if (apt.status === AppointmentStatus.COMPLETED && apt.completedAt) {
      timeline.push({
        type: 'appointment_completed',
        title: 'Appointment Completed',
        description: `Consultation with ${doctorName} completed`,
        doctor: apt.doctorId,
        appointmentId: apt._id,
        status: 'completed',
        diagnosis: apt.diagnosis,
        prescription: apt.prescription,
        timestamp: apt.completedAt
      });
    }

    // If cancelled
    if (apt.status === AppointmentStatus.CANCELLED && apt.cancelledAt) {
      timeline.push({
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        description: `Appointment with ${doctorName} was cancelled${apt.cancellationReason ? `: ${apt.cancellationReason}` : ''}`,
        doctor: apt.doctorId,
        appointmentId: apt._id,
        status: 'cancelled',
        cancelledBy: apt.cancelledBy,
        reason: apt.cancellationReason,
        timestamp: apt.cancelledAt
      });
    }
  });

  // Sort timeline by timestamp (most recent first)
  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    success: true,
    timeline
  };
};

export default {
  getPatientProfile,
  updatePatientSettings,
  updatePatientImage,
  getMedicalHistory,
  getTimeline
};
