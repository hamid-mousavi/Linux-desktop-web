import React, { useState } from 'react';
import { X, Box, ArrowRight, Check } from 'lucide-react';
import { Language, t } from '../translations';

interface CreateContainerModalProps {
  lang: Language;
  initialImage?: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    image: string;
    hostPort?: number;
    containerPort?: number;
    env?: Record<string, string>;
    command?: string;
  }) => void;
}

export const CreateContainerModal: React.FC<CreateContainerModalProps> = ({
  lang,
  initialImage = '',
  initialName = '',
  onClose,
  onSubmit,
}) => {
  const strings = t[lang];
  const [name, setName] = useState(initialName || '');
  const [image, setImage] = useState(initialImage || '');
  const [hostPort, setHostPort] = useState('8080');
  const [containerPort, setContainerPort] = useState('80');
  const [envRaw, setEnvRaw] = useState('');
  const [command, setCommand] = useState('');

  const quickPresets = [
    { label: 'Chromium GUI', image: 'kasmweb/chromium:1.15.0', host: 6901, cont: 6901 },
    { label: 'Firefox Web', image: 'linuxserver/firefox:latest', host: 3005, cont: 3000 },
    { label: 'Nginx (Web)', image: 'nginx:alpine', host: 8080, cont: 80 },
    { label: 'Node.js (API)', image: 'node:20-alpine', host: 3001, cont: 3000 },
    { label: 'Redis (Cache)', image: 'redis:7-alpine', host: 6379, cont: 6379 },
    { label: 'Postgres (DB)', image: 'postgres:16-alpine', host: 5432, cont: 5432 },
    { label: 'Python (FastAPI)', image: 'python:3.11-slim', host: 8000, cont: 8000 },
    { label: 'Ubuntu 24.04', image: 'ubuntu:24.04', host: 2222, cont: 22 },
  ];

  const handleSelectPreset = (p: typeof quickPresets[0]) => {
    setImage(p.image);
    setHostPort(String(p.host));
    setContainerPort(String(p.cont));
    if (!name) {
      setName(p.image.split(':')[0] + '-srv');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image.trim()) return;

    // Parse env
    const envObj: Record<string, string> = {};
    if (envRaw.trim()) {
      envRaw.split('\n').forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          envObj[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
    }

    onSubmit({
      name: name.trim() || 'app-' + Math.random().toString(36).substring(2, 6),
      image: image.trim(),
      hostPort: hostPort ? Number(hostPort) : undefined,
      containerPort: containerPort ? Number(containerPort) : undefined,
      env: envObj,
      command: command.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">{strings.createModalTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="block text-zinc-400 mb-2 font-medium">{strings.popularPresets}</label>
            <div className="grid grid-cols-3 gap-2">
              {quickPresets.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                    image === p.image
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-medium text-[11px] truncate">{p.label}</div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">{p.image}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Container Image */}
          <div>
            <label className="block text-zinc-300 mb-1 font-medium">{strings.image} *</label>
            <input
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="e.g. nginx:alpine or node:20-alpine"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Container Name */}
          <div>
            <label className="block text-zinc-300 mb-1 font-medium">{strings.containerName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. my-web-app"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Port Mappings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 mb-1 font-medium">{strings.hostPort}</label>
              <input
                type="number"
                value={hostPort}
                onChange={(e) => setHostPort(e.target.value)}
                placeholder="8080"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 mb-1 font-medium">{strings.containerPort}</label>
              <input
                type="number"
                value={containerPort}
                onChange={(e) => setContainerPort(e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Env Vars */}
          <div>
            <label className="block text-zinc-300 mb-1 font-medium">{strings.envVars}</label>
            <textarea
              rows={2}
              value={envRaw}
              onChange={(e) => setEnvRaw(e.target.value)}
              placeholder="PORT=80&#10;NODE_ENV=production"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Custom Command */}
          <div>
            <label className="block text-zinc-300 mb-1 font-medium">{strings.startupCmd}</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. npm start or nginx -g 'daemon off;'"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit / Cancel */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
            >
              {strings.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{strings.confirmDeploy}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
