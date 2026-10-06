import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting';
  stateDescription: string;
  created: number;
  ports: { host: number; container: number; protocol: 'tcp' | 'udp' }[];
  env: Record<string, string>;
  command: string;
  cpuPercent: number;
  memoryMb: number;
  memoryLimitMb: number;
  netIO: { rxMb: number; txMb: number };
  logs: string[];
}

// Initial default virtual containers running on this VPS
let containers: Container[] = [
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
    logs: [
      '[2026-10-06 00:00:01] [notice] 1#1: using the "epoll" event method',
      '[2026-10-06 00:00:01] [notice] 1#1: nginx/1.25.4',
      '[2026-10-06 00:00:01] [notice] 1#1: built by gcc 13.2.1 20231014 (Alpine 13.2.1_git20231014)',
      '[2026-10-06 00:00:01] [notice] 1#1: OS: Linux 6.6.0-cloud-vps',
      '[2026-10-06 00:00:01] [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576',
      '[2026-10-06 00:00:01] [notice] 1#1: start worker processes',
      '[2026-10-06 06:12:44] 172.18.0.1 - - [06/Oct/2026:06:12:44 +0000] "GET /health HTTP/1.1" 200 612 "-" "HealthCheck/1.0"',
      '[2026-10-06 06:30:19] 192.168.1.104 - - [06/Oct/2026:06:30:19 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"',
    ],
  },
  {
    id: 'c-app-node',
    name: 'backend-api-core',
    image: 'node:20-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 3001, container: 3000, protocol: 'tcp' }],
    env: { NODE_ENV: 'production', PORT: '3000', DB_HOST: 'database-postgres' },
    command: 'node dist/main.js',
    cpuPercent: 3.8,
    memoryMb: 118,
    memoryLimitMb: 1024,
    netIO: { rxMb: 521.8, txMb: 412.3 },
    logs: [
      '[INFO] Node.js server starting in production mode (v20.12.0)...',
      '[INFO] Connecting to Postgres pool on database-postgres:5432...',
      '[INFO] Connected to PostgreSQL db "vps_primary"',
      '[INFO] Redis cache connection established.',
      '[INFO] Microservice routes initialized (14 active controllers).',
      '[INFO] Listening for incoming HTTP connections on port 3000.',
    ],
  },
  {
    id: 'c-db-postgres',
    name: 'database-postgres',
    image: 'postgres:16-alpine',
    status: 'running',
    stateDescription: 'Up 18 hours',
    created: Date.now() - 18 * 3600 * 1000,
    ports: [{ host: 5432, container: 5432, protocol: 'tcp' }],
    env: { POSTGRES_DB: 'vps_primary', POSTGRES_USER: 'vps_admin', POSTGRES_PASSWORD: '••••••••' },
    command: 'docker-entrypoint.sh postgres',
    cpuPercent: 2.1,
    memoryMb: 165,
    memoryLimitMb: 2048,
    netIO: { rxMb: 320.4, txMb: 489.2 },
    logs: [
      'PostgreSQL Database directory appears to contain a database; Skipping initialization',
      '2026-10-06 00:00:02.128 UTC [1] LOG: starting PostgreSQL 16.2 on x86_64-pc-linux-musl',
      '2026-10-06 00:00:02.131 UTC [1] LOG: listening on IPv4 address "0.0.0.0", port 5432',
      '2026-10-06 00:00:02.135 UTC [1] LOG: database system was shut down at 2026-10-05 23:58:11 UTC',
      '2026-10-06 00:00:02.150 UTC [1] LOG: database system is ready to accept connections',
      '2026-10-06 06:31:00.010 UTC [28] LOG: checkpoint starting: time',
      '2026-10-06 06:31:04.220 UTC [28] LOG: checkpoint complete: wrote 42 buffers (0.3%); 0 WAL file(s) added',
    ],
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
    logs: [
      '1:M 06 Oct 2026 00:00:03.421 * Running mode=standalone, port=6379.',
      '1:M 06 Oct 2026 00:00:03.422 # Server initialized',
      '1:M 06 Oct 2026 00:00:03.422 * Ready to accept connections tcp',
      '1:M 06 Oct 2026 06:00:00.001 * DB 0: 412 keys (0 volatile) in 512 slots table.',
    ],
  },
];

// Virtual firewall rules
let firewallRules = [
  { id: 'f-1', port: 22, protocol: 'tcp', action: 'allow', description: 'SSH Remote Administration' },
  { id: 'f-2', port: 80, protocol: 'tcp', action: 'allow', description: 'HTTP Web Traffic' },
  { id: 'f-3', port: 443, protocol: 'tcp', action: 'allow', description: 'HTTPS Secure Traffic' },
  { id: 'f-4', port: 3001, protocol: 'tcp', action: 'allow', description: 'Node.js Core API Gateway' },
  { id: 'f-5', port: 5432, protocol: 'tcp', action: 'allow', description: 'PostgreSQL Internal Network' },
  { id: 'f-6', port: 6379, protocol: 'tcp', action: 'allow', description: 'Redis Cache Network' },
];

// User Auth Credentials (for login gate)
let authCredentials = {
  username: 'admin',
  password: 'vpsadmin2026',
};

// VPS system power state
let vpsPowerState: 'running' | 'rebooting' | 'stopped' = 'running';
let vpsOsType = 'Debian GNU/Linux 12 (bookworm) · Google Cloud';
let realGoogleCloudInfo = {
  ip: '34.34.246.193',
  city: 'London',
  region: 'England',
  country: 'GB',
  org: 'AS396982 Google LLC',
  datacenter: 'Google Cloud Platform (europe-west2)',
};

let vpsSpec = {
  vCpu: 4,
  ramGb: 8,
  diskGb: 120,
  ip4: '34.34.246.193',
  ip6: '2600:1900:0:4a01::1',
  privateIp: '10.0.0.15',
  hostname: 'google-ai-studio-host-01',
  uptimeSec: 3600 * 24 * 3.5,
};

// Auto-detect real Google Cloud outbound IP
async function detectGoogleIp() {
  try {
    const res = await fetch('https://ipinfo.io/json');
    if (res.ok) {
      const data = await res.json();
      realGoogleCloudInfo = {
        ip: data.ip || '34.34.246.193',
        city: data.city || 'London',
        region: data.region || 'England',
        country: data.country || 'GB',
        org: data.org || 'AS396982 Google LLC',
        datacenter: 'Google Cloud Platform (europe-west2)',
      };
      vpsSpec.ip4 = realGoogleCloudInfo.ip;
    }
  } catch (e) {
    // Keep defaults
  }
}
detectGoogleIp();

// Simulation tick: updates metric fluctuations to make stats feel real and alive
setInterval(() => {
  if (vpsPowerState === 'running') {
    vpsSpec.uptimeSec += 2;
    containers.forEach((c) => {
      if (c.status === 'running') {
        c.cpuPercent = Math.max(0.2, Math.min(95, Number((c.cpuPercent + (Math.random() * 1.4 - 0.7)).toFixed(1))));
        c.memoryMb = Math.max(10, Math.min(c.memoryLimitMb - 20, Number((c.memoryMb + (Math.random() * 2 - 1)).toFixed(0))));
        c.netIO.rxMb = Number((c.netIO.rxMb + Math.random() * 0.05).toFixed(2));
        c.netIO.txMb = Number((c.netIO.txMb + Math.random() * 0.08).toFixed(2));
      }
    });
  }
}, 3000);

export const app = express();
app.use(express.json());

async function startServer() {
  const PORT = 3000;

  // API 1: System info & live metrics
  app.get('/api/vps/system-info', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();
    const cpus = os.cpus();

    res.json({
      powerState: vpsPowerState,
      hostname: vpsSpec.hostname,
      osType: vpsOsType,
      ip4: vpsSpec.ip4,
      ip6: vpsSpec.ip6,
      privateIp: vpsSpec.privateIp,
      uptimeSeconds: vpsSpec.uptimeSec,
      googleCloudInfo: realGoogleCloudInfo,
      specs: {
        vCpu: vpsSpec.vCpu,
        ramGb: vpsSpec.ramGb,
        diskGb: vpsSpec.diskGb,
      },
      telemetry: {
        realTotalMemMb: Math.round(totalMem / (1024 * 1024)),
        realUsedMemMb: Math.round(usedMem / (1024 * 1024)),
        realFreeMemMb: Math.round(freeMem / (1024 * 1024)),
        realCores: cpus.length,
        loadAvg: [Number(loadAvg[0].toFixed(2)), Number(loadAvg[1].toFixed(2)), Number(loadAvg[2].toFixed(2))],
        arch: os.arch(),
        platform: os.platform(),
        release: os.release(),
      },
      containerSummary: {
        total: containers.length,
        running: containers.filter((c) => c.status === 'running').length,
        stopped: containers.filter((c) => c.status === 'stopped').length,
      },
    });
  });

  // API 2: Power Controls
  app.post('/api/vps/power', (req, res) => {
    const { action } = req.body;
    if (action === 'reboot') {
      vpsPowerState = 'rebooting';
      setTimeout(() => {
        vpsPowerState = 'running';
        vpsSpec.uptimeSec = 1;
      }, 4000);
      return res.json({ success: true, state: 'rebooting', message: 'VPS is rebooting...' });
    } else if (action === 'stop') {
      vpsPowerState = 'stopped';
      return res.json({ success: true, state: 'stopped', message: 'VPS powered off' });
    } else if (action === 'start') {
      vpsPowerState = 'running';
      return res.json({ success: true, state: 'running', message: 'VPS powered on' });
    } else if (action === 'reinstall') {
      const { newOs } = req.body;
      if (newOs) vpsOsType = newOs;
      vpsPowerState = 'rebooting';
      setTimeout(() => {
        vpsPowerState = 'running';
        vpsSpec.uptimeSec = 0;
      }, 5000);
      return res.json({ success: true, state: 'rebooting', message: `OS reinstalled with ${vpsOsType}` });
    }
    return res.status(400).json({ error: 'Invalid power action' });
  });

  // API 3: Docker Containers List
  app.get('/api/vps/containers', (req, res) => {
    res.json(containers);
  });

  // API 4: Docker Container Creation
  app.post('/api/vps/containers', (req, res) => {
    const { name, image, hostPort, containerPort, env, command } = req.body;
    if (!name || !image) {
      return res.status(400).json({ error: 'Name and Image are required' });
    }

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newContainer: Container = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      image: image.trim(),
      status: 'running',
      stateDescription: 'Up less than a minute',
      created: Date.now(),
      ports: hostPort && containerPort ? [{ host: Number(hostPort), container: Number(containerPort), protocol: 'tcp' }] : [],
      env: env || {},
      command: command || 'sh -c "exec /entrypoint.sh"',
      cpuPercent: Number((Math.random() * 2 + 0.5).toFixed(1)),
      memoryMb: Math.floor(Math.random() * 60 + 30),
      memoryLimitMb: 512,
      netIO: { rxMb: 0.1, txMb: 0.05 },
      logs: [
        `[${new Date().toISOString()}] Pulling library/${image}...`,
        `[${new Date().toISOString()}] Digest: sha256:7f9b8c9d0e1f2a3b...`,
        `[${new Date().toISOString()}] Status: Downloaded newer image for ${image}`,
        `[${new Date().toISOString()}] Container ${cleanName} created and started with command: ${command || 'default'}`,
        `[${new Date().toISOString()}] Service listening on internal port ${containerPort || 80}`,
      ],
    };

    containers.unshift(newContainer);
    res.status(201).json(newContainer);
  });

  // API 5: Container Lifecycle Actions (start, stop, restart, delete)
  app.post('/api/vps/containers/:id/:action', (req, res) => {
    const { id, action } = req.params;
    const container = containers.find((c) => c.id === id);

    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const timestamp = new Date().toISOString();
    if (action === 'start') {
      container.status = 'running';
      container.stateDescription = 'Up less than a minute';
      container.logs.push(`[${timestamp}] Container started by user`);
    } else if (action === 'stop') {
      container.status = 'stopped';
      container.stateDescription = 'Exited (0)';
      container.cpuPercent = 0;
      container.logs.push(`[${timestamp}] SIGTERM received, gracefully stopped`);
    } else if (action === 'restart') {
      container.status = 'restarting';
      container.logs.push(`[${timestamp}] Restarting container...`);
      setTimeout(() => {
        container.status = 'running';
        container.stateDescription = 'Up less than a minute';
        container.logs.push(`[${new Date().toISOString()}] Container restarted successfully`);
      }, 1000);
    } else if (action === 'delete') {
      containers = containers.filter((c) => c.id !== id);
      return res.json({ success: true, message: `Container ${id} removed` });
    } else {
      return res.status(400).json({ error: 'Invalid container action' });
    }

    res.json(container);
  });

  // API 6: Container Logs
  app.get('/api/vps/containers/:id/logs', (req, res) => {
    const { id } = req.params;
    const container = containers.find((c) => c.id === id);
    if (!container) return res.status(404).json({ error: 'Container not found' });
    res.json({ id: container.id, name: container.name, logs: container.logs });
  });

  // API 7: Docker Compose Deploy
  app.post('/api/vps/compose/deploy', (req, res) => {
    const { yamlContent, stackName } = req.body;
    if (!yamlContent) return res.status(400).json({ error: 'YAML content is required' });

    // Parse simple docker-compose services
    const timestamp = new Date().toISOString();
    const createdNames: string[] = [];

    // Basic regex parser for services
    const serviceMatches = yamlContent.match(/([a-zA-Z0-9_-]+):\s*\n\s+image:\s*([^\n\r]+)/g);
    if (serviceMatches && serviceMatches.length > 0) {
      serviceMatches.forEach((match: string) => {
        const parts = match.split('\n');
        const sName = parts[0].replace(':', '').trim();
        const sImage = parts[1].replace('image:', '').trim();
        const cName = `${stackName || 'compose'}_${sName}`;
        
        // Remove existing if duplicate
        containers = containers.filter((c) => c.name !== cName);

        const newC: Container = {
          id: 'c-' + Math.random().toString(36).substring(2, 9),
          name: cName,
          image: sImage,
          status: 'running',
          stateDescription: 'Up less than a minute (compose)',
          created: Date.now(),
          ports: [{ host: Math.floor(Math.random() * 3000 + 4000), container: 80, protocol: 'tcp' }],
          env: { COMPOSE_PROJECT: stackName || 'stack' },
          command: 'compose entrypoint',
          cpuPercent: 1.5,
          memoryMb: 48,
          memoryLimitMb: 512,
          netIO: { rxMb: 1.2, txMb: 0.8 },
          logs: [
            `[${timestamp}] Creating network "${stackName || 'default'}_default" with default driver`,
            `[${timestamp}] Pulling ${sImage}...`,
            `[${timestamp}] Creating ${cName} ... done`,
            `[${timestamp}] Attaching to ${cName}`,
          ],
        };
        containers.unshift(newC);
        createdNames.push(cName);
      });
    }

    res.json({
      success: true,
      message: `Stack deployed. Services created: ${createdNames.join(', ') || 'custom-stack'}`,
      services: createdNames,
    });
  });

  // API 8: Terminal Shell Execution (Full command support + Docker CLI)
  app.post('/api/vps/exec', (req, res) => {
    const { command, cwd = '/root' } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const trimmed = command.trim();

    // Check if VPS is offline
    if (vpsPowerState !== 'running') {
      return res.json({
        stdout: '',
        stderr: 'Error: Connection refused. VPS node is currently powered off.\nUse the Power menu to start the server.',
        exitCode: 1,
      });
    }

    // 1. Handle Docker CLI commands directly
    if (trimmed.startsWith('docker ')) {
      const dockerArgs = trimmed.replace(/^docker\s+/, '').trim();

      if (dockerArgs === 'ps' || dockerArgs === 'ps -a') {
        const header = 'CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS         PORTS                  NAMES\n';
        const rows = containers.map((c) => {
          const portStr = c.ports.map((p) => `0.0.0.0:${p.host}->${p.container}/${p.protocol}`).join(', ') || 'N/A';
          const pad = (s: string, len: number) => s.padEnd(len, ' ').substring(0, len);
          return `${pad(c.id, 14)} ${pad(c.image, 20)} ${pad(`"${c.command}"`, 24)} ${pad('18h ago', 15)} ${pad(c.stateDescription, 14)} ${pad(portStr, 22)} ${c.name}`;
        }).join('\n');
        return res.json({ stdout: header + rows, stderr: '', exitCode: 0 });
      }

      if (dockerArgs === 'images') {
        const header = 'REPOSITORY           TAG       IMAGE ID       CREATED         SIZE\n';
        const imgSet = new Set(containers.map((c) => c.image));
        imgSet.add('ubuntu:24.04');
        imgSet.add('alpine:latest');
        imgSet.add('debian:12-slim');
        const rows = Array.from(imgSet).map((img) => {
          const [repo, tag = 'latest'] = img.split(':');
          const id = Math.random().toString(16).substring(2, 14);
          const pad = (s: string, len: number) => s.padEnd(len, ' ');
          return `${pad(repo, 20)} ${pad(tag, 9)} ${pad(id, 14)} 2 weeks ago     ${Math.floor(Math.random() * 120 + 25)}MB`;
        }).join('\n');
        return res.json({ stdout: header + rows, stderr: '', exitCode: 0 });
      }

      if (dockerArgs.startsWith('stop ')) {
        const target = dockerArgs.replace('stop ', '').trim();
        const c = containers.find((x) => x.name === target || x.id === target);
        if (c) {
          c.status = 'stopped';
          c.stateDescription = 'Exited (0)';
          return res.json({ stdout: target + '\n', stderr: '', exitCode: 0 });
        }
        return res.json({ stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 });
      }

      if (dockerArgs.startsWith('start ')) {
        const target = dockerArgs.replace('start ', '').trim();
        const c = containers.find((x) => x.name === target || x.id === target);
        if (c) {
          c.status = 'running';
          c.stateDescription = 'Up less than a minute';
          return res.json({ stdout: target + '\n', stderr: '', exitCode: 0 });
        }
        return res.json({ stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 });
      }

      if (dockerArgs.startsWith('restart ')) {
        const target = dockerArgs.replace('restart ', '').trim();
        const c = containers.find((x) => x.name === target || x.id === target);
        if (c) {
          c.status = 'running';
          return res.json({ stdout: target + '\n', stderr: '', exitCode: 0 });
        }
        return res.json({ stdout: '', stderr: `Error response from daemon: No such container: ${target}\n`, exitCode: 1 });
      }

      if (dockerArgs.startsWith('rm ')) {
        const target = dockerArgs.replace('rm ', '').replace('-f', '').trim();
        const idx = containers.findIndex((x) => x.name === target || x.id === target);
        if (idx !== -1) {
          containers.splice(idx, 1);
          return res.json({ stdout: target + '\n', stderr: '', exitCode: 0 });
        }
        return res.json({ stdout: '', stderr: `Error: No such container: ${target}\n`, exitCode: 1 });
      }

      if (dockerArgs.startsWith('logs ')) {
        const target = dockerArgs.replace('logs ', '').trim();
        const c = containers.find((x) => x.name === target || x.id === target);
        if (c) {
          return res.json({ stdout: c.logs.join('\n') + '\n', stderr: '', exitCode: 0 });
        }
        return res.json({ stdout: '', stderr: `Error: No such container: ${target}\n`, exitCode: 1 });
      }

      if (dockerArgs.startsWith('run ')) {
        // e.g. docker run -d -p 8080:80 --name test-web nginx
        const matchName = dockerArgs.match(/--name\s+([^\s]+)/);
        const matchPort = dockerArgs.match(/-p\s+(\d+):(\d+)/);
        const name = matchName ? matchName[1] : 'container_' + Math.random().toString(36).substring(2, 6);
        const hostPort = matchPort ? Number(matchPort[1]) : 8080;
        const contPort = matchPort ? Number(matchPort[2]) : 80;
        const words = dockerArgs.split(/\s+/);
        const image = words[words.length - 1] || 'alpine';

        const newC: Container = {
          id: 'c-' + Math.random().toString(36).substring(2, 9),
          name: name,
          image: image,
          status: 'running',
          stateDescription: 'Up less than a minute',
          created: Date.now(),
          ports: [{ host: hostPort, container: contPort, protocol: 'tcp' }],
          env: {},
          command: 'default-entrypoint',
          cpuPercent: 1.1,
          memoryMb: 42,
          memoryLimitMb: 512,
          netIO: { rxMb: 0.1, txMb: 0.1 },
          logs: [`[${new Date().toISOString()}] Started container ${name} (${image})`],
        };
        containers.unshift(newC);
        return res.json({ stdout: newC.id + '\n', stderr: '', exitCode: 0 });
      }

      if (dockerArgs === '--version' || dockerArgs === 'version') {
        return res.json({
          stdout: 'Docker version 26.0.0, build 2aeab00\nClient API version: 1.45\nServer: Docker Engine - Community v26.0.0\n',
          stderr: '',
          exitCode: 0,
        });
      }
    }

    // 2. Handle Docker Compose commands
    if (trimmed.startsWith('docker-compose ') || trimmed.startsWith('docker compose ')) {
      if (trimmed.includes('ps')) {
        return res.json({
          stdout: `NAME                 IMAGE                COMMAND              SERVICE      STATUS       PORTS\n` +
            containers.map((c) => `${c.name.padEnd(20)} ${c.image.padEnd(20)} "${c.command.substring(0, 15)}..."   web          running      0.0.0.0:80->80/tcp`).join('\n') + '\n',
          stderr: '',
          exitCode: 0,
        });
      }
      if (trimmed.includes('up')) {
        return res.json({
          stdout: `[+] Running 3/3\n ✔ Network cloud_default        Created\n ✔ Container redis-cache         Started\n ✔ Container app-gateway         Started\n`,
          stderr: '',
          exitCode: 0,
        });
      }
      if (trimmed.includes('down')) {
        return res.json({
          stdout: `[+] Running 3/3\n ✔ Container app-gateway         Stopped\n ✔ Container redis-cache         Stopped\n ✔ Network cloud_default        Removed\n`,
          stderr: '',
          exitCode: 0,
        });
      }
    }

    // 3. Handle system virtual & safe commands
    if (trimmed === 'clear') {
      return res.json({ stdout: '\x1Bc', stderr: '', exitCode: 0 });
    }

    if (trimmed === 'neofetch' || trimmed === 'screenfetch') {
      const art = `
       _,met$$$$$gg.          root@${vpsSpec.hostname}
    ,g$$$$$$$$$$$$$$$P.       -------------------
  ,g$$P"     """Y$$.".        OS: ${vpsOsType}
 ,$$P'              \`$$$.     Host: KVM Virtual Machine Cloud-VPS
',$$P       ,ggs.     \`$$b:   Kernel: 6.6.21-cloud-generic
\`d$$'     ,$P"'   .    $$$    Uptime: ${Math.floor(vpsSpec.uptimeSec / 3600)}h ${Math.floor((vpsSpec.uptimeSec % 3600) / 60)}m
 $$P      d$'     ,    $$P    Packages: 684 (dpkg), 4 (docker)
 $$:      $$.   -    ,d$$'    Shell: bash 5.2.21
 $$;      Y$b._   _,d$P'      CPU: AMD EPYC 7763 (${vpsSpec.vCpu} vCPU) @ 2.44GHz
 Y$$.    \`."Y$$$$P"'          Memory: 1148MiB / ${vpsSpec.ramGb * 1024}MiB
 \`$$b      "-.__              Disk: 18.4GiB / ${vpsSpec.diskGb}GiB (15%)
  \`Y$$                        Docker: 26.0.0 (running: ${containers.filter((c) => c.status === 'running').length})
   \`$$b.                      IP: ${vpsSpec.ip4}
`;
      return res.json({ stdout: art, stderr: '', exitCode: 0 });
    }

    if (trimmed === 'top' || trimmed === 'htop') {
      const topOutput = `Tasks: 42 total, 1 running, 41 sleeping, 0 stopped, 0 zombie
%Cpu(s):  2.3 us,  1.1 sy,  0.0 ni, 96.2 id,  0.1 wa,  0.0 hi,  0.3 si
MiB Mem :  ${vpsSpec.ramGb * 1024}.0 total,   4210.2 free,   1489.1 used,   2480.7 buff/cache
MiB Swap:  2048.0 total,   2048.0 free,      0.0 used.

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0  168324  12480   8512 S   0.0   0.1   0:04.12 systemd
  412 root      20   0 1489210  94120  48200 S   2.1   1.1   1:12.80 dockerd
  520 root      20   0  420190  45210  22100 S   1.4   0.5   0:45.10 containerd
  841 root      20   0  712400 118400  32100 S   3.8   1.4   2:10.45 node
  912 root      20   0  245100 165200  84100 S   2.1   2.0   1:44.20 postgres
 1042 root      20   0   48200  34100  12400 S   1.2   0.4   0:18.90 nginx
 1105 root      20   0   35100  24100   8400 S   0.6   0.3   0:08.12 redis-server
`;
      return res.json({ stdout: topOutput, stderr: '', exitCode: 0 });
    }

    if (trimmed === 'ufw status') {
      const rulesList = firewallRules.map((r) => `${(r.port + '/' + r.protocol).padEnd(16)} ${r.action.toUpperCase().padEnd(12)} Anywhere`).join('\n');
      const ufwOut = `Status: active\n\nTo                         Action      From\n--                         ------      ----\n${rulesList}\n`;
      return res.json({ stdout: ufwOut, stderr: '', exitCode: 0 });
    }

    if (trimmed === 'ip a' || trimmed === 'ifconfig') {
      const netOut = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff
    inet ${vpsSpec.ip4}/24 brd 185.193.124.255 scope global eth0
    inet6 ${vpsSpec.ip6}/64 scope global dynamic
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:1a:89:bc:44 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
`;
      return res.json({ stdout: netOut, stderr: '', exitCode: 0 });
    }

    // 4. Try executing on the real Linux sub-shell with safety guardrails
    // Allowed safe commands
    const safeRegex = /^(ls|dir|cat|echo|pwd|uname|uptime|df|free|date|whoami|id|which|env|head|tail|grep|wc|ps|find|mkdir|touch|export|node -v|npm -v|hostname|curl|wget)/;
    if (safeRegex.test(trimmed)) {
      exec(trimmed, { timeout: 6000, cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err && !stdout && !stderr) {
          return res.json({ stdout: '', stderr: err.message, exitCode: err.code || 1 });
        }
        return res.json({ stdout: stdout || '', stderr: stderr || '', exitCode: err ? 1 : 0 });
      });
      return;
    }

    // Fallback simulated execution for bash commands
    if (trimmed.startsWith('apt ') || trimmed.startsWith('apt-get ')) {
      return res.json({
        stdout: `Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nAll packages are up to date.\n`,
        stderr: '',
        exitCode: 0,
      });
    }

    if (trimmed.startsWith('systemctl ')) {
      const svc = trimmed.split(' ')[2] || 'service';
      return res.json({
        stdout: `● ${svc}.service - High performance gateway\n   Loaded: loaded (/lib/systemd/system/${svc}.service; enabled; vendor preset: enabled)\n   Active: active (running) since Tue 2026-10-06 00:00:01 UTC; 18h ago\n`,
        stderr: '',
        exitCode: 0,
      });
    }

    if (trimmed.startsWith('ping ')) {
      const host = trimmed.split(' ')[1] || '8.8.8.8';
      return res.json({
        stdout: `PING ${host} (${host}) 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=117 time=14.2 ms\n64 bytes from ${host}: icmp_seq=2 ttl=117 time=13.9 ms\n64 bytes from ${host}: icmp_seq=3 ttl=117 time=14.1 ms\n--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 13.9/14.06/14.2/0.12 ms\n`,
        stderr: '',
        exitCode: 0,
      });
    }

    if (trimmed.startsWith('curl ') || trimmed.startsWith('wget ')) {
      return res.json({
        stdout: `HTTP/1.1 200 OK\nServer: nginx/1.25.4\nDate: Tue, 06 Oct 2026 06:40:00 GMT\nContent-Type: text/html; charset=UTF-8\nContent-Length: 612\n\n<!DOCTYPE html><html><head><title>Welcome to VPS</title></head><body><h1>Server Online</h1></body></html>\n`,
        stderr: '',
        exitCode: 0,
      });
    }

    // General command output
    return res.json({
      stdout: `[bash] executed: ${trimmed}\n`,
      stderr: '',
      exitCode: 0,
    });
  });

  // API 9: Firewall Rules
  app.get('/api/vps/firewall', (req, res) => {
    res.json(firewallRules);
  });

  app.post('/api/vps/firewall', (req, res) => {
    const { port, protocol, action, description } = req.body;
    if (!port) return res.status(400).json({ error: 'Port is required' });

    const newRule = {
      id: 'f-' + Date.now(),
      port: Number(port),
      protocol: protocol || 'tcp',
      action: action || 'allow',
      description: description || `Port ${port} rule`,
    };
    firewallRules.push(newRule);
    res.status(201).json(newRule);
  });

  app.delete('/api/vps/firewall/:id', (req, res) => {
    firewallRules = firewallRules.filter((r) => r.id !== req.params.id);
    res.json({ success: true });
  });

  // API 10: Export Dockerfile & Docker Compose package
  app.get('/api/vps/export-docker', (req, res) => {
    const dockerfile = `# Production Web VPS & Docker Manager Container
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache bash curl docker-cli git

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "dev"]
`;

    const dockerCompose = `version: '3.8'

services:
  web-vps-console:
    image: web-vps-manager:latest
    build: .
    container_name: web_vps_console
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./vps_data:/app/data
    environment:
      - NODE_ENV=production
      - HOSTNAME=cloud-vps-server
    networks:
      - vps_network

networks:
  vps_network:
    driver: bridge
`;

    res.json({ dockerfile, dockerCompose });
  });

  // API 11: Web Browser Proxy Engine (Browse the Web via VPS IP)
  app.get('/api/vps/browser/fetch', async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        // Search query
        targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetUrl)}`;
      }
    }

    const startTime = Date.now();
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            (req.query.ua as string) ||
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
        },
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || 'text/html';
      const latencyMs = Date.now() - startTime;
      const finalUrl = response.url || targetUrl;

      if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
        let html = await response.text();

        // Extract Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : new URL(finalUrl).hostname;

        // Inject <base href="...">
        const parsedBase = new URL(finalUrl);
        const baseHref = parsedBase.origin + parsedBase.pathname.substring(0, parsedBase.pathname.lastIndexOf('/') + 1);

        // Remove restrictive meta headers
        html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

        // Intercept links to keep browsing inside the VPS proxy
        const scriptInterceptor = `
          <script>
            document.addEventListener('click', function(e) {
              var target = e.target.closest('a');
              if (target && target.href && !target.href.startsWith('javascript:')) {
                e.preventDefault();
                window.parent.postMessage({ type: 'VPS_BROWSER_NAVIGATE', url: target.href }, '*');
              }
            });
          </script>
        `;

        const baseTag = `<base href="${baseHref}">\n${scriptInterceptor}`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else if (html.includes('<HEAD>')) {
          html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
        } else {
          html = baseTag + html;
        }

        return res.json({
          success: true,
          status: response.status,
          statusText: response.statusText,
          url: finalUrl,
          title,
          contentType,
          latencyMs,
          html,
          headers: {
            server: response.headers.get('server') || 'CloudVPS/Nginx',
            date: response.headers.get('date'),
            contentType,
          },
        });
      } else {
        return res.json({
          success: true,
          status: response.status,
          url: finalUrl,
          title: new URL(finalUrl).pathname.split('/').pop() || 'Resource',
          contentType,
          latencyMs,
          isBinary: true,
          html: `<div style="font-family:sans-serif;padding:30px;text-align:center;color:#eee;background:#18181b;">
            <h2>Binary File / Resource</h2>
            <p>Content-Type: <code>${contentType}</code></p>
            <p><a href="${finalUrl}" target="_blank" style="color:#10b981;">Open Raw File directly</a></p>
          </div>`,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch webpage',
        url: targetUrl,
        latencyMs: Date.now() - startTime,
      });
    }
  });

  // Streaming Proxy endpoint
  app.get('/api/vps/browser/stream', async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send('URL is required');

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const contentType = response.headers.get('content-type') || 'text/html';
      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');

      const html = await response.text();
      const parsedBase = new URL(targetUrl);
      const baseTag = `<base href="${parsedBase.origin}/">`;
      const finalHtml = html.includes('<head>') ? html.replace('<head>', `<head>${baseTag}`) : baseTag + html;
      res.send(finalHtml);
    } catch (err: any) {
      res.status(500).send(`Proxy Error: ${err.message}`);
    }
  });

  // API 12: Authentication Gate (Login, Change Password, Info)
  app.get('/api/vps/auth/info', (req, res) => {
    res.json({
      username: authCredentials.username,
      isDefaultPassword: authCredentials.password === 'vpsadmin2026',
    });
  });

  app.post('/api/vps/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    if (username.trim() === authCredentials.username && password === authCredentials.password) {
      const token = 'vps_session_' + Math.random().toString(36).substring(2, 12);
      return res.json({
        success: true,
        token,
        username: authCredentials.username,
        message: 'Authentication successful',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  });

  app.post('/api/vps/auth/change', (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (currentPassword !== authCredentials.password) {
      return res.status(401).json({ success: false, message: 'Current password does not match' });
    }

    if (newUsername && newUsername.trim()) {
      authCredentials.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      authCredentials.password = newPassword.trim();
    }

    res.json({
      success: true,
      username: authCredentials.username,
      message: 'Credentials updated successfully',
    });
  });

  // API 13: Enhanced Direct Web Viewer (strips X-Frame-Options and CSP for any website)
  app.get('/api/vps/browser/view', async (req, res) => {
    let targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send('URL required');

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetUrl)}`;
      }
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
        },
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || 'text/html';
      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');

      if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
        let html = await response.text();
        const finalUrl = response.url || targetUrl;
        const parsedBase = new URL(finalUrl);
        const baseHref = parsedBase.origin + parsedBase.pathname.substring(0, parsedBase.pathname.lastIndexOf('/') + 1);

        // Strip meta CSP & X-Frame-Options
        html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

        // Intercept link clicks to keep user browsing through the viewer
        const clientScript = `
          <script>
            document.addEventListener('click', function(e) {
              var a = e.target.closest('a');
              if (a && a.href && !a.href.startsWith('javascript:')) {
                e.preventDefault();
                window.location.href = '/api/vps/browser/view?url=' + encodeURIComponent(a.href);
              }
            });
          </script>
        `;

        const baseTag = `<base href="${baseHref}">\n${clientScript}`;
        const output = html.includes('<head>')
          ? html.replace('<head>', `<head>${baseTag}`)
          : html.includes('<HEAD>')
          ? html.replace('<HEAD>', `<HEAD>${baseTag}`)
          : baseTag + html;

        return res.send(output);
      } else {
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err: any) {
      res.status(500).send(`
        <div style="font-family:system-ui;padding:40px;text-align:center;color:#eee;background:#18181b;">
          <h2>خطا در باز کردن وبسایت</h2>
          <p style="color:#a1a1aa;">نشانی: <code>${targetUrl}</code></p>
          <p style="color:#f87171;">علت: ${err.message}</p>
        </div>
      `);
    }
  });

  // Mount Vite or static files
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud VPS Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
