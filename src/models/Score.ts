import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { Score } from '@/types';

export interface IScoreDocument extends Omit<Score, '_id'>, Document {
  _id: Types.ObjectId;
}

interface IScoreModel extends Model<IScoreDocument> {
  findByUser(userId: string): Promise<IScoreDocument[]>;
  findByWod(wodId: string): Promise<IScoreDocument[]>;
}

const scoreSchema = new Schema<IScoreDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wodId: {
      type: Schema.Types.ObjectId,
      ref: 'Wod',
      required: true,
      index: true,
    },
    performance: {
      score: {
        type: String,
        required: true,
      },
      scoreValue: Number,
      scoringType: {
        type: String,
        required: true,
      },
      rxd: {
        type: Boolean,
        default: false,
      },
      scaled: {
        type: Boolean,
        default: false,
      },
      scaledMovements: [{
        original: String,
        scaled: String,
      }],
    },
    details: {
      date: {
        type: Date,
        required: true,
        default: Date.now,
      },
      startTime: Date,
      endTime: Date,
      notes: String,
      feelingRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      location: {
        type: Schema.Types.ObjectId,
        ref: 'Gym',
      },
      weather: String,
      injuries: [String],
    },
    social: {
      likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// 複合索引
scoreSchema.index({ userId: 1, wodId: 1, 'details.date': -1 });
scoreSchema.index({ wodId: 1, 'performance.scoreValue': 1 });
scoreSchema.index({ 'details.date': -1 });

// 靜態方法
scoreSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId })
    .populate('wodId', 'name classification.scoringType')
    .sort({ 'details.date': -1 });
};

scoreSchema.statics.findByWod = function(wodId: string) {
  return this.find({ wodId })
    .populate('userId', 'username displayName profilePicture')
    .sort({ 'performance.scoreValue': 1, 'details.date': -1 });
};

// 方法
scoreSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const ScoreModel = (mongoose.models.Score || mongoose.model<IScoreDocument, IScoreModel>('Score', scoreSchema)) as IScoreModel;

export default ScoreModel;