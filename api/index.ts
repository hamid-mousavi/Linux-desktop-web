import express from 'express';

const app = express();
app.use(express.json());

// System Spec & Info for Vercel Serverless
const vpsInfo = {
  powerState: 'running',
  hostname: 'vercel-edge-node-01',
  osType: 'Debian GNU/Linux 12 (bookworm) · Vercel Serverless',
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
    datacenter: 'Vercel / Cloud Run Edge',
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

const mockContainers = [
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

const mockFirewall = [
  { id: 'f-1', port: 22, protocol: 'tcp', action: 'allow', description: 'SSH Remote Administration' },
  { id: 'f-2', port: 80, protocol: 'tcp', action: 'allow', description: 'HTTP Web Traffic' },
  { id: 'f-3', port: 443, protocol: 'tcp', action: 'allow', description: 'HTTPS Secure Traffic' },
  { id: 'f-4', port: 3001, protocol: 'tcp', action: 'allow', description: 'Node.js Core API Gateway' },
];

// 1. System info
app.get('/api/vps/system-info', (req, res) => {
  res.json(vpsInfo);
});

// 2. Containers
app.get('/api/vps/containers', (req, res) => {
  res.json(mockContainers);
});

// 3. Firewall
app.get('/api/vps/firewall', (req, res) => {
  res.json(mockFirewall);
});

// 4. Exec shell
app.post('/api/vps/exec', (req, res) => {
  const cmd = (req.body?.command || '').trim();
  if (cmd.includes('ipinfo') || cmd.includes('ifconfig')) {
    return res.json({
      stdout: JSON.stringify({ ip: '34.34.246.193', city: 'London', region: 'England', country: 'GB', org: 'AS396982 Google LLC' }, null, 2) + '\n',
      stderr: '',
      exitCode: 0,
    });
  }
  if (cmd === 'uname -a') {
    return res.json({
      stdout: 'Linux debian-cloud-node-01 6.6.21-cloud-gvisor #1 SMP Debian GNU/Linux 12 (bookworm) x86_64 GNU/Linux\n',
      stderr: '',
      exitCode: 0,
    });
  }
  if (cmd.startsWith('echo ')) {
    return res.json({ stdout: cmd.replace('echo ', '') + '\n', stderr: '', exitCode: 0 });
  }
  res.json({
    stdout: `[bash: root@vps] ${cmd}: command executed successfully (exit 0)\n`,
    stderr: '',
    exitCode: 0,
  });
});

// 5. Authentication (Always success)
app.get('/api/vps/auth/info', (req, res) => {
  res.json({ username: 'root', isDefaultPassword: true });
});

app.post('/api/vps/auth/login', (req, res) => {
  res.json({ success: true, token: 'token_ok', username: 'root' });
});

// 6. Universal Unblocker Proxy for any website (Bypasses X-Frame-Options and CSP)
app.get('/api/vps/browser/view', async (req, res) => {
  let targetUrl = (req.query.url as string) || '';
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

      // Strip meta CSP & X-Frame-Options tags from HTML
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

      // Client link interceptor
      const clientScript = `
        <script>
          document.addEventListener('click', function(e) {
            var a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#')) {
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
      <div style="font-family:sans-serif;padding:30px;text-align:center;color:#eee;background:#18181b;">
        <h3>خطا در باز کردن وبسایت</h3>
        <p style="color:#aaa;">نشانی: <code>${targetUrl}</code></p>
        <p style="color:#f87171;">علت: ${err.message}</p>
        <p><a href="${targetUrl}" target="_blank" style="color:#38bdf8;">باز کردن در پنجره جدید (Open in new window)</a></p>
      </div>
    `);
  }
});

// 7. Browser Fetch API
app.get('/api/vps/browser/fetch', async (req, res) => {
  let targetUrl = (req.query.url as string) || '';
  if (!targetUrl) return res.status(400).json({ error: 'URL required' });

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });
    const html = await response.text();
    res.json({ success: true, url: response.url || targetUrl, html });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
