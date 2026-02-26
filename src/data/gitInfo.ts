import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(execFileCb);
const TIMEOUT = 5000;

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFile('git', ['-C', cwd, ...args], { timeout: TIMEOUT });
  return stdout.trim();
}

export async function getBranch(repoPath: string): Promise<string> {
  try {
    return await git(repoPath, 'rev-parse', '--abbrev-ref', 'HEAD');
  } catch {
    return 'unknown';
  }
}

export async function getUpstream(repoPath: string): Promise<string> {
  // Try tracking branch
  try {
    return await git(repoPath, 'rev-parse', '--abbrev-ref', '@{upstream}');
  } catch {
    // No tracking branch set
  }

  // Fallback: origin/main or origin/master
  try {
    await git(repoPath, 'rev-parse', '--verify', 'origin/main');
    return 'origin/main';
  } catch {
    // no origin/main
  }

  try {
    await git(repoPath, 'rev-parse', '--verify', 'origin/master');
    return 'origin/master';
  } catch {
    return '';
  }
}

export async function getDirtyCount(repoPath: string): Promise<number> {
  try {
    const output = await git(repoPath, 'status', '--porcelain');
    if (!output) return 0;
    return output.split('\n').length;
  } catch {
    return 0;
  }
}

export async function getAheadBehind(
  repoPath: string,
  upstream: string
): Promise<{ ahead: number; behind: number }> {
  if (!upstream) return { ahead: 0, behind: 0 };

  try {
    const output = await git(repoPath, 'rev-list', '--left-right', '--count', `${upstream}...HEAD`);
    const [behind, ahead] = output.split(/\s+/).map(Number);
    return { ahead: ahead ?? 0, behind: behind ?? 0 };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}
