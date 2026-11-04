# Performance and scaling notes

## Current measures

- Mongoose uses a configurable connection pool (`MONGODB_MAX_POOL_SIZE`, default 20; accepted 1–100), a five-second initial server-selection timeout, and the driver's reconnection behavior. `/health/ready` reports database availability without exposing connection details.
- General API requests are limited to 300 per minute per client IP, with stricter auth and selected write-route limits. The in-memory limiter is suitable for one process only; multi-instance deployments need a shared limiter.
- JSON bodies are capped at 1 MB. Audio has a separate 10 MB raw-body limit.
- Lists have route-specific limits. There is no universal pagination contract yet; review APIs and learner dashboards return small fixed windows.
- Cultural list access now batches consent, membership, and permission reads before filtering. Public API output is not cached. The service worker only caches hashed static assets and the application shell.
- Client page modules are lazy-loaded. The most recent production build emitted a 255 KB main JavaScript chunk (about 85 KB gzip), with route chunks loaded when opened. Measure real devices and network profiles before setting a performance budget.

## Index review

Models define indexes for language, variety, publication state, user-scoped progress, course sequencing/enrollment, cultural access, reports, memberships, consent, and search fields. The audit inventoried 71 explicit schema index declarations before Phase 7 changes; this is not a query-plan analysis. Review actual Atlas/server query stats and `explain('executionStats')` for frequent catalog, dictionary, assessment, community, and cultural searches before adding or removing indexes.

`AssessmentAttempt` now declares a unique `(user, assessment, attemptNumber)` index to stop concurrent retake requests from creating duplicate attempt slots. Before deploying that index on existing data, check for duplicates:

```javascript
db.assessmentattempts.aggregate([
  { $group: { _id: { user: '$user', assessment: '$assessment', attemptNumber: '$attemptNumber' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

If duplicates exist, stop and have the data owner decide how to reconcile them. Do not auto-delete attempts. Unique index creation may fail until records are reviewed.

## Deferred items

No compression middleware dependency was added because the package registry was unavailable; configure and verify compression at the trusted HTTPS proxy. There is no Redis/cache service. Do not add shared caching to private learner or restricted culture routes. Query performance has not been benchmarked against production-like data volumes.
