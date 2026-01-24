/**
 * Patient Service
 * Business logic for patient-specific operations
 */

import { patientRepository } from '../../repositories/index.js';

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

export default {
  getPatientProfile,
  updatePatientSettings,
  updatePatientImage
};
