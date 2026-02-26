import { basename } from 'path';
import { getBranch, getUpstream, getAheadBehind, getDirtyCount } from './gitInfo.js';
import type { RepoInfo } from '../types.js';

async function fetchRepoInfo(repoPath: string): Promise<RepoInfo> {
  try {
    const [branch, upstream, dirty] = await Promise.all([
      getBranch(repoPath),
      getUpstream(repoPath),
      getDirtyCount(repoPath),
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
