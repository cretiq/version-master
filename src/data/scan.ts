import { readdir, stat } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const SCAN_ROOT = join(homedir(), 'CursorProjects');

export async function scanForRepos(): Promise<string[]> {
  const repos: string[] = [];

  try {
    const topLevel = await readdir(SCAN_ROOT);

    for (const dir of topLevel) {
      const dirPath = join(SCAN_ROOT, dir);
      const dirStat = await stat(dirPath).catch(() => null);
      if (!dirStat?.isDirectory()) continue;

      // Check if top-level dir itself is a git repo
      const topGit = await stat(join(dirPath, '.git')).catch(() => null);
      if (topGit) {
        repos.push(dirPath);
        continue;
      }

      // Check depth-2 subdirectories
      const subDirs = await readdir(dirPath).catch(() => [] as string[]);
      for (const sub of subDirs) {
        const subPath = join(dirPath, sub);
        const subStat = await stat(subPath).catch(() => null);
        if (!subStat?.isDirectory()) continue;

        const subGit = await stat(join(subPath, '.git')).catch(() => null);
        if (subGit) {
          repos.push(subPath);
        }
      }
    }
  } catch {
    // SCAN_ROOT doesn't exist
  }

  return repos.sort();
}
