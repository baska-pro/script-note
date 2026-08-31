import React from 'react';
import { ArrowLeft, BarChart3, Code2, Coffee, Moon, Plus, Search, Settings, Sun, Trash2 } from 'lucide-react';
import { Theme, ViewMode } from './types';

interface Props {
  currentView: ViewMode; searchQuery: string; setSearchQuery: (q: string) => void; onAdd: () => void;
  onBack: () => void; onOpenStats: () => void; onOpenSettings: () => void; onOpenTrash: () => void;
  theme: Theme; onToggleTheme: () => void; trashCount: number;
}

export const Header: React.FC<Props> = ({ currentView, searchQuery, setSearchQuery, onAdd, onBack, onOpenStats, onOpenSettings, onOpenTrash, theme, onToggleTheme, trashCount }) => {
  const themeIcon = theme === 'light' ? <Moon className="w-4 h-4" /> : theme === 'dark' ? <Coffee className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  if (currentView !== 'list') return <header className="sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-600 text-white"><Code2 className="w-5 h-5" /></div><strong>Script Note</strong></div><button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-hover)] text-sm"><ArrowLeft className="w-4 h-4" /> Beranda</button></header>;
  return <header className="sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-color)] px-4 md:px-6 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
    <div className="flex items-center justify-between w-full sm:w-auto"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-600 text-white"><Code2 className="w-5 h-5" /></div><h1 className="font-bold text-lg">Script Note</h1></div><button onClick={onOpenSettings} className="sm:hidden p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Pengaturan"><Settings className="w-4 h-4" /></button></div>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari skrip, folder, tag, file..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-sm" /></div>
      <button onClick={onOpenStats} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Statistik"><BarChart3 className="w-4 h-4" /></button>
      <button onClick={onOpenTrash} className="relative p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Tong Sampah"><Trash2 className="w-4 h-4" />{trashCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] grid place-items-center">{trashCount > 99 ? '99+' : trashCount}</span>}</button>
      <button onClick={onToggleTheme} className="p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Ganti tema">{themeIcon}</button>
      <button onClick={onOpenSettings} className="hidden sm:block p-2 rounded-xl hover:bg-[var(--bg-hover)]" title="Pengaturan"><Settings className="w-4 h-4" /></button>
      <button onClick={onAdd} className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /><span className="hidden md:inline">Skrip Baru</span></button>
    </div>
  </header>;
};
