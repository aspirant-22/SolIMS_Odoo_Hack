/**
 * @AUTHOR: Garima Mittal
 * @FILE: friendlyMessage.js
 * @RESPONSIBILITY: Converts raw API / network / validation errors into plain, non-technical language for end users.
 * @DEPENDENCIES: None
 */

const LEADING_ICON_PATTERN = /^\s*(✅|⚠️|⚠|❌|✔️|✔|🎉)\s*/u;

const TECHNICAL_NOISE_PATTERN =
  /ZodError|TypeError|ReferenceError|SyntaxError|CastError|ValidationError|MongoServerError|E11000|ObjectId|Cannot read propert|is not defined|is not a function|\bat\s+\S+\s+\(.*:\d+:\d+\)|stack|ECONNREFUSED|ENOTFOUND|undefined|\[object Object\]|\bNaN\b(?!.*positive)/i;

const NETWORK_PATTERN = /Failed to fetch|NetworkError|Network request failed|ECONNABORTED|Cloud Node latency|Load failed|timed out/i;

const statusCodeMessage = (statusCode) => {
  if (statusCode === 400) return 'Some of the information entered is not valid. Please check the form and try again.';
  if (statusCode === 401) return 'Your session has expired. Please sign in again to continue.';
  if (statusCode === 403) return "Your role doesn't have permission to do this.";
  if (statusCode === 404) return "We couldn't find what you were looking for. It may have been moved or removed.";
  if (statusCode === 409) return 'This action conflicts with the current status of the record. Please refresh and try again.';
  if (statusCode >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
};

export const toFriendlyMessage = (rawMessage, type = 'error') => {
  if (rawMessage === null || rawMessage === undefined) return '';
  let text = typeof rawMessage === 'string' ? rawMessage : (rawMessage.message || String(rawMessage));
  text = text.trim();
  if (!text) return '';

  // The banner draws its own big icon, so remove icons typed into the message itself
  text = text.replace(LEADING_ICON_PATTERN, '');
  if (type !== 'error') return text;

  const httpStatusMatch = text.match(/HTTP (?:Server )?Error:?\s*(\d{3})/i);
  if (httpStatusMatch) return statusCodeMessage(Number(httpStatusMatch[1]));

  if (NETWORK_PATTERN.test(text)) {
    return "We couldn't reach the server. Please check your internet connection and try again.";
  }

  if (/Authentication rejected|Access denied|session token|Authentication session/i.test(text)) {
    return statusCodeMessage(401);
  }
  if (/^Forbidden/i.test(text) || /lacks required tier authorization/i.test(text)) {
    return statusCodeMessage(403);
  }

  // Strip the technical validation prefix and "field.path: " labels, keep the human sentence(s)
  text = text.replace(/Request payload validation failed at API boundary:?\s*/i, '');
  text = text
    .split(/,\s(?=[A-Za-z_.0-9]+:\s)/)
    .map((segment) => segment.replace(/^[A-Za-z_][A-Za-z_.0-9]*:\s+/, ''))
    .join(' ');
  text = text.replace(/^Guardrail violation:\s*/i, '').trim();

  if (!text || TECHNICAL_NOISE_PATTERN.test(text)) {
    return 'Something went wrong on our side. Please try again in a moment.';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default toFriendlyMessage;
