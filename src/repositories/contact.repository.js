/**
 * Contact Repository
 * Data access layer for contact form operations
 */

import mongoose from 'mongoose';
import { Contact } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

const { ObjectId } = mongoose.Types;

class ContactRepository extends BaseRepository {
  constructor() {
    super(Contact);
  }

  /**
   * Create or update contact submission
   */
  async upsertByUserId(userId, data) {
    return await this.model.findOneAndUpdate(
      { userId: new ObjectId(userId) },
      {
        userId: new ObjectId(userId),
        ...data
      },
      { new: true, upsert: true }
    );
  }

  /**
   * Get contact submissions by status
   */
  async findByStatus(status, options = {}) {
    return await this.find({ status }, options);
  }

  /**
   * Update contact status
   */
  async updateStatus(id, status, response = null) {
    const updateData = { status };

    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
    }

    return await this.updateById(id, updateData);
  }
}

// Export singleton instance
export const contactRepository = new ContactRepository();
export default contactRepository;
