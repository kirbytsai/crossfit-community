import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { User } from '@/types';

export interface IUserDocument extends Omit<User, '_id'>, Document {
  _id: Types.ObjectId;
}

// 定義靜態方法的介面
interface IUserModel extends Model<IUserDocument> {
  findByLineUserId(lineUserId: string): Promise<IUserDocument | null>;
  findByUsername(username: string): Promise<IUserDocument | null>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    lineUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    personalInfo: {
      height: Number,
      weight: Number,
      birthDate: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
      injuryNotes: [{
        date: Date,
        note: String
      }],
    },
    crossfitData: {
      primaryGym: {
        type: Schema.Types.ObjectId,
        ref: 'Gym',
      },
      benchmarkScores: {
        type: Map,
        of: {
          time: Number,
          rounds: Number,
          reps: Number,
          weight: Number,
          date: Date,
          rxd: Boolean,
        },
      },
      personalRecords: {
        type: Map,
        of: {
          weight: Number,
          reps: Number,
          distance: Number,
          date: Date,
        },
      },
    },
    social: {
      following: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      isCoach: {
        type: Boolean,
        default: false,
      },
      coachCertification: {
        level: String,
        certDate: Date,
        certNumber: String,
      },
    },
    preferences: {
      isProfilePublic: {
        type: Boolean,
        default: true,
      },
      showAge: {
        type: Boolean,
        default: true,
      },
      showWeight: {
        type: Boolean,
        default: true,
      },
      preferredEquipment: [String],
      skillLevel: {
        type: Number,
        min: 1,
        max: 5,
      },
      language: {
        type: String,
        default: 'en',
      },
    },
    stats: {
      totalWODs: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastWorkoutDate: Date,
      totalComments: {
        type: Number,
        default: 0,
      },
      totalLikes: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// 索引
userSchema.index({ 'social.followers': 1 });
userSchema.index({ 'crossfitData.primaryGym': 1 });

// 方法
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// 靜態方法
userSchema.statics.findByLineUserId = function(lineUserId: string) {
  return this.findOne({ lineUserId });
};

userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

// 檢查 username 是否已存在
userSchema.statics.isUsernameTaken = async function(username: string, excludeUserId?: string) {
  const user = await this.findOne({ 
    username: username.toLowerCase(),
    _id: { $ne: excludeUserId }
  });
  return !!user;
};

const UserModel = (mongoose.models.User || mongoose.model<IUserDocument, IUserModel>('User', userSchema)) as IUserModel;

export default UserModel;