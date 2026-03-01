import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { scanForRepos } from '../data/scan.js';

interface RepoPickerProps {
  preSelected: string[];
  onConfirm: (selected: string[]) => void;
  onCancel?: () => void;
}

export function RepoPicker({ preSelected, onConfirm, onCancel }: RepoPickerProps) {
  const { exit } = useApp();
  const [repos, setRepos] = useState<string[]>([]);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set(preSelected));
  const [cursor, setCursor] = useState(0);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    scanForRepos().then((found) => {
      const foundSet = new Set(found);
      const orphaned = preSelected.filter((p) => !foundSet.has(p));
      setBroken(new Set(orphaned));
      setRepos([...found, ...orphaned]);
      setScanning(false);
    });
  }, []);

  useInput((input, key) => {
    if (scanning || repos.length === 0) {
      if (input === 'q') exit();
      return;
    }

    if (input === 'j' || key.downArrow) {
      setCursor((c) => Math.min(c + 1, repos.length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (input === ' ') {
      setSelected((prev) => {
        const next = new Set(prev);
        const repo = repos[cursor]!;
        if (next.has(repo)) next.delete(repo);
        else next.add(repo);
        return next;
      });
    }
    if (key.return) {
      onConfirm([...selected]);
    }
    if (input === 'a') {
      // Toggle all
      if (selected.size === repos.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(repos));
      }
    }
    if (input === 'q' || key.escape) {
      onCancel ? onCancel() : exit();
    }
  });

  if (scanning) {
    return (
      <Box padding={1}>
        <Text color="cyan">Scanning ~/CursorProjects for git repos...</Text>
      </Box>
    );
  }

  if (repos.length === 0) {
    return (
      <Box padding={1}>
        <Text color="yellow">No git repos found in ~/CursorProjects</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Text bold color="cyan">Select repos to monitor</Text>
        <Text dimColor>  ({selected.size}/{repos.length} selected)</Text>
      </Box>

      <Box flexDirection="column">
        {repos.map((repo, i) => {
          const isSelected = selected.has(repo);
          const isCursor = i === cursor;
          const isBroken = broken.has(repo);
          const name = repo.replace(/^.*\/CursorProjects\//, '');
          return (
            <Box key={repo} gap={1}>
              <Text color={isCursor ? 'cyan' : undefined}>
                {isCursor ? '▸' : ' '}
              </Text>
              <Text color={isSelected ? 'green' : 'gray'}>
                {isSelected ? '◉' : '○'}
              </Text>
              <Text bold={isCursor} dimColor={isBroken}>{name}</Text>
              {isBroken && <Text color="red">not found</Text>}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} gap={2}>
        <Box gap={1}><Text color="cyan" bold>space</Text><Text dimColor>toggle</Text></Box>
        <Box gap={1}><Text color="cyan" bold>a</Text><Text dimColor>all</Text></Box>
        <Box gap={1}><Text color="cyan" bold>enter</Text><Text dimColor>confirm</Text></Box>
        <Box gap={1}><Text color="cyan" bold>q</Text><Text dimColor>back</Text></Box>
      </Box>
    </Box>
  );
}
