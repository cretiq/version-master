import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { exec } from 'child_process';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { RepoList } from './components/RepoList.js';
import { RepoPicker } from './components/RepoPicker.js';
import { StatusBar } from './components/StatusBar.js';
import { ClaudeGauge } from './components/ClaudeGauge.js';
import { loadConfig, saveConfig } from './data/config.js';
import { fetchRepoInfo, skeletonRepo } from './data/refresh.js';
import { useClaudeUsage } from './hooks/useClaudeUsage.js';
import type { RepoInfo, View, Shortcut, SortMode } from './types.js';

const SORT_MODES: SortMode[] = ['vercel', 'dirty', 'name'];

function sortRepos(repos: RepoInfo[], mode: SortMode): RepoInfo[] {
  return [...repos].sort((a, b) => {
    switch (mode) {
      case 'vercel':
        return (b.vercel ? 1 : 0) - (a.vercel ? 1 : 0) || a.name.localeCompare(b.name);
      case 'dirty':
        return b.dirty - a.dirty || a.name.localeCompare(b.name);
      case 'name':
        return a.name.localeCompare(b.name);
    }
  });
}

export type SpawnMode = 'commit' | 'tidy';

interface AppProps {
  forcePicker?: boolean;
  onSpawn?: (repoPaths: string[], mode: SpawnMode) => void;
}

const DASHBOARD_SHORTCUTS: Shortcut[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'space', action: 'mark' },
  { key: 'a', action: 'select all' },
  { key: 'r', action: 'refresh' },
  { key: 'p', action: 'picker' },
  { key: 'c', action: 'commit+push' },
  { key: 't', action: 'tidy' },
  { key: 's', action: 'sort' },
  { key: 'd/D', action: 'detail/all' },
  { key: 'o', action: 'open site' },
  { key: 'v', action: 'vercel' },
  { key: 'q', action: 'quit' },
];

export function App({ forcePicker, onSpawn }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [view, setView] = useState<View | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [repoPaths, setRepoPaths] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>();
  const [markedPaths, setMarkedPaths] = useState<Set<string>>(new Set());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const claudeUsage = useClaudeUsage(view === 'dashboard');
  const sortedRepos = useMemo(() => sortRepos(repos, sortMode), [repos, sortMode]);
  const repoPathsRef = useRef(repoPaths);

  const doRefresh = useCallback((paths: string[]) => {
    if (paths.length === 0) {
      setRepos([]);
      return;
    }
    setMarkedPaths(new Set());
    setRepos(paths.map(skeletonRepo));
    for (const p of paths) {
      fetchRepoInfo(p).then((info) => {
        setRepos((prev) => prev.map((r) => (r.path === p ? info : r)));
      });
    }
    setLastRefresh(new Date());
  }, []);

  // Keep ref in sync for interval closure
  useEffect(() => { repoPathsRef.current = repoPaths; }, [repoPaths]);

  // Auto-refresh repo statuses every 60s on dashboard
  useEffect(() => {
    if (view !== 'dashboard') return;
    const id = setInterval(() => {
      if (repoPathsRef.current.length > 0) doRefresh(repoPathsRef.current);
    }, 60_000);
    return () => clearInterval(id);
  }, [view, doRefresh]);

  // Load config on mount
  useEffect(() => {
    loadConfig().then((config) => {
      if (config?.sortMode) setSortMode(config.sortMode);
      if (!config || config.repos.length === 0 || forcePicker) {
        setRepoPaths(config?.repos ?? []);
        setView('picker');
      } else {
        setRepoPaths(config.repos);
        setView('dashboard');
        doRefresh(config.repos);
      }
    });
  }, [forcePicker, doRefresh]);

  const handlePickerConfirm = useCallback(
    async (selected: string[]) => {
      await saveConfig({ repos: selected });
      setRepoPaths(selected);
      setView('dashboard');
      doRefresh(selected);
    },
    [doRefresh]
  );

  useInput(
    (input, key) => {
      if (input === 'j' || key.downArrow) {
        setSelectedIndex((i) => Math.min(i + 1, sortedRepos.length - 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (input === 'r') {
        doRefresh(repoPaths);
      }
      if (input === 'p') {
        setView('picker');
      }
      if (input === ' ') {
        const repo = sortedRepos[selectedIndex];
        if (repo && repo.dirty > 0) {
          setMarkedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(repo.path)) next.delete(repo.path);
            else next.add(repo.path);
            return next;
          });
        }
      }
      if (input === 'a') {
        const dirtyPaths = sortedRepos.filter((r) => r.dirty > 0).map((r) => r.path);
        setMarkedPaths((prev) =>
          prev.size === dirtyPaths.length ? new Set() : new Set(dirtyPaths),
        );
      }
      if (input === 'c') {
        if (!onSpawn) return;
        if (markedPaths.size > 0) {
          onSpawn([...markedPaths], 'commit');
        } else {
          const repo = sortedRepos[selectedIndex];
          if (repo && repo.dirty > 0) {
            onSpawn([repo.path], 'commit');
          }
        }
      }
      if (input === 't') {
        if (!onSpawn) return;
        if (markedPaths.size > 0) {
          onSpawn([...markedPaths], 'tidy');
        } else {
          const repo = sortedRepos[selectedIndex];
          if (repo) {
            onSpawn([repo.path], 'tidy');
          }
        }
      }
      if (input === 's') {
        const currentPath = sortedRepos[selectedIndex]?.path;
        const nextMode = SORT_MODES[(SORT_MODES.indexOf(sortMode) + 1) % SORT_MODES.length]!;
        setSortMode(nextMode);
        saveConfig({ repos: repoPaths, sortMode: nextMode });
        if (currentPath) {
          const newSorted = sortRepos(repos, nextMode);
          const newIdx = newSorted.findIndex((r) => r.path === currentPath);
          if (newIdx >= 0) setSelectedIndex(newIdx);
        }
      }
      if (input === 'd') {
        const repo = sortedRepos[selectedIndex];
        if (repo) {
          setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(repo.path)) next.delete(repo.path);
            else next.add(repo.path);
            return next;
          });
        }
      }
      if (input === 'D') {
        const allPaths = sortedRepos.map((r) => r.path);
        setExpandedPaths((prev) =>
          prev.size === allPaths.length ? new Set() : new Set(allPaths),
        );
      }
      if (input === 'o') {
        const repo = sortedRepos[selectedIndex];
        if (repo?.vercel?.prodUrl) {
          exec(`open "https://${repo.vercel.prodUrl}"`);
        }
      }
      if (input === 'v') {
        const repo = sortedRepos[selectedIndex];
        if (repo?.vercel) {
          const slug = repo.vercel.teamSlug ?? 'cretiqs-projects';
          exec(`open "https://vercel.com/${slug}/${repo.vercel.projectName}"`);
        }
      }
      if (input === 'q') {
        exit();
      }
    },
    { isActive: view === 'dashboard' }
  );

  if (view === null) {
    return (
      <Box padding={1}>
        <Text color="cyan">Loading...</Text>
      </Box>
    );
  }

  if (view === 'picker') {
    return (
      <RepoPicker preSelected={repoPaths} onConfirm={handlePickerConfirm} onCancel={() => setView('dashboard')} />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Box gap={1}>
          <Text bold color="cyan">version-master</Text>
          <Text dimColor>|</Text>
          <Text>{sortedRepos.length} repos</Text>
          <Text dimColor>|</Text>
          <Text dimColor>sort: {sortMode}</Text>
        </Box>
      </Box>

      <RepoList repos={sortedRepos} selectedIndex={selectedIndex} markedPaths={markedPaths} expandedPaths={expandedPaths} />

      <Box marginTop={1}>
        <ClaudeGauge usage={claudeUsage} width={stdout?.columns ?? 80} />
      </Box>

      <Box marginTop={1}>
        <StatusBar shortcuts={DASHBOARD_SHORTCUTS} lastRefresh={lastRefresh} />
      </Box>
    </Box>
  );
}
