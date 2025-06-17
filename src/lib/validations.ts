// src/lib/validations.ts
import { z } from 'zod';
import { ValidationError } from './errors';

// 通用驗證規則
export const commonValidations = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  email: z.string().email('Invalid email format'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  date: z.string().datetime().or(z.date()),
};

// WOD 驗證規則
export const wodValidations = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    classification: z.object({
      scoringType: z.enum(['For Time', 'AMRAP', 'EMOM', 'Tabata', 'Max Reps', 'Max Weight', 'Not Scored']),
      equipment: z.array(z.string()).optional(),
      movements: z.array(z.string()).optional(),
      difficulty: z.number().min(1).max(5).optional(),
      estimatedDuration: z.number().positive().optional(),
    }),
    structure: z.object({
      type: z.enum(['rounds', 'time-based', 'max-effort']).optional(),
      rounds: z.number().positive().optional(),
      timeLimit: z.number().positive().optional(),
      movements: z.array(z.object({
        name: z.string().min(1, 'Movement name is required'),
        reps: z.number().positive().optional(),
        weight: z.object({
          male: z.string().optional(),
          female: z.string().optional(),
        }).optional(),
        notes: z.string().optional(),
      })).min(1, 'At least one movement is required'),
    }),
    metadata: z.object({
      isPublic: z.boolean().optional(),
    }).optional(),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    classification: z.object({
      scoringType: z.enum(['For Time', 'AMRAP', 'EMOM', 'Tabata', 'Max Reps', 'Max Weight', 'Not Scored']).optional(),
      equipment: z.array(z.string()).optional(),
      movements: z.array(z.string()).optional(),
      difficulty: z.number().min(1).max(5).optional(),
      estimatedDuration: z.number().positive().optional(),
    }).optional(),
    structure: z.object({
      type: z.enum(['rounds', 'time-based', 'max-effort']).optional(),
      rounds: z.number().positive().optional(),
      timeLimit: z.number().positive().optional(),
      movements: z.array(z.object({
        name: z.string().min(1),
        reps: z.number().positive().optional(),
        weight: z.object({
          male: z.string().optional(),
          female: z.string().optional(),
        }).optional(),
        notes: z.string().optional(),
      })).optional(),
    }).optional(),
    metadata: z.object({
      isPublic: z.boolean().optional(),
    }).optional(),
  }),
};

// Score 驗證規則
export const scoreValidations = {
  create: z.object({
    wodId: commonValidations.objectId,
    performance: z.object({
      score: z.string().min(1, 'Score is required'),
      scoreValue: z.number().optional(),
      scoringType: z.string().min(1, 'Scoring type is required'),
      rxd: z.boolean().optional(),
      scaled: z.boolean().optional(),
    }),
    details: z.object({
      date: commonValidations.date,
      notes: z.string().max(500).optional(),
      feelingRating: z.number().min(1).max(5).optional(),
    }).optional(),
  }),

  update: z.object({
    performance: z.object({
      score: z.string().min(1),
      scoreValue: z.number().optional(),
      scoringType: z.string().min(1),
      rxd: z.boolean().optional(),
      scaled: z.boolean().optional(),
    }).optional(),
    details: z.object({
      date: commonValidations.date.optional(),
      notes: z.string().max(500).optional(),
      feelingRating: z.number().min(1).max(5).optional(),
    }).optional(),
  }),
};

// User 驗證規則
export const userValidations = {
  updateProfile: z.object({
    username: commonValidations.username.optional(),
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    profileCompleted: z.boolean().optional(),
  }),

  updatePersonalInfo: z.object({
    height: z.number().positive().max(300).optional(),
    weight: z.number().positive().max(500).optional(),
    age: z.number().min(10).max(100).optional(),
    injuryNotes: z.string().max(1000).optional(),
  }),

  updateBenchmarkScore: z.object({
    wodName: z.string().min(1),
    score: z.object({
      time: z.string().optional(),
      rounds: z.number().optional(),
      reps: z.number().optional(),
      weight: z.number().optional(),
      date: commonValidations.date.optional(),
      rxd: z.boolean().optional(),
    }),
  }),
};

// 驗證函數
export async function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new ValidationError(message);
    }
    throw error;
  }
}