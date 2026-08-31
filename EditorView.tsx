import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpCircle, Check, Copy, Download, Edit3, FileCode, History, Maximize, Minimize, MonitorPlay, Plus, Save, Search, Settings2, Trash2, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import { CodeRunner } from './CodeRunner';
import { HistoryView } from './HistoryView';
import { Modal } from './Modal';
import { Sidebar } from './Sidebar';
import { handleCopy, handleDownload } from './fileHelpers';
import { createId, languageFromFilename } from './scriptData';
import { HistoryEntry, Script, ScriptFile } from './types';

interface Props {
  script: Script;
  viewMode: 'editor' | 'viewer' | 'history';
  onUpdate: (updated: Partial<Script>, saveToHistory?: boolean) => void;
  onToggleMode: (mode: 'editor' | 'viewer' | 'history') => void;
  onBackRequest: (force?: boolean) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const languages = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'markdown', 'yaml', 'text'];
const prismLanguage = (lang: string) => ({ html: 'markup', typescript: 'javascript', yaml: 'clike' }[lang] || lang || 'clike');

export const EditorView: React.FC<Props> = ({ script, viewMode, onUpdate, onToggleMode, onBackRequest, isDirty, setIsDirty }) => {
  const [draft, setDraft] = useState<Script>(() => structuredClone(script));
  const [activeFileId, setActiveFileId] = useState(script.files[0]?.id || '');
  const [showMeta, setShowMeta] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [nextVersion, setNextVersion] = useState(script.version);
  const [releaseNote, setReleaseNote] = useState('');
  const [message, setMessage] = useState<{ title: string; message: string; type: 'danger' | 'info' | 'success' } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const highlighted = useRef<HTMLElement>(null);

  useEffect(() => {
    setDraft(structuredClone(script));
    setActiveFileId(script.files[0]?.id || '');
  }, [script.id]);

  const activeFile = draft.files.find(f => f.id === activeFileId) || draft.files[0];
  const isEditor = viewMode === 'editor';
  const isHistory = viewMode === 'history';

  useEffect(() => {
    if (!isEditor && !isHistory && highlighted.current && activeFile) {
      highlighted.current.textContent = activeFile.content;
      try { Prism.highlightElement(highlighted.current); } catch { /* custom language */ }
    }
  }, [activeFile?.content, activeFile?.language, isEditor, isHistory]);

  const editDraft = (patch: Partial<Script>) => { setDraft(prev => ({ ...prev, ...patch })); setIsDirty(true); };
  const editFile = (patch: Partial<ScriptFile>) => {
    setDraft(prev => ({ ...prev, files: prev.files.map(f => f.id === activeFileId ? { ...f, ...patch } : f) }));
    setIsDirty(true);
  };

  const matches = useMemo(() => {
    if (!query.trim() || !activeFile) return 0;
    const needle = query.toLowerCase(); let count = 0; let from = 0; const hay = activeFile.content.toLowerCase();
    while ((from = hay.indexOf(needle, from)) !== -1) { count += 1; from += Math.max(needle.length, 1); }
    return count;
  }, [query, activeFile?.content]);

  const addFile = () => {
    const file: ScriptFile = { id: createId(), name: `file-${draft.files.length + 1}`, language: 'javascript', content: '' };
    setDraft(prev => ({ ...prev, files: [...prev.files, file] })); setActiveFileId(file.id); setIsDirty(true);
  };
  const deleteFile = () => {
    if (draft.files.length <= 1) return setMessage({ title: 'Tidak Bisa Dihapus', message: 'Minimal satu file harus ada.', type: 'info' });
    const files = draft.files.filter(f => f.id !== activeFileId); setDraft(prev => ({ ...prev, files })); setActiveFileId(files[0].id); setIsDirty(true);
  };
  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMessage({ title: 'File Terlalu Besar', message: 'Maksimal 5 MB per file.', type: 'danger' });
    const reader = new FileReader();
    reader.onload = e => editFile({ name: file.name.replace(/\.[^.]+$/, '') || 'main', language: languageFromFilename(file.name), content: String(e.target?.result || '') });
    reader.readAsText(file);
  };
  const save = () => {
    onUpdate({ ...draft, content: draft.files[0]?.content || '', language: draft.files[0]?.language || 'text' });
    setIsDirty(false); setShowSave(false); onBackRequest(true);
  };
  const openRelease = () => {
    const m = draft.version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    setNextVersion(m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : draft.version); setReleaseNote(''); setShowRelease(true);
  };
  const publishVersion = () => {
    const version = nextVersion.trim();
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) return setMessage({ title: 'Versi Tidak Valid', message: 'Gunakan format semver, misalnya 1.2.3.', type: 'danger' });
    if (version === draft.version) return setMessage({ title: 'Versi Belum Berubah', message: 'Naikkan nomor versi sebelum membuat snapshot.', type: 'info' });
    onUpdate({ ...draft, version, updateInfo: releaseNote.trim() || `Pembaruan ke v${version}`, content: draft.files[0]?.content || '', language: draft.files[0]?.language || 'text' }, true);
    setIsDirty(false); setShowRelease(false); onBackRequest(true);
  };
  const restoreHistory = (entry: HistoryEntry) => {
    const files = entry.files?.length ? entry.files.map(f => ({ ...f })) : draft.files.map(f => f.id === activeFileId ? { ...f, content: entry.content } : f);
    setDraft(prev => ({ ...prev, files, updateInfo: `Restored from v${entry.version}` })); setActiveFileId(files[0]?.id || ''); setIsDirty(true); onToggleMode('editor');
  };
  const deleteHistory = (id: string) => { const history = draft.history.filter(h => h.id !== id); setDraft(prev => ({ ...prev, history })); onUpdate({ history }); };
  const downloadActive = () => {
    if (!activeFile) return; handleDownload({ ...draft, name: activeFile.name, language: activeFile.language, content: activeFile.content }); setShowDownload(false);
  };

  if (!activeFile) return null;
  const frame = fullScreen ? 'fixed inset-0 z-[100] bg-[var(--bg-card)] flex flex-col' : 'bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-xl overflow-hidden flex flex-col h-[calc(100vh-150px)] min-h-[560px]';

  return <>
    <div className={frame}>
      <div className="shrink-0 bg-[var(--bg-app)] border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => onBackRequest()} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Kembali"><ArrowLeft className="w-4 h-4" /></button>
            {isEditor ? <input value={draft.name} onChange={e => editDraft({ name: e.target.value })} className="min-w-0 max-w-56 bg-transparent font-bold outline-none border-b border-transparent focus:border-red-500" /> : <strong className="truncate">{draft.name}</strong>}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">v{draft.version}</span>
            {isDirty && <span className="text-[10px] text-amber-600 font-bold">Belum disimpan</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isHistory && <button onClick={() => setShowRunner(v => !v)} className={`p-2 rounded-xl ${showRunner ? 'bg-green-600 text-white' : 'hover:bg-[var(--bg-hover)]'}`} title="Preview"><MonitorPlay className="w-4 h-4" /></button>}
            <button onClick={() => setFontSize(v => Math.max(10, v - 1))} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Perkecil font"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setFontSize(v => Math.min(30, v + 1))} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Perbesar font"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setFullScreen(v => !v)} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Fullscreen">{fullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}</button>
            {!fullScreen && <button onClick={() => setShowMeta(v => !v)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-hover)]"><Settings2 className="w-4 h-4" /></button>}
            {isEditor ? <><button onClick={() => setShowSave(true)} className="p-2 rounded-xl bg-slate-800 text-white" title="Simpan"><Save className="w-4 h-4" /></button><button onClick={openRelease} className="p-2 rounded-xl bg-red-600 text-white" title="Terbitkan versi"><ArrowUpCircle className="w-4 h-4" /></button></> : !isHistory && <button onClick={() => onToggleMode('editor')} className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
          </div>
        </div>
        {!isHistory && <div className="flex items-center gap-1 px-2 border-t border-[var(--border-color)] overflow-x-auto no-scrollbar">
          {draft.files.map(file => <button key={file.id} onClick={() => setActiveFileId(file.id)} className={`flex items-center gap-2 px-3 py-2 min-w-[100px] text-xs border-r border-[var(--border-color)] ${file.id === activeFileId ? 'text-red-600 bg-[var(--bg-card)] border-t-2 border-t-red-600' : 'text-[var(--text-muted)]'}`}><FileCode className="w-3 h-3" /><span className="truncate">{file.name}</span></button>)}
          {isEditor && <button onClick={addFile} className="p-2" title="Tambah file"><Plus className="w-4 h-4" /></button>}
        </div>}
      </div>

      <div className="flex flex-1 min-h-0 relative">
        <div className={`flex-1 min-w-0 flex ${showRunner && !isHistory ? 'hidden md:flex md:w-1/2' : ''}`}>
          {isHistory ? <HistoryView history={draft.history} onRestore={restoreHistory} onDeleteEntry={deleteHistory} /> : <div className="flex-1 min-w-0 flex flex-col bg-[var(--bg-card)]">
            {isEditor && <div className="flex flex-wrap items-center gap-2 p-2 border-b border-[var(--border-color)] bg-[var(--bg-app)]">
              <input value={activeFile.name} onChange={e => editFile({ name: e.target.value })} className="w-32 px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]" aria-label="Nama file" />
              <select value={languages.includes(String(activeFile.language)) ? String(activeFile.language) : 'custom'} onChange={e => e.target.value !== 'custom' && editFile({ language: e.target.value })} className="px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]"><option value="custom">Custom: {activeFile.language}</option>{languages.map(x => <option key={x} value={x}>{x}</option>)}</select>
              <button onClick={() => fileInput.current?.click()} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]" title="Upload file"><Upload className="w-4 h-4" /></button><input ref={fileInput} type="file" className="hidden" onChange={uploadFile} />
              <button onClick={() => setShowDownload(true)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]" title="Download"><Download className="w-4 h-4" /></button>
              <button onClick={deleteFile} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Hapus file"><Trash2 className="w-4 h-4" /></button>
              <div className="ml-auto flex items-center gap-1"><Search className="w-3.5 h-3.5 text-[var(--text-muted)]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari dalam file" className="w-32 md:w-44 px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]" />{query && <span className="text-[10px] text-[var(--text-muted)]">{matches} hasil</span>}</div>
            </div>}
            {isEditor ? <textarea value={activeFile.content} onChange={e => editFile({ content: e.target.value })} spellCheck={false} style={{ fontSize }} className="flex-1 w-full resize-none outline-none p-5 md:p-7 code-font leading-relaxed bg-[var(--bg-card)] text-[var(--text-main)]" placeholder="Mulai tulis kode..." /> : <div className="flex-1 overflow-auto bg-[#1e1e1e] p-5 md:p-7 editor-high-contrast"><pre style={{ fontSize }}><code ref={highlighted} className={`language-${prismLanguage(String(activeFile.language))}`}>{activeFile.content || '// Kosong'}</code></pre></div>}
            <div className="px-3 py-1.5 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] flex justify-between"><span>{activeFile.language}</span><span>{activeFile.content.split('\n').length} baris • {activeFile.content.length.toLocaleString('id-ID')} karakter</span></div>
          </div>}
        </div>
        {showRunner && !isHistory && <div className="w-full md:w-1/2"><CodeRunner files={draft.files} /></div>}
        {!fullScreen && <div className="hidden lg:block w-72 shrink-0 border-l border-[var(--border-color)] overflow-y-auto"><Sidebar script={draft} isEditMode={isEditor} onUpdate={editDraft} /></div>}
        {showMeta && !fullScreen && <div className="absolute inset-0 z-40 lg:hidden bg-[var(--bg-card)] overflow-auto"><Sidebar script={draft} isEditMode={isEditor} onUpdate={editDraft} onCloseMobile={() => setShowMeta(false)} /></div>}
      </div>
    </div>

    <Modal isOpen={showSave} onClose={() => setShowSave(false)} title="Simpan Perubahan" message="Simpan perubahan ke penyimpanan lokal?" type="success" confirmLabel="Simpan & Keluar" onConfirm={save} />
    <Modal isOpen={showDownload} onClose={() => setShowDownload(false)} title="Unduh File" message={`Unduh ${activeFile.name}?`} type="info" confirmLabel="Unduh" onConfirm={downloadActive} />
    <Modal isOpen={showRelease} onClose={() => setShowRelease(false)} title="Terbitkan Versi Baru" type="info" confirmLabel="Terbitkan" onConfirm={publishVersion}><div className="space-y-3"><p className="text-xs text-blue-700">Versi lama akan disimpan sebagai snapshot History.</p><label className="block text-xs font-bold text-slate-600">Versi<input value={nextVersion} onChange={e => setNextVersion(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" /></label><label className="block text-xs font-bold text-slate-600">Catatan<input value={releaseNote} onChange={e => setReleaseNote(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-lg" placeholder="Apa yang berubah?" /></label></div></Modal>
    <Modal isOpen={!!message} onClose={() => setMessage(null)} title={message?.title || ''} message={message?.message} type={message?.type} cancelLabel="Tutup" />
  </>;
};
