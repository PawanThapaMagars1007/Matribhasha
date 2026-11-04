import mongoose from 'mongoose';

const sentenceExerciseSchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  sentence: { type: mongoose.Schema.Types.ObjectId, ref: 'ExampleSentence', default: null },
  grammarLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'GrammarLesson', default: null },
  type: { type: String, enum: ['word-order', 'fill-blank', 'translation-recognition', 'sentence-matching', 'context-selection', 'sentence-correction'], required: true },
  prompt: { type: String, required: true, trim: true, maxlength: 1000 },
  instructions: { type: String, trim: true, maxlength: 1000, default: '' },
  choices: [{ id: { type: String, required: true }, label: { type: String, required: true, trim: true, maxlength: 500 } }],
  tokens: [{ id: { type: String, required: true }, text: { type: String, required: true, trim: true, maxlength: 100 } }],
  answer: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
  explanation: { type: String, trim: true, maxlength: 1500, default: '' },
  difficulty: { type: String, enum: ['beginner', 'elementary', 'intermediate', 'advanced'], default: 'beginner' },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
sentenceExerciseSchema.index({ language: 1, variety: 1, grammarLesson: 1, type: 1, status: 1 });
export const SentenceExercise = mongoose.model('SentenceExercise', sentenceExerciseSchema);
