import React, { useState } from 'react';
import { Layers, Play, Square, Check, RefreshCw, FileCode, CheckCircle2 } from 'lucide-react';
import { Language, t } from '../translations';

interface ComposeTabProps {
  lang: Language;
  onDeployCompose: (yaml: string, name: string) => Promise<void>;
  isDeploying: boolean;
}

const TEMPLATES = [
  {
    name: 'microservices',
    label: 'Modern Microservices (Node + Redis + Postgres)',
    yaml: `version: '3.8'

services:
  api-gateway:
    image: node:20-alpine
    container_name: compose_api_gateway
    restart: always
    ports:
      - "4000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=compose_redis
      - DB_HOST=compose_db
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7.2-alpine
    container_name: compose_redis
    ports:
      - "6380:6379"

  postgres:
    image: postgres:16-alpine
    container_name: compose_db
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: vps_user
      POSTGRES_PASSWORD: secret_password
      POSTGRES_DB: app_production
`,
  },
  {
    name: 'web-lemp',
    label: 'Nginx Web Proxy & Static Hosting',
    yaml: `version: '3.8'

services:
  web-proxy:
    image: nginx:1.25-alpine
    container_name: compose_nginx_proxy
    restart: unless-stopped
    ports:
      - "8081:80"
      - "8443:443"
    environment:
      - NGINX_HOST=app.example.com
      - NGINX_PORT=80
`,
  },
  {
    name: 'ai-python',
    label: 'AI & Python FastAPI + Celery Worker',
    yaml: `version: '3.8'

services:
  fastapi-app:
    image: python:3.11-slim
    container_name: compose_fastapi_server
    ports:
      - "8001:8000"
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    environment:
      - CELERY_BROKER_URL=redis://compose_redis:6379/0

  redis-queue:
    image: redis:7.2-alpine
    container_name: compose_task_queue
    ports:
      - "6381:6379"
`,
  },
];

export const ComposeTab: React.FC<ComposeTabProps> = ({
  lang,
  onDeployCompose,
  isDeploying,
}) => {
  const strings = t[lang];
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].name);
  const [yamlContent, setYamlContent] = useState(TEMPLATES[0].yaml);
  const [deployOutput, setDeployOutput] = useState<string[]>([]);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const handleSelectTemplate = (name: string) => {
    setSelectedTemplate(name);
    const tmpl = TEMPLATES.find((t) => t.name === name);
    if (tmpl) {
      setYamlContent(tmpl.yaml);
      setDeployOutput([]);
      setDeploySuccess(false);
    }
  };

  const handleDeploy = async () => {
    setDeployOutput([
      `[${new Date().toLocaleTimeString()}] Parsing docker-compose.yml...`,
      `[${new Date().toLocaleTimeString()}] Creating bridge network "stack_${selectedTemplate}_default"...`,
      `[${new Date().toLocaleTimeString()}] Pulling target container images...`,
      `[${new Date().toLocaleTimeString()}] Building container service graph...`,
    ]);

    await onDeployCompose(yamlContent, selectedTemplate);

    setDeployOutput((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ✔ Services instantiated successfully!`,
      `[${new Date().toLocaleTimeString()}] Containers are now running and registered in the Containers tab.`,
    ]);
    setDeploySuccess(true);
  };

  const handleTearDown = () => {
    setDeployOutput([
      `[${new Date().toLocaleTimeString()}] Stopping containers in stack "${selectedTemplate}"...`,
      `[${new Date().toLocaleTimeString()}] Removing containers...`,
      `[${new Date().toLocaleTimeString()}] Removing network "stack_${selectedTemplate}_default"...`,
      `[${new Date().toLocaleTimeString()}] ✔ Stack teardown complete.`,
    ]);
    setDeploySuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">{strings.composeTitle}</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{strings.composeDesc}</p>
      </div>

      {/* Template Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">{strings.selectStack}</span>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => handleSelectTemplate(tmpl.name)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedTemplate === tmpl.name
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            {isDeploying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{strings.deployStack}</span>
          </button>
          <button
            onClick={handleTearDown}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-rose-400" />
            <span>{strings.tearDownStack}</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: YAML Code Editor */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-inner">
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-mono">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>docker-compose.yml</span>
            </div>
            <span className="text-[11px] text-zinc-500">YAML v3.8</span>
          </div>
          <textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full p-4 bg-zinc-950 text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed select-text"
          />
        </div>

        {/* Right: Deployment Console Output */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-inner">
          <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{strings.composeLogsTitle}</span>
            </div>
            {deploySuccess && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Running</span>
              </span>
            )}
          </div>

          <div className="p-4 flex-1 font-mono text-xs text-zinc-300 space-y-1 overflow-y-auto min-h-[300px]">
            {deployOutput.length === 0 ? (
              <div className="text-zinc-600 italic">
                {lang === 'fa'
                  ? 'جهت استقرار کانتینرها، دکمه "استقرار استک" را کلیک کنید.'
                  : 'Click "Deploy Stack" above to initialize and launch container services.'}
              </div>
            ) : (
              deployOutput.map((out, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    out.includes('✔') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  {out}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
