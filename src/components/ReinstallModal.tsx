import React, { useState } from 'react';
import { AlertOctagon, X, Check, Server } from 'lucide-react';
import { Language, t } from '../translations';

interface ReinstallModalProps {
  lang: Language;
  currentOs: string;
  onClose: () => void;
  onConfirmReinstall: (newOs: string) => void;
}

export const ReinstallModal: React.FC<ReinstallModalProps> = ({
  lang,
  currentOs,
  onClose,
  onConfirmReinstall,
}) => {
  const strings = t[lang];
  const [selectedOs, setSelectedOs] = useState(currentOs);

  const OS_OPTIONS = [
    { name: 'Ubuntu 24.04 LTS (Noble Numbat)', kernel: 'Linux 6.8', tag: 'Recommended' },
    { name: 'Debian 12 (Bookworm)', kernel: 'Linux 6.1', tag: 'Ultra Stable' },
    { name: 'Alpine Linux 3.19', kernel: 'Linux 6.6', tag: 'Lightweight (5MB)' },
    { name: 'CentOS Stream 9', kernel: 'Linux 5.14', tag: 'Enterprise' },
    { name: 'Arch Linux (Rolling)', kernel: 'Linux 6.9', tag: 'Bleeding Edge' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-100">{strings.reinstallOs}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            {lang === 'fa'
              ? 'توزیع لینوکس مورد نظر خود را جهت نصب مجدد روی این نود VPS انتخاب کنید. سیستم طی چند ثانیه با سیستم‌عامل انتخابی راه‌اندازی خواهد شد.'
              : 'Select your target Linux distribution to reinstall on this VPS node. The system will reboot into the chosen image.'}
          </p>

          <div className="space-y-2">
            {OS_OPTIONS.map((os) => (
              <button
                key={os.name}
                type="button"
                onClick={() => setSelectedOs(os.name)}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  selectedOs === os.name
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-zinc-100">{os.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">Kernel: {os.kernel}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  {os.tag}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
            >
              {strings.cancel}
            </button>
            <button
              onClick={() => onConfirmReinstall(selectedOs)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{strings.reinstallOs}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
