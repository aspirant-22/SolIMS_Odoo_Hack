/**
 * @AUTHOR: Garima Mittal
 * @FILE: authMiddleware.js
 * @RESPONSIBILITY: Authenticates incoming HTTP requests by verifying JWT sessions from cookies or authorization headers.
 * @DEPENDENCIES: jsonwebtoken, erpConfig.js, user.model.js
 */

import jwt from 'jsonwebtoken';
import { ERP_SYSTEM_CONFIG } from '../config/erpConfig.js';
import { UserModel } from '../modules/auth/user.model.js';

export const verifyAuthentication = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  const incomingAuthHeader = httpRequest.headers.authorization;
  const rawCookieToken = httpRequest.cookies?.[ERP_SYSTEM_CONFIG.COOKIE_NAME];
  const resolvedBearerToken = incomingAuthHeader?.startsWith('Bearer ')
    ? incomingAuthHeader.split(' ')[1]
    : rawCookieToken;

  if (!resolvedBearerToken) {
    return httpResponse.status(401).json({
      success: false,
      message: 'Access denied: Authentication session token missing'
    });
  }

  try {
    const verifiedTokenPayload = jwt.verify(resolvedBearerToken, ERP_SYSTEM_CONFIG.JWT_SECRET);
    const existingUserRecord = await UserModel.findById(verifiedTokenPayload.userId).select('-passwordHash');

    if (!existingUserRecord || !existingUserRecord.isActive) {
      return httpResponse.status(401).json({
        success: false,
        message: 'Authentication rejected: User account suspended or non-existent'
      });
    }

    httpRequest.authenticatedUser = existingUserRecord;
    return nextMiddlewareFunction();
  } catch (tokenVerificationError) {
    return httpResponse.status(401).json({
      success: false,
      message: 'Authentication rejected: Invalid or expired session token'
    });
  }
};
