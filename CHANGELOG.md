# Changelog

## 1.0.0 - 2026-08-31

### Added
- Local-first script/snippet manager with multi-file projects.
- Search, folder/tag organization, history snapshots, trash, JSON backup/restore.
- Sandboxed HTML/CSS/JavaScript preview with console capture.
- Optional GitHub Secret Gist backup and restore.
- Light, dark, and sepia themes.

### Fixed / Hardened
- Fixed startup persistence bug that could overwrite existing local data with an empty array.
- Fixed editor losing the active script when its name no longer matched the list search.
- Fixed version publishing reverting freshly edited metadata.
- Fixed fresh-device Gist restore not remembering the discovered Gist ID.
- Added strict backup normalization and legacy-backup compatibility.
- GitHub token moved from persistent localStorage to sessionStorage.
- Removed unused Gemini API environment injection and AI Studio boilerplate.
- Removed runtime Tailwind CDN/import map; dependencies are now bundled by Vite.
- Added file-size guards and safer code-runner message handling.
- Added accessible modal keyboard/overlay behavior and reduced-motion support.
