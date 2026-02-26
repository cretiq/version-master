import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { PROMPT } from '../data/claudeCommit.js';

const MAX_LINES = 25;

type Line =
  | { type: 'cmd'; text: string }
  | { type: 'txt'; text: string }
  | { type: 'ok'; text: string }
  | { type: 'err'; text: string };

interface Column {
  name: string;
  lines: Line[];
  done: boolean;
}

interface Props {
  repoPaths: string[];
}

export function ParallelCommitView({ repoPaths }: Props) {
  const { exit } = useApp();
  const [columns, setColumns] = useState<Column[]>(
    repoPaths.map((p) => ({
      name: p.split('/').pop() ?? p,
      lines: [],
      done: false,
    })),
  );
  const allDone = columns.every((c) => c.done);

  useEffect(() => {
    const children: ChildProcess[] = [];

    repoPaths.forEach((repoPath, idx) => {
      const addLine = (line: Line) => {
        setColumns((prev) =>
          prev.map((col, i) =>
            i === idx ? { ...col, lines: [...col.lines, line] } : col,
          ),
        );
      };
      const markDone = () => {
        setColumns((prev) =>
          prev.map((col, i) =>
            i === idx ? { ...col, done: true } : col,
          ),
        );
      };

      const child = spawn(
        'claude',
        [
          '-p', PROMPT,
          '--allowedTools', 'Bash(git *)',
          '--output-format', 'stream-json',
          '--verbose',
          '--include-partial-messages',
        ],
        { cwd: repoPath, stdio: ['ignore', 'pipe', 'pipe'] },
      );
      children.push(child);

      let toolName = '';
      let toolInput = '';
      let inText = false;
      let textBuf = '';
      let hadText = false;

      child.on('error', (err) => {
        addLine({ type: 'err', text: err.message });
        markDone();
      });

      const rl = createInterface({ input: child.stdout! });
      rl.on('line', (raw) => {
        try {
          const ev = JSON.parse(raw) as Record<string, unknown>;
          if (ev.type === 'stream_event') {
            const e = ev.event as Record<string, unknown> | undefined;
            if (!e) return;

            if (e.type === 'content_block_start') {
              const block = e.content_block as Record<string, unknown> | undefined;
              if (block?.type === 'tool_use') {
                toolName = String(block.name ?? '');
                toolInput = '';
              } else if (block?.type === 'text') {
                inText = true;
                textBuf = '';
              }
            } else if (e.type === 'content_block_delta') {
              const delta = e.delta as Record<string, unknown> | undefined;
              if (delta?.type === 'input_json_delta') {
                toolInput += String(delta.partial_json ?? '');
              } else if (delta?.type === 'text_delta' && inText) {
                textBuf += String(delta.text ?? '');
              }
            } else if (e.type === 'content_block_stop') {
              if (toolName) {
                try {
                  const input = JSON.parse(toolInput);
                  if (toolName === 'Bash' && input.command) {
                    addLine({ type: 'cmd', text: input.command });
                  } else {
                    addLine({ type: 'cmd', text: toolName });
                  }
                } catch {
                  addLine({ type: 'cmd', text: toolName });
                }
                toolName = '';
                toolInput = '';
              }
              if (inText) {
                if (textBuf.trim()) {
                  addLine({ type: 'txt', text: textBuf.trim() });
                  hadText = true;
                }
                inText = false;
                textBuf = '';
              }
            }
          } else if (ev.type === 'result' && ev.result && !hadText) {
            addLine({ type: 'ok', text: String(ev.result) });
          }
        } catch { /* skip malformed */ }
      });

      child.on('close', (code) => {
        if (code !== 0) {
          addLine({ type: 'err', text: `Exit code ${code ?? 'unknown'}` });
        }
        markDone();
      });
    });

    return () => {
      children.forEach((c) => { if (!c.killed) c.kill(); });
    };
  }, []);

  useInput(() => {
    if (allDone) exit();
  }, { isActive: allDone });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" gap={1}>
        {columns.map((col, i) => (
          <Box
            key={i}
            flexDirection="column"
            borderStyle="round"
            borderColor={col.done ? 'green' : 'cyan'}
            flexGrow={1}
            paddingX={1}
          >
            <Text bold color="cyan">{col.name}</Text>
            {col.lines.slice(-MAX_LINES).map((line, j) => {
              switch (line.type) {
                case 'cmd': return <Text key={j} color="cyan" wrap="truncate">▸ {line.text}</Text>;
                case 'txt': return <Text key={j} wrap="truncate">{line.text}</Text>;
                case 'ok': return <Text key={j} color="green" wrap="truncate">{line.text}</Text>;
                case 'err': return <Text key={j} color="red" wrap="truncate">{line.text}</Text>;
              }
            })}
            {col.done && <Text color="greenBright">✓ Done</Text>}
          </Box>
        ))}
      </Box>
      {allDone && (
        <Box marginTop={1}>
          <Text dimColor>Press any key to return…</Text>
        </Box>
      )}
    </Box>
  );
}
