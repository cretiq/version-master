export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
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
