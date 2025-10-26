/**
 * ValidationError
 *
 * Custom error class for validation failures.
 * Used when input data doesn't meet business or format requirements.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
