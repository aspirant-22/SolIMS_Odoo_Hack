/**
 * @AUTHOR: Garima Mittal
 * @FILE: customerScope.js
 * @RESPONSIBILITY: Builds Mongo filters that scope leads, orders, tickets and assets to the currently authenticated CUSTOMER (by user id, email, or phone).
 * @DEPENDENCIES: erpConfig.js
 */

import { ERP_SYSTEM_CONFIG } from '../config/erpConfig.js';

export const normalizePhoneDigits = (rawPhone) => String(rawPhone || '').replace(/\D/g, '').slice(-10);

const buildPhoneRegex = (tenDigits) => new RegExp(`${tenDigits.split('').join('[\\s-]*')}\\s*$`);

export const isCustomerUser = (user) => user?.role === ERP_SYSTEM_CONFIG.RBAC_ROLES.CUSTOMER;

export const buildCustomerPhoneRegex = (user) => {
  const digits = normalizePhoneDigits(user?.phoneNumber);
  return digits.length === 10 ? buildPhoneRegex(digits) : null;
};

export const buildOrderScopeFilter = (user) => {
  const clauses = [{ customerUserId: user._id }];
  if (user.email) clauses.push({ customerEmailAddress: user.email.toLowerCase().trim() });
  const phoneRegex = buildCustomerPhoneRegex(user);
  if (phoneRegex) clauses.push({ customerPhoneNumber: phoneRegex });
  return { $or: clauses };
};

export const buildLeadScopeFilter = (user) => {
  const clauses = [];
  if (user.email) clauses.push({ customerEmailAddress: user.email.toLowerCase().trim() });
  const phoneRegex = buildCustomerPhoneRegex(user);
  if (phoneRegex) clauses.push({ customerPhoneNumber: phoneRegex });
  // Never match everything: if the customer has no identifiers, match nothing.
  return clauses.length > 0 ? { $or: clauses } : { _id: null };
};

export const orderBelongsToCustomer = (order, user) => {
  if (!order || !user) return false;
  if (order.customerUserId && String(order.customerUserId?._id || order.customerUserId) === String(user._id)) return true;
  if (user.email && (order.customerEmailAddress || '').toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
  const userDigits = normalizePhoneDigits(user.phoneNumber);
  return userDigits.length === 10 && normalizePhoneDigits(order.customerPhoneNumber) === userDigits;
};

export const leadBelongsToCustomer = (lead, user) => {
  if (!lead || !user) return false;
  if (user.email && (lead.customerEmailAddress || '').toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
  const userDigits = normalizePhoneDigits(user.phoneNumber);
  return userDigits.length === 10 && normalizePhoneDigits(lead.customerPhoneNumber) === userDigits;
};

export const buildHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
