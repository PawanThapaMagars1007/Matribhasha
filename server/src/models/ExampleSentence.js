import mongoose from 'mongoose';

const sentenceTranslationSchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  source: { type: String, trim: true, maxlength: 500, default: '' },
  verificationStatus: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' },
}, { _id: false });

const exampleSentenceSchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', default: null },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  romanTransliteration: { type: String, trim: true, maxlength: 1000, default: '' },
  context: { type: String, trim: true, maxlength: 1000, default: '' },
  difficulty: { type: String, enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'unspecified'], default: 'unspecified' },
  vocabulary: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
  translations: { type: [sentenceTranslationSchema], default: [] },
  grammarNotes: { type: String, trim: true, maxlength: 1500, default: '' },
  pronunciation: { type: mongoose.Schema.Types.ObjectId, ref: 'Pronunciation', default: null },
  audioAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioAsset', default: null },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  attribution: { type: String, trim: true, maxlength: 300, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
exampleSentenceSchema.index({ language: 1, variety: 1, status: 1 });
export const ExampleSentence = mongoose.model('ExampleSentence', exampleSentenceSchema);
