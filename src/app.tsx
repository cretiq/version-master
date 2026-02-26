import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { RepoList } from './components/RepoList.js';
import { RepoPicker } from './components/RepoPicker.js';
import { StatusBar } from './components/StatusBar.js';
import { loadConfig, saveConfig } from './data/config.js';
import { refreshAll } from './data/refresh.js';
import type { RepoInfo, View, Shortcut } from './types.js';

interface AppProps {
  forcePicker?: boolean;
  onSpawnClaude?: (repoPaths: string[]) => void;
}

const DASHBOARD_SHORTCUTS: Shortcut[] = [
  { key: 'j/k', action: 'navigate' },
  { key: 'space', action: 'mark' },
  { key: 'r', action: 'refresh' },
  { key: 'p', action: 'picker' },
  { key: 'enter/c', action: 'commit+push' },
  { key: 'q', action: 'quit' },
];

export function App({ forcePicker, onSpawnClaude }: AppProps) {
  const { exit } = useApp();
  const [view, setView] = useState<View | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [repoPaths, setRepoPaths] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [markedPaths, setMarkedPaths] = useState<Set<string>>(new Set());

  const doRefresh = useCallback(async (paths: string[]) => {
    if (paths.length === 0) {
      setRepos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMarkedPaths(new Set());
    const info = await refreshAll(paths);
    setRepos(info);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // Load config on mount
  useEffect(() => {
    loadConfig().then((config) => {
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
        setSelectedIndex((i) => Math.min(i + 1, repos.length - 1));
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
        const repo = repos[selectedIndex];
        if (repo && repo.dirty > 0) {
          setMarkedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(repo.path)) next.delete(repo.path);
            else next.add(repo.path);
            return next;
          });
        }
      }
      if (input === 'c' || key.return) {
        if (!onSpawnClaude) return;
        if (markedPaths.size > 0) {
          onSpawnClaude([...markedPaths]);
        } else {
          const repo = repos[selectedIndex];
          if (repo && repo.dirty > 0) {
            onSpawnClaude([repo.path]);
          }
        }
      }
      if (input === 'q') {
        exit();
      }
    },
    { isActive: view === 'dashboard' && !loading }
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
      <RepoPicker preSelected={repoPaths} onConfirm={handlePickerConfirm} />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Box gap={1}>
          <Text bold color="cyan">version-master</Text>
          <Text dimColor>|</Text>
          <Text>{repos.length} repos</Text>
        </Box>
      </Box>

      {loading ? (
        <Box paddingY={1} justifyContent="center">
          <Text color="cyan">Fetching git status...</Text>
        </Box>
      ) : (
        <RepoList repos={repos} selectedIndex={selectedIndex} markedPaths={markedPaths} />
      )}

      <Box marginTop={1}>
        <StatusBar shortcuts={DASHBOARD_SHORTCUTS} lastRefresh={lastRefresh} />
      </Box>
    </Box>
  );
}
