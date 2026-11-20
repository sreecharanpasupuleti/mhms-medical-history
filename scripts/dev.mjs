import { spawn } from 'child_process';
import path from 'path';

const rawArgs = process.argv.slice(2);
let port = process.env.PORT || '3000';
let hostname = '0.0.0.0';
const extraArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--port' || arg === '-p') {
    if (rawArgs[i + 1]) {
      port = rawArgs[i + 1];
      i++;
    }
  } else if (arg.startsWith('--port=')) {
    port = arg.split('=')[1];
  } else if (arg === '--host' || arg === '-H' || arg === '--hostname') {
    if (rawArgs[i + 1]) {
      hostname = rawArgs[i + 1];
      i++;
    }
  } else if (arg.startsWith('--host=')) {
    hostname = arg.split('=')[1];
  } else if (arg.startsWith('--hostname=')) {
    hostname = arg.split('=')[1];
  } else {
    extraArgs.push(arg);
  }
}

const nextBin = path.resolve(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next'
);

const child = spawn(
  nextBin,
  ['dev', '-p', port, '-H', hostname, ...extraArgs],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
