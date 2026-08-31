import { useMemo, useState, useEffect } from 'react';
import { Script, HistoryEntry } from './types';
import { createId, normalizeScripts, STORAGE_KEY } from './scriptData';

const loadInitialScripts = (): Script[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeScripts(JSON.parse(saved)) : [];
  } catch (error) {
    console.error('Failed to load Script Note data', error);
    return [];
  }
};

export const useScripts = () => {
  const [scripts, setScripts] = useState<Script[]>(loadInitialScripts);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
    } catch (error) {
      console.error('Failed to persist Script Note data', error);
    }
  }, [scripts]);

  const filteredScripts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scripts.filter(s => !s.isTrash && (!q || (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q) ||
      (s.folder || '').toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
      s.files.some(f => f.name.toLowerCase().includes(q))
    ))).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [scripts, searchQuery]);

  const trashedScripts = useMemo(() =>
    scripts.filter(s => s.isTrash).sort((a, b) => b.updatedAt - a.updatedAt), [scripts]);

  const addScript = (initialData?: Partial<Script>) => {
    const now = Date.now();
    const id = createId();
    const language = initialData?.language || 'javascript';
    const content = initialData?.content || '';
    const fileId = createId();
    const newScript: Script = {
      id,
      name: initialData?.name || 'Untitled Script',
      language,
      type: 'snippet',
      content,
      files: [{ id: fileId, name: 'main', language, content }],
      description: initialData?.description || '',
      folder: initialData?.folder || '',
      tags: initialData?.tags || [],
      version: initialData?.version || '1.0.0',
      updateInfo: 'Initial version',
      changelog: ['Created script'],
      history: [],
      createdAt: now,
      updatedAt: now,
      isTrash: false,
    };
    setScripts(prev => [...prev, newScript]);
    return id;
  };

  const updateScript = (id: string, updated: Partial<Script>, saveToHistory = false) => {
    setScripts(prev => prev.map(s => {
      if (s.id !== id) return s;
      let history = [...s.history];
      if (saveToHistory) {
        const entry: HistoryEntry = {
          id: createId(),
          content: s.content,
          version: s.version,
          updatedAt: s.updatedAt,
          note: s.updateInfo || 'Version archived',
          files: s.files.map(file => ({ ...file })),
        };
        history = [entry, ...history].slice(0, 200);
      }
      const nextFiles = updated.files || s.files;
      return {
        ...s,
        ...updated,
        type: nextFiles.length > 1 ? 'project' : 'snippet',
        content: nextFiles[0]?.content ?? updated.content ?? s.content,
        language: nextFiles[0]?.language ?? updated.language ?? s.language,
        history,
        updatedAt: Date.now(),
      };
    }));
  };

  const deleteScript = (id: string) => setScripts(prev => prev.map(s =>
    s.id === id ? { ...s, isTrash: true, updatedAt: Date.now() } : s));
  const restoreScript = (id: string) => setScripts(prev => prev.map(s =>
    s.id === id ? { ...s, isTrash: false, updatedAt: Date.now() } : s));
  const permanentDeleteScript = (id: string) => setScripts(prev => prev.filter(s => s.id !== id));
  const emptyTrash = () => setScripts(prev => prev.filter(s => !s.isTrash));

  return {
    scripts, filteredScripts, trashedScripts, searchQuery, setSearchQuery,
    addScript, updateScript, deleteScript, restoreScript, permanentDeleteScript,
    emptyTrash, setScripts,
  };
};
