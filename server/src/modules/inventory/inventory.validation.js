/**
 * @AUTHOR: Garima Mittal
 * @FILE: inventory.validation.js
 * @RESPONSIBILITY: Zod boundary schemas for scanning hardware serials, validating dispatch lists, and registering stock.
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
  scannedSerialNumbersList: z.array(z.string()).min(1, 'At least one serial required for dispatch'),
  dispatchNotes: z.string().optional().default('')
});

export const registerWarehouseAssetValidationSchema = z.object({
  serialNumber: z.string().min(3),
  assetCategory: z.enum(['INVERTER', 'BATTERY', 'CHARGE_CONTROLLER', 'SOLAR_PANELS']),
  modelDesignation: z.string().min(2)
});
