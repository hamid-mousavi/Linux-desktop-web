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
import { LoginGate } from './components/LoginGate';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Language, t } from './translations';
import { SystemInfo, Container, FirewallRule } from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('vps_auth_token');
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('vps_auth_user') || 'admin';
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('desktop');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
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

  if (!isAuthenticated) {
    return (
      <LoginGate
        lang={lang}
        systemInfo={systemInfo}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          showToast(lang === 'fa' ? 'خوش آمدید!' : 'Welcome!');
        }}
      />
    );
  }

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
          localStorage.removeItem('vps_auth_token');
          setIsAuthenticated(false);
          showToast(lang === 'fa' ? 'صفحه قفل شد' : 'Session locked');
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
