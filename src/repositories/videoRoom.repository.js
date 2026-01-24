/**
 * Video Room Repository
 *
 * Handles data access for video consultation rooms.
 */

import { BaseRepository } from './base.repository.js';
import { VideoRoom } from '../models/index.js';

class VideoRoomRepository extends BaseRepository {
  constructor() {
    super(VideoRoom);
  }

  /**
   * Find room by room ID (UUID)
   */
  async findByRoomId(roomId) {
    return await this.model
      .findOne({ roomId })
      .populate('doctorId', 'firstName lastName email speciality profileImage')
      .populate('patientId', 'fullName email number profileImage')
      .populate('appointmentId')
      .lean();
  }

  /**
   * Find active room for an appointment
   */
  async findActiveRoomByAppointment(appointmentId) {
    return await this.model
      .findOne({
        appointmentId,
        status: { $in: ['waiting', 'active'] }
      })
      .populate('doctorId', 'firstName lastName email speciality profileImage')
      .populate('patientId', 'fullName email number profileImage')
      .lean();
  }

  /**
   * Create a new video room
   */
  async createRoom(data) {
    const room = new this.model(data);
    return await room.save();
  }

  /**
   * Update room status
   */
  async updateRoomStatus(roomId, status, additionalData = {}) {
    return await this.model.findOneAndUpdate(
      { roomId },
      {
        $set: {
          status,
          ...additionalData
        }
      },
      { new: true }
    );
  }

  /**
   * Add participant to room
   */
  async addParticipant(roomId, participant) {
    return await this.model.findOneAndUpdate(
      { roomId },
      {
        $push: { participants: participant }
      },
      { new: true }
    );
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomId, socketId) {
    return await this.model.findOneAndUpdate(
      { roomId },
      {
        $pull: { participants: { socketId } }
      },
      { new: true }
    );
  }

  /**
   * Get room with full details
   */
  async getRoomWithDetails(roomId) {
    return await this.model
      .findOne({ roomId })
      .populate('doctorId', 'firstName lastName email speciality profileImage number')
      .populate('patientId', 'fullName email number profileImage')
      .populate({
        path: 'appointmentId',
        populate: [
          { path: 'doctorId', select: 'firstName lastName speciality' },
          { path: 'patientId', select: 'fullName' }
        ]
      })
      .lean();
  }

  /**
   * End a video room
   */
  async endRoom(roomId, endedBy) {
    const room = await this.model.findOne({ roomId });
    if (!room) return null;

    const endedAt = new Date();
    const duration = room.startedAt
      ? Math.floor((endedAt - room.startedAt) / 1000)
      : 0;

    return await this.model.findOneAndUpdate(
      { roomId },
      {
        $set: {
          status: 'ended',
          endedAt,
          endedBy,
          duration,
          participants: []
        }
      },
      { new: true }
    );
  }

  /**
   * Get room history for an appointment
   */
  async getRoomHistoryByAppointment(appointmentId) {
    return await this.model
      .find({ appointmentId })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const videoRoomRepository = new VideoRoomRepository();
export default videoRoomRepository;
