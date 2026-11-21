/**
 * @AUTHOR: Garima Mittal
 * @FILE: stockMove.model.js
 * @RESPONSIBILITY: Mongoose schema recording immutable double-entry inventory transactions between stock nodes.
 * @DEPENDENCIES: mongoose
 */

import mongoose from 'mongoose';
import { auditPlugin } from '../../core/auditPlugin.js';

const stockMovementSchema = new mongoose.Schema(
  {
    movementReference: {
      type: String,
      required: true,
      unique: true
    },
    sourceLocationNode: {
      type: String,
      required: true,
      default: 'WH/Stock'
    },
    destinationLocationNode: {
      type: String,
      required: true,
      default: 'Customers'
    },
    assetSerialNumber: {
      type: String,
      required: true
    },
    componentCategory: {
      type: String,
      required: true
    },
    projectOrderReference: {
      type: String,
      required: true
    },
    quantityMoved: {
      type: Number,
      default: 1,
      required: true
    },
    dispatchedByTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

stockMovementSchema.plugin(auditPlugin);

export const StockMoveModel = mongoose.model('StockMove', stockMovementSchema);
