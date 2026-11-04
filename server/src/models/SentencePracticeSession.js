import mongoose from 'mongoose';

const sentencePracticeSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'SentenceExercise', required: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  choices: [{ type: String }],
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  submittedAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
  isCorrect: { type: Boolean, default: null },
  status: { type: String, enum: ['pending', 'answered'], default: 'pending', index: true },
  answeredAt: { type: Date, default: null },
}, { timestamps: true });

sentencePracticeSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
export const SentencePracticeSession = mongoose.model('SentencePracticeSession', sentencePracticeSessionSchema);
