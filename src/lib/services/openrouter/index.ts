/**
 * OpenRouter Service - Public API
 */

// Main service
export { OpenRouterService } from "./openrouter.service";

// Types
export type {
  OpenRouterConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResponse,
  StructuredCompletionOptions,
  ResponseFormat,
  JSONSchemaObject,
} from "./openrouter.types";

// Errors
export {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterTimeoutError,
  OpenRouterParseError,
  OpenRouterValidationError,
  OpenRouterConfigError,
} from "./openrouter.errors";

// Utilities (optional, for advanced users)
export { zodToJsonSchema } from "./openrouter.utils";
