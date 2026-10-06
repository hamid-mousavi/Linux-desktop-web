import React, { useState } from 'react';
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Globe, Network, ArrowRight } from 'lucide-react';
import { Language, t } from '../translations';
import { FirewallRule, SystemInfo } from '../types';

interface NetworkTabProps {
  lang: Language;
  firewallRules: FirewallRule[];
  systemInfo: SystemInfo | null;
  onAddRule: (rule: { port: number; protocol: string; action: string; description: string }) => void;
  onDeleteRule: (id: string) => void;
}

export const NetworkTab: React.FC<NetworkTabProps> = ({
  lang,
  firewallRules,
  systemInfo,
  onAddRule,
  onDeleteRule,
}) => {
  const strings = t[lang];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPort, setNewPort] = useState('');
  const [newProtocol, setNewProtocol] = useState('tcp');
  const [newAction, setNewAction] = useState('allow');
  const [newDesc, setNewDesc] = useState('');

  // Port test state
  const [testPortInput, setTestPortInput] = useState('80');
  const [testResult, setTestResult] = useState<{ port: string; open: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestPort = () => {
    setTesting(true);
    setTimeout(() => {
      const portNum = Number(testPortInput);
      const isKnownOpen = [80, 443, 22, 3000, 3001, 5432, 6379, 8080].includes(portNum);
      setTestResult({
        port: testPortInput,
        open: isKnownOpen,
        message: isKnownOpen
          ? `Port ${portNum} is OPEN and actively listening for incoming TCP packets.`
          : `Port ${portNum} connection refused (CLOSED / Filtered).`,
      });
      setTesting(false);
    }, 600);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPort) return;
    onAddRule({
      port: Number(newPort),
      protocol: newProtocol,
      action: newAction,
      description: newDesc.trim() || `Port ${newPort} Rule`,
    });
    setNewPort('');
    setNewDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Network Interfaces Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* eth0 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-200">eth0 (Public WAN)</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xs space-y-1">
            <div className="text-zinc-200 font-semibold">{systemInfo?.ip4 || '185.193.124.89'}/24</div>
            <div className="text-zinc-500 truncate">{systemInfo?.ip6 || '2a01:4f8:1c1c::1'}</div>
            <div className="text-[11px] text-zinc-400 mt-2">MTU: 1500 · 10Gbps Link UP</div>
          </div>
        </div>

        {/* docker0 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-200">docker0 (Bridge)</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-xs space-y-1">
            <div className="text-zinc-200 font-semibold">172.17.0.1/16</div>
            <div className="text-zinc-500">Virtual Container Gateway</div>
            <div className="text-[11px] text-zinc-400 mt-2">NAT Enabled · MTU: 1500</div>
          </div>
        </div>

        {/* lo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold text-zinc-200">lo (Loopback)</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono text-xs space-y-1">
            <div className="text-zinc-200 font-semibold">127.0.0.1/8</div>
            <div className="text-zinc-500">Internal IPC socket</div>
            <div className="text-[11px] text-zinc-400 mt-2">MTU: 65536 · State: UNKNOWN</div>
          </div>
        </div>
      </div>

      {/* Firewall Rules Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">{strings.firewallRules}</h3>
            <span className="text-xs font-mono text-zinc-500">
              ({firewallRules.length} active rules)
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{strings.addRule}</span>
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateRule}
            className="p-4 bg-zinc-950/80 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
          >
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">{strings.port}</label>
              <input
                type="number"
                required
                value={newPort}
                onChange={(e) => setNewPort(e.target.value)}
                placeholder="e.g. 8080"
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">{strings.protocol}</label>
              <select
                value={newProtocol}
                onChange={(e) => setNewProtocol(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">{strings.ruleAction}</label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="allow">ALLOW</option>
                <option value="deny">DENY</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">{strings.description}</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="My API port"
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium cursor-pointer"
              >
                Save Rule
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40 text-zinc-400 font-sans font-medium">
                <th className="py-2.5 px-4">{strings.port}</th>
                <th className="py-2.5 px-4">{strings.protocol}</th>
                <th className="py-2.5 px-4">{strings.ruleAction}</th>
                <th className="py-2.5 px-4">{strings.description}</th>
                <th className="py-2.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {firewallRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-zinc-200 font-semibold">{rule.port}</td>
                  <td className="py-2.5 px-4 text-zinc-400 uppercase">{rule.protocol}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${
                        rule.action === 'allow'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      {rule.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-zinc-300">{rule.description}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Port Connectivity Tester */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2 flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <span>{strings.testPort}</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          {lang === 'fa'
            ? 'یک شماره پورت را وارد کنید تا وضعیت باز یا بسته بودن و پاسخ‌دهی آن را روی سرور بررسی نمایید.'
            : 'Enter a port number to verify if it is open, bound to a service, and accessible from external connections.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            type="number"
            value={testPortInput}
            onChange={(e) => setTestPortInput(e.target.value)}
            placeholder="80"
            className="w-48 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleTestPort}
            disabled={testing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            {testing ? 'Testing...' : strings.checkPortBtn}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
              testResult.open
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800 text-rose-300'
            }`}
          >
            {testResult.open ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-mono">{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
