/**
 * @AUTHOR: Garima Mittal
 * @FILE: errorHandler.js
 * @RESPONSIBILITY: Global Express error handler converting technical failures into plain-language JSON responses.
 * @DEPENDENCIES: None
 */

export const handleGlobalApplicationErrors = (
  encounteredError,
  httpRequest,
  httpResponse,
  nextMiddlewareFunction
) => {
  console.error(`[ERP_ERROR] ${httpRequest.method} ${httpRequest.originalUrl}:`, encounteredError);

  let statusCode = encounteredError.statusCode || 500;
  let failureMessage = encounteredError.message || 'Something went wrong on our side. Please try again in a moment.';

  if (encounteredError.name === 'ValidationError' && encounteredError.errors) {
    statusCode = 400;
    failureMessage = Object.values(encounteredError.errors).map((e) => e.message).join(' ');
  } else if (encounteredError.name === 'CastError') {
    statusCode = 400;
    failureMessage = 'One of the values provided is not in the correct format. Please check and try again.';
  } else if (['TypeError', 'ReferenceError', 'SyntaxError', 'RangeError', 'MongoServerError', 'MongooseError', 'MongoNetworkError'].includes(encounteredError.name)) {
    // Technical / programmer errors never reach the user verbatim
    statusCode = 500;
    failureMessage = 'Something went wrong on our side. Please try again in a moment.';
  }

  return httpResponse.status(statusCode).json({
    success: false,
    message: failureMessage,
    errorPath: httpRequest.originalUrl,
    errorTimestamp: new Date().toISOString()
  });
};
