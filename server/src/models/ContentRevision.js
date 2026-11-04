import mongoose from 'mongoose';

const contentRevisionSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['category', 'character', 'pronunciation', 'vocabulary-category', 'vocabulary', 'word-meaning', 'translation', 'example-sentence', 'grammar-category', 'grammar-lesson', 'sentence-exercise', 'course', 'course-modules', 'course-lessons', 'course-assessments', 'course-listening', 'course-conversations', 'cultural-entry', 'story', 'cultural-media', 'community', 'discussion', 'comment', 'community-submission', 'contributor-profile', 'cultural-category'], required: true, index: true },
  entity: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

contentRevisionSchema.index({ entityType: 1, entity: 1, createdAt: -1 });
export const ContentRevision = mongoose.model('ContentRevision', contentRevisionSchema);
