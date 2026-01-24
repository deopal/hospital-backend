/**
 * Appointment Model
 * Schema definition for appointments between doctors and patients
 */

import mongoose from "mongoose";
import { ModelName, AppointmentStatus } from "../../config/constants.js";

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: ModelName.PATIENT,
      required: true,
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: ModelName.DOCTOR,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
      index: true
    },
    // Patient details at time of appointment (for medical records)
    patientDetails: {
      name: {
        type: String,
        required: true
      },
      age: {
        type: Number
      },
      gender: {
        type: String
      },
      adharNumber: {
        type: String,
        required: true
      },
      contactNumber: {
        type: String,
        required: true
      }
    },
    healthProblems: {
      type: String,
      required: true,
      trim: true
    },
    previousRecords: {
      type: String,
      trim: true
    },
    // Uploaded medical reports
    reports: [{
      filename: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      mimetype: {
        type: String
      },
      size: {
        type: Number
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Scheduling
    scheduledDate: {
      type: Date
    },
    scheduledTime: {
      type: String
    },
    // Doctor's notes
    diagnosis: {
      type: String,
      trim: true
    },
    prescription: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    completedAt: {
      type: Date
    },
    // Cancellation fields
    cancellationReason: {
      type: String,
      trim: true
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor']
    },
    cancelledAt: {
      type: Date
    },
    // Reminder tracking
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound indexes for common queries
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, patientId: 1 });

// Virtual to populate patient info
appointmentSchema.virtual('patient', {
  ref: ModelName.PATIENT,
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate doctor info
appointmentSchema.virtual('doctor', {
  ref: ModelName.DOCTOR,
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

export default mongoose.model(ModelName.APPOINTMENT, appointmentSchema);
