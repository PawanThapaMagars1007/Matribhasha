import mongoose from 'mongoose';

const vocabularyProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'VocabularyCategory', default: null },
  status: { type: String, enum: ['new', 'learning', 'needs-revision', 'familiar', 'mastered'], default: 'new', index: true },
  viewCount: { type: Number, min: 0, default: 0 },
  flashcardsCompleted: { type: Number, min: 0, default: 0 },
  quizAttempts: { type: Number, min: 0, default: 0 },
  correctAnswers: { type: Number, min: 0, default: 0 },
  learningTimeSeconds: { type: Number, min: 0, default: 0 },
  repetitions: { type: Number, min: 0, default: 0 },
  intervalDays: { type: Number, min: 0, max: 365, default: 0 },
  nextReviewAt: { type: Date, default: null, index: true },
  lastReviewedAt: { type: Date, default: null },
}, { timestamps: true });

vocabularyProgressSchema.index({ user: 1, vocabulary: 1 }, { unique: true });
vocabularyProgressSchema.index({ user: 1, language: 1, category: 1, status: 1 });
export const VocabularyProgress = mongoose.model('VocabularyProgress', vocabularyProgressSchema);
