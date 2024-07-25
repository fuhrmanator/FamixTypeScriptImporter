#!/usr/bin/env node

import { spawn } from 'child_process';

// allow tslog to display the proper typescript files and line numbers
const args = [
  '--enable-source-maps',
  '--experimental-specifier-resolution=node',
  'dist/ts2famix-cli.js',
  ...process.argv.slice(2)
];

const child = spawn('node', args, { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code);
});
