import React from 'react';
import { Box, Text } from 'ink';
import { StatusBadge } from './StatusBadge.js';
import { VercelBadge } from './VercelBadge.js';
import { VercelDetail } from './VercelDetail.js';
import type { RepoInfo } from '../types.js';

// Column widths (characters)
const COL = {
  mark: 2,
  name: 18,
  vercel: 3,
  branch: 16,
  upstream: 22,
} as const;

interface RepoEntryProps {
  repo: RepoInfo;
  isSelected: boolean;
  isMarked: boolean;
  isExpanded: boolean;
}

export function RepoEntry({ repo, isSelected, isMarked, isExpanded }: RepoEntryProps) {
  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={isSelected ? 'cyan' : 'gray'}
        paddingX={2}
      >
        <Box>
          <Box width={COL.mark}>
            {isMarked ? <Text color="green">◉</Text> : <Text> </Text>}
          </Box>
          <Box width={COL.name}>
            <Text bold color={isSelected ? 'cyan' : undefined} wrap="truncate">{repo.name}</Text>
          </Box>
          <Box width={COL.vercel}>
            {repo.vercel ? <VercelBadge deployState={repo.vercel.deployState} /> : <Text> </Text>}
          </Box>
          {repo.loading ? (
            <Box flexGrow={1}>
              <Text dimColor>…</Text>
            </Box>
          ) : (
            <>
              <Box width={COL.branch}>
                <Text color="blueBright" wrap="truncate">{repo.branch}</Text>
              </Box>
              <Box width={COL.upstream}>
                {repo.upstream ? (
                  <Text dimColor wrap="truncate">→ {repo.upstream}</Text>
                ) : (
                  <Text color="yellow">no remote</Text>
                )}
              </Box>
              <Box flexGrow={1} justifyContent="flex-end">
                {repo.error ? (
                  <Text color="red">error</Text>
                ) : (
                  <StatusBadge ahead={repo.ahead} behind={repo.behind} dirty={repo.dirty} />
                )}
              </Box>
            </>
          )}
        </Box>
        {isExpanded && (
          <>
            {repo.vercel ? (
              <VercelDetail vercel={repo.vercel} />
            ) : (
              <Text> </Text>
            )}
            <Box>
              <Box width={COL.mark}><Text dimColor>·</Text></Box>
              {repo.techStack && repo.techStack.length > 0 ? (
                <>
                  <Text dimColor>lang  </Text>
                  <Text wrap="truncate">{repo.techStack.join('  ')}</Text>
                </>
              ) : (
                <Text> </Text>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
