import React from 'react';
import { Text } from 'ink';

const STATE_COLORS: Record<string, string> = {
  READY: 'green',
  BUILDING: 'yellow',
  ERROR: 'red',
  CANCELED: 'red',
  QUEUED: 'yellow',
};

export function VercelBadge({ deployState }: { deployState: string | null }) {
  const color = (deployState && STATE_COLORS[deployState]) ?? 'gray';
  return <Text color={color}>▲</Text>;
}
