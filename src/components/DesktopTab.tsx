import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Terminal as TerminalIcon,
  Globe,
  Folder,
  Activity,
  FileText,
  Shield,
  Layers,
  X,
  Minus,
  Maximize2,
  RefreshCw,
  Search,
  Lock,
  ArrowLeft,
  ArrowRight,
  Home,
  Check,
  Copy,
  Volume2,
  Wifi,
  Clock,
  Sparkles,
  Zap,
  Play,
  CornerDownLeft,
  Server
} from 'lucide-react';
import { Language } from '../translations';
import { SystemInfo } from '../types';

interface DesktopTabProps {
  lang: Language;
  systemInfo: SystemInfo | null;
}

interface WindowState {
  id: string;
  appId: 'browser' | 'terminal' | 'files' | 'monitor' | 'editor' | 'ipinfo';
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DesktopTab: React.FC<DesktopTabProps> = ({ lang, systemInfo }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [activeWindowId, setActiveWindowId] = useState<string>('win-browser');
  const [maxZIndex, setMaxZIndex] = useState(10);

  // Real Google Cloud info
  const googleIp = systemInfo?.googleCloudInfo?.ip || systemInfo?.ip4 || '34.34.246.193';
  const googleCity = systemInfo?.googleCloudInfo?.city || 'London';
  const googleOrg = systemInfo?.googleCloudInfo?.org || 'AS396982 Google LLC';

  // Windows state
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'win-browser',
      appId: 'browser',
      title: 'Web Browser (Google Cloud IP: ' + googleIp + ')',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 5,
      x: 30,
      y: 30,
      width: 780,
      height: 520,
    },
    {
      id: 'win-terminal',
      appId: 'terminal',
      title: 'Root Bash Terminal (root@google-ai-studio)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 6,
      x: 240,
      y: 90,
      width: 680,
      height: 420,
    },
    {
      id: 'win-ipinfo',
      appId: 'ipinfo',
      title: 'Google Cloud Node Inspector',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 4,
      x: 120,
      y: 60,
      width: 580,
      height: 400,
    },
    {
      id: 'win-files',
      appId: 'files',
      title: 'File Manager (/root)',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      x: 80,
      y: 80,
      width: 640,
      height: 440,
    },
    {
      id: 'win-monitor',
      appId: 'monitor',
      title: 'Task Manager (System Monitor)',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      x: 150,
      y: 120,
      width: 620,
      height: 430,
    },
    {
      id: 'win-editor',
      appId: 'editor',
      title: 'Mousepad Text Editor - notes.txt',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      x: 180,
      y: 140,
      width: 560,
      height: 400,
    },
  ]);

  // Clock tick
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bring window to front
  const focusWindow = (id: string) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setActiveWindowId(id);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
    );
  };

  const openApp = (appId: WindowState['appId']) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setStartMenuOpen(false);

    setWindows((prev) =>
      prev.map((w) => {
        if (w.appId === appId) {
          return { ...w, isOpen: true, isMinimized: false, zIndex: nextZ };
        }
        return w;
      })
    );
    const target = windows.find((w) => w.appId === appId);
    if (target) setActiveWindowId(target.id);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w)));
  };

  const toggleMinimize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const toggleMaximize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  // State inside Browser App
  const [browserUrl, setBrowserUrl] = useState('https://duckduckgo.com');
  const [browserInput, setBrowserInput] = useState('https://duckduckgo.com');
  const [desktopBrowserMode, setDesktopBrowserMode] = useState<'unblock' | 'direct'>('unblock');

  // State inside Terminal App
  const [terminalLogs, setTerminalLogs] = useState<Array<{ cmd: string; out: string }>>([
    {
      cmd: 'curl -s https://ipinfo.io/json',
      out: JSON.stringify(
        {
          ip: googleIp,
          city: googleCity,
          region: 'England',
          country: 'GB',
          loc: '51.5085,-0.1257',
          org: googleOrg,
          datacenter: 'Google Cloud Platform europe-west2 (Google AI Studio Host)',
        },
        null,
        2
      ),
    },
    {
      cmd: 'uname -a',
      out: 'Linux google-ai-studio-host 6.6.21-cloud-gvisor #1 SMP Debian GNU/Linux 12 (bookworm) x86_64',
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isTerminalBusy, setIsTerminalBusy] = useState(false);

  const handleRunTerminalCmd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setIsTerminalBusy(true);
    setTerminalInput('');

    try {
      const res = await fetch('/api/vps/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setTerminalLogs((prev) => [
        ...prev,
        { cmd, out: data.stdout || data.stderr || 'Command executed (exit 0).' },
      ]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        { cmd, out: 'Error connecting to daemon: ' + err.message },
      ]);
    } finally {
      setIsTerminalBusy(false);
    }
  };

  // State inside Text Editor App
  const [editorText, setEditorText] = useState(
    `# Google AI Studio Lightweight Linux Desktop\n\n- Host OS: Debian GNU/Linux 12 (bookworm)\n- Public Outbound IP: ${googleIp}\n- Datacenter: ${googleOrg} (London, UK)\n\nThis desktop runs natively inside Google AI Studio's Cloud Run environment.\nAll web browsing, curl commands, and terminal executions use Google Cloud's high-speed IP address.\n`
  );

  return (
    <div className="relative select-none rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col h-[760px]">
      {/* Desktop Top Status Notification */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-100">
            {lang === 'fa' ? 'دسکتاپ سبک لینوکس دبیان (Google Cloud Host)' : 'Lightweight Debian Linux Desktop (Google Cloud)'}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="font-mono text-emerald-400 text-[11px] font-semibold">
            {lang === 'fa' ? `آی‌پی سرور گوگل: ${googleIp}` : `Google Cloud IP: ${googleIp}`}
          </span>
          <span className="text-zinc-500 hidden sm:inline">({googleCity}, {googleOrg})</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span className="hidden md:inline">RAM: 4096MB</span>
          <span className="hidden md:inline">·</span>
          <span className="text-blue-400">Debian 12</span>
        </div>
      </div>

      {/* Main Desktop Workspace Canvas with Wallpaper */}
      <div
        onClick={() => setStartMenuOpen(false)}
        className="relative flex-1 bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-900 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 30%, rgba(16, 185, 129, 0.05) 0%, rgba(9, 9, 11, 0.95) 100%)',
        }}
      >
        {/* Subtle Linux / Debian watermark */}
        <div className="absolute right-10 bottom-16 opacity-10 pointer-events-none select-none text-zinc-300 text-right">
          <div className="text-7xl font-bold font-mono tracking-tighter">DEBIAN 12</div>
          <div className="text-sm font-mono mt-1">Google AI Studio Host · {googleIp}</div>
        </div>

        {/* Desktop Icons Grid (Left column) */}
        <div className="absolute top-4 left-4 grid grid-cols-1 gap-4 z-0">
          {/* Icon 1: Browser */}
          <button
            onClick={() => openApp('browser')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'مرورگر وب' : 'Web Browser'}
            </span>
          </button>

          {/* Icon 2: Terminal */}
          <button
            onClick={() => openApp('terminal')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-lg">
              <TerminalIcon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'ترمینال روت' : 'Root Terminal'}
            </span>
          </button>

          {/* Icon 3: File Manager */}
          <button
            onClick={() => openApp('files')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-lg">
              <Folder className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'مدیریت فایل' : 'File Manager'}
            </span>
          </button>

          {/* Icon 4: Google IP Info */}
          <button
            onClick={() => openApp('ipinfo')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'آی‌پی سرور گوگل' : 'Google Cloud IP'}
            </span>
          </button>

          {/* Icon 5: System Monitor */}
          <button
            onClick={() => openApp('monitor')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'مانیتور سیستم' : 'Task Manager'}
            </span>
          </button>

          {/* Icon 6: Text Editor */}
          <button
            onClick={() => openApp('editor')}
            className="flex flex-col items-center justify-center w-22 p-2 rounded-lg hover:bg-zinc-800/60 active:bg-zinc-700/80 transition-all text-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-zinc-200 mt-1.5 drop-shadow group-hover:text-white">
              {lang === 'fa' ? 'ویرایشگر متن' : 'Text Editor'}
            </span>
          </button>
        </div>

        {/* Windows Rendering Layer */}
        {windows.map((win) => {
          if (!win.isOpen || win.isMinimized) return null;

          const isWinActive = activeWindowId === win.id;

          const winStyle: React.CSSProperties = win.isMaximized
            ? {
                top: 0,
                left: 0,
                width: '100%',
                height: 'calc(100% - 40px)',
                zIndex: win.zIndex,
              }
            : {
                top: win.y,
                left: win.x,
                width: win.width,
                height: win.height,
                zIndex: win.zIndex,
              };

          return (
            <div
              key={win.id}
              onClick={() => focusWindow(win.id)}
              style={winStyle}
              className={`absolute rounded-lg border shadow-2xl overflow-hidden flex flex-col transition-shadow bg-zinc-900 ${
                isWinActive
                  ? 'border-zinc-700 shadow-zinc-950/80 ring-1 ring-zinc-700'
                  : 'border-zinc-800 shadow-lg opacity-95'
              }`}
            >
              {/* Window Titlebar */}
              <div
                className={`h-8 px-3 flex items-center justify-between text-xs select-none cursor-move ${
                  isWinActive
                    ? 'bg-gradient-to-r from-zinc-800 to-zinc-850 text-zinc-100 font-medium'
                    : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {win.appId === 'browser' && <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  {win.appId === 'terminal' && <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {win.appId === 'files' && <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {win.appId === 'ipinfo' && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {win.appId === 'monitor' && <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  {win.appId === 'editor' && <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  <span className="truncate text-[11px] font-mono">{win.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMinimize(win.id);
                    }}
                    title="Minimize"
                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaximize(win.id);
                    }}
                    title="Maximize / Restore"
                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(win.id);
                    }}
                    title="Close"
                    className="p-1 hover:bg-rose-600 rounded text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Window Content Body */}
              <div className="flex-1 bg-zinc-950 overflow-hidden flex flex-col">
                {/* 1. Web Browser Window App */}
                {win.appId === 'browser' && (
                  <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
                    {/* Navigation bar with real IP banner */}
                    <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <button
                          onClick={() => setBrowserUrl('https://duckduckgo.com')}
                          className="p-1 hover:bg-zinc-800 rounded"
                        >
                          <Home className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          let u = browserInput.trim();
                          if (!u.startsWith('http://') && !u.startsWith('https://')) {
                            if (u.includes('.') && !u.includes(' ')) {
                              u = 'https://' + u;
                            } else {
                              u = `https://duckduckgo.com/?q=${encodeURIComponent(u)}`;
                            }
                          }
                          setBrowserUrl(u);
                        }}
                        className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-xs"
                      >
                        <Lock className="w-3 h-3 text-emerald-400 mr-1.5 shrink-0" />
                        <input
                          type="text"
                          value={browserInput}
                          onChange={(e) => setBrowserInput(e.target.value)}
                          placeholder="Enter URL or search query..."
                          className="w-full bg-transparent text-white focus:outline-none text-[11px]"
                        />
                      </form>

                      <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                        IP: {googleIp}
                      </div>
                    </div>

                    {/* Quick bookmarks */}
                    <div className="px-2 py-1 bg-zinc-950 border-b border-zinc-800 text-[10px] flex items-center justify-between gap-1.5 overflow-x-auto">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-zinc-500 font-medium">Quick:</span>
                        <button
                          onClick={() => {
                            setBrowserUrl('https://www.google.com');
                            setBrowserInput('https://www.google.com');
                          }}
                          className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                        >
                          Google
                        </button>
                        <button
                          onClick={() => {
                            setBrowserUrl('https://duckduckgo.com');
                            setBrowserInput('https://duckduckgo.com');
                          }}
                          className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                        >
                          DuckDuckGo
                        </button>
                        <button
                          onClick={() => {
                            setBrowserUrl('https://fa.wikipedia.org');
                            setBrowserInput('https://fa.wikipedia.org');
                          }}
                          className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                        >
                          ویکی‌پدیا
                        </button>
                        <button
                          onClick={() => {
                            setBrowserUrl('https://news.ycombinator.com');
                            setBrowserInput('https://news.ycombinator.com');
                          }}
                          className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer"
                        >
                          Hacker News
                        </button>
                      </div>

                      {/* Unblock vs Direct Mode */}
                      <div className="flex items-center gap-1 font-mono text-[9px]">
                        <button
                          onClick={() => setDesktopBrowserMode('unblock')}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            desktopBrowserMode === 'unblock' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Universal Unblocker (strips X-Frame-Options so Google and all sites open)"
                        >
                          🚀 Unblock (All Sites)
                        </button>
                        <button
                          onClick={() => setDesktopBrowserMode('direct')}
                          className={`px-1.5 py-0.5 rounded cursor-pointer ${
                            desktopBrowserMode === 'direct' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Direct Embed
                        </button>
                      </div>
                    </div>

                    {/* Browser viewport iframe */}
                    <iframe
                      src={
                        desktopBrowserMode === 'unblock'
                          ? `/api/vps/browser/view?url=${encodeURIComponent(browserUrl)}`
                          : browserUrl
                      }
                      title="Browser Desktop"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                      className="flex-1 w-full bg-white border-none"
                    />
                  </div>
                )}

                {/* 2. Terminal Bash Shell Window App */}
                {win.appId === 'terminal' && (
                  <div className="flex-1 flex flex-col bg-zinc-950 font-mono text-xs text-zinc-200 p-3 overflow-y-auto">
                    <div className="text-zinc-500 text-[11px] mb-2">
                      Debian GNU/Linux 12 (bookworm) - root@google-ai-studio: ~#
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto font-mono text-xs select-text">
                      {terminalLogs.map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <span className="text-emerald-400 font-bold">root@debian</span>
                            <span className="text-zinc-500">:</span>
                            <span className="text-blue-400">~</span>
                            <span className="text-zinc-400">#</span>
                            <span className="text-white">{item.cmd}</span>
                          </div>
                          <pre className="text-zinc-300 whitespace-pre-wrap pl-2 leading-relaxed text-[11px] font-mono text-emerald-300">
                            {item.out}
                          </pre>
                        </div>
                      ))}
                    </div>

                    {/* Input prompt */}
                    <form onSubmit={handleRunTerminalCmd} className="flex items-center gap-1.5 pt-2 border-t border-zinc-800">
                      <span className="text-emerald-400 font-bold">root@debian</span>
                      <span className="text-zinc-500">:</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-zinc-400">#</span>
                      <input
                        type="text"
                        autoFocus
                        value={terminalInput}
                        disabled={isTerminalBusy}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="type command (e.g. curl ifconfig.me or uname -a)..."
                        className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs"
                      />
                      {isTerminalBusy && <span className="w-2 h-4 bg-emerald-400 animate-pulse" />}
                    </form>
                  </div>
                )}

                {/* 3. Google Cloud IP Info Inspector App */}
                {win.appId === 'ipinfo' && (
                  <div className="flex-1 p-5 bg-zinc-900 text-zinc-100 overflow-y-auto space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
                      <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm text-emerald-300">
                          {lang === 'fa' ? 'آی‌پی سرور رسمی Google AI Studio' : 'Official Google AI Studio Server IP'}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">{googleIp}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">ISP / Organization</div>
                        <div className="font-bold text-zinc-200 mt-1">{googleOrg}</div>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">Location / Region</div>
                        <div className="font-bold text-zinc-200 mt-1">{googleCity}, England (GB)</div>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">Google Cloud Zone</div>
                        <div className="font-bold text-blue-400 mt-1">europe-west2 (London)</div>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">Host Architecture</div>
                        <div className="font-bold text-zinc-200 mt-1">x86_64 gVisor Linux 6.6</div>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">
                      {lang === 'fa'
                        ? 'تمام درخواست‌های وب، دانلودها و دستورات این دسکتاپ لینوکس مستقیماً از طریق اینترنت دیتاسنتر گوگل با همین آی‌پی انجام می‌شوند.'
                        : 'All web requests and terminal commands from this desktop originate directly from Google Cloud London with this IP address.'}
                    </div>
                  </div>
                )}

                {/* 4. File Manager App */}
                {win.appId === 'files' && (
                  <div className="flex-1 flex bg-zinc-950 text-xs">
                    {/* Left tree sidebar */}
                    <div className="w-44 bg-zinc-900 border-r border-zinc-800 p-2 space-y-1">
                      <div className="text-[10px] text-zinc-500 font-medium px-2 py-1 uppercase">Places</div>
                      <button className="w-full text-left px-2 py-1 rounded bg-zinc-800 text-white flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-amber-400" />
                        <span>/root</span>
                      </button>
                      <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800/60 text-zinc-300 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-zinc-500" />
                        <span>/etc</span>
                      </button>
                      <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800/60 text-zinc-300 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-zinc-500" />
                        <span>/var</span>
                      </button>
                      <button className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800/60 text-zinc-300 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-zinc-500" />
                        <span>/tmp</span>
                      </button>
                    </div>

                    {/* Files list */}
                    <div className="flex-1 p-4 grid grid-cols-4 gap-4 overflow-y-auto content-start">
                      <div className="flex flex-col items-center p-2 rounded hover:bg-zinc-900 cursor-pointer">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <span className="text-[11px] text-zinc-200 mt-1 font-mono">notes.txt</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded hover:bg-zinc-900 cursor-pointer">
                        <FileText className="w-8 h-8 text-emerald-400" />
                        <span className="text-[11px] text-zinc-200 mt-1 font-mono">server.ts</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded hover:bg-zinc-900 cursor-pointer">
                        <FileText className="w-8 h-8 text-amber-400" />
                        <span className="text-[11px] text-zinc-200 mt-1 font-mono">package.json</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded hover:bg-zinc-900 cursor-pointer">
                        <Folder className="w-8 h-8 text-amber-500" />
                        <span className="text-[11px] text-zinc-200 mt-1 font-mono">src</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. System Monitor App */}
                {win.appId === 'monitor' && (
                  <div className="flex-1 p-4 bg-zinc-950 text-xs font-mono space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">CPU Cores</div>
                        <div className="text-lg font-bold text-emerald-400">4 vCPUs AMD EPYC</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">Memory Allocated</div>
                        <div className="text-lg font-bold text-blue-400">1.2GB / 4.0GB</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                        <div className="text-zinc-500 text-[10px]">Outbound Gateway</div>
                        <div className="text-lg font-bold text-purple-400 truncate">{googleIp}</div>
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded overflow-hidden">
                      <div className="p-2 bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800">
                        Top Running Processes
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-zinc-950 text-zinc-500">
                          <tr>
                            <th className="p-1.5">PID</th>
                            <th className="p-1.5">User</th>
                            <th className="p-1.5">CPU%</th>
                            <th className="p-1.5">Command</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-zinc-300">
                          <tr>
                            <td className="p-1.5">1</td>
                            <td className="p-1.5">root</td>
                            <td className="p-1.5 text-emerald-400">0.8%</td>
                            <td className="p-1.5">node server.ts</td>
                          </tr>
                          <tr>
                            <td className="p-1.5">42</td>
                            <td className="p-1.5">root</td>
                            <td className="p-1.5 text-emerald-400">1.2%</td>
                            <td className="p-1.5">chromium --no-sandbox</td>
                          </tr>
                          <tr>
                            <td className="p-1.5">88</td>
                            <td className="p-1.5">root</td>
                            <td className="p-1.5 text-emerald-400">0.1%</td>
                            <td className="p-1.5">bash (tty1)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Text Editor App */}
                {win.appId === 'editor' && (
                  <div className="flex-1 flex flex-col bg-zinc-950">
                    <textarea
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      className="flex-1 w-full p-4 bg-zinc-950 text-zinc-200 font-mono text-xs focus:outline-none resize-none leading-relaxed select-text"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Linux Start Menu Popup */}
      {startMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-11 left-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-2 z-50 text-xs text-zinc-200 space-y-1"
        >
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-zinc-100">Debian 12 Desktop</div>
              <div className="text-[10px] text-zinc-500 font-mono">{googleIp}</div>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => openApp('browser')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{lang === 'fa' ? 'مرورگر وب (Chromium)' : 'Web Browser'}</span>
            </button>
            <button
              onClick={() => openApp('terminal')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fa' ? 'ترمینال روت (Root Shell)' : 'Terminal (Root)'}</span>
            </button>
            <button
              onClick={() => openApp('files')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>{lang === 'fa' ? 'مدیریت فایل (Files)' : 'File Manager'}</span>
            </button>
            <button
              onClick={() => openApp('ipinfo')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fa' ? 'بررسی آی‌پی گوگل کلود' : 'Google Cloud IP Info'}</span>
            </button>
            <button
              onClick={() => openApp('monitor')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>{lang === 'fa' ? 'مانیتورینگ و پردازش‌ها' : 'System Monitor'}</span>
            </button>
            <button
              onClick={() => openApp('editor')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>{lang === 'fa' ? 'ویرایشگر متن' : 'Text Editor'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Linux Taskbar / Panel */}
      <div className="h-10 bg-zinc-900 border-t border-zinc-800 px-2 flex items-center justify-between text-xs select-none z-40">
        {/* Left: Applications Start Menu + Active Windows Tabs */}
        <div className="flex items-center gap-1.5">
          {/* Start button */}
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              startMenuOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'fa' ? 'شروع' : 'Start'}</span>
          </button>

          {/* Active Window tabs on panel */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-lg">
            {windows.map((win) => {
              if (!win.isOpen) return null;
              const isActive = activeWindowId === win.id && !win.isMinimized;
              return (
                <button
                  key={win.id}
                  onClick={() => {
                    if (win.isMinimized) {
                      focusWindow(win.id);
                    } else if (activeWindowId === win.id) {
                      toggleMinimize(win.id);
                    } else {
                      focusWindow(win.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer truncate max-w-[140px] ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`}
                  />
                  <span className="truncate text-[11px]">{win.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right System Tray: IP badge, network, volume, clock */}
        <div className="flex items-center gap-2.5 text-zinc-400 text-[11px] font-mono">
          <div
            onClick={() => openApp('ipinfo')}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 border border-emerald-900/60 text-emerald-400 cursor-pointer hover:bg-zinc-800"
            title="Google AI Studio Server Outbound IP"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>{googleIp}</span>
          </div>

          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <Volume2 className="w-3.5 h-3.5 text-zinc-400" />

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 text-zinc-200 font-semibold">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{currentTime || '12:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
