import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, Server, Shield, Layers, FileCode, CheckCircle2 } from 'lucide-react';
import { Language, t } from '../translations';

interface DeployGuideTabProps {
  lang: Language;
}

export const DeployGuideTab: React.FC<DeployGuideTabProps> = ({ lang }) => {
  const strings = t[lang];
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const dockerfileCode = `# Multi-Stage Dockerfile for CloudVPS Web Studio
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install Docker CLI and Bash inside container
RUN apk add --no-cache bash curl docker-cli

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
`;

  const composeCode = `version: '3.8'

services:
  cloud-vps-dashboard:
    image: cloud-vps-web:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cloud_vps_studio
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
    volumes:
      # Mount host Docker socket to let the web panel manage real host containers!
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
    networks:
      - vps_net

networks:
  vps_net:
    driver: bridge
`;

  return (
    <div className="space-y-6">
      {/* 1. AI Studio Native Host Publishing Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-emerald-950/40 border border-blue-700/50 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'fa' ? 'انتشار مستقیم در هاست Google AI Studio (بدون نیاز به پروکسی)' : 'Publish Directly on Google AI Studio Host (No Proxy Required)'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === 'fa'
                  ? 'برنامه کاملاً بهینه‌سازی شده و آماده انتشار بر روی هاست رسمی گوگل کلود (Cloud Run) است.'
                  : 'The application is fully compiled and ready to be published on official Google Cloud Run.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-medium rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'fa' ? 'آماده انتشار (Build Ready)' : 'Build Ready'}</span>
            </span>
          </div>
        </div>

        {/* Live URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs font-mono">
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
            <div className="text-[11px] text-zinc-500 mb-1">
              {lang === 'fa' ? 'آدرس اشتراک‌گذاری و انتشار نهایی (Shared / Public URL):' : 'Shared / Public Published URL:'}
            </div>
            <div className="text-emerald-400 truncate font-semibold">
              https://ais-pre-lu4easulpk7ljvupxy3of3-300123940669.europe-west2.run.app
            </div>
          </div>
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
            <div className="text-[11px] text-zinc-500 mb-1">
              {lang === 'fa' ? 'آدرس محیط توسعه (Development App URL):' : 'Development App URL:'}
            </div>
            <div className="text-blue-400 truncate font-semibold">
              https://ais-dev-lu4easulpk7ljvupxy3of3-300123940669.europe-west2.run.app
            </div>
          </div>
        </div>

        {/* 3 Step instructions to publish */}
        <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-zinc-200">
            {lang === 'fa' ? 'مراحل انتشار در AI Studio:' : 'Steps to Publish in AI Studio:'}
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px]">
            <li>
              {lang === 'fa'
                ? 'در نوار بالای همین صفحه AI Studio روی دکمه آبی رنگ "Share" یا "Publish" کلیک کنید.'
                : 'Click the "Share" or "Publish" button at the top bar of AI Studio.'}
            </li>
            <li>
              {lang === 'fa'
                ? 'سطح دسترسی را مشخص کرده و لینک بالا را ذخیره کنید.'
                : 'Set visibility and save the public link.'}
            </li>
            <li>
              {lang === 'fa'
                ? 'پروژه به صورت ۲۴ ساعته و دائمی روی هاست Google AI Studio آنلاین و در دسترس خواهد بود (بدون نیاز به پروکسی یا هزینه سرور).'
                : 'The project will be permanently hosted on Google Cloud Run 24/7 without proxy or VPS costs.'}
            </li>
          </ol>
        </div>
      </div>

      {/* 2. Vercel Deployment Guide Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-purple-950/30 border border-zinc-700/80 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <span className="font-bold text-lg font-mono">▲</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'fa' ? 'راهنمای دیپلوی در ورسل (Deploy to Vercel)' : 'Deploy to Vercel (Step-by-Step)'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === 'fa'
                  ? 'فایل‌های vercel.json و api/index.ts با معماری Serverless Express برای استقرار روی ورسل ساخته شدند.'
                  : 'vercel.json and api/index.ts are configured with Serverless Express for seamless Vercel deployment.'}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-purple-950 border border-purple-800 text-purple-300 text-xs font-mono font-medium rounded-full flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Vercel Ready</span>
          </span>
        </div>

        {/* Vercel Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-1.5">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px]">1</span>
              <span>{lang === 'fa' ? 'پوش به گیت‌هاب' : 'Push to GitHub'}</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {lang === 'fa'
                ? 'کدهای این پروژه را در یک ریپازیتوری در حساب گیت‌هاب خود پوش (Push) کنید.'
                : 'Push this project codebase to a GitHub repository.'}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-1.5">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px]">2</span>
              <span>{lang === 'fa' ? 'اتصال در Vercel.com' : 'Import in Vercel'}</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {lang === 'fa'
                ? 'در پنل vercel.com روی "Add New Project" کلیک کرده و مخزن گیت‌هاب را انتخاب کنید.'
                : 'Click "Add New Project" on vercel.com and select your repository.'}
            </p>
          </div>

          <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-lg space-y-1.5">
            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px]">3</span>
              <span>{lang === 'fa' ? 'کلیک روی Deploy' : 'Click Deploy'}</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {lang === 'fa'
                ? 'بدون نیاز به تغییر هیچ تنظیمی دکمه Deploy را بزنید. دامنه اختصاصی .vercel.app در اختیارتان قرار می‌گیرد!'
                : 'Vercel detects vercel.json automatically and provides your free .vercel.app domain!'}
            </p>
          </div>
        </div>

        {/* Vercel CLI one-liner */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="text-zinc-400">
            {lang === 'fa' ? 'دیپلوی سریع از طریق خط فرمان (Vercel CLI):' : 'Deploy via Vercel CLI:'}
            <span className="text-emerald-400 ml-2">npx vercel --prod</span>
          </div>
          <button
            onClick={() => copyToClipboard('npx vercel --prod', 'vercel-cli')}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 text-[11px] cursor-pointer"
          >
            {copiedCmd === 'vercel-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd === 'vercel-cli' ? 'کپی شد' : 'کپی دستور'}</span>
          </button>
        </div>

        {/* IP Notice on Vercel */}
        <div className="mt-3 text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80 leading-relaxed">
          <span className="text-amber-400 font-semibold mr-1">نکته درباره آی‌پی ورسل:</span>
          {lang === 'fa'
            ? 'وقتی پروژه را روی Vercel دیپلوی می‌کنید، ترافیک از سرورهای Edge شرکت Vercel/AWS عبور می‌کند و آی‌پی خروجی متعلق به Vercel خواهد بود، در حالی که روی هاست Google AI Studio آی‌پی متعلق به گوگل کلود لندن (34.34.246.193) است.'
            : 'When deployed on Vercel, requests originate from Vercel/AWS Edge servers, whereas on AI Studio they use Google Cloud London (34.34.246.193).'}
        </div>
      </div>

      {/* Overview & Architecture explanation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-zinc-100">{strings.guideTitle}</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          {strings.guideSubtitle}
        </p>

        {/* Steps roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px]">
                1
              </span>
              <span>
                {lang === 'fa' ? 'نصب داکر روی سرور اوبونتو' : 'Install Docker on Ubuntu/Debian'}
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              {lang === 'fa'
                ? 'با اجرای اسکریپت رسمی Docker، موتور داکر و داکر کامپوز را تنها با یک دستور نصب کنید.'
                : 'Run the official Docker convenience script to install Docker Engine and Compose in 60 seconds.'}
            </p>
            <div className="bg-zinc-900 p-2 rounded font-mono text-[11px] text-zinc-300 flex items-center justify-between">
              <code>curl -fsSL https://get.docker.com | sh</code>
              <button
                onClick={() =>
                  copyToClipboard('curl -fsSL https://get.docker.com | sh', 'step1')
                }
                className="text-zinc-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedCmd === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>
                {lang === 'fa' ? 'کلون و استقرار با Docker Compose' : 'Run via Docker Compose'}
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              {lang === 'fa'
                ? 'فایل docker-compose.yml را ذخیره کرده و با اتصال سوکت داکر (/var/run/docker.sock) پنل را بالا بیاورید.'
                : 'Save docker-compose.yml with the docker socket mounted to manage host containers directly.'}
            </p>
            <div className="bg-zinc-900 p-2 rounded font-mono text-[11px] text-zinc-300 flex items-center justify-between">
              <code>docker compose up -d</code>
              <button
                onClick={() => copyToClipboard('docker compose up -d', 'step2')}
                className="text-zinc-400 hover:text-white cursor-pointer ml-2"
              >
                {copiedCmd === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>
                {lang === 'fa' ? 'ورود به پنل و مدیریت کانتینرها' : 'Access Web Console'}
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              {lang === 'fa'
                ? 'مرورگر خود را باز کرده و به آدرس http://YOUR_VPS_IP:3000 متصل شوید.'
                : 'Open your browser and navigate to http://YOUR_VPS_IP:3000 to manage your server.'}
            </p>
            <div className="bg-zinc-900 p-2 rounded font-mono text-[11px] text-zinc-300">
              <code>http://&lt;YOUR_SERVER_IP&gt;:3000</code>
            </div>
          </div>
        </div>
      </div>

      {/* Code Blocks for Dockerfile & Compose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dockerfile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-mono">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Dockerfile</span>
            </div>
            <button
              onClick={() => copyToClipboard(dockerfileCode, 'dockerfile')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd === 'dockerfile' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{strings.copyCommand}</span>
            </button>
          </div>
          <pre className="p-4 bg-zinc-950 text-zinc-300 font-mono text-xs overflow-x-auto flex-1 leading-relaxed select-text">
            {dockerfileCode}
          </pre>
        </div>

        {/* docker-compose.yml */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>docker-compose.yml</span>
            </div>
            <button
              onClick={() => copyToClipboard(composeCode, 'compose')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd === 'compose' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{strings.copyCommand}</span>
            </button>
          </div>
          <pre className="p-4 bg-zinc-950 text-cyan-300 font-mono text-xs overflow-x-auto flex-1 leading-relaxed select-text">
            {composeCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
