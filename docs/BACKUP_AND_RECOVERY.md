# Backup and recovery

## Scope

MongoDB backups do not include `server/storage/audio/`. The current audio adapter writes files to the API host's local disk. Back up that directory through a separate encrypted storage process or do not use it for production material until a durable private media store is installed. Keep database and media backups under the same access, retention, and deletion policy.

## Manual database backup (PowerShell)

Install MongoDB Database Tools, load the production `MONGODB_URI` from a secret manager into the current PowerShell process, and write the archive to an encrypted directory outside the repository:

```powershell
$backupPath = 'D:\secure-backups\matribhasha-2026-11-04.archive.gz'
mongodump --uri="$env:MONGODB_URI" --archive="$backupPath" --gzip
```

Restrict the backup directory to the database operators. Transfer copies over encrypted transport to a separately controlled backup location. Never put dumps under the workspace, web root, Git, or public object storage.

## Verification and restore drill

First inspect an archive without writing data:

```powershell
mongorestore --uri="$env:RESTORE_MONGODB_URI" --archive="$backupPath" --gzip --dryRun --verbose
```

For an actual recovery exercise, use a disposable isolated MongoDB database and rewrite the source namespace to the restore-check database; do not target production:

```powershell
mongorestore --uri="$env:RESTORE_MONGODB_URI" --archive="$backupPath" --gzip --nsFrom='matribhasha.*' --nsTo='matribhasha_restore_check.*'
```

Verify collection counts, representative language/course records, ownership-scoped learner records, consent records, and indexes in the isolated target. Record the archive checksum and restore duration. A dry run checks archive readability; only an isolated real restore tests recoverability. Avoid `--drop` unless the operator has independently confirmed the target database and explicitly intends replacement.

MongoDB documents compressed archive backups through `mongodump --archive --gzip` and matching `mongorestore --archive --gzip`; the restore tool also supports `--dryRun`. See [mongodump options](https://www.mongodb.com/docs/database-tools/mongodump/) and [mongorestore options](https://www.mongodb.com/docs/database-tools/mongorestore/).

## Retention and recovery objectives

Suggested starting policy: daily backups retained 14 days, weekly backups retained 8 weeks, monthly backups retained 12 months, encrypted and stored separately from the database account. Adjust to community consent, legal obligations, storage capacity, and deletion requests. Proposed objectives for planning are RPO 24 hours and RTO 4 hours; these are **not measured or guaranteed** until scheduled backups, media coverage, and recurring restore drills are configured.

Automated scheduling, off-site storage, backup encryption key management, monitoring, and restore exercises are not configured by this repository.
