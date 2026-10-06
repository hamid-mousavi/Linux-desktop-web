import React from 'react';
import { Cpu, HardDrive, Database, Activity, Box, ArrowUpRight, ArrowDownLeft, Terminal, Shield, Play, Square, ExternalLink, Globe } from 'lucide-react';
import { Language, t } from '../translations';
import { SystemInfo, Container } from '../types';

interface DashboardTabProps {
  lang: Language;
  systemInfo: SystemInfo | null;
  containers: Container[];
  onOpenCreateModal: (presetImage?: string, presetName?: string) => void;
  onNavigateTab: (tab: string) => void;
  onContainerAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  lang,
  systemInfo,
  containers,
  onOpenCreateModal,
  onNavigateTab,
  onContainerAction,
}) => {
  const strings = t[lang];

  // Calculate total container CPU & Memory
  const runningContainers = containers.filter((c) => c.status === 'running');
  const totalContainerCpu = runningContainers.reduce((acc, c) => acc + c.cpuPercent, 0).toFixed(1);
  const totalContainerMemMb = runningContainers.reduce((acc, c) => acc + c.memoryMb, 0);

  // Format uptime
  const uptimeSec = systemInfo?.uptimeSeconds || 0;
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const uptimeString = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;

  const ramTotalGb = systemInfo?.specs.ramGb || 8;
  const ramUsedGb = ((totalContainerMemMb + 600) / 1024).toFixed(2);
  const ramPercent = Math.min(100, Math.round((Number(ramUsedGb) / ramTotalGb) * 100));

  const diskTotalGb = systemInfo?.specs.diskGb || 120;
  const diskUsedGb = 18.4;
  const diskPercent = Math.round((diskUsedGb / diskTotalGb) * 100);

  const presets = [
    { name: 'Nginx Web Proxy', image: 'nginx:alpine', hostPort: 8080, contPort: 80, desc: 'Web server & reverse proxy' },
    { name: 'Node.js Express App', image: 'node:20-alpine', hostPort: 3001, contPort: 3000, desc: 'JavaScript runtime microservice' },
    { name: 'Redis Key-Value', image: 'redis:7-alpine', hostPort: 6379, contPort: 6379, desc: 'In-memory cache & pub/sub' },
    { name: 'PostgreSQL Relational DB', image: 'postgres:16-alpine', hostPort: 5432, contPort: 5432, desc: 'Enterprise SQL database' },
    { name: 'Python FastAPI Microservice', image: 'python:3.11-slim', hostPort: 8000, contPort: 8000, desc: 'High-speed Python REST API' },
    { name: 'Ubuntu Bash Sandbox', image: 'ubuntu:24.04', hostPort: 2222, contPort: 22, desc: 'Raw Linux bash container' },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CPU */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">{strings.cpuUsage}</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {totalContainerCpu}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / {systemInfo?.specs.vCpu || 4} vCPUs
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, Number(totalContainerCpu) * 2))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-2">
            <span>Load: {systemInfo?.telemetry.loadAvg.join(', ') || '0.12, 0.25, 0.18'}</span>
            <span>2.44 GHz AMD EPYC</span>
          </div>
        </div>

        {/* Metric 2: RAM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">{strings.ramUsage}</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {ramUsedGb} GB
            </span>
            <span className="text-xs text-zinc-400 font-mono">/ {ramTotalGb} GB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${ramPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-2">
            <span>{ramPercent}% Allocated</span>
            <span>DDR4 ECC</span>
          </div>
        </div>

        {/* Metric 3: Disk */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">{strings.diskUsage}</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {diskUsedGb} GB
            </span>
            <span className="text-xs text-zinc-400 font-mono">/ {diskTotalGb} GB</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${diskPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-2">
            <span>NVMe PCIe 4.0</span>
            <span>{diskTotalGb - diskUsedGb} GB Free</span>
          </div>
        </div>

        {/* Metric 4: Bandwidth */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">{strings.bandwidth}</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="flex items-center gap-1 font-mono text-sm text-zinc-200 tabular-nums">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>1.1 GB</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm text-zinc-200 tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              <span>1.4 GB</span>
            </div>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full w-1/4" />
          </div>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-2">
            <span>10 Gbps Port</span>
            <span>Uptime: {uptimeString}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Node Info & Quick Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Running Containers Summary & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Containers Quick Monitor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">{strings.activeContainers}</h3>
                <span className="text-xs text-zinc-400 font-mono">
                  ({runningContainers.length} / {containers.length})
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('containers')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{strings.allContainers}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {containers.slice(0, 4).map((c) => {
                const isCrunning = c.status === 'running';
                return (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isCrunning ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-zinc-600'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-zinc-100">{c.name}</span>
                          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {c.image}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                          <span>
                            {c.ports.length > 0
                              ? c.ports.map((p) => `:${p.host}→${p.container}`).join(', ')
                              : 'No mapped port'}
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">CPU: {c.cpuPercent}%</span>
                          <span>·</span>
                          <span className="tabular-nums">RAM: {c.memoryMb}MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCrunning ? (
                        <button
                          onClick={() => onContainerAction(c.id, 'stop')}
                          title={strings.stop}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Launch Docker Image Presets */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">{strings.popularPresets}</h3>
              <button
                onClick={() => onOpenCreateModal()}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                + {strings.deployContainer}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenCreateModal(p.image, p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                  className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-left transition-all group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">:{p.hostPort}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-1 truncate">{p.image}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Node System Specs & Live Terminal Preview */}
        <div className="space-y-6">
          {/* Node Specs Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{strings.nodeDetails}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">{strings.hostname}</span>
                <span className="font-mono text-zinc-200">{systemInfo?.hostname || 'vps-cloud-node-01'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">{strings.publicIp}</span>
                <span className="font-mono text-emerald-400">{systemInfo?.ip4 || '185.193.124.89'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">IPv6</span>
                <span className="font-mono text-zinc-400 truncate max-w-[160px]">
                  {systemInfo?.ip6 || '2a01:4f8:1c1c::1'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Private Subnet</span>
                <span className="font-mono text-zinc-300">{systemInfo?.privateIp || '10.0.0.15/24'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">{strings.osDistribution}</span>
                <span className="text-zinc-200 truncate max-w-[160px]">{systemInfo?.osType || 'Ubuntu 24.04 LTS'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Docker Engine</span>
                <span className="font-mono text-emerald-400">v26.0.0 (API 1.45)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">{strings.serverUptime}</span>
                <span className="font-mono text-zinc-200">{uptimeString}</span>
              </div>
            </div>
          </div>

          {/* Quick Cloud Browser Launch Banner */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-800/40 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2 text-zinc-200">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">
                {lang === 'fa' ? 'مرورگر ابری تحت وب (Web Browser)' : 'Cloud Web Browser'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              {lang === 'fa'
                ? 'وب‌گردی آزادانه و مستقیم با آدرس IP سرور مجازی بدون محدودیت‌های اینترنت محلی.'
                : 'Browse the web securely through your VPS server IP address.'}
            </p>
            <button
              onClick={() => onNavigateTab('browser')}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'باز کردن مرورگر وب سرور' : 'Open Cloud Browser'}</span>
            </button>
          </div>

          {/* Quick Terminal Launch Banner */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2 text-zinc-200">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold">{strings.terminalHeader}</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              {lang === 'fa'
                ? 'اجرای مستقیم دستورات Bash و مدیریت کانتینرها در محیط خط فرمان تحت وب.'
                : 'Directly execute Bash and Docker CLI commands in the web terminal shell.'}
            </p>
            <button
              onClick={() => onNavigateTab('terminal')}
              className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>root@vps:~#</span>
              <span className="text-emerald-400">docker ps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
