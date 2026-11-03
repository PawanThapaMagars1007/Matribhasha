import mongoose from 'mongoose';

const contentRevisionSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['category', 'character', 'pronunciation'], required: true, index: true },
  entity: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

contentRevisionSchema.index({ entityType: 1, entity: 1, createdAt: -1 });
export const ContentRevision = mongoose.model('ContentRevision', contentRevisionSchema);
