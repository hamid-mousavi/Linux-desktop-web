import React, { useState } from 'react';
import { Box, Play, Square, RefreshCw, Trash2, FileText, Terminal, Info, Plus, Search, Filter, X, Check, Copy } from 'lucide-react';
import { Language, t } from '../translations';
import { Container } from '../types';

interface ContainersTabProps {
  lang: Language;
  containers: Container[];
  onContainerAction: (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => void;
  onOpenCreateModal: () => void;
  onOpenTerminalWithCommand: (cmd: string) => void;
}

export const ContainersTab: React.FC<ContainersTabProps> = ({
  lang,
  containers,
  onContainerAction,
  onOpenCreateModal,
  onOpenTerminalWithCommand,
}) => {
  const strings = t[lang];
  const [filterState, setFilterState] = useState<'all' | 'running' | 'stopped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals for Logs and Inspect
  const [activeLogContainer, setActiveLogContainer] = useState<Container | null>(null);
  const [activeInspectContainer, setActiveInspectContainer] = useState<Container | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  // Filtered list
  const filtered = containers.filter((c) => {
    if (filterState === 'running' && c.status !== 'running') return false;
    if (filterState === 'stopped' && c.status !== 'stopped') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopyLogs = (logs: string[]) => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-md border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                filterState === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {strings.allContainers} ({containers.length})
            </button>
            <button
              onClick={() => setFilterState('running')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                filterState === 'running' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {strings.onlyRunning} ({containers.filter((c) => c.status === 'running').length})
            </button>
            <button
              onClick={() => setFilterState('stopped')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                filterState === 'stopped' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {strings.onlyStopped} ({containers.filter((c) => c.status === 'stopped').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.searchContainers}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* New Container Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{strings.deployContainer}</span>
          </button>
        </div>
      </div>

      {/* Containers Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3 px-4">{strings.containerName}</th>
                <th className="py-3 px-4">{strings.image}</th>
                <th className="py-3 px-4">{strings.status}</th>
                <th className="py-3 px-4">{strings.ports}</th>
                <th className="py-3 px-4 text-right">CPU / RAM</th>
                <th className="py-3 px-4 text-right">{strings.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                    {lang === 'fa' ? 'هیچ کانتینری یافت نشد.' : 'No containers match your criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isRunning = c.status === 'running';
                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isRunning ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'
                            }`}
                          />
                          <div>
                            <div className="font-sans font-medium text-zinc-100">{c.name}</div>
                            <div className="text-[11px] text-zinc-500">{c.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Image */}
                      <td className="py-3 px-4 text-zinc-300">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                          {c.image}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-sans px-2 py-0.5 rounded ${
                            isRunning
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                              : 'text-zinc-400 bg-zinc-800/60'
                          }`}
                        >
                          {c.stateDescription}
                        </span>
                      </td>

                      {/* Ports */}
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {c.ports.length > 0 ? (
                          c.ports.map((p, i) => (
                            <span key={i} className="inline-block mr-1">
                              {p.host}:{p.container}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>

                      {/* CPU & RAM */}
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-300">
                        {isRunning ? (
                          <div>
                            <span>{c.cpuPercent}%</span>
                            <span className="text-zinc-500 mx-1">·</span>
                            <span>{c.memoryMb}MB</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">0% · 0MB</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          {isRunning ? (
                            <button
                              onClick={() => onContainerAction(c.id, 'stop')}
                              title={strings.stop}
                              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onContainerAction(c.id, 'start')}
                              title={strings.start}
                              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onContainerAction(c.id, 'restart')}
                            title={strings.restart}
                            className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Exec terminal */}
                          <button
                            onClick={() => onOpenTerminalWithCommand(`docker exec -it ${c.name} sh`)}
                            title={strings.openTerminal}
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          {/* Logs modal */}
                          <button
                            onClick={() => setActiveLogContainer(c)}
                            title={strings.viewLogs}
                            className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Inspect modal */}
                          <button
                            onClick={() => setActiveInspectContainer(c)}
                            title={strings.inspect}
                            className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onContainerAction(c.id, 'delete')}
                            title={strings.delete}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Modal */}
      {activeLogContainer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Logs: {activeLogContainer.name} ({activeLogContainer.image})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLogs(activeLogContainer.logs)}
                  className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLog ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setActiveLogContainer(null)}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-zinc-950 text-zinc-300 space-y-1 select-text">
              {activeLogContainer.logs.length === 0 ? (
                <div className="text-zinc-600">No output logs recorded.</div>
              ) : (
                activeLogContainer.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-zinc-900/60 px-1 rounded">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500 font-mono flex justify-between">
              <span>Status: {activeLogContainer.status}</span>
              <span>Total Lines: {activeLogContainer.logs.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {activeInspectContainer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  docker inspect: {activeInspectContainer.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveInspectContainer(null)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-zinc-950 text-emerald-400 select-text">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    Id: activeInspectContainer.id,
                    Created: new Date(activeInspectContainer.created).toISOString(),
                    State: {
                      Status: activeInspectContainer.status,
                      Running: activeInspectContainer.status === 'running',
                      Error: '',
                      ExitCode: 0,
                    },
                    Image: activeInspectContainer.image,
                    Config: {
                      Hostname: activeInspectContainer.id,
                      Env: Object.entries(activeInspectContainer.env).map(([k, v]) => `${k}=${v}`),
                      Cmd: [activeInspectContainer.command],
                    },
                    NetworkSettings: {
                      Ports: activeInspectContainer.ports.reduce((acc, p) => {
                        acc[`${p.container}/${p.protocol}`] = [{ HostIp: '0.0.0.0', HostPort: String(p.host) }];
                        return acc;
                      }, {} as Record<string, any>),
                      IPAddress: '172.18.0.' + Math.floor(Math.random() * 200 + 2),
                      Gateway: '172.18.0.1',
                    },
                    HostConfig: {
                      Memory: activeInspectContainer.memoryLimitMb * 1024 * 1024,
                      NanoCpus: 1000000000,
                      RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 0 },
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
