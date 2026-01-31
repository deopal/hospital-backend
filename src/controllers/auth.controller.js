/**
 * Auth Controller
 * Handles authentication endpoints for doctors and patients
 * Controllers are thin - they only handle request/response
 */

import {
  registerDoctor,
  authenticateDoctor,
  verifyDoctorEmail,
  resendDoctorVerificationEmail
} from '../services/auth/doctor-auth.service.js';
import {
  registerPatient,
  authenticatePatient,
  verifyPatientEmail,
  resendPatientVerificationEmail
} from '../services/auth/patient-auth.service.js';
import {
  generateResetToken,
  getResetTokenExpiry,
  isResetTokenExpired,
  hashPassword
} from '../services/auth/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { HttpStatus, JwtConfig } from '../config/constants.js';
import Doctor from '../models/user/doctor.model.js';
import Patient from '../models/user/patient.model.js';

// ============================================
// Doctor Auth
// ============================================

export const doctorSignup = async (req, res) => {
  try {
    const result = await registerDoctor(req.body);

    if (result.error) {
      return errorResponse(res, result.error, HttpStatus.BAD_REQUEST);
    }

    return successResponse(res, {}, result.message, HttpStatus.CREATED);
  } catch (error) {
    console.error('Doctor signup error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

export const doctorSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateDoctor(email, password);

    if (result.error) {
      // Return verification info if email not verified
      if (result.requiresVerification) {
        return errorResponse(res, result.error, HttpStatus.FORBIDDEN, {
          requiresVerification: true,
          email: result.email
        });
      }
      return errorResponse(res, result.error, HttpStatus.UNAUTHORIZED);
    }

    res.cookie(JwtConfig.COOKIE_NAME, result.token, { expiresIn: JwtConfig.EXPIRES_IN });
    return successResponse(res, { token: result.token, user: result.user }, result.message);
  } catch (error) {
    console.error('Doctor signin error:', error);
    return errorResponse(res, error.message);
  }
};

export const doctorSignout = (req, res) => {
  res.clearCookie(JwtConfig.COOKIE_NAME);
  return successResponse(res, {}, 'Signout successfully!');
};

// ============================================
// Patient Auth
// ============================================

export const patientSignup = async (req, res) => {
  try {
    const result = await registerPatient(req.body);

    if (result.error) {
      return errorResponse(res, result.error, HttpStatus.BAD_REQUEST);
    }

    return successResponse(res, {}, result.message, HttpStatus.CREATED);
  } catch (error) {
    console.error('Patient signup error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

export const patientSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticatePatient(email, password);

    if (result.error) {
      // Return verification info if email not verified
      if (result.requiresVerification) {
        return errorResponse(res, result.error, HttpStatus.FORBIDDEN, {
          requiresVerification: true,
          email: result.email
        });
      }
      return errorResponse(res, result.error, HttpStatus.UNAUTHORIZED);
    }

    res.cookie(JwtConfig.COOKIE_NAME, result.token, { expiresIn: JwtConfig.EXPIRES_IN });
    return successResponse(res, { token: result.token, user: result.user }, result.message);
  } catch (error) {
    console.error('Patient signin error:', error);
    return errorResponse(res, error.message);
  }
};

export const patientSignout = (req, res) => {
  res.clearCookie(JwtConfig.COOKIE_NAME);
  return successResponse(res, {}, 'Signout successfully!');
};

// ============================================
// Password Reset (Shared for Doctor & Patient)
// ============================================

/**
 * Request password reset - sends email with reset link
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return errorResponse(res, 'Email and role are required', HttpStatus.BAD_REQUEST);
    }

    const Model = role === 'doctor' ? Doctor : Patient;
    const user = await Model.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't reveal if email exists
      return successResponse(res, {}, 'If an account exists with this email, you will receive a password reset link.');
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpiry = getResetTokenExpiry();

    // Save token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiry;
    await user.save();

    // In production, send email here
    // For now, we'll return the token in response (remove in production)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&role=${role}`;

    console.log(`Password reset link for ${email}: ${resetLink}`);

    return successResponse(res, {
      // Remove resetLink in production - only for development/testing
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    }, 'If an account exists with this email, you will receive a password reset link.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

/**
 * Verify reset token is valid
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return errorResponse(res, 'Token and role are required', HttpStatus.BAD_REQUEST);
    }

    const Model = role === 'doctor' ? Doctor : Patient;
    const user = await Model.findOne({ passwordResetToken: token });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    if (isResetTokenExpired(user.passwordResetExpires)) {
      return errorResponse(res, 'Reset token has expired. Please request a new one.', HttpStatus.BAD_REQUEST);
    }

    return successResponse(res, { valid: true }, 'Token is valid');
  } catch (error) {
    console.error('Verify reset token error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, role, password } = req.body;

    if (!token || !role || !password) {
      return errorResponse(res, 'Token, role, and password are required', HttpStatus.BAD_REQUEST);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', HttpStatus.BAD_REQUEST);
    }

    const Model = role === 'doctor' ? Doctor : Patient;
    const user = await Model.findOne({ passwordResetToken: token });

    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    if (isResetTokenExpired(user.passwordResetExpires)) {
      return errorResponse(res, 'Reset token has expired. Please request a new one.', HttpStatus.BAD_REQUEST);
    }

    // Hash new password and save
    user.hash_password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return successResponse(res, {}, 'Password has been reset successfully. You can now login with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

// ============================================
// Email Verification
// ============================================

/**
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return errorResponse(res, 'Token and role are required', HttpStatus.BAD_REQUEST);
    }

    const result = role === 'doctor'
      ? await verifyDoctorEmail(token)
      : await verifyPatientEmail(token);

    if (result.error) {
      return errorResponse(res, result.error, HttpStatus.BAD_REQUEST);
    }

    return successResponse(res, {}, result.message);
  } catch (error) {
    console.error('Verify email error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return errorResponse(res, 'Email and role are required', HttpStatus.BAD_REQUEST);
    }

    const result = role === 'doctor'
      ? await resendDoctorVerificationEmail(email)
      : await resendPatientVerificationEmail(email);

    if (result.error) {
      return errorResponse(res, result.error, HttpStatus.BAD_REQUEST);
    }

    return successResponse(res, {}, result.message);
  } catch (error) {
    console.error('Resend verification email error:', error);
    return errorResponse(res, 'Something went wrong');
  }
};

export default {
  doctorSignup,
  doctorSignin,
  doctorSignout,
  patientSignup,
  patientSignin,
  patientSignout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
};
