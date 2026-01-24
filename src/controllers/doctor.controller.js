/**
 * Doctor Controller
 * Handles doctor profile and settings endpoints
 */

import { getDoctorProfile, updateDoctorSettings, updateDoctorImage, getAllActiveDoctors, getDoctorById } from '../services/doctor/doctor.service.js';
import { getDoctorAppointments, approveAppointment, completeAppointment, addReview, getDoctorReviews, cancelAppointment } from '../services/appointment/appointment.service.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.util.js';
import { HttpStatus } from '../config/constants.js';

/**
 * Get doctor's profile/settings
 */
export const getSettings = async (req, res) => {
  try {
    const result = await getDoctorProfile(req.params.id);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor });
  } catch (error) {
    console.error('Get doctor settings error:', error);
    return errorResponse(res, 'Failed to fetch doctor settings');
  }
};

/**
 * Update doctor's settings
 */
export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const result = await updateDoctorSettings(req.params.id, settings);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor }, result.message);
  } catch (error) {
    console.error('Update doctor settings error:', error);
    return errorResponse(res, 'Failed to update settings');
  }
};

/**
 * Update doctor's profile image
 */
export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    const result = await updateDoctorImage(req.params.id, image);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor }, result.message);
  } catch (error) {
    console.error('Upload doctor image error:', error);
    return errorResponse(res, 'Failed to update profile picture');
  }
};

/**
 * Get all patients/appointments for a doctor
 */
export const getPatientList = async (req, res) => {
  try {
    const result = await getDoctorAppointments(req.params.id);
    return successResponse(res, { appointments: result.appointments });
  } catch (error) {
    console.error('Get patient list error:', error);
    return errorResponse(res, 'Failed to fetch patient list');
  }
};

/**
 * Approve an appointment
 */
export const approveAppointments = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    const result = await approveAppointment(req.params.id, scheduledDate, scheduledTime);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Approve appointment error:', error);
    return errorResponse(res, 'Failed to approve appointment');
  }
};

/**
 * Complete an appointment
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
 * Add review to appointment
 */
export const addReviews = async (req, res) => {
  try {
    const { diagnosis, prescription, notes } = req.body;
    const result = await addReview(req.params.id, diagnosis, prescription, notes);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Add review error:', error);
    return errorResponse(res, 'Failed to add review');
  }
};

/**
 * Get doctor's reviews
 */
export const getReviews = async (req, res) => {
  try {
    const result = await getDoctorReviews(req.params.id);
    return successResponse(res, { reviews: result.reviews });
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    return errorResponse(res, 'Failed to fetch reviews');
  }
};

/**
 * Get all active doctors (public)
 */
export const getAllDoctors = async (req, res) => {
  try {
    const result = await getAllActiveDoctors();
    return successResponse(res, { doctorList: result.doctorList });
  } catch (error) {
    console.error('Get all doctors error:', error);
    return errorResponse(res, 'Failed to fetch doctors');
  }
};

/**
 * Get doctor by ID (public)
 */
export const getDoctorByIdHandler = async (req, res) => {
  try {
    const result = await getDoctorById(req.params.id);

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    return errorResponse(res, 'Failed to fetch doctor');
  }
};

/**
 * Cancel an appointment (doctor action)
 */
export const cancelAppointmentHandler = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await cancelAppointment(req.params.id, reason, 'doctor');

    if (result.error) {
      return notFoundResponse(res, result.error);
    }

    return successResponse(res, { appointment: result.appointment }, result.message);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return errorResponse(res, 'Failed to cancel appointment');
  }
};

export default {
  getSettings,
  updateSettings,
  uploadImage,
  getPatientList,
  approveAppointments,
  completeAppointmentHandler,
  addReviews,
  getReviews,
  getAllDoctors,
  getDoctorByIdHandler,
  cancelAppointmentHandler
};
