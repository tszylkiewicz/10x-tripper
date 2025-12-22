/**
 * Custom error classes for OpenRouter service
 */

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Zachowanie stack trace (dla V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class OpenRouterAPIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody?: string
  ) {
    super(message, "API_ERROR", { status, responseBody });
    this.name = "OpenRouterAPIError";
  }
}

export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, "TIMEOUT", { timeoutMs });
    this.name = "OpenRouterTimeoutError";
  }
}

export class OpenRouterParseError extends OpenRouterError {
  constructor(
    message: string,
    public readonly rawContent: string
  ) {
    super(message, "PARSE_ERROR", { rawContent });
    this.name = "OpenRouterParseError";
  }
}

export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly validationErrors: unknown[]
  ) {
    super(message, "VALIDATION_ERROR", { validationErrors });
    this.name = "OpenRouterValidationError";
  }
}

export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "OpenRouterConfigError";
  }
}
