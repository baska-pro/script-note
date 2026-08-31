export type ScriptLanguage = 'javascript' | 'python' | 'bash' | 'html' | 'css' | 'sql' | 'json' | 'markdown' | 'text' | string;

export interface ScriptFile {
  id: string;
  name: string;
  language: ScriptLanguage;
  content: string;
}

export interface HistoryEntry {
  id: string;
  content: string;
  version: string;
  updatedAt: number;
  note: string;
  files?: ScriptFile[];
}

export interface Script {
  id: string;
  name: string;
  language: ScriptLanguage;
  type?: 'snippet' | 'project';
  content: string;
  files: ScriptFile[];
  description: string;
  folder?: string;
  tags?: string[];
  version: string;
  updateInfo: string;
  changelog: string[];
  history: HistoryEntry[];
  createdAt: number;
  updatedAt: number;
  isTrash?: boolean;
}

export type ViewMode = 'list' | 'editor' | 'viewer' | 'history' | 'trash';
export type Theme = 'light' | 'dark' | 'sepia';
