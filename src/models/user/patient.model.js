/**
 * Patient Model
 * Schema definition for patient users
 */

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { ModelName, UserRole } from "../../config/constants.js";

const { Schema } = mongoose;

const patientSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true
    },
    hash_password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: [UserRole.PATIENT],
      default: UserRole.PATIENT
    },
    image: {
      type: String
    },
    gender: {
      type: String,
      trim: true,
      required: true,
      enum: ["male", "female", "other"]
    },
    number: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    allergies: {
      type: String,
      trim: true
    },
    medicalHistory: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    },
    address: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 0,
      max: 150
    },
    isActive: {
      type: Boolean,
      default: true
    },
    passwordResetToken: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String
    },
    emailVerificationExpires: {
      type: Date
    },
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }
  },
  { timestamps: true }
);

// Virtual for full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for unread notifications count
patientSchema.virtual("unreadNotifications", {
  ref: ModelName.NOTIFICATION,
  localField: '_id',
  foreignField: 'recipientId',
  count: true,
  match: { isRead: false, recipientType: ModelName.PATIENT }
});

// Method to authenticate password
patientSchema.methods.authenticate = async function (password) {
  return await bcrypt.compare(password, this.hash_password);
};

// Ensure virtuals are included in JSON
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

export default mongoose.model(ModelName.PATIENT, patientSchema);
