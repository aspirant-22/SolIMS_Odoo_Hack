/**
 * @AUTHOR: Garima Mittal
 * @FILE: auth.controller.js
 * @RESPONSIBILITY: Handles authentication endpoints, cookie assignment, and persona switching requests.
 * @DEPENDENCIES: auth.service.js, erpConfig.js
 */

import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import {
  authenticateUserCredentials,
  switchDemoUserPersona,
  authenticateMagicToken
} from './auth.service.js';

export const handleUserLogin = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { email, password } = httpRequest.validatedBody;
    const { authenticatedUser, sessionToken } = await authenticateUserCredentials(email, password);

    httpResponse.cookie(ERP_SYSTEM_CONFIG.COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ERP_SYSTEM_CONFIG.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    });

    return httpResponse.status(200).json({
      success: true,
      message: 'Authentication successful',
      sessionToken,
      user: {
        id: authenticatedUser._id,
        fullName: authenticatedUser.fullName,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      }
    });
  } catch (authError) {
    return nextMiddlewareFunction(authError);
  }
};

export const handleDemoPersonaSwitch = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const { targetRole } = httpRequest.validatedBody;
    const { authenticatedUser, sessionToken } = await switchDemoUserPersona(targetRole);

    httpResponse.cookie(ERP_SYSTEM_CONFIG.COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ERP_SYSTEM_CONFIG.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    });

    return httpResponse.status(200).json({
      success: true,
      message: `Switched demo persona to ${targetRole}`,
      sessionToken,
      user: {
        id: authenticatedUser._id,
        fullName: authenticatedUser.fullName,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      }
    });
  } catch (personaError) {
    return nextMiddlewareFunction(personaError);
  }
};

export const handleMagicLogin = async (httpRequest, httpResponse, nextMiddlewareFunction) => {
  try {
    const magicToken = httpRequest.body?.magicToken || httpRequest.query?.magicToken;
    const { authenticatedUser, sessionToken } = await authenticateMagicToken(magicToken);

    httpResponse.cookie(ERP_SYSTEM_CONFIG.COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: ERP_SYSTEM_CONFIG.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    });

    return httpResponse.status(200).json({
      success: true,
      message: 'Magic authentication successful',
      sessionToken,
      user: {
        id: authenticatedUser._id,
        fullName: authenticatedUser.fullName,
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        phoneNumber: authenticatedUser.phoneNumber
      }
    });
  } catch (magicError) {
    return nextMiddlewareFunction(magicError);
  }
};

export const handleUserLogout = async (httpRequest, httpResponse) => {
  httpResponse.clearCookie(ERP_SYSTEM_CONFIG.COOKIE_NAME);
  return httpResponse.status(200).json({
    success: true,
    message: 'User session terminated'
  });
};

export const handleGetSessionProfile = async (httpRequest, httpResponse) => {
  const activeUser = httpRequest.authenticatedUser;
  return httpResponse.status(200).json({
    success: true,
    user: {
      id: activeUser._id,
      fullName: activeUser.fullName,
      email: activeUser.email,
      role: activeUser.role,
      phoneNumber: activeUser.phoneNumber
    }
  });
};
