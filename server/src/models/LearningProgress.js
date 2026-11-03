import mongoose from 'mongoose';

const learningProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'CharacterCategory', default: null },
  status: { type: String, enum: ['not-started', 'learning', 'practised', 'completed'], default: 'not-started' },
  viewedCount: { type: Number, min: 0, default: 0 },
  practiceCount: { type: Number, min: 0, default: 0 },
  writingExercises: { type: Number, min: 0, default: 0 },
  listeningExercises: { type: Number, min: 0, default: 0 },
  quizAttempts: { type: Number, min: 0, default: 0 },
  correctAnswers: { type: Number, min: 0, default: 0 },
  learningTimeSeconds: { type: Number, min: 0, default: 0 },
  lastPracticeAt: { type: Date, default: null },
}, { timestamps: true });

learningProgressSchema.index({ user: 1, character: 1 }, { unique: true });
learningProgressSchema.index({ user: 1, language: 1, script: 1, category: 1, status: 1 });
export const LearningProgress = mongoose.model('LearningProgress', learningProgressSchema);
