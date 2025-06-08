// User related types
export interface User {
    _id: string;
    lineUserId: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    personalInfo?: {
      height?: number;
      weight?: number;
      age?: number;
      gender?: 'male' | 'female' | 'other';
      injuryNotes?: string[];
    };
    crossfitData?: {
      primaryGym?: string;
      benchmarkScores?: Record<string, BenchmarkScore>;
      personalRecords?: Record<string, PersonalRecord>;
    };
    social?: {
      following: string[];
      followers: string[];
      isCoach: boolean;
      coachCertification?: {
        level: string;
        certDate: Date;
        certNumber: string;
      };
    };
    preferences?: {
      isProfilePublic: boolean;
      showAge: boolean;
      showWeight: boolean;
      preferredEquipment?: string[];
      skillLevel?: number;
      language: string;
    };
    stats?: {
      totalWODs: number;
      currentStreak: number;
      longestStreak: number;
      lastWorkoutDate?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface BenchmarkScore {
    time?: number;
    rounds?: number;
    reps?: number;
    weight?: number;
    date: Date;
    rxd: boolean;
  }
  
  export interface PersonalRecord {
    weight?: number;
    reps?: number;
    distance?: number;
    date: Date;
  }
  
  // WOD related types
  export interface WOD {
    _id: string;
    name: string;
    description?: string;
    classification: {
      scoringType: 'For Time' | 'AMRAP' | 'EMOM' | 'Tabata' | 'Max Reps' | 'Max Weight' | 'Not Scored';
      equipment?: string[];
      movements?: string[];
      movementCategories?: string[];
      difficulty?: number;
      estimatedDuration?: number;
      targetMuscleGroups?: string[];
    };
    structure: {
      type?: 'rounds' | 'time-based' | 'max-effort';
      rounds?: number;
      timeLimit?: number;
      intervals?: Array<{
        work: number;
        rest: number;
        movements?: string[];
      }>;
      movements: Array<{
        name: string;
        reps?: number;
        weight?: {
          male?: string;
          female?: string;
        };
        notes?: string;
        alternatives?: string[];
      }>;
    };
    metadata: {
      createdBy: string;
      gym?: string;
      isOfficial: boolean;
      isPublic: boolean;
      source?: string;
      tags?: string[];
    };
    engagement?: {
      completedCount: number;
      averageScore?: {
        time?: number;
        rounds?: number;
        reps?: number;
      };
      likes?: string[];
      savedBy?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Score related types
  export interface Score {
    _id: string;
    userId: string;
    wodId: string;
    performance: {
      score: string;
      scoreValue?: number;
      scoringType: string;
      rxd: boolean;
      scaled: boolean;
      scaledMovements?: Array<{
        original: string;
        scaled: string;
      }>;
    };
    details: {
      date: Date;
      startTime?: Date;
      endTime?: Date;
      notes?: string;
      feelingRating?: number;
      location?: string;
      weather?: string;
      injuries?: string[];
    };
    social?: {
      likes?: string[];
      isPublic: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  // API Response types
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  }
  
  // Auth types
  export interface AuthUser {
    id: string;
    username: string;
    displayName: string;
    profilePicture?: string;
    token: string;
  }
  
  export interface LineProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }