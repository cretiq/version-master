import React from 'react';
import { Box, Text } from 'ink';
import { StatusBadge } from './StatusBadge.js';
import type { RepoInfo } from '../types.js';

interface RepoEntryProps {
  repo: RepoInfo;
  isSelected: boolean;
}

export function RepoEntry({ repo, isSelected }: RepoEntryProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={isSelected ? 'cyan' : 'gray'}
      paddingX={2}
      justifyContent="space-between"
    >
      <Box gap={2}>
        <Text bold color={isSelected ? 'cyan' : undefined}>{repo.name}</Text>
        <Text color="blueBright">{repo.branch}</Text>
        {repo.upstream ? (
          <Text dimColor>→ {repo.upstream}</Text>
        ) : (
          <Text color="yellow">no remote</Text>
        )}
      </Box>
      <Box>
        {repo.error ? (
          <Text color="red">error</Text>
        ) : (
          <StatusBadge ahead={repo.ahead} behind={repo.behind} />
        )}
      </Box>
    </Box>
  );
}
