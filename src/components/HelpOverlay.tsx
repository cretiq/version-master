import React from 'react';
import { Box, Text } from 'ink';

interface HelpOverlayProps {
  onClose: () => void;
}

const LEFT_COL = [
  { heading: 'Navigation' },
  { key: 'j/k', desc: 'navigate' },
  { key: 'space', desc: 'mark' },
  { key: 'a', desc: 'select all' },
  null,
  { heading: 'Views' },
  { key: 'd', desc: 'detail' },
  { key: 'D', desc: 'expand all' },
  { key: 'p', desc: 'picker' },
] as const;

const RIGHT_COL = [
  { heading: 'Actions' },
  { key: 'r', desc: 'refresh' },
  { key: 'c', desc: 'commit+push' },
  { key: 't', desc: 'tidy' },
  { key: 's', desc: 'sort' },
  null,
  { heading: 'External' },
  { key: 'o', desc: 'open site' },
  { key: 'v', desc: 'vercel' },
  null,
  { heading: 'Other' },
  { key: 'q', desc: 'quit' },
  { key: '?', desc: 'help' },
] as const;

type Row = { heading: string } | { key: string; desc: string } | null;

function renderColumn(rows: readonly Row[]) {
  return (
    <Box flexDirection="column" width={22}>
      {rows.map((row, i) => {
        if (row === null) return <Text key={i}> </Text>;
        if ('heading' in row) return <Text key={i} bold color="cyan">{row.heading}</Text>;
        return (
          <Box key={i} gap={1}>
            <Text color="yellow" bold>{row.key.padEnd(7)}</Text>
            <Text>{row.desc}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={3}
      paddingY={1}
      alignItems="center"
    >
      <Text bold color="cyan">Help</Text>
      <Text> </Text>
      <Box gap={4}>
        {renderColumn(LEFT_COL)}
        {renderColumn(RIGHT_COL)}
      </Box>
      <Text> </Text>
      <Text dimColor>press ? or esc to close</Text>
    </Box>
  );
}
