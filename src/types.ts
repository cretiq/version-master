export interface VercelInfo {
  projectName: string;
  projectId: string;
  teamSlug: string | null;
  prodUrl: string | null;
  deployState: string | null;
  healthy: boolean | null;
  lastDeployAt: number | null;
  errorCode?: string;
  errorMessage?: string;
  inspectorUrl?: string;
}

export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
  dirty: number;
  loading?: boolean;
  error?: string;
  vercel?: VercelInfo;
  techStack?: string[];
}

export interface Config {
  repos: string[];
  sortMode?: SortMode;
}

export type View = 'picker' | 'dashboard';

export type SortMode = 'vercel' | 'dirty' | 'name';

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
