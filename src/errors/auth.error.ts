/**
 * AuthenticationError
 *
 * Custom error class for authentication-related failures.
 * Used when session is missing, expired, or invalid.
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}
