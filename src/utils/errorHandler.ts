// Standardized Error Handler to prevent leakage of internal details, stack traces, and DB queries to clients.

export interface SanitizedError {
  userMessage: string;
  correlationId: string;
  originalError: unknown;
}

/**
 * Generate a unique correlation ID for tracking server/client errors securely.
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * List of user-safe error messages or prefixes that can be safely displayed to end users.
 */
const SAFE_USER_MESSAGES = [
  'Invalid email address or password',
  'Invalid email or password',
  'Current password is incorrect',
  'Access code is required',
  'Invalid access code',
  'Invalid email address or temporary access code',
  'Failed to reset password. The code may have already been used',
  'Password must be at least 6 characters',
  'Passwords do not match',
  'Email is required',
  'Condition / Title is required',
  'Treatment details are required',
  'Attending doctor name is required',
];

/**
 * Sanitizes any application or server error before returning or displaying it to the client.
 * Removes stack traces, database query details, internal paths, and server info.
 */
export function sanitizeError(error: unknown, customFallbackMessage?: string): SanitizedError {
  const correlationId = generateCorrelationId();

  // Log full error details to internal server logs only
  if (process.env.NODE_ENV !== 'production') {
    // Controlled internal logging
    console.error(`[Correlation ID: ${correlationId}] Detailed Internal Error:`, error);
  } else {
    // In production, log correlation ID with stringified internal details securely
    const detail = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[${correlationId}] Internal Log: ${detail.replace(/(\r\n|\n|\r)/gm, " ")}`);
  }

  let rawMessage = '';
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    rawMessage = error.message;
  } else if (typeof error === 'string') {
    rawMessage = error;
  }

  // Check if rawMessage is explicitly safe for end user
  const isSafe = SAFE_USER_MESSAGES.some(safe => 
    rawMessage.toLowerCase().includes(safe.toLowerCase())
  );

  if (isSafe && rawMessage) {
    return {
      userMessage: rawMessage,
      correlationId,
      originalError: error,
    };
  }

  // Generic message without revealing internal details or stack traces
  const defaultUserMessage = customFallbackMessage || 'An unexpected server error occurred. Please try again or contact support.';
  return {
    userMessage: `${defaultUserMessage} (Correlation ID: ${correlationId})`,
    correlationId,
    originalError: error,
  };
}

/**
 * Format a toast error message safely with correlation ID.
 */
export function getSanitizedErrorMessage(error: unknown, fallbackMessage?: string): string {
  const { userMessage } = sanitizeError(error, fallbackMessage);
  return userMessage;
}
