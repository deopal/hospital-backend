/**
 * Contact Model
 * Schema definition for contact form submissions
 */

import mongoose from "mongoose";
import { ModelName } from "../../config/constants.js";

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'role',
      index: true
    },
    role: {
      type: String,
      required: true,
      enum: [ModelName.DOCTOR, ModelName.PATIENT, 'doctor', 'patient']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'read', 'resolved'],
      default: 'pending'
    },
    response: {
      type: String,
      trim: true
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model(ModelName.CONTACT, contactSchema);
