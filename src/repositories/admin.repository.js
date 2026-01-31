/**
 * Admin Repository
 * Data access layer for admin-related operations
 */

import { Admin } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class AdminRepository extends BaseRepository {
  constructor() {
    super(Admin);
  }

  /**
   * Find admin by email
   */
  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  /**
   * Find admin by ID excluding password
   */
  async findByIdSafe(id) {
    return await this.findById(id, { select: '-hash_password' });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id) {
    return await this.updateById(id, { lastLogin: new Date() });
  }

  /**
   * Create or update admin (upsert)
   */
  async upsertByEmail(email, data) {
    return await this.model.findOneAndUpdate(
      { email },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

// Export singleton instance
export const adminRepository = new AdminRepository();
export default adminRepository;
