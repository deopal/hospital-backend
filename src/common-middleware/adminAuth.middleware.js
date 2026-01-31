/**
 * Admin Auth Middleware
 * Protects admin-only routes
 */

import jwt from 'jsonwebtoken';
import { adminRepository } from '../repositories/index.js';
import { UserRole } from '../config/constants.js';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.util.js';

/**
 * Verify admin token and attach admin to request
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    if (decoded.role !== UserRole.ADMIN) {
      return forbiddenResponse(res, 'Access denied. Admin only.');
    }

    // Find admin
    const admin = await adminRepository.findByIdSafe(decoded._id);
    if (!admin) {
      return unauthorizedResponse(res, 'Admin not found.');
    }

    if (!admin.isActive) {
      return forbiddenResponse(res, 'Admin account is deactivated.');
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token expired.');
    }
    return unauthorizedResponse(res, 'Authentication failed.');
  }
};

/**
 * Check if admin has specific permission
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return unauthorizedResponse(res, 'Authentication required.');
    }

    if (!req.admin.permissions.includes(permission)) {
      return forbiddenResponse(res, `Permission denied. Required: ${permission}`);
    }

    next();
  };
};

export default {
  requireAdminAuth,
  requirePermission
};
