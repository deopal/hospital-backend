/**
 * Patient Repository
 * Data access layer for patient-related operations
 */

import { Patient } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class PatientRepository extends BaseRepository {
  constructor() {
    super(Patient);
  }

  /**
   * Find patient by email
   */
  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  /**
   * Find patient by ID excluding password
   */
  async findByIdSafe(id) {
    return await this.findById(id, { select: '-hash_password' });
  }

  /**
   * Update patient profile (excluding sensitive fields)
   */
  async updateProfile(id, data) {
    // Remove sensitive fields that shouldn't be updated this way
    delete data.hash_password;
    delete data.email;
    delete data.role;

    return await this.updateById(id, data, { select: '-hash_password' });
  }

  /**
   * Update patient's profile image
   */
  async updateImage(id, imageUrl) {
    return await this.updateById(id, { image: imageUrl }, { select: '-hash_password' });
  }
}

// Export singleton instance
export const patientRepository = new PatientRepository();
export default patientRepository;
