import mongoose from 'mongoose';

const grammarProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'GrammarLesson', required: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  status: { type: String, enum: ['new', 'learning', 'completed'], default: 'new', index: true },
  viewCount: { type: Number, min: 0, default: 0 },
  exerciseAttempts: { type: Number, min: 0, default: 0 },
  correctAnswers: { type: Number, min: 0, default: 0 },
  learningTimeSeconds: { type: Number, min: 0, default: 0 },
  lastStudiedAt: { type: Date, default: null },
}, { timestamps: true });

grammarProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
grammarProgressSchema.index({ user: 1, language: 1, variety: 1, status: 1 });
export const GrammarProgress = mongoose.model('GrammarProgress', grammarProgressSchema);
