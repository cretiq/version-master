import { readdir, stat } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();
const SCAN_ROOT = join(HOME, 'CursorProjects');

// Dotfile dirs in ~ that might be git repos
const HOME_DOTDIRS = ['.dotfiles', '.claude', '.claude_phoenix'];

async function scanDir(root: string, maxDepth: number): Promise<string[]> {
  const repos: string[] = [];

  try {
    const topLevel = await readdir(root);

    for (const dir of topLevel) {
      const dirPath = join(root, dir);
      const dirStat = await stat(dirPath).catch(() => null);
      if (!dirStat?.isDirectory()) continue;

      const topGit = await stat(join(dirPath, '.git')).catch(() => null);
      if (topGit) {
        repos.push(dirPath);
        continue;
      }

      if (maxDepth > 1) {
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
    }
  } catch {
    // root doesn't exist
  }

  return repos;
}

export async function scanForRepos(): Promise<string[]> {
  const repos: string[] = [];

  // Scan ~/CursorProjects (depth 2)
  repos.push(...await scanDir(SCAN_ROOT, 2));

  // Scan home dotfile dirs (depth 0 — check if they themselves are git repos)
  for (const name of HOME_DOTDIRS) {
    const dirPath = join(HOME, name);
    const hasGit = await stat(join(dirPath, '.git')).catch(() => null);
    if (hasGit) {
      repos.push(dirPath);
    }
  }

  return repos.sort();
}
