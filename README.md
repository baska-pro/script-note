# Script Note

[![CI](https://github.com/baska-pro/script-note/actions/workflows/ci.yml/badge.svg)](https://github.com/baska-pro/script-note/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/baska-pro/script-note?style=flat-square)](https://github.com/baska-pro/script-note/releases/latest)
[![License: Baska-Pro Personal Use](https://img.shields.io/badge/License-Baska--Pro%20Personal%20Use%201.0-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)

**Script Note v1.0.0** adalah manajer script dan code snippet **local-first** untuk browser. Data utama disimpan di perangkat, dengan dukungan multi-file project, riwayat versi, trash, backup JSON, syntax highlighting, preview HTML/CSS/JavaScript terisolasi, serta sinkronisasi GitHub Secret Gist secara opsional.

## Fitur

- Local-first: tidak memerlukan akun atau server untuk fungsi utama.
- Script/snippet dan multi-file project.
- Folder, tags, deskripsi, versi semver, changelog, dan history snapshot.
- Pencarian berdasarkan nama, bahasa, folder, tag, dan nama file.
- Editor responsif dengan syntax highlighting dan pencarian dalam file.
- Preview HTML/CSS/JavaScript dalam sandboxed iframe + console output.
- Soft delete, restore, permanent delete, dan empty trash.
- Backup/restore JSON dengan validasi dan kompatibilitas backup format lama.
- Optional GitHub Secret Gist backup/restore.
- Tema Light, Dark, dan Sepia.
- Responsive untuk desktop dan mobile.

## Privasi & keamanan

Data script utama tersimpan di `localStorage` browser. GitHub token **tidak disimpan permanen**; token hanya berada di `sessionStorage` dan hilang saat sesi browser ditutup. Secret Gist bersifat **unlisted, bukan encrypted/private storage**—siapa pun yang memiliki URL Gist dapat mengaksesnya. Jangan sinkronkan secret, password, private key, token, atau source code sensitif ke Gist.

Preview code menggunakan iframe dengan `sandbox="allow-scripts allow-modals"` tanpa `allow-same-origin`, sehingga code preview tidak mendapat origin yang sama dengan aplikasi.

## Menjalankan lokal

Persyaratan: Node.js 20.19+.

```bash
git clone https://github.com/baska-pro/script-note.git
cd script-note
npm install
npm run dev
```

Build produksi:

```bash
npm run typecheck
npm run build
npm run preview
```

## GitHub Gist Sync

Gunakan GitHub Personal Access Token khusus dengan izin `gist`. Masukkan token melalui **Pengaturan → Cloud Sync**. Token hanya disimpan untuk sesi browser aktif.

Saat restore dari perangkat baru, Script Note mencari `script-note-backup.json` di Gist akun. ID Gist yang ditemukan kemudian disimpan lokal agar backup berikutnya memperbarui Gist yang sama, bukan membuat duplikat.

## Penyimpanan

- `script_vault_data`: data script utama.
- `script_note_theme`: tema.
- `sn_gist_id`: ID Gist backup.
- `sn_gh_token`: token GitHub di **sessionStorage**, bukan localStorage.

Backup JSON memakai envelope dengan `schemaVersion`, `exportedAt`, dan `scripts`, tetapi restore tetap kompatibel dengan backup lama yang hanya berupa array.

## Struktur

```text
script-note/
├─ .github/workflows/ci.yml
├─ docs/
├─ services/githubService.ts
├─ App.tsx
├─ CodeRunner.tsx
├─ EditorView.tsx
├─ Header.tsx
├─ HistoryView.tsx
├─ Modal.tsx
├─ ScriptCard.tsx
├─ Sidebar.tsx
├─ TrashView.tsx
├─ scriptData.ts
├─ useScripts.ts
├─ types.ts
├─ index.tsx
├─ index.css
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ VERSION
├─ CHANGELOG.md
├─ SECURITY.md
└─ LICENSE
```

## Batasan

- Browser storage memiliki quota; lakukan backup rutin untuk koleksi besar.
- Runner hanya ditujukan untuk preview HTML/CSS/JavaScript client-side, bukan runtime Python/Bash/SQL.
- Secret Gist bukan tempat penyimpanan credential.
- Tidak ada server-side account sync bawaan.

## License

BASKA-PRO PERSONAL USE LICENSE Version 1.0. Lihat [LICENSE](LICENSE).
