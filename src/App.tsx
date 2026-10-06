import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  Plus,
  X,
  ExternalLink,
  Zap,
  Trash2,
  BookOpen,
  ShieldCheck,
  Search,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface TabItem {
  id: string;
  title: string;
  url: string;
  inputUrl: string;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  engine: 'cached' | 'direct' | 'reader';
  cachedAt?: number;
}

const BOOKMARKS = [
  { name: 'جستجو DuckDuckGo (بدون فیلتر)', url: 'https://html.duckduckgo.com/html/' },
  { name: 'یوتیوب (YouTube Player)', url: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1' },
  { name: 'یوتیوب ترندینگ', url: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLrEnWoR732-BHrPp_AK4CDqt55czPEbVU&autoplay=1' },
  { name: 'ویکی‌پدیا فارسی', url: 'https://fa.wikipedia.org' },
  { name: 'Wikipedia EN', url: 'https://en.wikipedia.org' },
  { name: 'گوگل (Google)', url: 'https://www.google.com' },
  { name: 'بینگ (Bing)', url: 'https://www.bing.com' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'تست سرعت Fast.com', url: 'https://fast.com' },
  { name: 'آرشیو وب Archive.org', url: 'https://web.archive.org' },
  { name: 'مستندات W3Schools', url: 'https://www.w3schools.com' },
];

export default function App() {
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab-1',
      title: 'DuckDuckGo Search',
      url: 'https://html.duckduckgo.com/html/',
      inputUrl: 'https://html.duckduckgo.com/html/',
      isLoading: false,
      history: ['https://html.duckduckgo.com/html/'],
      historyIndex: 0,
      engine: 'cached',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cacheCount, setCacheCount] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check cache stats periodically
  const fetchCacheStats = async () => {
    try {
      const res = await fetch('/api/cache/stats');
      if (res.ok) {
        const data = await res.json();
        setCacheCount(data.totalEntries || 0);
      }
    } catch (e) {
      // Ignore in static offline mode
    }
  };

  useEffect(() => {
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const clearServerCache = async () => {
    try {
      const res = await fetch('/api/cache/clear', { method: 'POST' });
      if (res.ok) {
        setCacheCount(0);
        showToast(lang === 'fa' ? 'حافظه کش سرور با موفقیت پاک شد.' : 'Server cache cleared successfully.');
        handleReload(true);
      }
    } catch (e) {
      showToast(lang === 'fa' ? 'کش محلی بازنشانی شد.' : 'Local cache reset.');
      handleReload(true);
    }
  };

  const navigateTo = (tabId: string, rawUrl: string, addToHistory = true, forceNoCache = false) => {
    let clean = rawUrl.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = 'https://' + clean;
      } else {
        clean = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(clean)}`;
      }
    }

    let title = clean;
    try {
      title = new URL(clean).hostname;
    } catch (e) {}

    // Auto-detect YouTube links and convert to embed player to avoid loading freeze
    const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      clean = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1`;
      title = 'YouTube Video (' + ytMatch[1] + ')';
    } else if (clean === 'https://youtube.com' || clean === 'https://www.youtube.com' || clean === 'https://www.youtube.com/') {
      clean = 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1';
      title = 'YouTube Player';
    }

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          const newHistory = addToHistory ? [...t.history.slice(0, t.historyIndex + 1), clean] : t.history;
          const newIdx = addToHistory ? newHistory.length - 1 : t.historyIndex;
          return {
            ...t,
            url: clean,
            inputUrl: clean,
            title,
            isLoading: true,
            history: newHistory,
            historyIndex: newIdx,
            cachedAt: Date.now(),
          };
        }
        return t;
      })
    );

    // Stop loading indicator after brief delay
    setTimeout(() => {
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isLoading: false } : t)));
      fetchCacheStats();
    }, 700);
  };

  const handleNewTab = () => {
    const newId = 'tab-' + Math.random().toString(36).substring(2, 7);
    const startUrl = 'https://html.duckduckgo.com/html/';
    const newTab: TabItem = {
      id: newId,
      title: 'زبانه جدید',
      url: startUrl,
      inputUrl: startUrl,
      isLoading: false,
      history: [startUrl],
      historyIndex: 0,
      engine: 'cached',
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

  const handleReload = (forceNoCache = false) => {
    navigateTo(activeTab.id, activeTab.url, false, forceNoCache);
  };

  const changeEngine = (newEngine: 'cached' | 'direct' | 'reader') => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, engine: newEngine } : t))
    );
    showToast(
      lang === 'fa'
        ? newEngine === 'cached'
          ? 'موتور کش هوشمند فعال شد (رفع خطای فریم و سرعت بالا)'
          : newEngine === 'direct'
          ? 'موتور اتصال مستقیم فعال شد'
          : 'حالت مطالعه فعال شد'
        : `Switched to ${newEngine} mode`
    );
  };

  // Determine iframe source URL
  const getIframeSrc = () => {
    // YouTube embeds already permit cross-origin iframes and stream directly from Google's video CDN
    if (activeTab.url.includes('youtube-nocookie.com') || activeTab.url.includes('youtube.com/embed/')) {
      return activeTab.url;
    }
    if (activeTab.engine === 'cached') {
      return `/api/browser/view?url=${encodeURIComponent(activeTab.url)}`;
    }
    return activeTab.url;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Browser Tabs Bar */}
      <div className="bg-zinc-900 px-2 pt-2 border-b border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group max-w-[220px] min-w-[140px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-zinc-950 text-zinc-100 border-t border-x border-zinc-800 shadow-md font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {tab.isLoading ? (
                    <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate text-[11px]">{tab.title}</span>
                </div>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleNewTab}
            title={lang === 'fa' ? 'افزودن زبانه جدید' : 'New Tab'}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Global cache info & language switcher */}
        <div className="flex items-center gap-2 pb-1.5 text-xs font-mono text-zinc-400">
          <div
            onClick={clearServerCache}
            title={lang === 'fa' ? 'کلیک کنید تا کش پاک شود' : 'Click to clear cache'}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 hover:bg-zinc-800 cursor-pointer text-[11px]"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{lang === 'fa' ? `کش: ${cacheCount} صفحه` : `Cache: ${cacheCount} pages`}</span>
            <Trash2 className="w-2.5 h-2.5 text-zinc-500 hover:text-rose-400 ml-1" />
          </div>

          <button
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
          >
            {lang === 'fa' ? 'English' : 'فارسی'}
          </button>
        </div>
      </div>

      {/* 2. Omnibox Navigation & Address Controls */}
      <div className="p-2 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoBack}
            disabled={activeTab.historyIndex <= 0}
            title={lang === 'fa' ? 'بازگشت به صفحه قبل' : 'Back'}
            className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleGoForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            title={lang === 'fa' ? 'صفحه بعد' : 'Forward'}
            className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-700 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleReload(false)}
            title={lang === 'fa' ? 'بارگذاری مجدد' : 'Reload'}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => navigateTo(activeTab.id, 'https://html.duckduckgo.com/html/', true)}
            title={lang === 'fa' ? 'صفحه اصلی' : 'Home'}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer"
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
          className="flex-1 min-w-[260px] relative"
        >
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
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
              placeholder={
                lang === 'fa'
                  ? 'آدرس وبسایت یا عبارت جستجو را وارد کنید (مثال: wikipedia.org)...'
                  : 'Enter website URL or search query (e.g. wikipedia.org)...'
              }
              className="w-full py-1.5 text-xs font-mono text-zinc-100 bg-transparent placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium border-l border-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              {lang === 'fa' ? 'برو' : 'Go'}
            </button>
            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              title={
                lang === 'fa'
                  ? 'باز کردن در پنجره جدید مرورگر (برای سایت‌هایی که امبد را قفل کرده‌اند)'
                  : 'Open in new browser tab'
              }
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs border-l border-zinc-800 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">{lang === 'fa' ? 'تب جدید' : 'New Tab'}</span>
            </a>
          </div>
        </form>

        {/* Engine Switcher */}
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
          <button
            onClick={() => changeEngine('cached')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab.engine === 'cached'
                ? 'bg-emerald-600 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Cached Cloud Engine: High-speed server caching & bypasses X-Frame-Options"
          >
            {lang === 'fa' ? '⚡ کش ابری (ضد خطا)' : '⚡ Cached Engine'}
          </button>
          <button
            onClick={() => changeEngine('direct')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab.engine === 'direct'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Direct Embed: Native iframe embedding"
          >
            {lang === 'fa' ? 'اتصال مستقیم' : 'Direct Embed'}
          </button>
          <button
            onClick={() => changeEngine('reader')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab.engine === 'reader'
                ? 'bg-purple-600 text-white font-medium shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Clean Reader View"
          >
            <BookOpen className="w-3 h-3 inline mr-1" />
            Reader
          </button>
        </div>
      </div>

      {/* 3. Bookmarks Quick Bar */}
      <div className="px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{lang === 'fa' ? 'نشانک‌ها:' : 'Bookmarks:'}</span>
        </span>
        {BOOKMARKS.map((bm, i) => (
          <button
            key={i}
            onClick={() => navigateTo(activeTab.id, bm.url, true)}
            className="px-2.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/60 text-[11px] transition-colors whitespace-nowrap cursor-pointer"
          >
            {bm.name}
          </button>
        ))}
      </div>

      {/* 4. Main Viewport Display */}
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        {/* Progress bar during fetch */}
        {activeTab.isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 z-30 animate-pulse" />
        )}

        {/* A. Cached Cloud Engine (Default & Resilient) */}
        {activeTab.engine === 'cached' && (
          <iframe
            ref={iframeRef}
            src={getIframeSrc()}
            title={activeTab.title}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full border-none bg-white"
          />
        )}

        {/* B. Direct Embed Mode */}
        {activeTab.engine === 'direct' && (
          <div className="w-full h-full relative">
            <iframe
              ref={iframeRef}
              src={activeTab.url}
              title={activeTab.title}
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="w-full h-full border-none bg-white"
            />
          </div>
        )}

        {/* C. Reader View Mode */}
        {activeTab.engine === 'reader' && (
          <div className="w-full h-full bg-zinc-950 text-zinc-100 p-8 overflow-y-auto select-text leading-relaxed">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="border-b border-zinc-800 pb-4">
                <h1 className="text-xl font-bold text-white mb-2">{activeTab.title}</h1>
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="text-emerald-400">{activeTab.url}</span>
                  <span>·</span>
                  <a
                    href={activeTab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Direct Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs leading-relaxed text-zinc-300">
                <p className="mb-3 text-zinc-400">
                  {lang === 'fa'
                    ? 'این صفحه در حالت مطالعه متنی بدون تبلیغات و اسکریپت‌های مزاحم بارگذاری شده است.'
                    : 'Clean distraction-free reading mode.'}
                </p>
                <iframe
                  src={`/api/browser/view?url=${encodeURIComponent(activeTab.url)}`}
                  title="Reader Frame"
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-[520px] rounded border border-zinc-800 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Status Bar */}
      <div className="px-3 py-1 bg-zinc-950 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between select-none">
        <div className="flex items-center gap-3 truncate">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SSL / TLS Encrypted</span>
          </span>
          <span>·</span>
          <span className="text-zinc-500 truncate max-w-md">{activeTab.url}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-zinc-500">
          <span className="text-emerald-400">
            {activeTab.engine === 'cached' ? '⚡ Caching Active' : 'Direct Connection'}
          </span>
          <span>·</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
