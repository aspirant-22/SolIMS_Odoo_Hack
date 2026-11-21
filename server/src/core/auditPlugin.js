/**
 * @AUTHOR: Garima Mittal
 * @FILE: auditPlugin.js
 * @RESPONSIBILITY: Reusable Mongoose schema plugin enforcing { timestamps: true } and updatedBy across all domain models.
 * @DEPENDENCIES: mongoose
 */

import mongoose from 'mongoose';

export const auditPlugin = (schema, options = {}) => {
  // Enforce updatedBy reference to User if not already explicitly defined
  if (!schema.path('updatedBy')) {
    schema.add({
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    });
  }

  // Enforce timestamps are enabled on schema options
  schema.set('timestamps', true);
};

export default auditPlugin;
