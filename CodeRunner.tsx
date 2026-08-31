import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { ScriptFile } from './types';

interface CodeRunnerProps { files: ScriptFile[]; }
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch));

export const CodeRunner: React.FC<CodeRunnerProps> = ({ files }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [key, setKey] = useState(0);
  const [showConsole, setShowConsole] = useState(true);

  const runCode = () => { setLogs([]); setKey(prev => prev + 1); };

  const generateSrcDoc = () => {
    const htmlFile = files.find(f => f.language === 'html') || files.find(f => /\.html?$/i.test(f.name));
    const cssFiles = files.filter(f => f.language === 'css' || /\.css$/i.test(f.name));
    const jsFiles = files.filter(f => ['javascript', 'js'].includes(String(f.language).toLowerCase()) || /\.(m?js|cjs)$/i.test(f.name));
    let htmlContent = htmlFile?.content || '';
    const cssContent = cssFiles.map(f => f.content).join('\n');
    const jsContent = jsFiles.map(f => f.content).join('\n');
    if (!htmlFile) {
      htmlContent = (jsFiles.length || cssFiles.length)
        ? '<div id="app"></div>'
        : `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(files[0]?.content || '')}</pre>`;
    }
    const consoleOverride = `<script>
      const safeString = (value) => { try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); } };
      const sendLog = (level, args) => parent.postMessage({__scriptNote:true,type:'console',level,message:args.map(safeString).join(' ')}, '*');
      ['log','warn','error'].forEach(level => { const original=console[level]; console[level]=(...args)=>{ original(...args); sendLog(level,args); }; });
      addEventListener('error', event => sendLog('error',[event.message]));
      addEventListener('unhandledrejection', event => sendLog('error',[event.reason]));
    <\/script>`;
    return `<!doctype html><html><head><meta charset="UTF-8"><meta name="referrer" content="no-referrer"><style>body{font-family:system-ui,sans-serif;padding:1rem;color:#1e293b;background:white;margin:0}${cssContent}</style>${consoleOverride}</head><body>${htmlContent}<script>try{${jsContent}}catch(err){console.error(err)}<\/script></body></html>`;
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { __scriptNote?: boolean; type?: string; level?: string; message?: string };
      if (!data?.__scriptNote || data.type !== 'console') return;
      const level = String(data.level || 'log').toUpperCase();
      const message = String(data.message || '');
      setLogs(prev => [...prev.slice(-499), `[${level}] ${message}`]);
      if (level === 'ERROR') setShowConsole(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-bold text-slate-300 px-2">Preview HTML/CSS/JS</span>
        <div className="flex gap-2">
          <button onClick={() => setShowConsole(v => !v)} className={`p-1.5 rounded-md ${showConsole ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`} title="Toggle console" aria-label="Toggle console"><Terminal className="w-3 h-3" /></button>
          <button onClick={runCode} className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-bold flex items-center gap-1"><Play className="w-3 h-3" /> Run</button>
          <button onClick={() => setKey(prev => prev + 1)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md" title="Reload preview" aria-label="Reload preview"><RefreshCw className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <iframe key={key} ref={iframeRef} srcDoc={generateSrcDoc()} className={`w-full bg-white ${showConsole ? 'h-[60%]' : 'h-full'}`} title="Script preview" sandbox="allow-scripts allow-modals" referrerPolicy="no-referrer" />
        {showConsole && <div className="h-[40%] bg-[#1e1e1e] border-t border-slate-700 flex flex-col">
          <div className="p-2 bg-[#252526] text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"><span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Console</span><span className="flex items-center gap-2"><button onClick={() => setLogs([])} className="hover:text-white text-[9px] bg-slate-700 px-1.5 rounded">CLEAR</button><button onClick={() => setShowConsole(false)} aria-label="Close console"><XCircle className="w-3 h-3" /></button></span></div>
          <div className="flex-1 overflow-auto p-2 font-mono text-xs space-y-1" aria-live="polite">{logs.length === 0 && <span className="text-slate-600 italic">Belum ada output.</span>}{logs.map((log,i)=><div key={`${i}-${log.slice(0,12)}`} className={`border-b border-slate-800/50 pb-0.5 break-words whitespace-pre-wrap ${log.startsWith('[ERROR]')?'text-red-400':log.startsWith('[WARN]')?'text-yellow-400':'text-slate-300'}`}>{log}</div>)}</div>
        </div>}
      </div>
    </div>
  );
};
