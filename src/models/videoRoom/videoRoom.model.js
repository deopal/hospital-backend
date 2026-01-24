/**
 * Video Room Model
 *
 * Stores video consultation room information for appointments.
 * Each approved appointment can have one associated video room.
 */

import mongoose from 'mongoose';

const videoRoomSchema = new mongoose.Schema(
  {
    // Unique room identifier (UUID)
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Associated appointment
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointments',
      required: true,
      index: true
    },
    // Doctor in the call
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctors',
      required: true
    },
    // Patient in the call
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patients',
      required: true
    },
    // Room status
    status: {
      type: String,
      enum: ['waiting', 'active', 'ended'],
      default: 'waiting'
    },
    // Call timestamps
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    // Call duration in seconds
    duration: {
      type: Number,
      default: 0
    },
    // Who started the call
    startedBy: {
      type: String,
      enum: ['doctor', 'patient']
    },
    // Who ended the call
    endedBy: {
      type: String,
      enum: ['doctor', 'patient']
    },
    // Participants currently in the room
    participants: [{
      userId: mongoose.Schema.Types.ObjectId,
      userType: {
        type: String,
        enum: ['doctor', 'patient']
      },
      joinedAt: Date,
      socketId: String
    }]
  },
  { timestamps: true }
);

// Index for finding rooms by appointment
videoRoomSchema.index({ appointmentId: 1, status: 1 });

export default mongoose.model('VideoRooms', videoRoomSchema);
