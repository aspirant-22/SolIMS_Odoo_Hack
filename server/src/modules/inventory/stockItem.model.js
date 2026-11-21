/**
 * @AUTHOR: Garima Mittal
 * @FILE: stockItem.model.js
 * @RESPONSIBILITY: Quantity-based warehouse stock catalog (available / reserved units) for solar materials, with an append-only restock history.
 * @DEPENDENCIES: mongoose, auditPlugin.js
 */

import mongoose from 'mongoose';
import { auditPlugin } from '../../core/auditPlugin.js';

export const STOCK_GROUPS = Object.freeze([
  'SOLAR_PANELS',
  'ON_GRID_INVERTERS',
  'OFF_GRID_INVERTERS',
  'LITHIUM_BATTERIES',
  'MPPT_CONTROLLERS',
  'MOUNTING_STANDS',
  'WIRING_EARTHING'
]);

const restockEntrySchema = new mongoose.Schema(
  {
    quantityAdded: { type: Number, required: true },
    restockedAt: { type: Date, default: Date.now },
    restockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    restockedByName: { type: String, default: '' },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const stockItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    stockGroup: { type: String, enum: STOCK_GROUPS, required: true },
    // Matches the BOM itemCategory so the packing slip can offer the right dropdown per BOM line
    bomCategory: {
      type: String,
      enum: ['SOLAR_PANELS', 'INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'STANDS', 'WIRING_BOX', 'SAFETY_EARTHING'],
      required: true
    },
    capacityKw: { type: Number, default: null },
    unitOfMeasure: { type: String, default: 'Units' },
    availableUnits: { type: Number, required: true, min: 0, default: 0 },
    reservedUnits: { type: Number, required: true, min: 0, default: 0 },
    totalDispatchedUnits: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    restockHistory: [restockEntrySchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

stockItemSchema.plugin(auditPlugin);

export const StockItemModel = mongoose.model('StockItem', stockItemSchema);
