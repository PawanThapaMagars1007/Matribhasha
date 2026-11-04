import mongoose from 'mongoose';

const vocabularyReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true, index: true },
  rating: { type: String, enum: ['again', 'hard', 'good', 'easy'], required: true },
  previousIntervalDays: { type: Number, min: 0, default: 0 },
  nextIntervalDays: { type: Number, min: 0, max: 365, default: 0 },
  nextReviewAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

vocabularyReviewSchema.index({ user: 1, vocabulary: 1, createdAt: -1 });
export const VocabularyReview = mongoose.model('VocabularyReview', vocabularyReviewSchema);
