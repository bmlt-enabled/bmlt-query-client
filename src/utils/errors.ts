/**
 * Comprehensive error handling for BMLT Query Client
 */

export enum BmltErrorType {
  API_ERROR = 'ApiError',
  NETWORK_ERROR = 'NetworkError',
  VALIDATION_ERROR = 'ValidationError',
  GEOCODING_ERROR = 'GeocodingError',
  RATE_LIMIT_ERROR = 'RateLimitError',
  TIMEOUT_ERROR = 'TimeoutError',
  AUTHENTICATION_ERROR = 'AuthenticationError',
  SERVER_ERROR = 'ServerError',
  CLIENT_ERROR = 'ClientError',
  CONFIGURATION_ERROR = 'ConfigurationError',
}

export class BmltQueryError extends Error {
  public readonly type: BmltErrorType;
  public readonly statusCode?: number;
  public readonly response?: unknown;
  public readonly originalError?: Error;
  public readonly context?: Record<string, unknown>;

  constructor(
    type: BmltErrorType,
    message: string,
    options: {
      statusCode?: number;
      response?: unknown;
      originalError?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = 'BmltQueryError';
    this.type = type;
    this.statusCode = options.statusCode;
    this.response = options.response;
    this.originalError = options.originalError;
    this.context = options.context;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BmltQueryError.prototype);
  }

  /**
   * Check if error is of a specific type
   */
  isType(type: BmltErrorType): boolean {
    return this.type === type;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableTypes = [
      BmltErrorType.NETWORK_ERROR,
      BmltErrorType.TIMEOUT_ERROR,
      BmltErrorType.RATE_LIMIT_ERROR,
      BmltErrorType.SERVER_ERROR,
    ];
    return retryableTypes.includes(this.type);
  }

  /**
   * Check if error is a client-side error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server-side error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case BmltErrorType.NETWORK_ERROR:
        return 'Unable to connect to the BMLT server. Please check your internet connection and try again.';

      case BmltErrorType.TIMEOUT_ERROR:
        return 'The request timed out. Please try again later.';

      case BmltErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';

      case BmltErrorType.GEOCODING_ERROR:
        return 'Unable to find the specified address. Please check the address and try again.';

      case BmltErrorType.VALIDATION_ERROR:
        return 'Invalid input provided. Please check your parameters and try again.';

      case BmltErrorType.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please check your credentials.';

      case BmltErrorType.SERVER_ERROR:
        return 'The BMLT server encountered an error. Please try again later.';

      case BmltErrorType.API_ERROR:
        if (this.statusCode === 404) {
          return 'The requested resource was not found.';
        }
        return 'An error occurred while communicating with the BMLT server.';

      case BmltErrorType.CONFIGURATION_ERROR:
        return 'Invalid configuration. Please check your settings.';

      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      response: this.response,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Factory class for creating specific error types
 */
export class ErrorFactory {
  static createApiError(
    message: string,
    statusCode?: number,
    response?: unknown,
    originalError?: Error
  ): BmltQueryError {
    let type: BmltErrorType;

    if (statusCode) {
      if (statusCode >= 500) {
        type = BmltErrorType.SERVER_ERROR;
      } else if (statusCode === 401 || statusCode === 403) {
        type = BmltErrorType.AUTHENTICATION_ERROR;
      } else if (statusCode === 429) {
        type = BmltErrorType.RATE_LIMIT_ERROR;
      } else if (statusCode >= 400) {
        type = BmltErrorType.CLIENT_ERROR;
      } else {
        type = BmltErrorType.API_ERROR;
      }
    } else {
      type = BmltErrorType.API_ERROR;
    }

    return new BmltQueryError(type, message, {
      statusCode,
      response,
      originalError,
    });
  }

  static createNetworkError(message: string, originalError?: Error): BmltQueryError {
    return new BmltQueryError(BmltErrorType.NETWORK_ERROR, message, {
      originalError,
    });
  }

  static createTimeoutError(message: string, originalError?: Error): BmltQueryError {
    return new BmltQueryError(BmltErrorType.TIMEOUT_ERROR, message, {
      originalError,
    });
  }

  static createValidationError(message: string, context?: Record<string, unknown>): BmltQueryError {
    return new BmltQueryError(BmltErrorType.VALIDATION_ERROR, message, {
      context,
    });
  }

  static createGeocodingError(
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ): BmltQueryError {
    return new BmltQueryError(BmltErrorType.GEOCODING_ERROR, message, {
      originalError,
      context,
    });
  }

  static createRateLimitError(
    message: string,
    statusCode?: number,
    response?: unknown
  ): BmltQueryError {
    return new BmltQueryError(BmltErrorType.RATE_LIMIT_ERROR, message, {
      statusCode,
      response,
    });
  }

  static createConfigurationError(
    message: string,
    context?: Record<string, unknown>
  ): BmltQueryError {
    return new BmltQueryError(BmltErrorType.CONFIGURATION_ERROR, message, {
      context,
    });
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle and transform fetch errors
   */
  static handleFetchError(error: unknown, response?: Response): BmltQueryError {
    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return ErrorFactory.createTimeoutError('Request timeout', error);
    }

    // Handle TypeError (network errors)
    if (error instanceof TypeError) {
      return ErrorFactory.createNetworkError('Network connection failed', error);
    }

    if (response && !response.ok) {
      // Server responded with error status
      const message = `HTTP ${response.status}: ${response.statusText}`;
      return ErrorFactory.createApiError(message, response.status, undefined, error as Error);
    }

    // Handle other errors
    if (error instanceof Error) {
      return ErrorFactory.createApiError(error.message, undefined, undefined, error);
    }

    // Fallback for unknown errors
    return ErrorFactory.createApiError(
      'Unknown error occurred',
      undefined,
      undefined,
      new Error(String(error))
    );
  }

  /**
   * @deprecated Use handleFetchError instead
   */
  static handleAxiosError(error: any): BmltQueryError {
    return ErrorHandler.handleFetchError(error);
  }

  /**
   * Handle validation errors with detailed context
   */
  static handleValidationError(
    field: string,
    value: unknown,
    expectedType: string,
    constraints?: string[]
  ): BmltQueryError {
    let message = `Invalid ${field}: expected ${expectedType}`;

    if (constraints && constraints.length > 0) {
      message += ` (${constraints.join(', ')})`;
    }

    return ErrorFactory.createValidationError(message, {
      field,
      value,
      expectedType,
      constraints,
    });
  }

  /**
   * Handle endpoint validation errors
   */
  static handleEndpointError(endpoint: string, format: string): BmltQueryError {
    const message = `Invalid endpoint/format combination: ${endpoint} with ${format}`;
    return ErrorFactory.createValidationError(message, {
      endpoint,
      format,
    });
  }

  /**
   * Handle URL validation errors
   */
  static handleUrlError(url: string, reason: string): BmltQueryError {
    const message = `Invalid URL: ${reason}`;
    return ErrorFactory.createValidationError(message, {
      url,
      reason,
    });
  }

  /**
   * Handle coordinate validation errors
   */
  static handleCoordinateError(
    latitude?: number,
    longitude?: number,
    reason?: string
  ): BmltQueryError {
    const message = reason || 'Invalid coordinates provided';
    return ErrorFactory.createValidationError(message, {
      latitude,
      longitude,
      reason,
    });
  }

  /**
   * Wrap and enhance existing errors
   */
  static wrapError(
    originalError: Error,
    context: string,
    additionalContext?: Record<string, unknown>
  ): BmltQueryError {
    const message = `${context}: ${originalError.message}`;

    // Try to preserve the original error type if it's already a BmltQueryError
    if (originalError instanceof BmltQueryError) {
      return new BmltQueryError(originalError.type, message, {
        statusCode: originalError.statusCode,
        response: originalError.response,
        originalError: originalError.originalError || originalError,
        context: {
          ...originalError.context,
          ...additionalContext,
        },
      });
    }

    // Default to API error for unknown errors
    return ErrorFactory.createApiError(message, undefined, undefined, originalError);
  }
}

/**
 * Retry utility for handling retryable errors
 */
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  factor: number;
  onRetry?: (error: BmltQueryError, attempt: number) => void;
}

export class RetryHandler {
  static async withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
    const { maxRetries, baseDelay, maxDelay, factor, onRetry } = options;

    let lastError: BmltQueryError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const bmltError =
          error instanceof BmltQueryError
            ? error
            : ErrorHandler.wrapError(error as Error, 'Operation failed');

        lastError = bmltError;

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === maxRetries || !bmltError.isRetryable()) {
          throw bmltError;
        }

        // Calculate delay for next attempt
        const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);

        // Call retry callback if provided
        if (onRetry) {
          onRetry(bmltError, attempt + 1);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
