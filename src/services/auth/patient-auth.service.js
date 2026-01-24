/**
 * Patient Auth Service
 * Patient-specific authentication operations
 */

import { patientRepository } from '../../repositories/index.js';
import { hashPassword, generateToken, generateUsername, sanitizeUserData } from './auth.service.js';
import { UserRole } from '../../config/constants.js';

/**
 * Register a new patient
 */
export const registerPatient = async (patientData) => {
  const { email, password, firstName, lastName, gender, number } = patientData;

  // Check if patient already exists
  const existingPatient = await patientRepository.findByEmail(email);
  if (existingPatient) {
    return { error: 'Patient already registered' };
  }

  // Hash password and create patient
  const hash_password = await hashPassword(password);
  const patient = await patientRepository.create({
    firstName,
    lastName,
    username: generateUsername(),
    email,
    hash_password,
    gender,
    number
  });

  return { success: true, message: 'Patient registered successfully!' };
};

/**
 * Authenticate patient
 */
export const authenticatePatient = async (email, password) => {
  const patient = await patientRepository.findByEmail(email);

  if (!patient) {
    return { error: 'Invalid credentials' };
  }

  const isValidPassword = await patient.authenticate(password);

  if (!isValidPassword || patient.role !== UserRole.PATIENT) {
    return { error: 'Invalid credentials' };
  }

  const token = generateToken({
    _id: patient._id,
    role: patient.role
  });

  const userData = sanitizeUserData(patient);

  return {
    success: true,
    message: 'Logged in successfully',
    token,
    user: {
      _id: userData._id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName,
      gender: userData.gender,
      number: userData.number
    }
  };
};

export default {
  registerPatient,
  authenticatePatient
};
