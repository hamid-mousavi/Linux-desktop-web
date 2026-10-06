export interface Container {
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

export interface GoogleCloudInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  org: string;
  datacenter: string;
}

export interface SystemInfo {
  powerState: 'running' | 'rebooting' | 'stopped';
  hostname: string;
  osType: string;
  ip4: string;
  ip6: string;
  privateIp: string;
  uptimeSeconds: number;
  googleCloudInfo?: GoogleCloudInfo;
  specs: {
    vCpu: number;
    ramGb: number;
    diskGb: number;
  };
  telemetry: {
    realTotalMemMb: number;
    realUsedMemMb: number;
    realFreeMemMb: number;
    realCores: number;
    loadAvg: [number, number, number];
    arch: string;
    platform: string;
    release: string;
  };
  containerSummary: {
    total: number;
    running: number;
    stopped: number;
  };
}

export interface FirewallRule {
  id: string;
  port: number;
  protocol: string;
  action: string;
  description: string;
}
