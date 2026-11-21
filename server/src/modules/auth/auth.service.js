/**
 * @AUTHOR: Garima Mittal
 * @FILE: auth.service.js
 * @RESPONSIBILITY: Handles user credential verification, JWT token generation, and demo persona switching.
 * @DEPENDENCIES: bcryptjs, jsonwebtoken, erpConfig.js, user.model.js
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ERP_SYSTEM_CONFIG } from '../../config/erpConfig.js';
import { UserModel } from './user.model.js';

export const createSignedUserToken = (userId, userRole) => {
  return jwt.sign({ userId, userRole }, ERP_SYSTEM_CONFIG.JWT_SECRET, {
    expiresIn: `${ERP_SYSTEM_CONFIG.JWT_EXPIRES_IN_DAYS}d`
  });
};

export const authenticateUserCredentials = async (userEmailAddress, plainTextPassword) => {
  const existingUserRecord = await UserModel.findOne({ email: userEmailAddress.toLowerCase() });
  if (!existingUserRecord || !existingUserRecord.isActive) {
    throw new Error('Authentication failed: Invalid credentials or inactive user');
  }

  const isPasswordMatch = await bcrypt.compare(plainTextPassword, existingUserRecord.passwordHash);
  if (!isPasswordMatch) {
    throw new Error('Authentication failed: Invalid credentials');
  }

  const generatedSessionToken = createSignedUserToken(existingUserRecord._id, existingUserRecord.role);
  return { authenticatedUser: existingUserRecord, sessionToken: generatedSessionToken };
};

export const switchDemoUserPersona = async (targetPersonaRole) => {
  const personaUserAccount = await UserModel.findOne({
    role: targetPersonaRole,
    isActive: true
  });

  if (!personaUserAccount) {
    throw new Error(`Demo persona for role [${targetPersonaRole}] not seeded in database`);
  }

  const generatedPersonaToken = createSignedUserToken(personaUserAccount._id, personaUserAccount.role);
  return { authenticatedUser: personaUserAccount, sessionToken: generatedPersonaToken };
};
