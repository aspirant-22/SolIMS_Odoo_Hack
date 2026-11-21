/**
 * @AUTHOR: Garima Mittal
 * @FILE: validateMiddleware.js
 * @RESPONSIBILITY: Enforces Zod boundary validation schemas against incoming HTTP request bodies.
 * @DEPENDENCIES: zod
 */

export const validateRequestBody = (targetZodSchema) => {
  return async (httpRequest, httpResponse, nextMiddlewareFunction) => {
    try {
      const sanitizedParsedBody = await targetZodSchema.parseAsync(httpRequest.body);
      httpRequest.validatedBody = sanitizedParsedBody;
      return nextMiddlewareFunction();
    } catch (schemaValidationError) {
      const descriptiveErrors = schemaValidationError.errors?.map((errDetail) => ({
        field: errDetail.path.join('.'),
        issue: errDetail.message
      }));

      return httpResponse.status(400).json({
        success: false,
        message: 'Request payload validation failed at API boundary',
        validationErrors: descriptiveErrors || schemaValidationError.message
      });
    }
  };
};
