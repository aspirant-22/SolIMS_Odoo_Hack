/**
 * @AUTHOR: Garima Mittal
 * @FILE: validateMiddleware.js
 * @RESPONSIBILITY: Validates request bodies against Zod schemas and returns plain-language field errors.
 * @DEPENDENCIES: zod
 */

export const validateRequestBody = (targetZodSchema) => {
  return async (httpRequest, httpResponse, nextMiddlewareFunction) => {
    try {
      const sanitizedParsedBody = await targetZodSchema.parseAsync(httpRequest.body);
      httpRequest.validatedBody = sanitizedParsedBody;
      return nextMiddlewareFunction();
    } catch (schemaValidationError) {
      const issueList = schemaValidationError.errors || schemaValidationError.issues || [];
      const descriptiveErrors = issueList.map((errDetail) => ({
        field: (errDetail.path || []).join('.'),
        issue: errDetail.message
      }));

      // Human-readable summary: unique issue messages only (no field paths, no stack traces)
      const readableMessage = [...new Set(descriptiveErrors.map((e) => e.issue).filter(Boolean))].join(' ');

      return httpResponse.status(400).json({
        success: false,
        message: readableMessage || 'Some of the information you entered is not valid. Please check the form and try again.',
        validationErrors: descriptiveErrors.length > 0 ? descriptiveErrors : schemaValidationError.message
      });
    }
  };
};
