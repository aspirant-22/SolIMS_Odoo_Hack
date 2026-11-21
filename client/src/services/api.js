/**
 * @AUTHOR: Garima Mittal
 * @FILE: api.js
 * @RESPONSIBILITY: Robust HTTP client wrapper with timeout interceptor, authentication headers, and standard error handling.
 * @DEPENDENCIES: None
 */

import { ERP_CLIENT_CONFIG } from '../erpClientConfig.js';

const API_REQUEST_TIMEOUT_MS = ERP_CLIENT_CONFIG.NETWORK_TIMEOUT_THRESHOLD_MS || 15000;

export const executeHttpRequest = async (endpointUrl, requestOptions = {}, triggerTimeoutCallback = null) => {
  const abortControllerInstance = new AbortController();
  const timeoutId = setTimeout(() => {
    abortControllerInstance.abort('ECONNABORTED');
  }, API_REQUEST_TIMEOUT_MS);

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(requestOptions.headers || {})
  };

  try {
    const rawResponse = await fetch(endpointUrl, {
      ...requestOptions,
      headers: requestHeaders,
      signal: abortControllerInstance.signal,
      credentials: 'include'
    });

    clearTimeout(timeoutId);

    const parsedJsonResponse = await rawResponse.json().catch(() => ({}));
    if (!rawResponse.ok) {
      const errorMessage = parsedJsonResponse.message || `HTTP Server Error: ${rawResponse.status}`;
      const customHttpError = new Error(errorMessage);
      customHttpError.statusCode = rawResponse.status;
      customHttpError.validationErrors = parsedJsonResponse.validationErrors;
      throw customHttpError;
    }

    return parsedJsonResponse;
  } catch (caughtError) {
    clearTimeout(timeoutId);

    if (caughtError.name === 'AbortError' || caughtError === 'ECONNABORTED') {
      if (typeof triggerTimeoutCallback === 'function') {
        triggerTimeoutCallback(true);
      }
      throw new Error('⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state.');
    }

    throw caughtError;
  }
};
