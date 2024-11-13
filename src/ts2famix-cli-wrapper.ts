#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';

// Resolve the path to ts2famix-cli.js relative to the wrapper script
const cliPath = path.resolve(__dirname, 'ts2famix-cli.js');

// Allow tslog to display the proper TypeScript files and line numbers
const args = [
  '--enable-source-maps',
  '--experimental-specifier-resolution=node',
  cliPath,
  ...process.argv.slice(2)
];

const child = spawn('node', args, { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code);
});
