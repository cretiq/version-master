import React from 'react';
import { Box, Text } from 'ink';
import { RepoEntry } from './RepoEntry.js';
import type { RepoInfo } from '../types.js';

interface RepoListProps {
  repos: RepoInfo[];
  selectedIndex: number;
  markedPaths: Set<string>;
  expandedPaths: Set<string>;
}

export function RepoList({ repos, selectedIndex, markedPaths, expandedPaths }: RepoListProps) {
  if (repos.length === 0) {
    return (
      <Box justifyContent="center" paddingY={2}>
        <Text dimColor>No repos configured. Press p to open picker.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {repos.map((repo, i) => (
        <RepoEntry
          key={repo.path}
          repo={repo}
          isSelected={i === selectedIndex}
          isMarked={markedPaths.has(repo.path)}
          isExpanded={expandedPaths.has(repo.path)}
        />
      ))}
    </Box>
  );
}
