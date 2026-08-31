# Script Note v1.0.0

Initial public release of Script Note, a local-first script and code snippet manager.

## Highlights
- Multi-file projects, folders, tags, descriptions, versions, changelog and history.
- Search and responsive editor with syntax highlighting.
- Sandboxed HTML/CSS/JavaScript preview with console capture.
- Trash and recovery workflow.
- Versioned JSON backup/restore with legacy compatibility.
- Optional GitHub Secret Gist sync.
- Light, dark and sepia themes.

## Reliability and security improvements
- Prevented startup data loss caused by an empty initial-state write.
- Fixed active editor disappearing after search-sensitive metadata edits.
- Fixed version publishing reverting metadata changes.
- GitHub token is session-only instead of persisted in localStorage.
- Removed unused Gemini key injection and third-party runtime Tailwind JavaScript.
- Added backup validation, safer Gist error handling and sandbox message filtering.

See `CHANGELOG.md` for details.
