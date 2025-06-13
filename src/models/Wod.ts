import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { WOD } from '@/types';

export interface IWodDocument extends Omit<WOD, '_id'>, Document {
  _id: Types.ObjectId;
}

interface IWodModel extends Model<IWodDocument> {
  findByUser(userId: string): Promise<IWodDocument[]>;
  findPublicWods(limit?: number): Promise<IWodDocument[]>;
}

const wodSchema = new Schema<IWodDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    classification: {
      scoringType: {
        type: String,
        enum: ['For Time', 'AMRAP', 'EMOM', 'Tabata', 'Max Reps', 'Max Weight', 'Not Scored'],
        required: true,
      },
      equipment: [String],
      movements: [String],
      movementCategories: [String],
      difficulty: {
        type: Number,
        min: 1,
        max: 5,
      },
      estimatedDuration: Number,
      targetMuscleGroups: [String],
    },
    structure: {
      type: {
        type: String,
        enum: ['rounds', 'time-based', 'max-effort'],
      },
      rounds: Number,
      timeLimit: Number,
      intervals: [{
        work: Number,
        rest: Number,
        movements: [String],
      }],
      movements: [{
        name: {
          type: String,
          required: true,
        },
        reps: Number,
        weight: {
          male: String,
          female: String,
        },
        notes: String,
        alternatives: [String],
      }],
    },
    metadata: {
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      gym: {
        type: Schema.Types.ObjectId,
        ref: 'Gym',
      },
      isOfficial: {
        type: Boolean,
        default: false,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
      source: String,
      tags: [String],
    },
    engagement: {
      completedCount: {
        type: Number,
        default: 0,
      },
      averageScore: {
        time: Number,
        rounds: Number,
        reps: Number,
      },
      likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      savedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
  },
  {
    timestamps: true,
  }
);

// 索引
wodSchema.index({ 'metadata.createdBy': 1, createdAt: -1 });
wodSchema.index({ 'metadata.isPublic': 1, createdAt: -1 });
wodSchema.index({ 'classification.scoringType': 1 });
wodSchema.index({ 'classification.equipment': 1 });
wodSchema.index({ 'classification.difficulty': 1 });
wodSchema.index({ name: 'text', description: 'text' });

// 靜態方法
wodSchema.statics.findByUser = function(userId: string) {
  return this.find({ 'metadata.createdBy': userId }).sort({ createdAt: -1 });
};

wodSchema.statics.findPublicWods = function(limit: number = 20) {
  return this.find({ 'metadata.isPublic': true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('metadata.createdBy', 'username displayName profilePicture');
};

// 方法
wodSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const WodModel = (mongoose.models.Wod || mongoose.model<IWodDocument, IWodModel>('Wod', wodSchema)) as IWodModel;

export default WodModel;