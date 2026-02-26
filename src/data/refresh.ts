import { basename } from 'path';
import { getBranch, getUpstream, getAheadBehind } from './gitInfo.js';
import type { RepoInfo } from '../types.js';

async function fetchRepoInfo(repoPath: string): Promise<RepoInfo> {
  try {
    const branch = await getBranch(repoPath);
    const upstream = await getUpstream(repoPath);
    const { ahead, behind } = await getAheadBehind(repoPath, upstream);

    return {
      path: repoPath,
      name: basename(repoPath),
      branch,
      upstream,
      ahead,
      behind,
    };
  } catch (err: unknown) {
    return {
      path: repoPath,
      name: basename(repoPath),
      branch: 'error',
      upstream: '',
      ahead: 0,
      behind: 0,
      error: (err as Error).message,
    };
  }
}

export async function refreshAll(repoPaths: string[]): Promise<RepoInfo[]> {
  return Promise.all(repoPaths.map(fetchRepoInfo));
}
