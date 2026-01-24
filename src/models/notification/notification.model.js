/**
 * Notification Model
 * Schema definition for system notifications
 */

import mongoose from "mongoose";
import { ModelName, NotificationType, RecipientType } from "../../config/constants.js";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientType'
    },
    recipientType: {
      type: String,
      required: true,
      enum: Object.values(RecipientType)
    },
    senderId: {
      type: Schema.Types.ObjectId,
      refPath: 'senderType'
    },
    senderType: {
      type: String,
      enum: Object.values(RecipientType)
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: ModelName.APPOINTMENT
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType)
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ appointmentId: 1 });

export default mongoose.model(ModelName.NOTIFICATION, notificationSchema);
