/**
 * Message Model
 * Schema for appointment chat/communication messages
 */

import mongoose from "mongoose";
import { ModelName } from "../../config/constants.js";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: ModelName.APPOINTMENT,
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'senderType'
    },
    senderType: {
      type: String,
      enum: ['Doctors', 'Patients'],
      required: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    attachment: {
      filename: { type: String },
      originalName: { type: String },
      mimetype: { type: String },
      size: { type: Number }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Index for efficient message retrieval
messageSchema.index({ appointmentId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
