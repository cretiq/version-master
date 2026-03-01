import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  lastRefresh?: Date;
}

export function StatusBar({ lastRefresh }: StatusBarProps) {
  const timeStr = lastRefresh
    ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={1}>
        <Text color="cyan" bold>?</Text>
        <Text dimColor>help</Text>
      </Box>
      <Text dimColor>refreshed {timeStr}</Text>
    </Box>
  );
}
