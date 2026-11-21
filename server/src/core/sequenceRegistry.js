/**
 * @AUTHOR: Garima Mittal
 * @FILE: sequenceRegistry.js
 * @RESPONSIBILITY: Provides atomic Odoo ir.sequence code generation and self-healing index synchronization.
 * @DEPENDENCIES: mongoose, erpConfig.js
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_CONFIG } from '../config/erpConfig.js';

const sequenceRecordSchema = new mongoose.Schema(
  {
    sequenceCode: { type: String, required: true, unique: true },
    sequencePrefix: { type: String, required: true },
    currentNumber: { type: Number, required: true, default: 0 },
    paddingLength: { type: Number, required: true, default: 4 }
  },
  { timestamps: true }
);

export const SequenceModel = mongoose.model('ir_sequence', sequenceRecordSchema);

export const getNextSequenceNumber = async (sequenceTargetCode) => {
  const sequenceDefinition = ERP_SYSTEM_CONFIG.SEQUENCE_DEFINITIONS[sequenceTargetCode];
  if (!sequenceDefinition) {
    throw new Error(`Invalid sequence code requested: ${sequenceTargetCode}`);
  }

  const updatedSequenceDocument = await SequenceModel.findOneAndUpdate(
    { sequenceCode: sequenceTargetCode },
    {
      $inc: { currentNumber: 1 },
      $setOnInsert: {
        sequencePrefix: sequenceDefinition.prefix,
        paddingLength: sequenceDefinition.paddingLength
      }
    },
    { new: true, upsert: true }
  );

  const formattedCounterString = String(updatedSequenceDocument.currentNumber).padStart(
    updatedSequenceDocument.paddingLength,
    '0'
  );
  return `${updatedSequenceDocument.sequencePrefix}${formattedCounterString}`;
};

export const synchronizeSequenceCounter = async (sequenceTargetCode, highestObservedNumber) => {
  const sequenceDefinition = ERP_SYSTEM_CONFIG.SEQUENCE_DEFINITIONS[sequenceTargetCode];
  if (!sequenceDefinition) return;

  await SequenceModel.findOneAndUpdate(
    { sequenceCode: sequenceTargetCode },
    {
      $max: { currentNumber: highestObservedNumber },
      $setOnInsert: {
        sequencePrefix: sequenceDefinition.prefix,
        paddingLength: sequenceDefinition.paddingLength
      }
    },
    { upsert: true }
  );
};
