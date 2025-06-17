// src/lib/errors.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

// 錯誤回應格式
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// 處理錯誤並返回統一格式
export function handleError(error: unknown): {
  status: number;
  response: ErrorResponse;
} {
  // 如果是我們自定義的錯誤
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      response: {
        error: {
          code: error.code || 'ERROR',
          message: error.message,
        },
      },
    };
  }

  // Mongoose 驗證錯誤
  if (error instanceof Error && error.name === 'ValidationError') {
    const mongooseError = error as Error & {
      errors: Record<string, {
        path: string;
        message: string;
      }>;
    };
    const errors = Object.values(mongooseError.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return {
      status: 400,
      response: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      },
    };
  }

  // Mongoose CastError (無效的 ObjectId)
  if (error instanceof Error && error.name === 'CastError') {
    return {
      status: 400,
      response: {
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format',
        },
      },
    };
  }

  // JWT 錯誤
  if (error instanceof Error && error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      response: {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      },
    };
  }

  // 預設錯誤
  console.error('Unhandled error:', error);
  return {
    status: 500,
    response: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  };
}