/**
 * Type definitions for OpenRouter service
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface OpenRouterConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  httpReferer?: string;
  appTitle?: string;
}

export type RequiredOpenRouterConfig = Required<OpenRouterConfig>;

// ============================================================================
// Message Types
// ============================================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ============================================================================
// JSON Schema Types
// ============================================================================

export interface JSONSchemaObject {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JSONSchemaObject>;
  items?: JSONSchemaObject;
  required?: string[];
  additionalProperties?: boolean;
  enum?: unknown[];
  const?: unknown;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchemaObject;
  };
}

// ============================================================================
// Completion Options
// ============================================================================

export interface CompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: ResponseFormat;
  abortSignal?: AbortSignal;
}

export interface StructuredCompletionOptions<T> extends Omit<CompletionOptions, "responseFormat"> {
  schema: {
    name: string;
    schema: JSONSchemaObject;
  };
  validator?: (data: unknown) => T;
}

// ============================================================================
// Response Types
// ============================================================================

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  id: string;
}

// ============================================================================
// Internal API Types
// ============================================================================

export interface OpenRouterRequestBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  object: string;
}
