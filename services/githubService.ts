import { Script } from '../types';
import { parseBackup, serializeBackup } from '../scriptData';

const GIST_FILENAME = 'script-note-backup.json';
const GIST_DESCRIPTION = 'Script Note backup (auto-generated)';
const API_VERSION = '2022-11-28';
const MAX_BACKUP_BYTES = 8 * 1024 * 1024;

interface GistFile {
  filename?: string;
  content?: string;
  raw_url?: string;
  truncated?: boolean;
}
interface GistResponse {
  id: string;
  updated_at: string;
  files: Record<string, GistFile>;
}

const headers = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token.trim()}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': API_VERSION,
  'Content-Type': 'application/json',
});

const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<Response> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { window.clearTimeout(timer); }
};

const githubError = async (response: Response, fallback: string): Promise<Error> => {
  let detail = '';
  try {
    const body = await response.json() as { message?: string };
    detail = body.message ? ` ${body.message}` : '';
  } catch { /* ignore non-JSON errors */ }
  return new Error(`${fallback} (HTTP ${response.status}).${detail}`);
};

const readBackupFile = async (file: GistFile): Promise<string> => {
  if (!file.truncated && typeof file.content === 'string') return file.content;
  if (!file.raw_url) throw new Error('Isi backup Gist tidak tersedia.');
  const response = await fetchWithTimeout(file.raw_url, { headers: { Accept: 'text/plain' } });
  if (!response.ok) throw await githubError(response, 'Gagal mengunduh isi backup Gist');
  return response.text();
};

export const githubService = {
  validateToken: async (token: string): Promise<boolean> => {
    if (!token.trim()) return false;
    try {
      const response = await fetchWithTimeout('https://api.github.com/user', { headers: headers(token) });
      return response.ok;
    } catch { return false; }
  },

  backupToGist: async (
    token: string,
    scripts: Script[],
    existingGistId?: string | null,
  ): Promise<{ id: string; updatedAt: string }> => {
    const content = serializeBackup(scripts);
    if (new Blob([content]).size > MAX_BACKUP_BYTES) {
      throw new Error('Backup terlalu besar untuk sinkronisasi Gist (maksimal sekitar 8 MB). Gunakan backup JSON lokal.');
    }
    const body = JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content } },
    });

    if (existingGistId) {
      const response = await fetchWithTimeout(`https://api.github.com/gists/${encodeURIComponent(existingGistId)}`, {
        method: 'PATCH', headers: headers(token), body,
      });
      if (response.ok) {
        const data = await response.json() as GistResponse;
        return { id: data.id, updatedAt: data.updated_at };
      }
      if (response.status !== 404) throw await githubError(response, 'Gagal memperbarui Gist');
    }

    const response = await fetchWithTimeout('https://api.github.com/gists', {
      method: 'POST', headers: headers(token), body,
    });
    if (!response.ok) throw await githubError(response, 'Gagal membuat Gist');
    const data = await response.json() as GistResponse;
    return { id: data.id, updatedAt: data.updated_at };
  },

  restoreFromGist: async (
    token: string,
    knownGistId?: string | null,
  ): Promise<{ scripts: Script[]; id: string; updatedAt: string }> => {
    let targetId = knownGistId?.trim() || '';
    if (!targetId) {
      const response = await fetchWithTimeout('https://api.github.com/gists?per_page=100', { headers: headers(token) });
      if (!response.ok) throw await githubError(response, 'Gagal mengambil daftar Gist');
      const gists = await response.json() as GistResponse[];
      targetId = gists.find(g => g.files?.[GIST_FILENAME])?.id || '';
      if (!targetId) throw new Error(`Backup '${GIST_FILENAME}' tidak ditemukan pada Gist akun ini.`);
    }

    const response = await fetchWithTimeout(`https://api.github.com/gists/${encodeURIComponent(targetId)}`, { headers: headers(token) });
    if (!response.ok) throw await githubError(response, 'Gagal mengunduh Gist');
    const data = await response.json() as GistResponse;
    const file = data.files?.[GIST_FILENAME];
    if (!file) throw new Error(`File '${GIST_FILENAME}' tidak ditemukan dalam Gist.`);
    const text = await readBackupFile(file);
    return { scripts: parseBackup(text), id: data.id, updatedAt: data.updated_at };
  },
};
