import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { CulturalEntry } from '../src/models/CulturalEntry.js';
import { Story } from '../src/models/Story.js';
import { ConsentRecord } from '../src/models/ConsentRecord.js';
import { ContentPermission } from '../src/models/ContentPermission.js';
import { CommunityMembership } from '../src/models/CommunityMembership.js';
import { canAccessCulturalContent } from '../src/services/culturalAccess.js';

test('cultural entry preserves Unicode and defaults to an unpublished state', async () => {
  const entry = new CulturalEntry({ title: 'देउसी–भैलो', description: 'तिहारको परम्परा', contributor: new mongoose.Types.ObjectId() });
  await entry.validate();
  assert.equal(entry.status, 'draft');
  assert.equal(entry.accessLevel, 'public');
  assert.equal(entry.verification.cultural, 'pending');
});

test('story requires a language and supports audio-only and version metadata', async () => {
  const story = new Story({ title: 'A spoken memory', language: new mongoose.Types.ObjectId(), contributor: new mongoose.Types.ObjectId(), audioOnly: true, versionLabel: 'Village version' });
  await story.validate();
  assert.equal(story.originalText, '');
  assert.equal(story.audioOnly, true);
  assert.equal(story.status, 'draft');
  await assert.rejects(new Story({ title: 'Missing language', contributor: new mongoose.Types.ObjectId() }).validate());
});

test('public retrieval requires publication checks, and restricted content needs an explicit grant', async () => {
  const originalConsent = ConsentRecord.exists;
  const originalPermission = ContentPermission.exists;
  const originalMembership = CommunityMembership.exists;
  try {
    ConsentRecord.exists = async () => true;
    ContentPermission.exists = async () => false;
    CommunityMembership.exists = async () => false;
    const verified = { _id: new mongoose.Types.ObjectId(), status: 'published', accessLevel: 'public', consentRequired: true, verification: { cultural: 'verified', permission: 'verified', source: 'verified' } };
    assert.equal(await canAccessCulturalContent(null, 'cultural-entry', verified), true);
    assert.equal(await canAccessCulturalContent(null, 'cultural-entry', { ...verified, status: 'submitted' }), false);
    assert.equal(await canAccessCulturalContent(null, 'cultural-entry', { ...verified, accessLevel: 'restricted' }), false);
  } finally {
    ConsentRecord.exists = originalConsent;
    ContentPermission.exists = originalPermission;
    CommunityMembership.exists = originalMembership;
  }
});
