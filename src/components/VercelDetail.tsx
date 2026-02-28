import React from 'react';
import { Box, Text } from 'ink';
import type { VercelInfo } from '../types.js';

const COL = {
  offset: 2,
  state: 12,
  url: 32,
  health: 10,
} as const;

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATE_COLORS: Record<string, string> = {
  READY: 'green',
  BUILDING: 'yellow',
  ERROR: 'red',
  CANCELED: 'red',
  QUEUED: 'yellow',
};

export function VercelDetail({ vercel }: { vercel: VercelInfo }) {
  const stateColor = (vercel.deployState && STATE_COLORS[vercel.deployState]) ?? 'gray';

  return (
    <Box>
      <Box width={COL.offset}><Text dimColor>·</Text></Box>
      <Box width={COL.state}>
        <Text color={stateColor}>▲ {vercel.deployState ?? 'UNKNOWN'}</Text>
      </Box>
      <Box width={COL.url}>
        {vercel.prodUrl ? (
          <Text color="blueBright" wrap="truncate">{vercel.prodUrl}</Text>
        ) : (
          <Text> </Text>
        )}
      </Box>
      <Box width={COL.health}>
        {vercel.healthy !== null ? (
          <Text color={vercel.healthy ? 'green' : 'red'}>
            {vercel.healthy ? '● healthy' : '● down'}
          </Text>
        ) : (
          <Text> </Text>
        )}
      </Box>
      <Box flexGrow={1} justifyContent="flex-end">
        {vercel.lastDeployAt ? <Text dimColor>{timeAgo(vercel.lastDeployAt)}</Text> : <Text> </Text>}
      </Box>
    </Box>
  );
}
