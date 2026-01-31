/**
 * Patient Controller
 * Handles patient profile and settings endpoints
 */

import { getPatientProfile, updatePatientSettings, updatePatientImage, getMedicalHistory, getTimeline } from '../services/patient/patient.service.js';
import { createAppointment, getPatientAppointments, getAppointmentById, getPatientReviews, completeAppointment, cancelAppointment } from '../services/appointment/appointment.service.js';
import { generatePrescriptionPDF } from '../services/pdf/prescription.service.js';
import { successResponse, errorResponse, notFoundResponse, badRequestResponse, createdResponse } from '../utils/response.util.js';

/**
 * Get patient's profile/settings
 */
export const getSettings = async (req, res) => {
  try {
    const result = await getPatientProfile(req.params.id);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { patient: result.patient });
  } catch (error) {
    console.error('Get patient settings error:', error);
    return errorResponse(res, 'Failed to fetch patient settings');
  }
};

/**
 * Update patient's settings
 */
export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const result = await updatePatientSettings(req.params.id, settings);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { patient: result.patient }, result.message);
  } catch (error) {
    console.error('Update patient settings error:', error);
    return errorResponse(res, 'Failed to update settings');
  }
};

/**
 * Update patient's profile image
 */
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    const result = await updatePatientImage(req.params.id, image);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { patient: result.patient }, result.message);
  } catch (error) {
    console.error('Upload patient image error:', error);
    return errorResponse(res, 'Failed to update profile picture');
  }
};

/**
 * Make appointment request
 */
export const makeAppointment = async (req, res) => {
  try {
    console.log('makeAppointment - req.body:', req.body);
    console.log('makeAppointment - req.files:', req.files);

    // Process uploaded files if any
    const reports = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    const appointmentData = {
      ...req.body,
      reports
    };

    console.log('makeAppointment - appointmentData:', appointmentData);

    const result = await createAppointment(appointmentData);

    if (result.error) {
      console.log('makeAppointment - error:', result.error);
      return badRequestResponse(res, result.error);
    }

    return createdResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Make appointment error:', error);
    return errorResponse(res, 'Failed to create appointment');
  }
};

/**
 * Get all appointments for patient
 */
export const getAllAppointments = async (req, res) => {
  try {
    const result = await getPatientAppointments(req.params.id);
    return successResponse(res, { appointments: result.appointments });
  } catch (error) {
    console.error('Get all appointments error:', error);
    return errorResponse(res, 'Failed to fetch appointments');
  }
};

/**
 * Get appointment by ID
 */
export const getAppointmentByIdHandler = async (req, res) => {
  try {
    const result = await getAppointmentById(req.params.id);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    return errorResponse(res, 'Failed to fetch appointment');
  }
};

/**
 * Get patient's reviews (completed appointments)
 */
export const getReviews = async (req, res) => {
  try {
    const result = await getPatientReviews(req.params.id);
    return successResponse(res, { reviews: result.reviews });
  } catch (error) {
    console.error('Get patient reviews error:', error);
    return errorResponse(res, 'Failed to fetch reviews');
  }
};

/**
 * Complete appointment (patient marking as done)
 */
export const completeAppointmentHandler = async (req, res) => {
  try {
    const { diagnosis, prescription, notes } = req.body;
    const result = await completeAppointment(req.params.id, diagnosis, prescription, notes);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Complete appointment error:', error);
    return errorResponse(res, 'Failed to complete appointment');
  }
};

/**
 * Cancel an appointment (patient action)
 */
export const cancelAppointmentHandler = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await cancelAppointment(req.params.id, reason, 'patient');

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return errorResponse(res, 'Failed to cancel appointment');
  }
};

/**
 * Download prescription PDF for a completed appointment
 */
export const downloadPrescription = async (req, res) => {
  try {
    const pdfBuffer = await generatePrescriptionPDF(req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${req.params.id.slice(-8)}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download prescription error:', error);
    if (error.message === 'Appointment not found') {
      return notFoundResponse(res, error.message);
    }
    if (error.message.includes('completed')) {
      return badRequestResponse(res, error.message);
    }
    return errorResponse(res, 'Failed to generate prescription PDF');
  }
};

/**
 * Get patient's medical history
 */
export const getMedicalHistoryHandler = async (req, res) => {
  try {
    const result = await getMedicalHistory(req.params.id);
    return successResponse(res, { medicalHistory: result.medicalHistory });
  } catch (error) {
    console.error('Get medical history error:', error);
    return errorResponse(res, 'Failed to fetch medical history');
  }
};

/**
 * Get patient's appointment timeline
 */
export const getTimelineHandler = async (req, res) => {
  try {
    const result = await getTimeline(req.params.id);
    return successResponse(res, { timeline: result.timeline });
  } catch (error) {
    console.error('Get timeline error:', error);
    return errorResponse(res, 'Failed to fetch timeline');
  }
};

export default {
  getSettings,
  updateSettings,
  uploadImage,
  makeAppointment,
  getAllAppointments,
  getAppointmentByIdHandler,
  getReviews,
  completeAppointmentHandler,
  cancelAppointmentHandler,
  downloadPrescription,
  getMedicalHistoryHandler,
  getTimelineHandler
};
