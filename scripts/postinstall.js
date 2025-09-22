#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// Cek jika menggunakan Bun
if (process.env.npm_config_user_agent?.includes('bun')) {
  console.log('❗️ Bun detected - skipping overrides handling');
} else {
  console.log('❗️ npm/yarn/pnpm detected - proceeding normally');
}

console.log('👍 Postinstall script completed');
