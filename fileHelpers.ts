import { Script } from './types';

export const handleCopy = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy text', error);
    return false;
  }
};

const extensionMap: Record<string, string> = {
  javascript: 'js', typescript: 'ts', python: 'py', bash: 'sh', html: 'html',
  css: 'css', sql: 'sql', json: 'json', markdown: 'md', text: 'txt', yaml: 'yaml',
};
const mimeMap: Record<string, string> = {
  js: 'text/javascript', ts: 'text/plain', py: 'text/x-python', sh: 'text/x-shellscript',
  html: 'text/html', css: 'text/css', sql: 'text/plain', json: 'application/json',
  md: 'text/markdown', txt: 'text/plain', yaml: 'text/yaml',
};

const safeFilename = (name: string): string => {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/[. ]+$/g, '').slice(0, 120);
  return cleaned || 'script';
};

export const handleDownload = (script: Script) => {
  const language = String(script.language || 'text').trim().toLowerCase();
  let ext = extensionMap[language];
  if (!ext) ext = /^[a-z0-9]{1,10}$/i.test(language) ? language : 'txt';
  const blob = new Blob([script.content || ''], { type: `${mimeMap[ext] || 'text/plain'};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFilename(script.name)}.${ext}`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
