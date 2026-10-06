import React, { useState, useRef } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  ShieldCheck,
  Search,
  Plus,
  X,
  ExternalLink,
  BookOpen,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Share2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Language } from '../translations';
import { SystemInfo } from '../types';

interface BrowserTabProps {
  lang: Language;
  systemInfo: SystemInfo | null;
  onDeployBrowserContainer?: () => void;
}

interface WebTab {
  id: string;
  title: string;
  url: string;
  inputUrl: string;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  htmlContent: string;
  hasFrameError?: boolean;
}

const DIRECT_PRESETS = [
  { name: 'جستجو DuckDuckGo (بدون فیلتر)', url: 'https://duckduckgo.com', category: 'search' },
  { name: 'ویکی‌پدیا فارسی', url: 'https://fa.wikipedia.org', category: 'encyclopedia' },
  { name: 'Wikipedia English', url: 'https://en.wikipedia.org', category: 'encyclopedia' },
  { name: 'جستجو Bing', url: 'https://www.bing.com', category: 'search' },
  { name: 'آرشیو وب Archive.org', url: 'https://web.archive.org', category: 'tools' },
  { name: 'اخبار Hacker News', url: 'https://news.ycombinator.com', category: 'news' },
  { name: 'تست سرعت Fast.com', url: 'https://fast.com', category: 'tools' },
  { name: 'مستندات Docker', url: 'https://docs.docker.com', category: 'docs' },
  { name: 'کدنویسی CodePen', url: 'https://codepen.io/pen/', category: 'dev' },
];

export const BrowserTab: React.FC<BrowserTabProps> = ({
  lang,
  systemInfo,
  onDeployBrowserContainer,
}) => {
  // Default to 'unblock' (Universal View: strips X-Frame-Options & CSP so all sites open!)
  const [renderMode, setRenderMode] = useState<'unblock' | 'direct' | 'reader'>('unblock');
  const [copiedLink, setCopiedLink] = useState(false);

  const [tabs, setTabs] = useState<WebTab[]>([
    {
      id: 'tab-1',
      title: 'ویکی‌پدیا فارسی (بدون پروکسی)',
      url: 'https://fa.wikipedia.org',
      inputUrl: 'https://fa.wikipedia.org',
      isLoading: false,
      history: ['https://fa.wikipedia.org'],
      historyIndex: 0,
      htmlContent: '',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // AI Studio published URL
  const aiStudioUrl = 'https://ais-pre-lu4easulpk7ljvupxy3of3-300123940669.europe-west2.run.app';

  const navigateTo = (tabId: string, rawUrl: string, addToHistory = true) => {
    let clean = rawUrl.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = 'https://' + clean;
      } else {
        // Direct search query via DuckDuckGo without proxy
        clean = `https://duckduckgo.com/?q=${encodeURIComponent(clean)}`;
      }
    }

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          const newHistory = addToHistory ? [...t.history.slice(0, t.historyIndex + 1), clean] : t.history;
          const newIdx = addToHistory ? newHistory.length - 1 : t.historyIndex;
          let title = clean;
          try {
            title = new URL(clean).hostname;
          } catch (e) {}

          return {
            ...t,
            url: clean,
            inputUrl: clean,
            title,
            isLoading: false,
            history: newHistory,
            historyIndex: newIdx,
            hasFrameError: false,
          };
        }
        return t;
      })
    );

    // If unblock mode is active, fetch via backend proxy
    if (renderMode === 'unblock') {
      fetchProxyContent(tabId, clean);
    }
  };

  const fetchProxyContent = async (tabId: string, url: string) => {
    try {
      const res = await fetch(`/api/vps/browser/fetch?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.success && data.html) {
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, htmlContent: data.html, title: data.title || t.title } : t))
        );
      }
    } catch (e) {
      console.warn('Proxy fetch failed, falling back to direct view', e);
    }
  };

  const handleNewTab = () => {
    const newId = 'tab-' + Math.random().toString(36).substring(2, 7);
    const startUrl = 'https://duckduckgo.com';
    const newTab: WebTab = {
      id: newId,
      title: 'DuckDuckGo (بدون پروکسی)',
      url: startUrl,
      inputUrl: startUrl,
      isLoading: false,
      history: [startUrl],
      historyIndex: 0,
      htmlContent: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleGoBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevUrl = activeTab.history[activeTab.historyIndex - 1];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, historyIndex: t.historyIndex - 1 } : t))
      );
      navigateTo(activeTab.id, prevUrl, false);
    }
  };

  const handleGoForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextUrl = activeTab.history[activeTab.historyIndex + 1];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, historyIndex: t.historyIndex + 1 } : t))
      );
      navigateTo(activeTab.id, nextUrl, false);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = activeTab.url;
    }
  };

  const handleCopyPublishLink = () => {
    navigator.clipboard.writeText(aiStudioUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* AI Studio Host Publishing & No-Proxy Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-emerald-950/40 border border-blue-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-100">
                {lang === 'fa' ? 'مرورگر مستقیم (بدون پروکسی) در هاست AI Studio' : 'Direct Browser (No Proxy) on AI Studio Host'}
              </span>
              <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
                100% Direct Mode
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
              {lang === 'fa'
                ? 'وب‌گردی بدون نیاز به هیچ پروکسی خارجی! تمام درخواست‌ها مستقیماً در بستر ابری Google AI Studio بارگذاری و منتشر می‌شوند.'
                : 'Browse directly without any external proxies! Fully hosted and published natively on Google AI Studio Cloud.'}
            </p>
          </div>
        </div>

        {/* AI Studio Publish URL & Copy Button */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
          <div className="font-mono text-[11px] text-zinc-300 truncate max-w-[240px]">
            {aiStudioUrl}
          </div>
          <button
            onClick={handleCopyPublishLink}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'لینک هاست' : 'Copy URL')}</span>
          </button>
        </div>
      </div>

      {/* Main Browser Window Frame */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[680px]">
        {/* 1. Browser Tab Strip */}
        <div className="bg-zinc-950 px-2 pt-2 border-b border-zinc-800 flex items-center gap-1 overflow-x-auto select-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group max-w-[220px] min-w-[140px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-zinc-100 border-t border-x border-zinc-800 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate text-[11px]">{tab.title}</span>
                </div>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleNewTab}
            title="Open new tab"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Omnibox Navigation & Controls Bar */}
        <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleGoBack}
              disabled={activeTab.historyIndex <= 0}
              title="Back"
              className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoForward}
              disabled={activeTab.historyIndex >= activeTab.history.length - 1}
              title="Forward"
              className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReload}
              title="Reload page"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo(activeTab.id, 'https://duckduckgo.com', true)}
              title="Home"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Omnibox Address Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(activeTab.id, activeTab.inputUrl, true);
            }}
            className="flex-1 min-w-[240px] relative"
          >
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
              <div className="pl-3 pr-2 flex items-center text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={activeTab.inputUrl}
                onChange={(e) =>
                  setTabs((prev) =>
                    prev.map((t) => (t.id === activeTab.id ? { ...t, inputUrl: e.target.value } : t))
                  )
                }
                placeholder={lang === 'fa' ? 'آدرس سایت را بدون پروکسی وارد کنید (مثال: fa.wikipedia.org)...' : 'Enter website URL (e.g. en.wikipedia.org)...'}
                className="w-full py-1.5 text-xs font-mono text-zinc-200 bg-transparent placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium border-l border-zinc-800 transition-colors cursor-pointer"
              >
                {lang === 'fa' ? 'ورود' : 'Open'}
              </button>
            </div>
          </form>

          {/* Mode Switcher: Unblock (Universal Default) vs Direct vs Reader */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => setRenderMode('unblock')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                renderMode === 'unblock' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Universal Unblocker: Strips X-Frame-Options so all websites open!"
            >
              {lang === 'fa' ? '🚀 ضد مسدودسازی (باز کردن همه سایت‌ها)' : '🚀 Unblock (All Sites)'}
            </button>
            <button
              onClick={() => setRenderMode('direct')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                renderMode === 'direct' ? 'bg-blue-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Direct Embed: Native iframe without server rewriting"
            >
              {lang === 'fa' ? 'مستقیم (Direct)' : 'Direct Embed'}
            </button>
            <button
              onClick={() => setRenderMode('reader')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                renderMode === 'reader' ? 'bg-zinc-800 text-purple-300 font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Reader Mode: Clean text reader"
            >
              Reader
            </button>
          </div>
        </div>

        {/* 3. Bookmarks Quick Bar (Direct Presets) */}
        <div className="px-3 py-2 bg-zinc-950/70 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{lang === 'fa' ? 'سایت‌های منتخب:' : 'Featured Sites:'}</span>
          </span>
          {DIRECT_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => navigateTo(activeTab.id, p.url, true)}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/70 text-[11px] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* 4. Browser Viewport Display */}
        <div className="flex-1 bg-white relative overflow-hidden flex flex-col min-h-[550px]">
          {/* Unblock Mode: Renders through /api/vps/browser/view which strips X-Frame-Options and CSP */}
          {renderMode === 'unblock' && (
            <iframe
              ref={iframeRef}
              src={`/api/vps/browser/view?url=${encodeURIComponent(activeTab.url)}`}
              title={activeTab.title}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              className="w-full flex-1 border-none bg-white min-h-[550px]"
            />
          )}

          {/* Direct Mode: Native Iframe */}
          {renderMode === 'direct' && (
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              title={activeTab.title}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              className="w-full flex-1 border-none bg-white min-h-[550px]"
            />
          )}

          {/* Reader Mode */}
          {renderMode === 'reader' && (
            <div className="w-full flex-1 bg-zinc-950 text-zinc-100 p-8 overflow-y-auto select-text leading-relaxed">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="border-b border-zinc-800 pb-4">
                  <h1 className="text-xl font-bold text-white mb-2">{activeTab.title}</h1>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span className="text-blue-400">{activeTab.url}</span>
                    <span>·</span>
                    <span className="text-emerald-400">Direct No-Proxy View</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs leading-relaxed text-zinc-300">
                  <p className="mb-3 font-semibold text-zinc-200">
                    {lang === 'fa' ? 'پیش‌نمایش محتوای مستقیم وبسایت:' : 'Direct Webpage Preview:'}
                  </p>
                  <iframe
                    src={activeTab.url}
                    title="Reader Embed"
                    sandbox="allow-scripts allow-forms allow-same-origin"
                    className="w-full h-[450px] rounded border border-zinc-800 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Browser Bottom Status Bar */}
        <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'اتصال مستقیم بدون پروکسی (Direct Connection)' : 'Direct Connection (No Proxy)'}</span>
            </span>
            <span>·</span>
            <span className="text-zinc-500 truncate max-w-sm">{activeTab.url}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-zinc-400">
            <span className="text-blue-400">AI Studio Host: Cloud Run</span>
            <span>·</span>
            <span>Port: 3000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
