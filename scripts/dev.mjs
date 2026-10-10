import { spawn } from 'node:child_process';

function run(command, args) {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => {
    if (code) process.exit(code || 1);
  });
}

run('node', ['--experimental-strip-types', '--watch', 'server/src/index.ts']);
run('npx', ['vite']);
