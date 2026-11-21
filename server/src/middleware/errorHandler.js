/**
 * @AUTHOR: Garima Mittal
 * @FILE: errorHandler.js
 * @RESPONSIBILITY: Catches unhandled exceptions, formats structured JSON responses, and logs operational telemetry.
 * @DEPENDENCIES: None
 */

export const handleGlobalApplicationErrors = (
  encounteredError,
  httpRequest,
  httpResponse,
  nextMiddlewareFunction
) => {
  console.error(`[ERP_ERROR] ${httpRequest.method} ${httpRequest.originalUrl}:`, encounteredError);

  const statusCode = encounteredError.statusCode || 500;
  const failureMessage = encounteredError.message || 'Internal Enterprise Server Exception';

  return httpResponse.status(statusCode).json({
    success: false,
    message: failureMessage,
    errorPath: httpRequest.originalUrl,
    errorTimestamp: new Date().toISOString()
  });
};
