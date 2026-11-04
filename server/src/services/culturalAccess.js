import mongoose from 'mongoose';
import { CommunityMembership } from '../models/CommunityMembership.js';
import { ContentPermission } from '../models/ContentPermission.js';
import { ContentAccessLog } from '../models/ContentAccessLog.js';
import { ConsentRecord } from '../models/ConsentRecord.js';

const platformResearchRoles = ['superAdmin', 'reviewer', 'languageAdmin', 'languageExpert', 'culturalReviewer', 'researcher'];
const activeExpiry = () => [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }];
const storedType = (type) => type === 'cultural-media' ? 'media' : type;

export function requiredConsentScopes(type, doc) {
  if (doc.consentRequired === false) return [];
  const scopes = ['publication'];
  if (type === 'cultural-entry') scopes.push('text');
  if (type === 'story') {
    if (doc.originalText) scopes.push('text');
    if (doc.audioOnly) scopes.push('recording');
  }
  if (type === 'media' || type === 'cultural-media') scopes.push(doc.mediaType === 'audio' ? 'recording' : doc.mediaType === 'image' ? 'image' : 'video');
  return scopes;
}

export async function activeConsentScopes(type, doc) {
  const scopes = requiredConsentScopes(type, doc);
  if (!scopes.length) return true;
  const records = await ConsentRecord.find({ contentType: storedType(type), content: doc._id, scope: { $in: scopes }, status: 'active', $or: activeExpiry() }).select('scope').lean();
  return scopes.every((scope) => records.some((record) => record.scope === scope));
}

function validScopes(type, doc, activeScopes) {
  return requiredConsentScopes(type, doc).every((scope) => activeScopes.has(scope));
}

export async function publicationCleared(type, doc) {
  if (!doc) return false;
  const verification = doc.verification || {};
  if (verification.cultural !== 'verified' || verification.permission !== 'verified' || verification.source !== 'verified') return false;
  const hasText = (type === 'story' && Boolean(doc.originalText)) || (type === 'cultural-entry' && Boolean(doc.language && doc.description));
  if (hasText && verification.linguistic !== 'verified') return false;
  const scopes = requiredConsentScopes(type, doc);
  if (!scopes.length) return true;
  const records = await ConsentRecord.find({ contentType: storedType(type), content: doc._id, scope: { $in: scopes }, status: 'active', $or: activeExpiry() }).select('scope').lean();
  return validScopes(type, doc, new Set(records.map((record) => record.scope)));
}

export async function canAccessCulturalContent(user, contentType, doc, { log = false, action = 'view' } = {}) {
  if (!doc || doc.status !== 'published' || doc.accessLevel === 'not-publishable' || !await publicationCleared(contentType, doc)) return false;
  const type = storedType(contentType);
  let allowed = false;
  switch (doc.accessLevel) {
    case 'public': allowed = true; break;
    case 'registered': allowed = Boolean(user); break;
    case 'community': allowed = Boolean(user && doc.community && await CommunityMembership.exists({ user: user._id, community: doc.community, status: 'approved' })); break;
    case 'researcher':
      allowed = Boolean(user && (platformResearchRoles.includes(user.role)
        || (doc.community && await CommunityMembership.exists({ user: user._id, community: doc.community, status: 'approved', role: 'researcher' }))
        || await ContentPermission.exists({ contentType: type, content: doc._id, user: user._id, permission: { $in: ['research', 'view'] }, status: 'active', $or: activeExpiry() })));
      break;
    case 'restricted':
      if (user) allowed = Boolean(await ContentPermission.exists({ contentType: type, content: doc._id, user: user._id, permission: { $in: [action, 'view'] }, status: 'active', $or: activeExpiry() }));
      if (!allowed && doc.community && user && await CommunityMembership.exists({ user: user._id, community: doc.community, status: 'approved' })) allowed = Boolean(await ContentPermission.exists({ contentType: type, content: doc._id, community: doc.community, permission: { $in: [action, 'view'] }, status: 'active', $or: activeExpiry() }));
      break;
    default: allowed = false;
  }
  if (allowed && log && doc.accessLevel !== 'public') await ContentAccessLog.create({ contentType: type, content: doc._id, user: user?._id || null, action });
  return allowed;
}

export async function filterAccessible(user, contentType, docs, { log = false, action = 'view' } = {}) {
  if (!docs.length) return [];
  const type = storedType(contentType);
  const publishable = docs.filter((doc) => doc && doc.status === 'published' && doc.accessLevel !== 'not-publishable');
  if (!publishable.length) return [];
  const ids = publishable.map((doc) => doc._id);
  const communityIds = [...new Set(publishable.map((doc) => String(doc.community || '')).filter(Boolean))];
  const scopes = [...new Set(publishable.flatMap((doc) => requiredConsentScopes(contentType, doc)))];
  const [consents, memberships, permissions] = await Promise.all([
    scopes.length ? ConsentRecord.find({ contentType: type, content: { $in: ids }, scope: { $in: scopes }, status: 'active', $or: activeExpiry() }).select('content scope').lean() : [],
    user && communityIds.length ? CommunityMembership.find({ user: user._id, community: { $in: communityIds }, status: 'approved' }).select('community role').lean() : [],
    user ? ContentPermission.find({ contentType: type, content: { $in: ids }, status: 'active', $and: [{ $or: activeExpiry() }, { $or: [{ user: user._id }, { community: { $in: communityIds } }] }] }).select('content user community permission').lean() : [],
  ]);
  const consentByContent = new Map();
  for (const record of consents) {
    const key = String(record.content);
    if (!consentByContent.has(key)) consentByContent.set(key, new Set());
    consentByContent.get(key).add(record.scope);
  }
  const membershipRoles = new Map(memberships.map((membership) => [String(membership.community), membership.role]));
  const permissionRows = new Map();
  for (const permission of permissions) {
    const key = String(permission.content);
    if (!permissionRows.has(key)) permissionRows.set(key, []);
    permissionRows.get(key).push(permission);
  }
  const allowed = [];
  for (const doc of publishable) {
    const id = String(doc._id);
    const community = String(doc.community || '');
    if (!validScopes(contentType, doc, consentByContent.get(id) || new Set())) continue;
    let access = false;
    if (doc.accessLevel === 'public') access = true;
    else if (doc.accessLevel === 'registered') access = Boolean(user);
    else if (doc.accessLevel === 'community') access = Boolean(user && community && membershipRoles.has(community));
    else if (doc.accessLevel === 'researcher') access = Boolean(user && (platformResearchRoles.includes(user.role) || membershipRoles.get(community) === 'researcher' || (permissionRows.get(id) || []).some((permission) => String(permission.user) === String(user._id) && ['research', 'view'].includes(permission.permission))));
    else if (doc.accessLevel === 'restricted' && user) access = (permissionRows.get(id) || []).some((permission) => {
      const direct = String(permission.user || '') === String(user._id);
      const communityGrant = community && membershipRoles.has(community) && String(permission.community || '') === community;
      return (direct || communityGrant) && [action, 'view'].includes(permission.permission);
    });
    if (access) allowed.push(doc);
  }
  if (log && user) {
    const auditRows = allowed.filter((doc) => doc.accessLevel !== 'public').map((doc) => ({ contentType: type, content: doc._id, user: user._id, action }));
    if (auditRows.length) await ContentAccessLog.insertMany(auditRows, { ordered: false }).catch(() => {});
  }
  return allowed;
}

export function canModerate(user, communityId) {
  if (!user) return false;
  if (user.role === 'superAdmin') return true;
  if (!communityId) return ['moderator', 'reviewer', 'languageAdmin'].includes(user.role);
  return CommunityMembership.exists({ user: user._id, community: communityId, status: 'approved', role: { $in: ['communityAdmin', 'culturalReviewer', 'moderator'] } });
}

export function validateObjectId(id) { return mongoose.isValidObjectId(id); }
