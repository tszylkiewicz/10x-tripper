/**
 * DuplicateError
 *
 * Custom error class for duplicate resource violations.
 * Used when trying to create a resource that violates uniqueness constraints.
 */
export class DuplicateError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = "DuplicateError";
  }
}
