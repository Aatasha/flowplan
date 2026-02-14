import * as fs from 'node:fs';
import * as path from 'node:path';
import * as net from 'node:net';
import * as crypto from 'node:crypto';

interface PortInfo {
  port: number;
  pid: number;
}

function hashToPort(cwd: string): number {
  const hash = crypto.createHash('sha256').update(cwd).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return 9100 + (num % 900); // Range 9100-9999
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function getPort(projectDir: string): Promise<number> {
  // Allow overriding via env var (useful for E2E tests)
  if (process.env.FLOWPLAN_PORT) {
    return parseInt(process.env.FLOWPLAN_PORT, 10);
  }

  const flowplansDir = path.join(projectDir, '.claude', 'flowplans');
  const portFile = path.join(flowplansDir, '.port');

  // Check if an existing port file exists with a live process
  if (fs.existsSync(portFile)) {
    try {
      const raw = fs.readFileSync(portFile, 'utf-8');
      const info: PortInfo = JSON.parse(raw);
      if (info.pid === process.pid || isPidAlive(info.pid)) {
        // Reuse the same port if the process is still alive
        return info.port;
      }
    } catch {
      // Malformed port file, continue to find a new port
    }
  }

  // Find an available port starting from the hashed value
  let port = hashToPort(projectDir);
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortAvailable(port)) {
      break;
    }
    port++;
    if (port > 9999) port = 9100;
  }

  // Write port file
  if (!fs.existsSync(flowplansDir)) {
    fs.mkdirSync(flowplansDir, { recursive: true });
  }
  const info: PortInfo = { port, pid: process.pid };
  fs.writeFileSync(portFile, JSON.stringify(info), 'utf-8');

  return port;
}
