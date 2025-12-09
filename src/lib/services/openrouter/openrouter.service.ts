/**
 * OpenRouter Service
 *
 * Service for interacting with OpenRouter API for LLM chat completions.
 * Supports structured outputs via JSON Schema and comprehensive error handling.
 */

import type {
  OpenRouterConfig,
  RequiredOpenRouterConfig,
  CompletionOptions,
  CompletionResponse,
  StructuredCompletionOptions,
  OpenRouterRequestBody,
  OpenRouterResponse,
} from "./openrouter.types";

import {
  OpenRouterAPIError,
  OpenRouterTimeoutError,
  OpenRouterParseError,
  OpenRouterValidationError,
  OpenRouterConfigError,
} from "./openrouter.errors";

import { cleanMarkdownCodeBlocks, isRetryableError, calculateRetryDelay, validateConfig } from "./openrouter.utils";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<RequiredOpenRouterConfig> = {
  baseUrl: "https://openrouter.ai/api/v1",
  model: "openai/o3-mini",
  timeout: 180000, // 3 minutes
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  appTitle: "Tripper App",
};

/**
 * OpenRouter Service Class
 */
export class OpenRouterService {
  private readonly config: RequiredOpenRouterConfig;
  private readonly completionEndpoint: string;

  constructor(config: OpenRouterConfig = {}) {
    // Resolve configuration with defaults and environment variables
    this.config = this.resolveConfig(config);

    // Validate configuration
    this.validateConfiguration();

    // Build endpoint URL
    this.completionEndpoint = `${this.config.baseUrl}/chat/completions`;
  }

  /**
   * Resolves final configuration from provided config, env vars, and defaults
   */
  private resolveConfig(config: OpenRouterConfig): RequiredOpenRouterConfig {
    const apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new OpenRouterConfigError(
        "API key is required. Provide via config.apiKey or OPENROUTER_API_KEY environment variable."
      );
    }

    return {
      apiKey,
      model:
        config.model ||
        import.meta.env.OPENROUTER_MODEL ||
        process.env.OPENROUTER_MODEL ||
        DEFAULT_CONFIG.model ||
        "anthropic/claude-3-sonnet-20240229",
      baseUrl: config.baseUrl || DEFAULT_CONFIG.baseUrl || "https://openrouter.ai/api/v1",
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout ?? 180000,
      maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? DEFAULT_CONFIG.retryDelay ?? 1000,
      httpReferer:
        config.httpReferer || import.meta.env.PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || "http://localhost:4321",
      appTitle: config.appTitle || DEFAULT_CONFIG.appTitle || "Tripper App",
    };
  }

  /**
   * Validates the resolved configuration
   */
  private validateConfiguration(): void {
    try {
      validateConfig(this.config);
    } catch (error) {
      throw new OpenRouterConfigError(error instanceof Error ? error.message : "Invalid configuration");
    }
  }

  /**
   * Gets the current configuration (read-only)
   */
  public getConfig(): Readonly<RequiredOpenRouterConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Builds HTTP headers for OpenRouter API requests
   */
  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      // "HTTP-Referer": this.config.httpReferer,
      "X-Title": this.config.appTitle,
    };
  }

  /**
   * Combines external abort signal with internal timeout signal
   */
  private createAbortSignal(externalSignal?: AbortSignal): {
    signal: AbortSignal;
    cleanup: () => void;
  } {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, this.config.timeout);

    // If no external signal, just use timeout
    if (!externalSignal) {
      return {
        signal: timeoutController.signal,
        cleanup: () => clearTimeout(timeoutId),
      };
    }

    // Combine both signals
    const combinedController = new AbortController();

    const abortHandler = () => combinedController.abort();

    timeoutController.signal.addEventListener("abort", abortHandler);
    externalSignal.addEventListener("abort", abortHandler);

    return {
      signal: combinedController.signal,
      cleanup: () => {
        clearTimeout(timeoutId);
        timeoutController.signal.removeEventListener("abort", abortHandler);
        externalSignal.removeEventListener("abort", abortHandler);
      },
    };
  }

  /**
   * Executes HTTP request to OpenRouter API with retry logic
   */
  private async executeRequest(body: OpenRouterRequestBody, abortSignal?: AbortSignal): Promise<OpenRouterResponse> {
    const { signal, cleanup } = this.createAbortSignal(abortSignal);

    try {
      return await this.retryWithBackoff(async () => {
        try {
          const response = await fetch(this.completionEndpoint, {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify(body),
            signal,
          });

          // Handle non-ok responses
          if (!response.ok) {
            const responseBody = await response.text();
            throw new OpenRouterAPIError(
              `OpenRouter API error: ${response.status} - ${response.statusText}`,
              response.status,
              responseBody
            );
          }

          const data = await response.json();
          return data as OpenRouterResponse;
        } catch (error) {
          // Convert AbortError to OpenRouterTimeoutError
          if (error instanceof Error && error.name === "AbortError") {
            throw new OpenRouterTimeoutError(this.config.timeout);
          }

          // Re-throw other errors as-is
          throw error;
        }
      });
    } finally {
      cleanup();
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>, attemptNumber = 0): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Don't retry if max attempts reached
      if (attemptNumber >= this.config.maxRetries) {
        throw error;
      }

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(this.config.retryDelay, attemptNumber);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry
      return this.retryWithBackoff(operation, attemptNumber + 1);
    }
  }

  /**
   * Parses content from OpenRouter response
   */
  private parseResponse(response: OpenRouterResponse): string {
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterParseError("No choices in response", JSON.stringify(response));
    }

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new OpenRouterParseError("No content in response", JSON.stringify(response));
    }

    return content;
  }

  /**
   * Parses and validates structured response
   */
  private parseStructuredResponse<T>(content: string, validator?: (data: unknown) => T): T {
    // Clean markdown code blocks and extract JSON
    // eslint-disable-next-line no-console
    console.log("OpenRouter raw response:", content);
    const cleaned = cleanMarkdownCodeBlocks(content);

    try {
      // Parse JSON
      const parsed = JSON.parse(cleaned);

      // Validate if validator provided
      if (validator) {
        try {
          return validator(parsed);
        } catch (validationError) {
          throw new OpenRouterValidationError(
            "Response validation failed",
            validationError instanceof Error ? [validationError.message] : ["Unknown validation error"]
          );
        }
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof OpenRouterValidationError) {
        throw error;
      }

      // Include both original and cleaned content for debugging
      const errorMessage = `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`;
      // eslint-disable-next-line no-console
      console.error("JSON Parse Error:", {
        error: errorMessage,
        originalLength: content.length,
        cleanedLength: cleaned.length,
        originalStart: content.substring(0, 100),
        cleanedStart: cleaned.substring(0, 100),
      });

      throw new OpenRouterParseError(errorMessage, cleaned);
    }
  }

  /**
   * Executes a basic chat completion
   *
   * @param options - Completion options
   * @returns Completion response with content and metadata
   */
  public async complete(options: CompletionOptions): Promise<CompletionResponse> {
    const {
      messages,
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      responseFormat,
      abortSignal,
    } = options;

    // Build request body
    const requestBody: OpenRouterRequestBody = {
      model: model || this.config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      response_format: responseFormat,
    };

    // Execute request
    const response = await this.executeRequest(requestBody, abortSignal);

    // Parse response
    const content = this.parseResponse(response);

    // Build completion response
    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: response.choices[0].finish_reason,
      id: response.id,
    };
  }

  /**
   * Executes a chat completion with structured output
   *
   * @param options - Structured completion options with JSON schema
   * @returns Parsed and validated object of type T
   */
  public async completeStructured<T>(options: StructuredCompletionOptions<T>): Promise<T> {
    const { schema, validator, ...baseOptions } = options;

    // Build response_format from schema
    const responseFormat = {
      type: "json_schema" as const,
      json_schema: {
        name: schema.name,
        strict: true as const,
        schema: schema.schema,
      },
    };

    // Execute base completion
    const response = await this.complete({
      ...baseOptions,
      responseFormat,
    });

    // Parse and validate structured response
    return this.parseStructuredResponse<T>(response.content, validator);
  }
}
