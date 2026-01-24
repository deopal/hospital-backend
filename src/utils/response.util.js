/**
 * Standardized API Response Utilities
 * Provides consistent response formatting across all endpoints
 */

import { HttpStatus } from '../config/constants.js';

/**
 * Success response
 */
export const successResponse = (res, data = {}, message = 'Success', statusCode = HttpStatus.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Created response (201)
 */
export const createdResponse = (res, data = {}, message = 'Created successfully') => {
  return successResponse(res, data, message, HttpStatus.CREATED);
};

/**
 * Error response
 */
export const errorResponse = (res, message = 'Something went wrong', statusCode = HttpStatus.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    error: message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Not found response (404)
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, HttpStatus.NOT_FOUND);
};

/**
 * Bad request response (400)
 */
export const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  return errorResponse(res, message, HttpStatus.BAD_REQUEST, errors);
};

/**
 * Unauthorized response (401)
 */
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, HttpStatus.UNAUTHORIZED);
};

/**
 * Conflict response (409)
 */
export const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, HttpStatus.CONFLICT);
};

/**
 * Paginated response
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(HttpStatus.OK).json({
    success: true,
    message,
    ...data,
    pagination
  });
};

export default {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  conflictResponse,
  paginatedResponse
};
