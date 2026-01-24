/**
 * Contact Controller
 * Handles contact form endpoints
 */

import { submitContact } from '../services/contact/contact.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Submit contact form
 */
export const contact = async (req, res) => {
  try {
    const result = await submitContact(req.body);

    return successResponse(res, { contact: result.contact }, result.message);
  } catch (error) {
    console.error('Contact form error:', error);
    return errorResponse(res, 'Failed to submit contact form');
  }
};

export default {
  contact
};
