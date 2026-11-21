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

export const createMagicLoginToken = (userId, userRole) => {
  return jwt.sign(
    { userId, userRole, isMagicLink: true },
    ERP_SYSTEM_CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const authenticateMagicToken = async (magicToken) => {
  if (!magicToken) {
    throw new Error('Magic token missing');
  }

  const decoded = jwt.verify(magicToken, ERP_SYSTEM_CONFIG.JWT_SECRET);
  const user = await UserModel.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  const sessionToken = createSignedUserToken(user._id, user.role);
  return { authenticatedUser: user, sessionToken };
};

export const provisionCustomerUserAccount = async ({ fullName, email, phoneNumber }) => {
  const cleanEmail = email.toLowerCase().trim();
  let existingUser = await UserModel.findOne({ email: cleanEmail });

  if (existingUser) {
    const magicLoginToken = createMagicLoginToken(existingUser._id, existingUser.role);
    return {
      customerUser: existingUser,
      temporaryPassword: '(Preserved Active Password)',
      magicLoginToken,
      isNewUser: false
    };
  }

  const defaultTempPassword = 'SolarHome#2026';
  const passwordHash = await bcrypt.hash(defaultTempPassword, 10);

  const newUser = await UserModel.create({
    fullName: fullName.trim(),
    email: cleanEmail,
    passwordHash,
    role: ERP_SYSTEM_CONFIG.RBAC_ROLES.CUSTOMER,
    phoneNumber: (phoneNumber || '').trim(),
    assignedSpecialization: 'Residential Rooftop Client',
    isActive: true
  });

  const magicLoginToken = createMagicLoginToken(newUser._id, newUser.role);
  return {
    customerUser: newUser,
    temporaryPassword: defaultTempPassword,
    magicLoginToken,
    isNewUser: true
  };
};
