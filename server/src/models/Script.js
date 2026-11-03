import mongoose from 'mongoose';

const scriptSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, maxlength: 1500, default: '' },
  unicodeRange: { type: String, trim: true, maxlength: 100, default: '' },
  direction: { type: String, enum: ['ltr', 'rtl', 'other', 'unknown'], default: 'unknown' },
  fontRequirements: [{ type: String, trim: true, maxlength: 150 }],
  languages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
  varieties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety' }],
  availability: { type: String, enum: ['unavailable', 'planned', 'in-development', 'available'], default: 'planned' },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, source: { type: String, trim: true, maxlength: 1000, default: '' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

scriptSchema.index({ name: 1 }, { unique: true });
scriptSchema.index({ status: 1, isActive: 1 });
export const Script = mongoose.model('Script', scriptSchema);
