import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Cloud, Download, Info, Layers, Loader2, LogOut, Upload } from 'lucide-react';
import { EditorView } from './EditorView';
import { EmptyState } from './EmptyState';
import { Header } from './Header';
import { Modal } from './Modal';
import { ScriptCard } from './ScriptCard';
import { TrashView } from './TrashView';
import { handleDownload } from './fileHelpers';
import { parseBackup, serializeBackup, STORAGE_KEY } from './scriptData';
import { githubService } from './services/githubService';
import { Script, Theme, ViewMode } from './types';
import { useScripts } from './useScripts';

const App: React.FC = () => {
  const store = useScripts();
  const { scripts, filteredScripts, trashedScripts, searchQuery, setSearchQuery } = store;
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('script_note_theme');
    return saved === 'dark' || saved === 'sepia' || saved === 'light' ? saved : 'light';
  });

  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem('sn_gh_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('sn_gist_id') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [scriptToDownload, setScriptToDownload] = useState<Script | null>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<{ count: number; filename: string; data: Script[] } | null>(null);
  const [showCloudBackupConfirm, setShowCloudBackupConfirm] = useState(false);
  const [showCloudRestoreConfirm, setShowCloudRestoreConfirm] = useState(false);
  const [cloudPreview, setCloudPreview] = useState<{ count: number; date?: string; data?: Script[] } | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const activeScript = scripts.find(s => !s.isTrash && s.id === selectedScriptId) || null;

  useEffect(() => {
    localStorage.setItem('script_note_theme', theme);
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'sepia' : 'light');
  const openScript = (id: string, view: 'editor' | 'viewer' | 'history') => {
    setSelectedScriptId(id); setCurrentView(view); setIsDirty(false);
  };
  const handleAddNew = () => openScript(store.addScript(), 'editor');
  const setViewMode = (mode: ViewMode, force = false) => {
    if (!force && isDirty && mode === 'list') { setShowUnsavedModal(true); return; }
    setCurrentView(mode); if (mode === 'list') setIsDirty(false);
  };
  const forceGoBack = () => {
    setCurrentView('list'); setSelectedScriptId(null); setIsDirty(false); setShowUnsavedModal(false);
  };
  const confirmDelete = () => {
    if (!deleteTargetId) return;
    store.deleteScript(deleteTargetId);
    if (selectedScriptId === deleteTargetId) forceGoBack();
    setDeleteTargetId(null);
  };

  const active = scripts.filter(s => !s.isTrash);
  const stats = {
    totalScripts: active.length,
    totalLines: active.reduce((acc, s) => acc + s.files.reduce((sum, f) => sum + (f.content ? f.content.split('\n').length : 0), 0), 0),
    totalChars: active.reduce((acc, s) => acc + s.files.reduce((sum, f) => sum + f.content.length, 0), 0),
    byLang: active.reduce((acc, s) => { const lang = s.language || 'other'; acc[lang] = (acc[lang] || 0) + 1; return acc; }, {} as Record<string, number>),
  };

  const saveGithubToken = (token: string) => { setGithubToken(token); sessionStorage.setItem('sn_gh_token', token); };
  const clearGithubToken = () => {
    setGithubToken(''); sessionStorage.removeItem('sn_gh_token'); setSyncStatus('idle'); setSyncMessage('Token dihapus dari sesi browser.');
  };
  const performBackup = () => {
    const blob = new Blob([serializeBackup(scripts)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `script_note_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0); setShowBackupConfirm(false);
  };
  const handleRestoreFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('File backup terlalu besar (maksimal 20 MB).'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try { const data = parseBackup(String(e.target?.result || '')); setImportPreview({ count: data.length, filename: file.name, data }); setShowSettings(false); }
      catch (error) { alert(`Gagal membaca backup: ${error instanceof Error ? error.message : 'format tidak valid'}`); }
    };
    reader.readAsText(file); event.target.value = '';
  };
  const replaceLocalData = (data?: Script[]) => {
    if (!data) return; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); window.location.reload();
  };
  const executeCloudBackup = async () => {
    setShowCloudBackupConfirm(false); setShowSettings(true); setSyncStatus('loading'); setSyncMessage('Mengunggah ke GitHub Gist...');
    try {
      const result = await githubService.backupToGist(githubToken, scripts, gistId);
      setGistId(result.id); localStorage.setItem('sn_gist_id', result.id); setSyncStatus('success');
      setSyncMessage(`Backup berhasil • ${new Date(result.updatedAt).toLocaleString('id-ID')} • Gist ${result.id.slice(0, 6)}...`);
    } catch (error) { setSyncStatus('error'); setSyncMessage(error instanceof Error ? error.message : 'Gagal backup.'); }
  };
  const prepareCloudRestore = async () => {
    if (!githubToken) { setSyncStatus('error'); setSyncMessage('Token wajib diisi.'); return; }
    setSyncStatus('loading'); setSyncMessage('Mencari data backup...');
    try {
      const result = await githubService.restoreFromGist(githubToken, gistId);
      setGistId(result.id); localStorage.setItem('sn_gist_id', result.id);
      setCloudPreview({ count: result.scripts.length, date: result.updatedAt, data: result.scripts });
      setSyncStatus('idle'); setSyncMessage(''); setShowSettings(false); setShowCloudRestoreConfirm(true);
    } catch (error) { setSyncStatus('error'); setSyncMessage(error instanceof Error ? error.message : 'Gagal restore.'); }
  };

  const renderContent = () => {
    if (currentView === 'trash') return <TrashView scripts={trashedScripts} onRestore={store.restoreScript} onPermanentDelete={store.permanentDeleteScript} onEmptyTrash={store.emptyTrash} />;
    if (currentView === 'list') return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4">{filteredScripts.length ? filteredScripts.map(script => <ScriptCard key={script.id} script={script} onEdit={id => openScript(id, 'editor')} onView={id => openScript(id, 'viewer')} onDownload={setScriptToDownload} onDelete={setDeleteTargetId} />) : <EmptyState onAdd={handleAddNew} />}</div>;
    if (!activeScript) return <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border-color)]"><p className="text-[var(--text-muted)]">Skrip tidak ditemukan.</p><button onClick={() => setViewMode('list', true)} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold">Kembali</button></div>;
    return <EditorView script={activeScript} viewMode={currentView as 'editor' | 'viewer' | 'history'} onUpdate={(updated, history) => store.updateScript(activeScript.id, updated, history)} onToggleMode={mode => setViewMode(mode)} onBackRequest={force => setViewMode('list', force)} isDirty={isDirty} setIsDirty={setIsDirty} />;
  };

  return <div className="min-h-screen flex flex-col text-[var(--text-main)] bg-[var(--bg-app)] transition-colors">
    <Header currentView={currentView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onAdd={handleAddNew} onBack={() => setViewMode('list')} onOpenStats={() => setShowStats(true)} onOpenSettings={() => setShowSettings(true)} onOpenTrash={() => setViewMode('trash')} theme={theme} onToggleTheme={toggleTheme} trashCount={trashedScripts.length} />
    <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 overflow-x-hidden">{renderContent()}</main>
    <footer className="py-5 text-center text-[10px] md:text-xs text-[var(--text-muted)] font-semibold tracking-widest uppercase opacity-70">Script Note • Local-first • Cepat • Portabel</footer>

    <Modal isOpen={!!deleteTargetId} onClose={() => setDeleteTargetId(null)} title="Hapus Skrip" message="Skrip dipindahkan ke Tong Sampah dan masih dapat dipulihkan." type="danger" confirmLabel="Pindahkan" onConfirm={confirmDelete} />
    <Modal isOpen={showUnsavedModal} onClose={() => setShowUnsavedModal(false)} title="Perubahan Belum Disimpan" message="Keluar tanpa menyimpan perubahan?" type="danger" confirmLabel="Keluar" onConfirm={forceGoBack} />
    <Modal isOpen={!!scriptToDownload} onClose={() => setScriptToDownload(null)} title="Unduh Skrip" message={`Unduh "${scriptToDownload?.name}"?`} type="info" confirmLabel="Unduh" onConfirm={() => { if (scriptToDownload) handleDownload(scriptToDownload); setScriptToDownload(null); }} />
    <Modal isOpen={showBackupConfirm} onClose={() => setShowBackupConfirm(false)} title="Backup Data" message={`Unduh snapshot lengkap ${scripts.length} item termasuk Trash?`} type="info" confirmLabel="Unduh Backup" onConfirm={performBackup} />
    <Modal isOpen={!!importPreview} onClose={() => setImportPreview(null)} title="Restore Data Lokal" type="danger" confirmLabel="Restore & Timpa Data" onConfirm={() => replaceLocalData(importPreview?.data)}><p className="text-sm text-red-700">File <strong>{importPreview?.filename}</strong> berisi {importPreview?.count} item. Data lokal saat ini akan ditimpa.</p></Modal>
    <Modal isOpen={showCloudBackupConfirm} onClose={() => setShowCloudBackupConfirm(false)} title="Backup ke GitHub Secret Gist" type="info" confirmLabel="Backup Sekarang" onConfirm={executeCloudBackup}><p className="text-sm text-blue-700">Secret Gist bersifat unlisted, bukan encrypted private storage. Backup ini berisi {scripts.length} item.</p></Modal>
    <Modal isOpen={showCloudRestoreConfirm} onClose={() => setShowCloudRestoreConfirm(false)} title="Pulihkan dari Cloud" type="danger" confirmLabel="Restore & Timpa Data" onConfirm={() => replaceLocalData(cloudPreview?.data)}><p className="text-sm text-red-700">Ditemukan {cloudPreview?.count} item{cloudPreview?.date ? `, diperbarui ${new Date(cloudPreview.date).toLocaleString('id-ID')}` : ''}. Data lokal akan ditimpa.</p></Modal>

    <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Statistik Skrip" type="info" cancelLabel="Tutup"><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="bg-red-50 p-4 rounded-2xl"><div className="text-xs text-red-600 font-bold uppercase">Total Skrip</div><div className="text-2xl font-black text-slate-800">{stats.totalScripts}</div></div><div className="bg-slate-50 p-4 rounded-2xl"><div className="text-xs text-slate-500 font-bold uppercase">Baris Kode</div><div className="text-2xl font-black text-slate-800">{stats.totalLines.toLocaleString('id-ID')}</div><div className="text-[10px] text-slate-400">{stats.totalChars.toLocaleString('id-ID')} karakter</div></div></div><div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-xs text-slate-500 font-bold uppercase mb-3">Distribusi Bahasa</div>{Object.entries(stats.byLang).map(([lang, count]) => <div key={lang} className="flex justify-between text-sm py-1"><span className="capitalize text-slate-700">{lang}</span><span className="font-bold text-slate-600">{count}</span></div>)}</div></div></Modal>

    <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Pengaturan & Backup" cancelLabel="Tutup"><div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1"><section className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-500" /> GitHub Secret Gist</h4><label className="text-[10px] font-bold text-slate-500 uppercase">Personal Access Token</label><input type="password" value={githubToken} onChange={e => saveGithubToken(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs mt-1" placeholder="Masukkan token khusus Gist" autoComplete="off" spellCheck={false} /><p className="text-[10px] text-slate-400 mt-1">Disimpan hanya di sessionStorage. Gunakan token khusus dengan scope <code>gist</code>.</p>{githubToken && <button onClick={clearGithubToken} className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1"><LogOut className="w-3 h-3" /> Hapus token dari sesi</button>}<div className="flex gap-2 mt-3"><button onClick={() => { if (!githubToken) return; setCloudPreview({ count: scripts.length }); setShowSettings(false); setShowCloudBackupConfirm(true); }} disabled={!githubToken || syncStatus === 'loading'} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">{syncStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Backup</button><button onClick={prepareCloudRestore} disabled={!githubToken || syncStatus === 'loading'} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">{syncStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Restore</button></div>{syncMessage && <div className={`text-[10px] mt-3 p-2 rounded border flex items-center gap-2 ${syncStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' : syncStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{syncStatus === 'success' ? <CheckCircle2 className="w-3 h-3" /> : syncStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}{syncMessage}</div>}</section><section><h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-red-500" /> Backup Lokal</h4><div className="grid grid-cols-2 gap-3"><button onClick={() => { setShowSettings(false); setShowBackupConfirm(true); }} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold flex flex-col items-center gap-2"><Download className="w-6 h-6" /> Download JSON</button><button onClick={() => restoreInputRef.current?.click()} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold flex flex-col items-center gap-2"><Upload className="w-6 h-6" /> Upload JSON</button><input type="file" ref={restoreInputRef} onChange={handleRestoreFile} className="hidden" accept="application/json,.json" /></div></section><section className="pt-4 border-t border-slate-200"><h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-red-500" /> Tentang</h4><div className="bg-red-50 p-4 rounded-xl text-xs text-slate-600 border border-red-100"><strong className="text-red-700 block mb-1">Script Note v1.0.0</strong>Local-first script manager dengan multi-file project, version history, backup JSON, dan Gist sync opsional.</div></section></div></Modal>
  </div>;
};

export default App;
