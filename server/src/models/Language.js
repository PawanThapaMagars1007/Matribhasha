import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  alternativeNames: [{ type: String, trim: true, maxlength: 100 }],
  description: { type: String, maxlength: 2000, default: '' },
  code: { type: String, trim: true, uppercase: true, maxlength: 20, default: '' },
  varieties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety' }],
  scripts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Script' }],
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, source: { type: String, default: '' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  audioAvailable: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

languageSchema.index({ name: 'text', nativeName: 'text', alternativeNames: 'text' });
languageSchema.index({ isPublished: 1, name: 1 });
export const Language = mongoose.model('Language', languageSchema);
