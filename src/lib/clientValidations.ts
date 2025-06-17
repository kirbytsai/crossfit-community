// src/lib/clientValidations.ts
// 前端驗證規則（與後端保持一致）

export const validationRules = {
  // WOD 相關
  wodName: {
    required: 'WOD name is required',
    minLength: { value: 1, message: 'WOD name cannot be empty' },
    maxLength: { value: 100, message: 'WOD name is too long' },
  },
  
  wodMovement: {
    required: 'Movement name is required',
    minLength: { value: 1, message: 'Movement name cannot be empty' },
  },

  // Score 相關
  scoreTime: {
    validate: (value: { minutes: number; seconds: number }) => {
      if (value.minutes === 0 && value.seconds === 0) {
        return 'Please enter a valid time';
      }
      if (value.seconds >= 60) {
        return 'Seconds must be less than 60';
      }
      return true;
    },
  },

  scoreRounds: {
    required: 'Rounds are required',
    min: { value: 0, message: 'Rounds cannot be negative' },
  },

  scoreReps: {
    min: { value: 0, message: 'Reps cannot be negative' },
  },

  // User 相關
  username: {
    required: 'Username is required',
    minLength: { value: 3, message: 'Username must be at least 3 characters' },
    maxLength: { value: 30, message: 'Username is too long' },
    pattern: {
      value: /^[a-zA-Z0-9_-]+$/,
      message: 'Username can only contain letters, numbers, underscores, and hyphens',
    },
  },

  height: {
    min: { value: 0, message: 'Height must be positive' },
    max: { value: 300, message: 'Please enter a valid height' },
  },

  weight: {
    min: { value: 0, message: 'Weight must be positive' },
    max: { value: 500, message: 'Please enter a valid weight' },
  },

  age: {
    min: { value: 10, message: 'Age must be at least 10' },
    max: { value: 100, message: 'Please enter a valid age' },
  },
};

// 錯誤訊息格式化
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as {
      error?: {
        message?: string;
        details?: Array<{ message: string }>;
      };
    };
    if (apiError.error?.message) {
      return apiError.error.message;
    }
    if (apiError.error?.details) {
      return apiError.error.details
        .map((d) => d.message)
        .join(', ');
    }
  }
  
  return 'An unexpected error occurred';
}

// API 錯誤處理
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
  return response.json();
}

// 表單錯誤狀態管理
export interface FormErrors {
  [key: string]: string | undefined;
}

interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: unknown) => true | string;
}

export function validateField(
  name: string,
  value: unknown,
  rules: ValidationRule
): string | undefined {
  if (rules.required && !value) {
    return typeof rules.required === 'string' ? rules.required : 'This field is required';
  }

  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength.value) {
    return rules.minLength.message;
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }

  if (rules.min && typeof value === 'number' && value < rules.min.value) {
    return rules.min.message;
  }

  if (rules.max && typeof value === 'number' && value > rules.max.value) {
    return rules.max.message;
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.value.test(value)) {
    return rules.pattern.message;
  }

  if (rules.validate) {
    const result = rules.validate(value);
    if (result !== true) {
      return result;
    }
  }

  return undefined;
}