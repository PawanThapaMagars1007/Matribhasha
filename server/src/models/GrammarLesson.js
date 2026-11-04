import mongoose from 'mongoose';

const grammarLessonSchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'GrammarCategory', default: null, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  nativeTitle: { type: String, trim: true, maxlength: 160, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  interfaceLanguage: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', default: null },
  explanation: { type: String, required: true, trim: true, maxlength: 6000 },
  exceptions: { type: String, trim: true, maxlength: 3000, default: '' },
  difficulty: { type: String, enum: ['beginner', 'elementary', 'intermediate', 'advanced'], default: 'beginner' },
  topicLabels: [{ type: String, trim: true, maxlength: 80 }],
  exampleSentences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExampleSentence' }],
  relatedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GrammarLesson' }],
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  attribution: { type: String, trim: true, maxlength: 300, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
grammarLessonSchema.index({ language: 1, variety: 1, category: 1, status: 1, difficulty: 1 });
export const GrammarLesson = mongoose.model('GrammarLesson', grammarLessonSchema);
