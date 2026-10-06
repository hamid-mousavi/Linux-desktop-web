import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { DashboardTab } from './components/DashboardTab';
import { ContainersTab } from './components/ContainersTab';
import { ComposeTab } from './components/ComposeTab';
import { TerminalTab } from './components/TerminalTab';
import { BrowserTab } from './components/BrowserTab';
import { DesktopTab } from './components/DesktopTab';
import { NetworkTab } from './components/NetworkTab';
import { DeployGuideTab } from './components/DeployGuideTab';
import { CreateContainerModal } from './components/CreateContainerModal';
import { ReinstallModal } from './components/ReinstallModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Language, t } from './translations';
import { SystemInfo, Container, FirewallRule } from './types';

const DEFAULT_SYSTEM_INFO: SystemInfo = {
  powerState: 'running',
  hostname: 'google-ai-studio-host-01',
  osType: 'Debian GNU/Linux 12 (bookworm)',
  ip4: '34.34.246.193',
  ip6: '2600:1900:0:4a01::1',
  privateIp: '10.0.0.15',
  uptimeSeconds: 302402,
  googleCloudInfo: {
    ip: '34.34.246.193',
    city: 'London',
    region: 'England',
    country: 'GB',
    org: 'AS396982 Google LLC',
    datacenter: 'Google Cloud Platform (europe-west2)',
  },
  specs: {
    vCpu: 4,
    ramGb: 8,
    diskGb: 120,
  },
  telemetry: {
    realTotalMemMb: 4096,
    realUsedMemMb: 616,
    realFreeMemMb: 3480,
    realCores: 4,
    loadAvg: [0.12, 0.25, 0.18],
    arch: 'x64',
    platform: 'linux',
    release: '6.6.21-cloud',
  },
  containerSummary: {
    total: 4,
    running: 4,
    stopped: 0,
  },
};

const DEFAULT_CONTAINERS: Container[] = [
  {
    id: 'c-web-nginx',
    name: 'production-gateway',
    image: 'nginx:1.25-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 80, container: 80, protocol: 'tcp' }, { host: 443, container: 443, protocol: 'tcp' }],
    env: { NGINX_HOST: 'vps.local', NGINX_PORT: '80' },
    command: 'nginx -g "daemon off;"',
    cpuPercent: 1.2,
    memoryMb: 34,
    memoryLimitMb: 512,
    netIO: { rxMb: 142.5, txMb: 890.1 },
    logs: ['[notice] start worker processes', '[notice] nginx/1.25.4 ready'],
  },
  {
    id: 'c-app-node',
    name: 'backend-api-core',
    image: 'node:20-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 3001, container: 3000, protocol: 'tcp' }],
    env: { NODE_ENV: 'production', PORT: '3000' },
    command: 'node dist/main.js',
    cpuPercent: 2.1,
    memoryMb: 68,
    memoryLimitMb: 1024,
    netIO: { rxMb: 245.8, txMb: 512.4 },
    logs: ['[server] listening on port 3000', '[api] connection pool ready'],
  },
  {
    id: 'c-db-postgres',
    name: 'database-postgres',
    image: 'postgres:16-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 5432, container: 5432, protocol: 'tcp' }],
    env: { POSTGRES_DB: 'vpsdb', POSTGRES_USER: 'postgres' },
    command: 'postgres',
    cpuPercent: 0.8,
    memoryMb: 92,
    memoryLimitMb: 2048,
    netIO: { rxMb: 89.2, txMb: 120.7 },
    logs: ['database system is ready to accept connections'],
  },
  {
    id: 'c-cache-redis',
    name: 'cache-redis',
    image: 'redis:7.2-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 6379, container: 6379, protocol: 'tcp' }],
    env: { ALLOW_EMPTY_PASSWORD: 'yes' },
    command: 'redis-server --protected-mode no',
    cpuPercent: 0.6,
    memoryMb: 24,
    memoryLimitMb: 512,
    netIO: { rxMb: 110.1, txMb: 95.3 },
    logs: ['Ready to accept connections tcp'],
  },
];

const DEFAULT_FIREWALL: FirewallRule[] = [
  { id: 'f-1', port: 22, protocol: 'tcp', action: 'allow', description: 'SSH Remote Administration' },
  { id: 'f-2', port: 80, protocol: 'tcp', action: 'allow', description: 'HTTP Web Traffic' },
  { id: 'f-3', port: 443, protocol: 'tcp', action: 'allow', description: 'HTTPS Secure Traffic' },
  { id: 'f-4', port: 3001, protocol: 'tcp', action: 'allow', description: 'Node.js Core API Gateway' },
];

export default function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [currentUser] = useState<string>('root');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('desktop');
  const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
  const [containers, setContainers] = useState<Container[]>(DEFAULT_CONTAINERS);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(DEFAULT_FIREWALL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Terminal command forwarding
  const [createModalConfig, setCreateModalConfig] = useState<{ open: boolean; image?: string; name?: string }>({
    open: false,
  });
  const [showReinstallModal, setShowReinstallModal] = useState(false);
  const [terminalInitialCmd, setTerminalInitialCmd] = useState<string | undefined>(undefined);
  const [isDeployingCompose, setIsDeployingCompose] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial system info and containers
  const fetchAllData = async () => {
    try {
      setIsRefreshing(true);
      const [sysRes, contRes, fwRes] = await Promise.all([
        fetch('/api/vps/system-info'),
        fetch('/api/vps/containers'),
        fetch('/api/vps/firewall'),
      ]);

      if (sysRes.ok) setSystemInfo(await sysRes.json());
      if (contRes.ok) setContainers(await contRes.json());
      if (fwRes.ok) setFirewallRules(await fwRes.json());
    } catch (err) {
      console.error('Failed to load system state', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update HTML document direction for Persian RTL
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Power actions
  const handlePowerAction = async (action: 'reboot' | 'stop' | 'start' | 'reinstall') => {
    if (action === 'reinstall') {
      setShowReinstallModal(true);
      return;
    }
    try {
      const res = await fetch('/api/vps/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      showToast(data.message || 'Power action executed');
      fetchAllData();
    } catch (err) {
      showToast('Power command failed');
    }
  };

  const handleConfirmReinstall = async (newOs: string) => {
    try {
      const res = await fetch('/api/vps/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reinstall', newOs }),
      });
      const data = await res.json();
      setShowReinstallModal(false);
      showToast(data.message || `OS reinstalled with ${newOs}`);
      fetchAllData();
    } catch (err) {
      showToast('OS reinstallation failed');
    }
  };

  // Container Lifecycle Actions
  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    try {
      const res = await fetch(`/api/vps/containers/${id}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast(`Container ${action} completed`);
        fetchAllData();
      }
    } catch (err) {
      showToast(`Action ${action} failed`);
    }
  };

  // Create Container
  const handleCreateContainer = async (data: {
    name: string;
    image: string;
    hostPort?: number;
    containerPort?: number;
    env?: Record<string, string>;
    command?: string;
  }) => {
    try {
      const res = await fetch('/api/vps/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setCreateModalConfig({ open: false });
        showToast(lang === 'fa' ? `کانتینر ${data.name} با موفقیت راه‌اندازی شد.` : `Container ${data.name} deployed.`);
        fetchAllData();
      }
    } catch (err) {
      showToast('Failed to deploy container');
    }
  };

  // Deploy Compose
  const handleDeployCompose = async (yaml: string, stackName: string) => {
    setIsDeployingCompose(true);
    try {
      const res = await fetch('/api/vps/compose/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yamlContent: yaml, stackName }),
      });
      const data = await res.json();
      showToast(data.message || 'Compose stack deployed');
      await fetchAllData();
    } catch (err) {
      showToast('Failed to deploy Compose stack');
    } finally {
      setIsDeployingCompose(false);
    }
  };

  // Open Terminal with specific command
  const handleOpenTerminalWithCommand = (cmd: string) => {
    setTerminalInitialCmd(cmd);
    setActiveTab('terminal');
  };

  // Add & Delete Firewall Rules
  const handleAddFirewallRule = async (rule: { port: number; protocol: string; action: string; description: string }) => {
    try {
      const res = await fetch('/api/vps/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        showToast(lang === 'fa' ? `قانون پورت ${rule.port} ذخیره شد.` : `Firewall rule for port ${rule.port} added.`);
        fetchAllData();
      }
    } catch (err) {
      showToast('Failed to add rule');
    }
  };

  const handleDeleteFirewallRule = async (id: string) => {
    try {
      const res = await fetch(`/api/vps/firewall/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(lang === 'fa' ? 'قانون فایروال حذف شد.' : 'Firewall rule removed.');
        fetchAllData();
      }
    } catch (err) {
      showToast('Failed to delete rule');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 3-Zone Top Navigation Bar */}
      <TopNav
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemInfo={systemInfo}
        onPowerAction={handlePowerAction}
        onRefresh={fetchAllData}
        isRefreshing={isRefreshing}
        currentUser={currentUser}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={() => {
          showToast(lang === 'fa' ? 'نشست ریست شد' : 'Session reset');
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'desktop' && (
          <DesktopTab lang={lang} systemInfo={systemInfo} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            lang={lang}
            systemInfo={systemInfo}
            containers={containers}
            onOpenCreateModal={(img, name) => setCreateModalConfig({ open: true, image: img, name })}
            onNavigateTab={setActiveTab}
            onContainerAction={(id, act) => handleContainerAction(id, act)}
          />
        )}

        {activeTab === 'browser' && (
          <BrowserTab
            lang={lang}
            systemInfo={systemInfo}
            onDeployBrowserContainer={() =>
              setCreateModalConfig({
                open: true,
                image: 'kasmweb/chromium:1.15.0',
                name: 'cloud-chromium-browser',
              })
            }
          />
        )}

        {activeTab === 'containers' && (
          <ContainersTab
            lang={lang}
            containers={containers}
            onContainerAction={handleContainerAction}
            onOpenCreateModal={() => setCreateModalConfig({ open: true })}
            onOpenTerminalWithCommand={handleOpenTerminalWithCommand}
          />
        )}

        {activeTab === 'compose' && (
          <ComposeTab
            lang={lang}
            onDeployCompose={handleDeployCompose}
            isDeploying={isDeployingCompose}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            lang={lang}
            systemInfo={systemInfo}
            initialCommand={terminalInitialCmd}
          />
        )}

        {activeTab === 'network' && (
          <NetworkTab
            lang={lang}
            firewallRules={firewallRules}
            systemInfo={systemInfo}
            onAddRule={handleAddFirewallRule}
            onDeleteRule={handleDeleteFirewallRule}
          />
        )}

        {activeTab === 'deploy-guide' && <DeployGuideTab lang={lang} />}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Create Container Dialog Modal */}
      {createModalConfig.open && (
        <CreateContainerModal
          lang={lang}
          initialImage={createModalConfig.image}
          initialName={createModalConfig.name}
          onClose={() => setCreateModalConfig({ open: false })}
          onSubmit={handleCreateContainer}
        />
      )}

      {/* Reinstall OS Modal */}
      {showReinstallModal && (
        <ReinstallModal
          lang={lang}
          currentOs={systemInfo?.osType || 'Ubuntu 24.04 LTS'}
          onClose={() => setShowReinstallModal(false)}
          onConfirmReinstall={handleConfirmReinstall}
        />
      )}

      {/* Change Password & Username Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          lang={lang}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            showToast(lang === 'fa' ? 'اطلاعات ورود با موفقیت ذخیره شد' : 'Credentials updated successfully');
          }}
        />
      )}
    </div>
  );
}
