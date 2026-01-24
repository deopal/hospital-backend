/**
 * Appointment Service
 * Business logic for appointment operations
 */

import mongoose from 'mongoose';
import { appointmentRepository, doctorRepository } from '../../repositories/index.js';
import { notifyDoctorOfAppointmentRequest, notifyPatientOfAppointmentApproval, notifyPatientOfAppointmentCompletion, notifyOfAppointmentCancellation } from '../notification/notification.service.js';
import { RecipientType } from '../../config/constants.js';

const { ObjectId } = mongoose.Types;

/**
 * Create a new appointment
 */
export const createAppointment = async (appointmentData) => {
  const {
    patientId,
    doctorId,
    patientName,
    age,
    adharNumber,
    number,
    gender,
    healthProblems,
    previousRecords,
    reports = []
  } = appointmentData;

  // Validate ObjectIds
  if (!ObjectId.isValid(patientId) || !ObjectId.isValid(doctorId)) {
    return { error: 'Invalid patient or doctor ID' };
  }

  // Check if active appointment already exists
  const hasActive = await appointmentRepository.hasActiveAppointment(patientId, doctorId);
  if (hasActive) {
    return { error: 'You already have an active appointment with this doctor' };
  }

  // Verify doctor exists
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  // Create appointment
  const appointment = await appointmentRepository.create({
    patientId: new ObjectId(patientId),
    doctorId: new ObjectId(doctorId),
    patientDetails: {
      name: patientName,
      age,
      gender,
      adharNumber,
      contactNumber: number
    },
    healthProblems,
    previousRecords,
    reports
  });

  // Notify doctor (with metadata for email)
  await notifyDoctorOfAppointmentRequest(doctorId, patientId, appointment._id, patientName, {
    healthProblems,
    appointmentDate: 'To be scheduled'
  });

  return {
    success: true,
    message: 'Appointment request sent successfully',
    appointment
  };
};

/**
 * Get appointments for a doctor
 */
export const getDoctorAppointments = async (doctorId) => {
  const appointments = await appointmentRepository.findByDoctorId(doctorId);
  return { success: true, appointments };
};

/**
 * Get appointments for a patient
 */
export const getPatientAppointments = async (patientId) => {
  const appointments = await appointmentRepository.findByPatientId(patientId);
  return { success: true, appointments };
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (appointmentId) => {
  const appointment = await appointmentRepository.findByIdWithDetails(appointmentId);

  if (!appointment) {
    return { error: 'Appointment not found' };
  }

  return { success: true, appointment };
};

/**
 * Approve appointment (doctor action)
 */
export const approveAppointment = async (appointmentId, scheduledDate, scheduledTime) => {
  const appointment = await appointmentRepository.approve(appointmentId, scheduledDate, scheduledTime);

  if (!appointment) {
    return { error: 'Appointment not found' };
  }

  // Notify patient (with metadata for email)
  const doctorName = `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`;
  await notifyPatientOfAppointmentApproval(
    appointment.patientId._id,
    appointment.doctorId._id,
    appointment._id,
    doctorName,
    {
      scheduledDate: scheduledDate || 'To be confirmed',
      scheduledTime: scheduledTime || 'To be confirmed',
      speciality: appointment.doctorId.speciality
    }
  );

  return {
    success: true,
    message: 'Appointment approved successfully',
    appointment
  };
};

/**
 * Complete appointment (doctor action)
 */
export const completeAppointment = async (appointmentId, diagnosis, prescription, notes) => {
  const appointment = await appointmentRepository.complete(appointmentId, diagnosis, prescription, notes);

  if (!appointment) {
    return { error: 'Appointment not found' };
  }

  // Notify patient (with metadata for email)
  const doctorName = `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`;
  await notifyPatientOfAppointmentCompletion(
    appointment.patientId._id,
    appointment.doctorId._id,
    appointment._id,
    doctorName,
    {
      diagnosis,
      prescription,
      notes
    }
  );

  return {
    success: true,
    message: 'Appointment completed successfully',
    appointment
  };
};

/**
 * Cancel appointment (by patient or doctor)
 */
export const cancelAppointment = async (appointmentId, reason, cancelledBy) => {
  // Get appointment first to get details for notification
  const existingAppointment = await appointmentRepository.findByIdWithDetails(appointmentId);

  if (!existingAppointment) {
    return { error: 'Appointment not found' };
  }

  // Check if appointment can be cancelled (not already completed or cancelled)
  if (existingAppointment.status === 'completed') {
    return { error: 'Cannot cancel a completed appointment' };
  }

  if (existingAppointment.status === 'cancelled') {
    return { error: 'Appointment is already cancelled' };
  }

  const appointment = await appointmentRepository.cancel(appointmentId, reason, cancelledBy);

  if (!appointment) {
    return { error: 'Failed to cancel appointment' };
  }

  // Notify the other party
  if (cancelledBy === 'patient') {
    // Patient cancelled - notify doctor
    const patientName = existingAppointment.patientDetails?.name ||
      `${existingAppointment.patientId?.firstName || ''} ${existingAppointment.patientId?.lastName || ''}`.trim();

    await notifyOfAppointmentCancellation(
      existingAppointment.doctorId._id,
      RecipientType.DOCTOR,
      existingAppointment.patientId._id,
      RecipientType.PATIENT,
      appointmentId,
      patientName,
      {
        reason,
        appointmentDate: existingAppointment.scheduledDate
          ? new Date(existingAppointment.scheduledDate).toLocaleDateString()
          : 'Not scheduled'
      }
    );
  } else {
    // Doctor cancelled - notify patient
    const doctorName = `${existingAppointment.doctorId?.firstName || ''} ${existingAppointment.doctorId?.lastName || ''}`.trim();

    await notifyOfAppointmentCancellation(
      existingAppointment.patientId._id,
      RecipientType.PATIENT,
      existingAppointment.doctorId._id,
      RecipientType.DOCTOR,
      appointmentId,
      doctorName,
      {
        reason,
        appointmentDate: existingAppointment.scheduledDate
          ? new Date(existingAppointment.scheduledDate).toLocaleDateString()
          : 'Not scheduled'
      }
    );
  }

  return {
    success: true,
    message: 'Appointment cancelled successfully',
    appointment
  };
};

/**
 * Add review to appointment
 */
export const addReview = async (appointmentId, diagnosis, prescription, notes) => {
  const appointment = await appointmentRepository.updateById(appointmentId, {
    diagnosis,
    prescription,
    notes
  });

  if (!appointment) {
    return { error: 'Appointment not found' };
  }

  return {
    success: true,
    message: 'Review added successfully',
    appointment
  };
};

/**
 * Get completed appointments (reviews) for a doctor
 */
export const getDoctorReviews = async (doctorId) => {
  const reviews = await appointmentRepository.getCompletedByDoctorId(doctorId);
  return { success: true, reviews };
};

/**
 * Get completed appointments (reviews) for a patient
 */
export const getPatientReviews = async (patientId) => {
  const reviews = await appointmentRepository.getCompletedByPatientId(patientId);
  return { success: true, reviews };
};

export default {
  createAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  getAppointmentById,
  approveAppointment,
  completeAppointment,
  cancelAppointment,
  addReview,
  getDoctorReviews,
  getPatientReviews
};
