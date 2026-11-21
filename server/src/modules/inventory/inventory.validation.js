/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for scanning hardware serials, validating dispatch lists, restocking and equipment reservations.
 * @DEPENDENCIES: zod
 */

import { z } from 'zod';

export const scanSerialForDispatchValidationSchema = z.object({
  orderId: z.string().min(1, 'Target order ID required'),
  scannedSerialNumber: z.string().min(3, 'Valid serial number required'),
  expectedComponentCategory: z.enum(['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS'])
});

export const confirmDispatchOrderValidationSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  scannedSerialNumbersList: z.array(z.string()).min(1, 'Please scan at least one serial number before dispatch.'),
  dispatchNotes: z.string().optional().default('')
});

export const registerWarehouseAssetValidationSchema = z.object({
  serialNumber: z.string().min(3),
  assetCategory: z.enum(['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS']),
  modelDesignation: z.string().min(2)
});

const restockQuantityMessage = 'Please enter a whole number of units greater than 0.';

export const restockStockItemValidationSchema = z.object({
  quantity: z.preprocess(
    (raw) => (typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : raw),
    z.number({ invalid_type_error: restockQuantityMessage, required_error: restockQuantityMessage })
      .int(restockQuantityMessage)
      .positive(restockQuantityMessage)
      .max(100000, 'Please enter 100,000 units or fewer.')
  ),
  note: z.string().max(200).optional().default('')
});

export const reserveEquipmentValidationSchema = z.object({
  orderId: z.string().min(1, 'Order ID required'),
  selections: z
    .array(
      z.object({
        stockItemId: z.string().regex(/^[a-f\d]{24}$/i, 'Please select an equipment item for every line.'),
        quantity: z.number({ invalid_type_error: 'Equipment quantity must be a whole number.' }).int().positive('Equipment quantity must be greater than 0.')
      })
    )
    .min(1, 'Please select the equipment items for this packing slip.')
});
