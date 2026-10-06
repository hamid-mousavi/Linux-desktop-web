import express from 'express';

const app = express();
app.use(express.json());

// In-Memory Fast Cache Store on Vercel
interface CacheEntry {
  html: string;
  contentType: string;
  status: number;
  url: string;
  title: string;
  timestamp: number;
  sizeBytes: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 20; // 20 minutes TTL

function normalizeUrl(rawUrl: string): string {
  let target = rawUrl.trim();
  if (!target) return '';
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    if (target.includes('.') && !target.includes(' ')) {
      target = 'https://' + target;
    } else {
      target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(target)}`;
    }
  }
  return target;
}

// 1. Browser View Engine (with Caching & X-Frame-Options Stripping)
app.get(['/api/browser/view', '/api/vps/browser/view'], async (req, res) => {
  const rawUrl = (req.query.url as string) || '';
  if (!rawUrl) return res.status(400).send('URL is required');

  const targetUrl = normalizeUrl(rawUrl);
  const bypassCache = req.query.nocache === '1' || req.query.refresh === 'true';

  // Special handling for YouTube video links: redirect to embed player so video plays smoothly
  const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return res.redirect(`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1`);
  }

  // Check in-memory cache
  if (!bypassCache && memoryCache.has(targetUrl)) {
    const entry = memoryCache.get(targetUrl)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Cache-Control', 'public, s-maxage=1200, max-age=1200');
      res.setHeader('Content-Type', entry.contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      return res.send(entry.html);
    } else {
      memoryCache.delete(targetUrl);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=1200, max-age=1200');

    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      let html = await response.text();
      const finalUrl = response.url || targetUrl;
      const parsed = new URL(finalUrl);
      const baseHref = parsed.origin + parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/') + 1);

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : parsed.hostname;

      // Strip meta CSP & X-Frame-Options tags
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

      // Neutralize frame-busting scripts (fixes Firefox "Can't Open This Page" on DuckDuckGo/Google)
      html = html.replace(/top\.location\s*!=\s*self\.location/gi, 'false');
      html = html.replace(/top\.location\s*!==\s*self\.location/gi, 'false');
      html = html.replace(/self\.location\s*!=\s*top\.location/gi, 'false');
      html = html.replace(/self\.location\s*!==\s*top\.location/gi, 'false');
      html = html.replace(/window\.top\s*!==\s*window\.self/gi, 'false');
      html = html.replace(/top\s*!==\s*self/gi, 'false');
      html = html.replace(/window\.top\.location/gi, 'window.location');
      html = html.replace(/top\.location\.href\s*=/gi, 'window.location.href =');
      html = html.replace(/top\.location\s*=/gi, 'window.location =');

      // Replace target="_top", "_parent", and "_blank" so links and search forms stay inside the iframe
      html = html.replace(/target\s*=\s*["']?_top["']?/gi, 'target="_self"');
      html = html.replace(/target\s*=\s*["']?_parent["']?/gi, 'target="_self"');
      html = html.replace(/target\s*=\s*["']?_blank["']?/gi, 'target="_self"');

      // Injected script to intercept clicks, form submissions, and prevent breakout
      const linkInterceptorScript = `
        <script>
          // 1. Intercept link clicks
          document.addEventListener('click', function(e) {
            var a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('#')) {
              e.preventDefault();
              window.location.href = '/api/browser/view?url=' + encodeURIComponent(a.href);
            }
          }, true);

          // 2. Intercept search forms and form submissions (fixes DuckDuckGo and Google search)
          document.addEventListener('submit', function(e) {
            var form = e.target;
            if (!form) return;
            e.preventDefault();
            try {
              var formData = new FormData(form);
              var params = new URLSearchParams();
              for (var pair of formData.entries()) {
                params.append(pair[0], pair[1]);
              }
              var rawAction = form.getAttribute('action') || window.location.href;
              var actionUrl;
              try {
                actionUrl = new URL(rawAction, window.location.href);
              } catch (err) {
                actionUrl = new URL(rawAction, "${baseHref}");
              }
              var queryStr = params.toString();
              var fullTarget = actionUrl.origin + actionUrl.pathname + (queryStr ? '?' + queryStr : '');
              window.location.href = '/api/browser/view?url=' + encodeURIComponent(fullTarget);
            } catch (err) {
              form.submit();
            }
          }, true);
        </script>
      `;

      const baseTag = `<base href="${baseHref}">\n${linkInterceptorScript}`;
      const renderedHtml = html.includes('<head>')
        ? html.replace('<head>', `<head>${baseTag}`)
        : html.includes('<HEAD>')
        ? html.replace('<HEAD>', `<HEAD>${baseTag}`)
        : baseTag + html;

      // Save to cache
      memoryCache.set(targetUrl, {
        html: renderedHtml,
        contentType,
        status: response.status,
        url: finalUrl,
        title,
        timestamp: Date.now(),
        sizeBytes: Buffer.byteLength(renderedHtml, 'utf8'),
      });

      return res.send(renderedHtml);
    } else {
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    res.status(502).send(`
      <div style="font-family:system-ui,-apple-system,sans-serif;padding:40px;text-align:center;color:#eee;background:#18181b;line-height:1.6;">
        <h2 style="color:#ef4444;margin-bottom:8px;">خطا در بارگذاری وبسایت</h2>
        <p style="color:#a1a1aa;font-size:14px;">نشانی: <code>${targetUrl}</code></p>
        <p style="color:#f87171;font-size:13px;margin:16px 0;">علت: ${err.message}</p>
        <div style="margin-top:24px;">
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">
            باز کردن مستقیم در تب جدید ↗
          </a>
        </div>
      </div>
    `);
  }
});

// 2. Fetch JSON endpoint
app.get(['/api/browser/fetch', '/api/vps/browser/fetch'], async (req, res) => {
  const rawUrl = (req.query.url as string) || '';
  if (!rawUrl) return res.status(400).json({ error: 'URL is required' });

  const targetUrl = normalizeUrl(rawUrl);

  if (memoryCache.has(targetUrl)) {
    const cached = memoryCache.get(targetUrl)!;
    return res.json({
      success: true,
      cached: true,
      url: cached.url,
      title: cached.title,
      contentType: cached.contentType,
      status: cached.status,
    });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
    });
    res.json({
      success: true,
      cached: false,
      status: response.status,
      url: response.url || targetUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Cache Management
app.get('/api/cache/stats', (req, res) => {
  res.json({
    totalEntries: memoryCache.size,
    ttlMinutes: CACHE_TTL_MS / (1000 * 60),
  });
});

app.post('/api/cache/clear', (req, res) => {
  const count = memoryCache.size;
  memoryCache.clear();
  res.json({ success: true, clearedEntries: count });
});

export default app;
