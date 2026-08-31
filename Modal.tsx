import React, { useEffect, useId, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, HelpCircle, CheckCircle2, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean; onClose: () => void; title: string; message?: string; children?: React.ReactNode;
  type?: 'danger' | 'info' | 'success' | 'default'; confirmLabel?: string; onConfirm?: () => void; cancelLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, children, type='default', confirmLabel, onConfirm, cancelLabel='Batal' }) => {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { window.clearTimeout(timer); document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const icons = { danger:<AlertCircle className="w-8 h-8 text-red-500"/>, info:<HelpCircle className="w-8 h-8 text-blue-500"/>, success:<CheckCircle2 className="w-8 h-8 text-green-500"/>, default:null };
  const colors = { danger:'bg-red-600 hover:bg-red-700', info:'bg-blue-600 hover:bg-blue-700', success:'bg-green-600 hover:bg-green-700', default:'bg-slate-800 hover:bg-slate-900' };
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm md:max-w-md overflow-hidden shadow-2xl scale-in-center border border-slate-200 dark:border-slate-700">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup dialog"><X className="w-4 h-4"/></button>
        <div className="p-6"><div className="flex items-start gap-4">{type!=='default'&&<div className="shrink-0">{icons[type]}</div>}<div className="flex-1 min-w-0 pr-4"><h3 id={titleId} className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>{message&&<p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{message}</p>}{children}</div></div></div>
        <div className="flex border-t border-slate-100 dark:border-slate-800"><button ref={cancelRef} onClick={onClose} className="flex-1 px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-r border-slate-100 dark:border-slate-800">{cancelLabel}</button>{confirmLabel&&<button onClick={onConfirm} className={`flex-1 px-6 py-4 text-sm font-bold text-white transition-all ${colors[type]}`}>{confirmLabel}</button>}</div>
      </div>
    </div>, document.body);
};
