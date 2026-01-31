/**
 * Admin Model
 * Schema definition for admin users
 * Note: Admin signin is restricted to ADMIN_EMAIL from environment
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ModelName, UserRole, AdminPermission } from '../../config/constants.js';

const { Schema } = mongoose;

const adminSchema = new Schema(
  {
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
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: [UserRole.ADMIN],
      default: UserRole.ADMIN
    },
    permissions: {
      type: [String],
      enum: Object.values(AdminPermission),
      default: Object.values(AdminPermission)
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

// Method to authenticate password
adminSchema.methods.authenticate = async function (password) {
  return await bcrypt.compare(password, this.hash_password);
};

// Ensure virtuals are included in JSON
adminSchema.set('toJSON', { virtuals: true });
adminSchema.set('toObject', { virtuals: true });

export default mongoose.model(ModelName.ADMIN, adminSchema);
