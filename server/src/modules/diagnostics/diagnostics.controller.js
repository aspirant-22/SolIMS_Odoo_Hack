/**
 * @AUTHOR: Garima Mittal
 * @FILE: diagnostics.controller.js
 * @RESPONSIBILITY: Express controller serving diagnostic metrics and server health telemetry.
 * @DEPENDENCIES: diagnostics.service.js
 */

import { gatherSystemRuntimeTelemetry } from './diagnostics.service.js';

export const handleGetSystemTelemetry = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const telemetryData = await gatherSystemRuntimeTelemetry();
    return httpResponse.status(200).json({ success: true, telemetry: telemetryData });
  } catch (error) {
    return nextMiddlewareFunction(error);
  }
};
