import mongoose from 'mongoose';

const audioAssetSchema = new mongoose.Schema({
  storageKey: { type: String, required: true, select: false },
  format: { type: String, enum: ['webm', 'ogg', 'wav', 'mp3', 'm4a'], required: true },
  mimeType: { type: String, required: true },
  byteSize: { type: Number, required: true, min: 1, max: 10485760 },
  durationSeconds: { type: Number, min: 0, max: 120, default: null },
  attribution: { type: String, required: true, trim: true, maxlength: 300 },
  consentRecorded: { type: Boolean, required: true, default: false },
  speakerLabel: { type: String, trim: true, maxlength: 100, default: '' },
  source: { type: String, trim: true, maxlength: 500, default: '' },
  verification: { status: { type: String, enum: ['pending', 'verified', 'needs-review'], default: 'pending' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['pending', 'published', 'rejected', 'deleted'], default: 'pending', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

audioAssetSchema.index({ status: 1, createdAt: -1 });
export const AudioAsset = mongoose.model('AudioAsset', audioAssetSchema);
