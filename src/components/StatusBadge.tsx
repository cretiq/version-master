import React from 'react';
import { Box, Text } from 'ink';

interface StatusBadgeProps {
  ahead: number;
  behind: number;
  dirty: number;
}

export function StatusBadge({ ahead, behind, dirty }: StatusBadgeProps) {
  const parts: React.ReactNode[] = [];

  if (ahead > 0) parts.push(<Text key="a" color="green">↑{ahead}</Text>);
  if (behind > 0) parts.push(<Text key="b" color="red">↓{behind}</Text>);
  if (dirty > 0) parts.push(<Text key="d" color="yellow">●{dirty}</Text>);

  if (parts.length === 0) {
    return <Text color="green">in sync</Text>;
  }

  return <Box gap={1}>{parts}</Box>;
}
