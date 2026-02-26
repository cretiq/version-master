import React from 'react';
import { Box, Text } from 'ink';

interface StatusBadgeProps {
  ahead: number;
  behind: number;
}

export function StatusBadge({ ahead, behind }: StatusBadgeProps) {
  if (ahead === 0 && behind === 0) {
    return <Text color="green">in sync</Text>;
  }

  return (
    <Box gap={1}>
      {ahead > 0 && <Text color="green">↑{ahead}</Text>}
      {behind > 0 && <Text color="red">↓{behind}</Text>}
    </Box>
  );
}
