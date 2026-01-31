/**
 * Doctor Model
 * Schema definition for doctor users
 */

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { ModelName, UserRole } from "../../config/constants.js";

const { Schema } = mongoose;

const doctorSchema = new Schema(
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
      enum: [UserRole.DOCTOR],
      default: UserRole.DOCTOR
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
    speciality: {
      type: String,
      trim: true
    },
    qualification: {
      type: String,
      trim: true
    },
    experience: {
      type: Number,
      min: 0
    },
    consultationFee: {
      type: Number,
      min: 0
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
      min: 18,
      max: 100
    },
    isVerified: {
      type: Boolean,
      default: false
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
    emailVerificationCode: {
      type: String
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
doctorSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for unread notifications count
doctorSchema.virtual("unreadNotifications", {
  ref: ModelName.NOTIFICATION,
  localField: '_id',
  foreignField: 'recipientId',
  count: true,
  match: { isRead: false, recipientType: ModelName.DOCTOR }
});

// Method to authenticate password
doctorSchema.methods.authenticate = async function (password) {
  return await bcrypt.compare(password, this.hash_password);
};

// Ensure virtuals are included in JSON
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

export default mongoose.model(ModelName.DOCTOR, doctorSchema);
