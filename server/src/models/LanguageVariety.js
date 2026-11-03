import mongoose from 'mongoose';

const languageVarietySchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, maxlength: 1500, default: '' },
  regions: [{ type: String, trim: true, maxlength: 100 }],
  alternativeNames: [{ type: String, trim: true, maxlength: 100 }],
  scripts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Script' }],
  availability: { type: String, enum: ['unavailable', 'planned', 'in-development', 'available'], default: 'planned' },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, source: { type: String, trim: true, maxlength: 1000, default: '' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

languageVarietySchema.index({ language: 1, name: 1 }, { unique: true });
languageVarietySchema.index({ status: 1, language: 1 });
export const LanguageVariety = mongoose.model('LanguageVariety', languageVarietySchema);
