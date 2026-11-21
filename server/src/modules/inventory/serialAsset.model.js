/**
 * @AUTHOR: Garima Mittal
 * @FILE: serialAsset.model.js
 * @RESPONSIBILITY: Mongoose schema tracking unique hardware serial numbers, lifecycle states, and warranty timestamps.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';

const serialHardwareAssetSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    assetCategory: {
      type: String,
      enum: ['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS'],
      required: true
    },
    modelDesignation: {
      type: String,
      required: true
    },
    assetStatus: {
      type: String,
      enum: ['WAREHOUSE_STOCK', 'ALLOCATED_FOR_DISPATCH', 'DISPATCHED', 'ACTIVE_IN_FIELD', 'REPLACED', 'DECOMMISSIONED'],
      default: 'WAREHOUSE_STOCK',
      required: true
    },
    allocatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectOrder',
      default: null
    },
    orderReference: {
      type: String,
      default: null
    },
    assignedCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customerFullName: {
      type: String,
      default: null
    },
    customerPhoneNumber: {
      type: String,
      default: null
    },
    installationSiteAddress: {
      type: String,
      default: null
    },
    dispatchConfirmedTimestamp: {
      type: Date,
      default: null
    },
    warrantyDurationDays: {
      type: Number,
      required: true
    },
    warrantyExpiresTimestamp: {
      type: Date,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const SerialAssetModel = mongoose.model('SerialAsset', serialHardwareAssetSchema);
