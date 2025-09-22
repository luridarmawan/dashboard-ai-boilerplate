// configuration.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from "../../utils";
import { readFile, removeCommentLines } from "../../utils";
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

interface DefaultConfiguration {
  section: string;
  key: string;
  value: string;
  type?: string;
  description: string;
  order?: number;
  public?: boolean;
  pro?: boolean;
  status_id: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read system prompt from file
const systemPromptPath = path.join(__dirname, '..', '..', '..', 'data', 'install_only', 'system_prompt.md');
let systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
systemPrompt = removeCommentLines(systemPrompt);

// Read configurations from file
const configurationPath = path.join(__dirname, '..', '..', '..', 'data', 'install_only', 'configuration.json');

/**
 * Seed configurations in the database
 * @param client_id - The client ID to associate configurations with
 * @returns Promise<void>
 */
export const seedConfiguration = async (client_id: string, firstInstall: boolean = true): Promise<void> => {
  console.log('👉  Seeding default configurations...');
  let defaultConfigurations = readFile(configurationPath, true, []);

  if (firstInstall) {
    // Process configurations to handle environment variables and system prompt
    defaultConfigurations = defaultConfigurations.map((config: DefaultConfiguration) => {
      // Handle AI-specific configurations that need environment variables or system prompt
      if (config.key === 'ai.key') {
        return { ...config, value: process.env.VITE_CHAT_API_TOKEN || config.value };
      }
      if (config.key === 'ai.baseurl') {
        return { ...config, value: process.env.VITE_CHAT_API_URL || config.value || 'https://api.openai.com/v1' };
      }
      if (config.key === 'ai.model') {
        return { ...config, value: process.env.VITE_CHAT_API_MODEL || config.value || 'gpt-oss' };
      }
      if (config.key === 'ai.system_prompt') {
        return { ...config, value: systemPrompt };
      }

      if (config.key === 'email.host') {
        return { ...config, value: process.env.EMAIL_HOST || config.value || 'smtp.yourdomain.com' };
      }
      if (config.key === 'email.port') {
        return { ...config, value: process.env.EMAIL_PORT || config.value || '587' };
      }
      if (config.key === 'email.username') {
        return { ...config, value: process.env.EMAIL_USERNAME || config.value || '' };
      }
      if (config.key === 'email.password') {
        return { ...config, value: process.env.EMAIL_PASSWORD || config.value || '' };
      }
      if (config.key === 'email.from') {
        return { ...config, value: process.env.EMAIL_FROM || config.value || 'Admin Dashboard Notification <your_email@example.com>' };
      }
      if (config.key === 'email.bcc') {
        return { ...config, value: process.env.EMAIL_BCC || config.value || '' };
      }

      return config;
    });

  }

  for (const config of defaultConfigurations) {
    // Check if configuration already exists
    const existingConfig = await prisma.configurations.findFirst({
      where: {
        client_id: client_id,
        key: config.key,
      }
    });

    if (existingConfig) {
      console.log(` - Configuration with key ${config.key} already exists, skipping...`);
      continue;
    }

    if (!firstInstall) {
      // TODO: not first install
    }

    // Create configuration
    const configId = generateUUIDv7();
    const newConfig = await prisma.configurations.create({
      data: {
        id: configId,
        client_id: client_id,
        section: config.section,
        sub: config.sub || null,
        key: config.key,
        value: config.value,
        type: config.type,
        title: config.title,
        note: config.note,
        order: config.order,
        public: config.public,
        pro: config.pro,
        status_id: config.status_id,
      }
    });

    if (newConfig.type == 'text') {
      console.log(`  ⚙️  Created configuration: ${newConfig.key} = ...`);
    } else {
      console.log(`  ⚙️  Created configuration: ${newConfig.key} = ${newConfig.value}`);
    }
  }
};

