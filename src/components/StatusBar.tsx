import React from 'react';
import { Box, Text } from 'ink';
import type { Shortcut } from '../types.js';

interface StatusBarProps {
  shortcuts: Shortcut[];
  lastRefresh?: Date;
}

export function StatusBar({ shortcuts, lastRefresh }: StatusBarProps) {
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
      <Box gap={2} flexWrap="wrap">
        {shortcuts.map(({ key, action }) => (
          <Box key={key} gap={1}>
            <Text color="cyan" bold>{key}</Text>
            <Text dimColor>{action}</Text>
          </Box>
        ))}
      </Box>
      <Text dimColor> refreshed {timeStr}</Text>
    </Box>
  );
}
