import mongoose from 'mongoose';

const wordMeaningSchema = new mongoose.Schema({
  vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true, index: true },
  definitionLanguage: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', default: null },
  definition: { type: String, required: true, trim: true, maxlength: 1000 },
  contextualExplanation: { type: String, trim: true, maxlength: 1500, default: '' },
  contextLabel: { type: String, trim: true, maxlength: 100, default: '' },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  attribution: { type: String, trim: true, maxlength: 300, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
wordMeaningSchema.index({ vocabulary: 1, status: 1, contextLabel: 1 });
export const WordMeaning = mongoose.model('WordMeaning', wordMeaningSchema);
