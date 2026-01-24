/**
 * Doctor Service
 * Business logic for doctor-specific operations
 */

import { doctorRepository } from '../../repositories/index.js';

/**
 * Get doctor profile
 */
export const getDoctorProfile = async (doctorId) => {
  const doctor = await doctorRepository.findByIdSafe(doctorId);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  return { success: true, doctor };
};

/**
 * Update doctor settings
 */
export const updateDoctorSettings = async (doctorId, settings) => {
  const doctor = await doctorRepository.updateProfile(doctorId, settings);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  return {
    success: true,
    message: 'Settings updated successfully',
    doctor
  };
};

/**
 * Update doctor profile image
 */
export const updateDoctorImage = async (doctorId, imageUrl) => {
  const doctor = await doctorRepository.updateImage(doctorId, imageUrl);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  return {
    success: true,
    message: 'Profile picture updated',
    doctor
  };
};

/**
 * Get all active doctors
 */
export const getAllActiveDoctors = async () => {
  const doctors = await doctorRepository.findAllActive();
  return { success: true, doctorList: doctors };
};

/**
 * Get doctor by ID (public profile)
 */
export const getDoctorById = async (doctorId) => {
  const doctor = await doctorRepository.findByIdSafe(doctorId);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  return { success: true, doctor };
};

export default {
  getDoctorProfile,
  updateDoctorSettings,
  updateDoctorImage,
  getAllActiveDoctors,
  getDoctorById
};
