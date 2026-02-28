export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
  dirty: number;
  error?: string;
}

export interface Config {
  repos: string[];
}

export type View = 'picker' | 'dashboard';

export interface Shortcut {
  key: string;
  action: string;
}

/** All timestamps are unix seconds (not ms). */
export interface ClaudeUsage {
  fiveHourPct: number;
  sevenDayPct: number;
  fiveHourResetsAt: number;
  sevenDayResetsAt: number;
  updated: number;
}
