import { basename } from 'path';
import { getBranch, getUpstream, getAheadBehind, getDirtyCount } from './gitInfo.js';
import { fetchVercelInfo } from './vercel.js';
import { detectTechStack } from './techStack.js';
import type { RepoInfo } from '../types.js';

export function skeletonRepo(repoPath: string): RepoInfo {
  return {
    path: repoPath,
    name: basename(repoPath),
    branch: '',
    upstream: '',
    ahead: 0,
    behind: 0,
    dirty: 0,
    loading: true,
  };
}

export async function fetchRepoInfo(repoPath: string): Promise<RepoInfo> {
  try {
    const [branch, upstream, dirty, vercel, techStack] = await Promise.all([
      getBranch(repoPath),
      getUpstream(repoPath),
      getDirtyCount(repoPath),
      fetchVercelInfo(repoPath),
      detectTechStack(repoPath),
    ]);
    const { ahead, behind } = await getAheadBehind(repoPath, upstream);

    return {
      path: repoPath,
      name: basename(repoPath),
      branch,
      upstream,
      ahead,
      behind,
      dirty,
      ...(vercel && { vercel }),
      ...(techStack.length > 0 && { techStack }),
    };
  } catch (err: unknown) {
    return {
      path: repoPath,
      name: basename(repoPath),
      branch: 'error',
      upstream: '',
      ahead: 0,
      behind: 0,
      dirty: 0,
      error: (err as Error).message,
    };
  }
}

export async function refreshAll(repoPaths: string[]): Promise<RepoInfo[]> {
  return Promise.all(repoPaths.map(fetchRepoInfo));
}
