/**
 * Contact Service
 * Business logic for contact form operations
 */

import mongoose from 'mongoose';
import { contactRepository } from '../../repositories/index.js';

const { ObjectId } = mongoose.Types;

/**
 * Submit contact form
 */
export const submitContact = async (contactData) => {
  const { userId, name, email, number, message, role } = contactData;

  const contact = await contactRepository.upsertByUserId(userId, {
    name,
    email,
    number,
    message,
    role
  });

  return {
    success: true,
    message: 'Thank you for contacting us!',
    contact
  };
};

/**
 * Get all contact submissions (admin)
 */
export const getAllContacts = async (options = {}) => {
  const contacts = await contactRepository.find({}, options);
  return { success: true, contacts };
};

/**
 * Get contacts by status
 */
export const getContactsByStatus = async (status) => {
  const contacts = await contactRepository.findByStatus(status);
  return { success: true, contacts };
};

/**
 * Update contact status
 */
export const updateContactStatus = async (contactId, status, response = null) => {
  const contact = await contactRepository.updateStatus(contactId, status, response);

  if (!contact) {
    return { error: 'Contact not found' };
  }

  return {
    success: true,
    message: 'Contact status updated',
    contact
  };
};

export default {
  submitContact,
  getAllContacts,
  getContactsByStatus,
  updateContactStatus
};
