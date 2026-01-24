/**
 * Doctor Repository
 * Data access layer for doctor-related operations
 */

import { Doctor } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class DoctorRepository extends BaseRepository {
  constructor() {
    super(Doctor);
  }

  /**
   * Find doctor by email
   */
  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  /**
   * Find all active doctors
   */
  async findAllActive(options = {}) {
    return await this.find(
      { isActive: true },
      { select: '-hash_password', ...options }
    );
  }

  /**
   * Find doctor by ID excluding password
   */
  async findByIdSafe(id) {
    return await this.findById(id, { select: '-hash_password' });
  }

  /**
   * Update doctor profile (excluding sensitive fields)
   */
  async updateProfile(id, data) {
    // Remove sensitive fields that shouldn't be updated this way
    delete data.hash_password;
    delete data.email;
    delete data.role;

    return await this.updateById(id, data, { select: '-hash_password' });
  }

  /**
   * Update doctor's profile image
   */
  async updateImage(id, imageUrl) {
    return await this.updateById(id, { image: imageUrl }, { select: '-hash_password' });
  }
}

// Export singleton instance
export const doctorRepository = new DoctorRepository();
export default doctorRepository;
