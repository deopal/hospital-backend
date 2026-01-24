/**
 * Appointment Repository
 * Data access layer for appointment-related operations
 */

import mongoose from 'mongoose';
import { Appointment } from '../models/index.js';
import { BaseRepository } from './base.repository.js';
import { AppointmentStatus } from '../config/constants.js';

const { ObjectId } = mongoose.Types;

class AppointmentRepository extends BaseRepository {
  constructor() {
    super(Appointment);
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(doctorId, options = {}) {
    return await this.find(
      { doctorId: new ObjectId(doctorId) },
      {
        populate: { path: 'patientId', select: 'firstName lastName email number image gender age' },
        sort: { createdAt: -1 },
        ...options
      }
    );
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(patientId, options = {}) {
    return await this.find(
      { patientId: new ObjectId(patientId) },
      {
        populate: { path: 'doctorId', select: 'firstName lastName speciality image' },
        sort: { createdAt: -1 },
        ...options
      }
    );
  }

  /**
   * Find appointment by ID with full population
   */
  async findByIdWithDetails(id) {
    return await this.model.findById(id)
      .populate('doctorId', 'firstName lastName speciality image email number')
      .populate('patientId', 'firstName lastName image email number')
      .lean();
  }

  /**
   * Check if active appointment exists between patient and doctor
   */
  async hasActiveAppointment(patientId, doctorId) {
    return await this.exists({
      patientId: new ObjectId(patientId),
      doctorId: new ObjectId(doctorId),
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED] }
    });
  }

  /**
   * Update appointment status
   */
  async updateStatus(id, status, additionalData = {}) {
    return await this.model.findByIdAndUpdate(
      id,
      { status, ...additionalData },
      { new: true }
    )
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'firstName lastName');
  }

  /**
   * Approve appointment
   */
  async approve(id, scheduledDate, scheduledTime) {
    return await this.updateStatus(id, AppointmentStatus.APPROVED, {
      scheduledDate,
      scheduledTime
    });
  }

  /**
   * Complete appointment
   */
  async complete(id, diagnosis, prescription, notes) {
    return await this.updateStatus(id, AppointmentStatus.COMPLETED, {
      diagnosis,
      prescription,
      notes,
      completedAt: new Date()
    });
  }

  /**
   * Cancel appointment
   */
  async cancel(id, reason, cancelledBy) {
    return await this.updateStatus(id, AppointmentStatus.CANCELLED, {
      cancellationReason: reason,
      cancelledBy,
      cancelledAt: new Date()
    });
  }

  /**
   * Get completed appointments for a doctor (reviews)
   */
  async getCompletedByDoctorId(doctorId) {
    return await this.find(
      { doctorId: new ObjectId(doctorId), status: AppointmentStatus.COMPLETED },
      {
        populate: { path: 'patientId', select: 'firstName lastName' },
        select: 'patientDetails diagnosis prescription notes completedAt',
        sort: { completedAt: -1 }
      }
    );
  }

  /**
   * Get completed appointments for a patient (reviews)
   */
  async getCompletedByPatientId(patientId) {
    return await this.find(
      { patientId: new ObjectId(patientId), status: AppointmentStatus.COMPLETED },
      {
        populate: { path: 'doctorId', select: 'firstName lastName' },
        select: 'diagnosis prescription notes completedAt',
        sort: { completedAt: -1 }
      }
    );
  }
}

// Export singleton instance
export const appointmentRepository = new AppointmentRepository();
export default appointmentRepository;
