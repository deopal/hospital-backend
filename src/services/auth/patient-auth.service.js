/**
 * Patient Auth Service
 * Patient-specific authentication operations
 */

import { patientRepository } from '../../repositories/index.js';
import {
  hashPassword,
  generateToken,
  generateUsername,
  sanitizeUserData,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailVerificationExpired
} from './auth.service.js';
import { UserRole } from '../../config/constants.js';
import { sendEmail, isEmailConfigured } from '../email/email.service.js';
import { emailVerificationTemplate } from '../email/email.templates.js';

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

  // Generate email verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpires = getEmailVerificationExpiry();

  // Hash password and create patient
  const hash_password = await hashPassword(password);
  const patient = await patientRepository.create({
    firstName,
    lastName,
    username: generateUsername(),
    email,
    hash_password,
    gender,
    number,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - HealOrbit',
        html: emailVerificationTemplate({
          name: firstName,
          verificationToken: emailVerificationToken,
          isDoctor: false
        })
      });
    } catch (error) {
      console.error('[Patient Auth] Failed to send verification email:', error);
    }
  }

  return {
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    requiresVerification: true
  };
};

/**
 * Verify patient email
 */
export const verifyPatientEmail = async (token) => {
  const patient = await patientRepository.findOne({ emailVerificationToken: token });

  if (!patient) {
    return { error: 'Invalid verification token' };
  }

  if (isEmailVerificationExpired(patient.emailVerificationExpires)) {
    return { error: 'Verification token has expired. Please request a new one.' };
  }

  // Mark email as verified
  await patientRepository.updateById(patient._id, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  return { success: true, message: 'Email verified successfully! You can now sign in.' };
};

/**
 * Resend verification email
 */
export const resendPatientVerificationEmail = async (email) => {
  const patient = await patientRepository.findByEmail(email);

  if (!patient) {
    // Don't reveal if email exists
    return { success: true, message: 'If an account exists with this email, a verification link has been sent.' };
  }

  if (patient.isEmailVerified) {
    return { error: 'Email is already verified' };
  }

  // Generate new verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpires = getEmailVerificationExpiry();

  await patientRepository.updateById(patient._id, {
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - HealOrbit',
        html: emailVerificationTemplate({
          name: patient.firstName,
          verificationToken: emailVerificationToken,
          isDoctor: false
        })
      });
    } catch (error) {
      console.error('[Patient Auth] Failed to send verification email:', error);
    }
  }

  return { success: true, message: 'If an account exists with this email, a verification link has been sent.' };
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

  // Check if email is verified
  if (!patient.isEmailVerified) {
    return {
      error: 'Please verify your email before signing in',
      requiresVerification: true,
      email: patient.email
    };
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
  authenticatePatient,
  verifyPatientEmail,
  resendPatientVerificationEmail
};
