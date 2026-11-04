import mongoose from 'mongoose';

const sentenceProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'SentenceExercise', required: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  attempts: { type: Number, min: 0, default: 0 },
  correctAnswers: { type: Number, min: 0, default: 0 },
  completed: { type: Boolean, default: false },
  learningTimeSeconds: { type: Number, min: 0, default: 0 },
  lastPractisedAt: { type: Date, default: null },
}, { timestamps: true });

sentenceProgressSchema.index({ user: 1, exercise: 1 }, { unique: true });
sentenceProgressSchema.index({ user: 1, language: 1, variety: 1 });
export const SentenceProgress = mongoose.model('SentenceProgress', sentenceProgressSchema);
