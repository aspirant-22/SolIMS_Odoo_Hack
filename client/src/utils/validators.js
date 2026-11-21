/**
 * @AUTHOR: Garima Mittal
 * @FILE: validators.js
 * @RESPONSIBILITY: Shared client-side field validators returning clear human-readable messages (amounts, 20% advance rule, phone, email, dimensions, dates).
 * @DEPENDENCIES: None
 */

export const INVALID_NUMBER_MESSAGE = 'Invalid input: Please enter a valid positive number.';
export const MINIMUM_ADVANCE_RATE = 0.2;

const formatInr = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

/** Returns a positive Number, or null for non-numeric / negative / zero / special-character / empty input. */
export const parsePositiveNumber = (rawValue) => {
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
  if (typeof rawValue !== 'string') return null;
  const cleaned = rawValue.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return parsed > 0 ? parsed : null;
};

export const getMinimumAdvance = (totalAmount) => Math.ceil(Number(totalAmount || 0) * MINIMUM_ADVANCE_RATE);

export const validateAdvanceAmount = (rawValue, totalAmount) => {
  const amount = parsePositiveNumber(rawValue);
  if (amount === null) return { ok: false, error: INVALID_NUMBER_MESSAGE };
  const total = Number(totalAmount || 0);
  if (amount < total * MINIMUM_ADVANCE_RATE) {
    return {
      ok: false,
      error: `Advance payment must be at least 20% of the total quote amount (Minimum: ${formatInr(getMinimumAdvance(total))}).`
    };
  }
  if (amount > total) {
    return { ok: false, error: `Advance payment cannot be more than the total quote amount (${formatInr(total)}).` };
  }
  return { ok: true, value: amount };
};

export const validatePaymentAgainstBalance = (rawValue, balanceDue) => {
  const amount = parsePositiveNumber(rawValue);
  if (amount === null) return { ok: false, error: INVALID_NUMBER_MESSAGE };
  if (amount > Number(balanceDue || 0)) {
    return { ok: false, error: `The payment is more than the balance due. The remaining balance is ${formatInr(balanceDue)}.` };
  }
  return { ok: true, value: amount };
};

export const validatePositiveField = (rawValue, label) => {
  const parsed = typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue > 0 ? rawValue : parsePositiveNumber(String(rawValue ?? ''));
  return parsed === null ? `${label} must be a number greater than 0.` : '';
};

export const validateRangeField = (rawValue, label, min, max) => {
  const numeric = Number(rawValue);
  if (rawValue === '' || rawValue === null || rawValue === undefined || !Number.isFinite(numeric) || numeric < min || numeric > max) {
    return `${label} must be a number between ${min} and ${max}.`;
  }
  return '';
};

export const validatePhone10 = (rawValue) => {
  const raw = String(rawValue || '').trim();
  const message = 'Phone number must be exactly 10 digits (for example 9811000000).';
  if (!raw || !/^[+\d\s()-]+$/.test(raw)) return message;
  const digits = raw.replace(/\D/g, '');
  const isValid = digits.length === 10 || (digits.length === 12 && digits.startsWith('91')) || (digits.length === 11 && digits.startsWith('0'));
  return isValid ? '' : message;
};

export const validateEmail = (rawValue) => {
  const raw = String(rawValue || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? '' : 'Please enter a valid email address (for example name@example.com).';
};

export const validateRequiredText = (rawValue, label, minLength = 2) => {
  return String(rawValue || '').trim().length >= minLength ? '' : `${label} must be at least ${minLength} characters.`;
};

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const validateDateField = (rawValue, label, { allowPast = true } = {}) => {
  const raw = String(rawValue || '').trim();
  if (!raw) return `Please choose ${label}.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(new Date(`${raw}T12:00:00`).getTime())) {
    return `Please enter a valid date for ${label}.`;
  }
  if (!allowPast && raw < todayKey()) return `${label} cannot be in the past. Please choose today or a future date.`;
  return '';
};

export const getTodayDateInputValue = todayKey;

export const hasFieldErrors = (errorMap) => Object.values(errorMap || {}).some(Boolean);
