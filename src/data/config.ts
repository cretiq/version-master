import { readFile, writeFile, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join, dirname } from 'path';
import type { Config } from '../types.js';

const CONFIG_PATH = join(homedir(), '.config', 'version-master', 'repos.json');

export async function loadConfig(): Promise<Config | null> {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as Config;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return null;
    return null;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const dir = dirname(CONFIG_PATH);
  await mkdir(dir, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
