import React, { useState } from 'react';
import { Server, Power, RefreshCw, Globe, ChevronDown, CheckCircle2, AlertOctagon, User, KeyRound, LogOut, Lock } from 'lucide-react';
import { Language, t } from '../translations';
import { SystemInfo } from '../types';

interface TopNavProps {
  lang: Language;
  setLang: (l: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemInfo: SystemInfo | null;
  onPowerAction: (action: 'reboot' | 'stop' | 'start' | 'reinstall') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  currentUser?: string;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  systemInfo,
  onPowerAction,
  onRefresh,
  isRefreshing,
  currentUser = 'admin',
  onOpenChangePassword,
  onLogout,
}) => {
  const strings = t[lang];
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { id: 'desktop', label: strings.navDesktop },
    { id: 'dashboard', label: strings.navDashboard },
    { id: 'browser', label: strings.navBrowser },
    { id: 'containers', label: strings.navContainers },
    { id: 'compose', label: strings.navCompose },
    { id: 'terminal', label: strings.navTerminal },
    { id: 'network', label: strings.navNetwork },
    { id: 'deploy-guide', label: strings.navDeployGuide },
  ];

  const isRunning = systemInfo?.powerState === 'running';
  const isRebooting = systemInfo?.powerState === 'rebooting';

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Server Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-zinc-100">
                CloudVPS Studio
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : isRebooting ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
                  {systemInfo?.ip4 || '185.193.124.89'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single Line, 5-6 Items) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Power, Lang, Refresh) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh metrics */}
          <button
            onClick={onRefresh}
            title="Refresh system metrics"
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
          </button>

          {/* User Account / Lock Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{currentUser}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showUserMenu && (
              <div
                className={`absolute ${lang === 'fa' ? 'left-0' : 'right-0'} mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 text-xs z-50`}
              >
                <div className="px-3 py-1.5 border-b border-zinc-800 font-mono text-[11px] text-zinc-400">
                  User: <strong className="text-emerald-400">{currentUser}</strong>
                </div>
                {onOpenChangePassword && (
                  <button
                    onClick={() => {
                      onOpenChangePassword();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span>{lang === 'fa' ? 'تغییر رمز عبور' : 'Change Password'}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{lang === 'fa' ? 'قفل صفحه و خروج' : 'Lock & Log Out'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Power Controls Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPowerMenu(!showPowerMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isRunning ? strings.running : isRebooting ? strings.rebooting : strings.stopped}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showPowerMenu && (
              <div
                className={`absolute ${lang === 'fa' ? 'left-0' : 'right-0'} mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 text-xs z-50`}
              >
                {isRunning ? (
                  <>
                    <button
                      onClick={() => {
                        onPowerAction('reboot');
                        setShowPowerMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{strings.reboot}</span>
                    </button>
                    <button
                      onClick={() => {
                        onPowerAction('stop');
                        setShowPowerMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{strings.powerOff}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onPowerAction('start');
                      setShowPowerMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{strings.powerOn}</span>
                  </button>
                )}
                <div className="border-t border-zinc-800 my-1"></div>
                <button
                  onClick={() => {
                    onPowerAction('reinstall');
                    setShowPowerMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 flex items-center gap-2 cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{strings.reinstallOs}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 bg-zinc-900/90 border-t border-zinc-800/80 overflow-x-auto text-xs">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
