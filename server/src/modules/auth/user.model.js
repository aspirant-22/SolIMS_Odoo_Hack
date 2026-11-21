/**
 * @AUTHOR: Garima Mittal
 * @FILE: user.model.js
 * @RESPONSIBILITY: Mongoose data model defining SolIMS user credentials, contact details, and RBAC authorization tier.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

const userEntitySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(ERP_SYSTEM_CONFIG.RBAC_ROLES),
      default: ERP_SYSTEM_CONFIG.RBAC_ROLES.CUSTOMER,
      required: true
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ''
    },
    assignedSpecialization: {
      type: String,
      default: 'General'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userEntitySchema);
