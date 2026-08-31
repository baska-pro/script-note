import { Script, ScriptFile, ScriptLanguage } from './types';

export const STORAGE_KEY = 'script_vault_data';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupEnvelope {
  schemaVersion: number;
  app: 'Script Note';
  exportedAt: string;
  scripts: Script[];
}

export const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const languageFromFilename = (filename: string): ScriptLanguage => {
  const ext = filename.split('.').pop()?.trim().toLowerCase() || '';
  const map: Record<string, ScriptLanguage> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', py: 'python', html: 'html', htm: 'html',
    css: 'css', json: 'json', md: 'markdown', markdown: 'markdown', sh: 'bash',
    bash: 'bash', sql: 'sql', txt: 'text', yml: 'yaml', yaml: 'yaml',
  };
  return map[ext] || (ext && /^[a-z0-9+#.-]{1,20}$/i.test(ext) ? ext : 'text');
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asTimestamp = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

const normalizeFile = (raw: unknown, fallbackLanguage: ScriptLanguage, fallbackContent = ''): ScriptFile => {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    id: asString(obj.id) || createId(),
    name: asString(obj.name, 'main').slice(0, 200) || 'main',
    language: asString(obj.language, String(fallbackLanguage || 'text')) || 'text',
    content: asString(obj.content, fallbackContent),
  };
};

export const normalizeScript = (raw: unknown): Script => {
  if (!raw || typeof raw !== 'object') throw new Error('Entri script bukan object.');
  const obj = raw as Record<string, unknown>;
  const now = Date.now();
  const language = asString(obj.language, 'javascript') || 'javascript';
  const legacyContent = asString(obj.content);
  const rawFiles = Array.isArray(obj.files) ? obj.files : [];
  const files = rawFiles.length > 0
    ? rawFiles.map(file => normalizeFile(file, language, legacyContent))
    : [normalizeFile(null, language, legacyContent)];

  const history = Array.isArray(obj.history) ? obj.history.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const h = item as Record<string, unknown>;
    const historyFiles = Array.isArray(h.files)
      ? h.files.map(file => normalizeFile(file, language))
      : undefined;
    return [{
      id: asString(h.id) || createId(),
      content: asString(h.content),
      version: asString(h.version, '1.0.0') || '1.0.0',
      updatedAt: asTimestamp(h.updatedAt, now),
      note: asString(h.note, 'Version archived'),
      files: historyFiles,
    }];
  }) : [];

  const tags = Array.isArray(obj.tags)
    ? [...new Set(obj.tags.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean))].slice(0, 50)
    : [];

  return {
    id: asString(obj.id) || createId(),
    name: asString(obj.name, 'Untitled Script').trim().slice(0, 200) || 'Untitled Script',
    language: files[0]?.language || language,
    type: obj.type === 'project' || files.length > 1 ? 'project' : 'snippet',
    content: files[0]?.content || '',
    files,
    description: asString(obj.description).slice(0, 10_000),
    folder: asString(obj.folder).slice(0, 500),
    tags,
    version: asString(obj.version, '1.0.0') || '1.0.0',
    updateInfo: asString(obj.updateInfo, 'Initial version').slice(0, 2_000),
    changelog: Array.isArray(obj.changelog)
      ? obj.changelog.filter((v): v is string => typeof v === 'string').slice(0, 500)
      : [],
    history,
    createdAt: asTimestamp(obj.createdAt, now),
    updatedAt: asTimestamp(obj.updatedAt, now),
    isTrash: Boolean(obj.isTrash),
  };
};

export const normalizeScripts = (raw: unknown): Script[] => {
  if (!Array.isArray(raw)) throw new Error('Data backup tidak berisi array script.');
  if (raw.length > 10_000) throw new Error('Backup terlalu besar (maksimal 10.000 script).');
  return raw.map((item, index) => {
    try { return normalizeScript(item); }
    catch (error) { throw new Error(`Script ke-${index + 1} tidak valid: ${(error as Error).message}`); }
  });
};

export const parseBackup = (text: string): Script[] => {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) return normalizeScripts(parsed); // legacy backup
  if (!parsed || typeof parsed !== 'object') throw new Error('Format backup tidak valid.');
  const envelope = parsed as Partial<BackupEnvelope>;
  if (!Array.isArray(envelope.scripts)) throw new Error('Field scripts tidak ditemukan.');
  return normalizeScripts(envelope.scripts);
};

export const serializeBackup = (scripts: Script[]): string => JSON.stringify({
  schemaVersion: BACKUP_SCHEMA_VERSION,
  app: 'Script Note',
  exportedAt: new Date().toISOString(),
  scripts,
} satisfies BackupEnvelope, null, 2);
