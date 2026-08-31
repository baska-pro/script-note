# Backup and Sync

## Local backup
Use **Settings → Download JSON**. The file contains all active and trashed entries so the backup is a full snapshot.

## Restore
Restore validates and normalizes the imported scripts before replacing local data. Both v1 envelope backups and legacy raw-array backups are supported.

## GitHub Secret Gist
Cloud sync is optional. Use a dedicated token with `gist` scope. Script Note creates or updates `script-note-backup.json`.

Important: Secret Gists are unlisted, not encrypted private storage. Do not store credentials or confidential source code there.
