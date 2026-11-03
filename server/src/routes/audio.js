import { Router } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import { AudioAsset } from '../models/AudioAsset.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { audioStorage, inspectAudio } from '../storage/audioStorage.js';

const router = Router();
const reviewerRoles = ['superAdmin', 'reviewer', 'languageAdmin', 'languageExpert'];
const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4'];

router.post('/', requireAuth, requireRoles('superAdmin', 'languageAdmin', 'languageExpert', 'reviewer'), express.raw({ type: allowedMimes, limit: '10mb' }), async (req, res, next) => {
  let storageKey;
  try {
    if (!Buffer.isBuffer(req.body)) return res.status(415).json({ message: 'Send an audio file using a supported audio content type.' });
    const inspected = inspectAudio(req.body, req.headers['content-type']);
    if (!inspected) return res.status(415).json({ message: 'The audio file format does not match its content type or is unsupported.' });
    if (req.headers['x-recording-consent'] !== 'confirmed') return res.status(400).json({ message: 'Confirm that the speaker gave permission for this recording to be used.' });
    const attribution = String(req.headers['x-audio-attribution'] || '').trim().slice(0, 300);
    if (!attribution) return res.status(400).json({ message: 'Add an attribution for the recording.' });
    const durationSeconds = req.headers['x-audio-duration-seconds'] === undefined ? null : Number(req.headers['x-audio-duration-seconds']);
    if (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 120)) return res.status(400).json({ message: 'Audio duration must be between 0 and 120 seconds.' });
    storageKey = await audioStorage.put(req.body, inspected.format);
    const asset = await AudioAsset.create({ storageKey, format: inspected.format, mimeType: inspected.mime, byteSize: req.body.length, durationSeconds, attribution, consentRecorded: true, speakerLabel: String(req.headers['x-speaker-label'] || '').slice(0, 100), source: String(req.headers['x-audio-source'] || '').slice(0, 500), verification: { status: 'pending' }, status: 'pending', createdBy: req.user._id });
    return res.status(201).json({ asset: { _id: asset._id, format: asset.format, byteSize: asset.byteSize, status: asset.status, attribution: asset.attribution } });
  } catch (error) { if (storageKey) await audioStorage.remove(storageKey).catch(() => {}); return next(error); }
});

router.put('/:id/review', requireAuth, requireRoles(...reviewerRoles), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Audio record not found.' });
    const { status } = req.body || {};
    if (!['published', 'rejected'].includes(status)) return res.status(400).json({ message: 'Choose published or rejected.' });
    const asset = await AudioAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Audio record not found.' });
    if (status === 'published' && (!asset.consentRecorded || !asset.attribution)) return res.status(400).json({ message: 'Approved consent and attribution are required before publication.' });
    asset.status = status; asset.verification.status = status === 'published' ? 'verified' : 'needs-review'; asset.verification.reviewedBy = req.user._id; asset.verification.reviewedAt = new Date();
    await asset.save();
    return res.json({ asset: { _id: asset._id, format: asset.format, byteSize: asset.byteSize, status: asset.status, attribution: asset.attribution } });
  } catch (error) { return next(error); }
});

router.get('/admin', requireAuth, requireRoles(...reviewerRoles), async (req, res, next) => {
  try {
    const status = ['pending', 'published', 'rejected', 'deleted'].includes(req.query.status) ? req.query.status : 'pending';
    const assets = await AudioAsset.find({ status }).sort({ createdAt: -1 }).limit(100).select('format mimeType byteSize durationSeconds attribution consentRecorded speakerLabel source verification status createdBy createdAt').populate('createdBy', 'name username').lean();
    return res.json({ assets });
  } catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Audio not found.' });
    const asset = await AudioAsset.findOne({ _id: req.params.id, status: 'published', 'verification.status': 'verified', consentRecorded: true }).select('+storageKey');
    if (!asset) return res.status(404).json({ message: 'Audio not found.' });
    return res.sendFile(audioStorage.resolve(asset.storageKey), { headers: { 'Content-Type': asset.mimeType, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } }, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { return next(error); }
});

export default router;
