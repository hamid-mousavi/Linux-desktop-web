import React, { useState } from 'react';
import { Lock, User, KeyRound, Eye, EyeOff, ShieldCheck, Server, AlertCircle, ArrowRight } from 'lucide-react';
import { Language } from '../translations';
import { SystemInfo } from '../types';

interface LoginGateProps {
  lang: Language;
  systemInfo: SystemInfo | null;
  onLoginSuccess: (username: string) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  lang,
  systemInfo,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('vpsadmin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const googleIp = systemInfo?.googleCloudInfo?.ip || systemInfo?.ip4 || '34.34.246.193';
  const googleOrg = systemInfo?.googleCloudInfo?.org || 'AS396982 Google LLC';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/vps/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('vps_auth_token', data.token);
        localStorage.setItem('vps_auth_user', data.username);
        onLoginSuccess(data.username);
      } else {
        setErrorMessage(
          lang === 'fa'
            ? 'نام کاربری یا رمز عبور اشتباه است.'
            : 'Invalid username or password.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        lang === 'fa'
          ? 'خطا در برقراری ارتباط با سرور اعتبارسنجی.'
          : 'Failed to connect to authentication daemon.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl z-10">
        {/* Brand & Server Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
            <Server className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
            {lang === 'fa' ? 'ورود به سرور مجازی ابری CloudVPS' : 'CloudVPS Linux Server Login'}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Host: {googleIp}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">{googleOrg}</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              {lang === 'fa' ? 'نام کاربری (Username)' : 'Username'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              {lang === 'fa' ? 'رمز عبور (Password)' : 'Password'}
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/20"
          >
            {isLoading ? (
              <span>{lang === 'fa' ? 'در حال بررسی...' : 'Verifying...'}</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'ورود به پنل سرور' : 'Unlock & Access Panel'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Credentials default hint banner */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'fa' ? 'اطلاعات ورود پیش‌فرض سرور:' : 'Default Server Credentials:'}</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 font-mono text-[11px] flex justify-between items-center text-zinc-300">
            <div>
              <span>User: <strong className="text-emerald-400">admin</strong></span>
              <span className="mx-2 text-zinc-600">|</span>
              <span>Pass: <strong className="text-emerald-400">vpsadmin2026</strong></span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {lang === 'fa'
              ? 'پس از ورود به پنل، می‌توانید در منوی بالا یا تنظیمات دسکتاپ رمز عبور و نام کاربری را به مقدار دلخواه تغییر دهید.'
              : 'Once logged in, you can change your password anytime via Settings.'}
          </p>
        </div>
      </div>
    </div>
  );
};
