import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { ReadStream } from 'node:tty';

const PROMPT = `You are an automated commit-push bot. Do NOT ask questions — just act.

Steps:
1. Run \`git status\` to see all changes (staged, unstaged, untracked)
2. Stage ALL changes: \`git add -A\`
3. Run \`git diff --cached --stat\` to review what will be committed
4. Commit with a concise conventional message: \`type(scope): description\` (max 72 chars)
5. Push with \`git push -u origin HEAD\`

Rules:
- Never ask the user anything. Just execute.
- If there are no changes at all, say "Nothing to commit" and stop.
- Commit message must be lowercase conventional format.`;

// ANSI helpers
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const RESULT_MAX_LINES = 20;

interface ParseState {
  toolName: string;
  toolInput: string;
  inText: boolean;
  hadText: boolean;
  textBuf: string;
}

function printToolCommand(name: string, rawInput: string): void {
  try {
    const input = JSON.parse(rawInput);
    if (name === 'Bash' && input.command) {
      console.log(`\n  ${CYAN}▸${RESET} ${input.command}`);
      return;
    }
  } catch { /* partial JSON — show raw */ }
  console.log(`\n  ${CYAN}▸${RESET} ${name}`);
}

function printToolResult(content: unknown): void {
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? (content as Array<{ text?: string }>).map((c) => c.text ?? '').join('\n')
        : String(content ?? '');
  if (!text.trim()) return;

  const lines = text.split('\n');
  const display =
    lines.length > RESULT_MAX_LINES
      ? [...lines.slice(0, RESULT_MAX_LINES - 1), `    ${DIM}… ${lines.length - RESULT_MAX_LINES + 1} more lines${RESET}`]
      : lines;
  console.log(display.map((l) => `${DIM}    ${l}${RESET}`).join('\n'));
}

function handleEvent(raw: unknown, state: ParseState): void {
  const ev = raw as Record<string, unknown>;

  // ── stream_event: wraps Anthropic API streaming events ──
  if (ev.type === 'stream_event') {
    const e = ev.event as Record<string, unknown> | undefined;
    if (!e) return;

    // content_block_start → detect tool_use or text block
    if (e.type === 'content_block_start') {
      const block = e.content_block as Record<string, unknown> | undefined;
      if (block?.type === 'tool_use') {
        state.toolName = String(block.name ?? '');
        state.toolInput = '';
      } else if (block?.type === 'text') {
        state.inText = true;
      }
      return;
    }

    // content_block_delta → accumulate tool input or stream text
    if (e.type === 'content_block_delta') {
      const delta = e.delta as Record<string, unknown> | undefined;
      if (delta?.type === 'input_json_delta') {
        state.toolInput += String(delta.partial_json ?? '');
      } else if (delta?.type === 'text_delta' && state.inText) {
        const text = String(delta.text ?? '');
        if (text) {
          if (!state.hadText) {
            process.stdout.write('\n  ');
            state.hadText = true;
          }
          process.stdout.write(text);
        }
      }
      return;
    }

    // content_block_stop → flush tool command or end text
    if (e.type === 'content_block_stop') {
      if (state.toolName) {
        printToolCommand(state.toolName, state.toolInput);
        state.toolName = '';
        state.toolInput = '';
      }
      if (state.inText) {
        state.inText = false;
      }
      return;
    }

    return;
  }

  // ── tool_result (verbose mode) ──
  if (ev.type === 'tool_result' || ev.subtype === 'tool_result') {
    printToolResult(ev.content ?? ev.output ?? '');
    return;
  }

  // ── result: final output ──
  if (ev.type === 'result') {
    if (state.hadText) {
      process.stdout.write('\n');
    } else if (ev.result) {
      console.log(`\n  ${GREEN}${ev.result}${RESET}`);
    }
    return;
  }
}

export async function runClaudeCommitPush(repoPath: string): Promise<void> {
  console.log(`\n${DIM}  commit-push: ${repoPath}${RESET}`);

  const exitCode = await new Promise<number | null>((resolve) => {
    const child = spawn(
      'claude',
      [
        '-p', PROMPT,
        '--allowedTools', 'Bash(git *)',
        '--output-format', 'stream-json',
        '--verbose',
        '--include-partial-messages',
      ],
      { cwd: repoPath, stdio: ['ignore', 'pipe', 'inherit'] },
    );

    child.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`\n  ${RED}"claude" not found on PATH.${RESET}\n`);
      } else {
        console.error(`\n  ${RED}Spawn error: ${err.message}${RESET}\n`);
      }
      resolve(1);
    });

    const state: ParseState = { toolName: '', toolInput: '', inText: false, hadText: false, textBuf: '' };
    const rl = createInterface({ input: child.stdout! });
    rl.on('line', (line) => {
      try {
        handleEvent(JSON.parse(line), state);
      } catch { /* skip malformed lines */ }
    });

    child.on('close', (code) => resolve(code));
  });

  if (exitCode !== 0) {
    console.error(`\n  ${RED}Claude exited with code ${exitCode ?? 'unknown'}${RESET}`);
  }
}

export async function runParallelCommitPush(repoPaths: string[]): Promise<void> {
  if (repoPaths.length === 1) {
    await runClaudeCommitPush(repoPaths[0]!);
    return;
  }

  const results = await Promise.all(
    repoPaths.map(async (repoPath) => {
      const lines: string[] = [];
      const name = repoPath.split('/').pop() ?? repoPath;
      const push = (msg: string) => lines.push(msg);

      const exitCode = await new Promise<number | null>((resolve) => {
        const child = spawn(
          'claude',
          [
            '-p', PROMPT,
            '--allowedTools', 'Bash(git *)',
            '--output-format', 'stream-json',
            '--verbose',
            '--include-partial-messages',
          ],
          { cwd: repoPath, stdio: ['ignore', 'pipe', 'inherit'] },
        );

        child.on('error', (err) => {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            push(`  ${RED}"claude" not found on PATH.${RESET}`);
          } else {
            push(`  ${RED}Spawn error: ${err.message}${RESET}`);
          }
          resolve(1);
        });

        const state: ParseState = { toolName: '', toolInput: '', inText: false, hadText: false, textBuf: '' };
        const rl = createInterface({ input: child.stdout! });
        rl.on('line', (line) => {
          try {
            const ev = JSON.parse(line) as Record<string, unknown>;
            if (ev.type === 'stream_event') {
              const e = ev.event as Record<string, unknown> | undefined;
              if (!e) return;
              if (e.type === 'content_block_start') {
                const block = e.content_block as Record<string, unknown> | undefined;
                if (block?.type === 'tool_use') {
                  state.toolName = String(block.name ?? '');
                  state.toolInput = '';
                } else if (block?.type === 'text') {
                  state.inText = true;
                  state.textBuf = '';
                }
                return;
              }
              if (e.type === 'content_block_delta') {
                const delta = e.delta as Record<string, unknown> | undefined;
                if (delta?.type === 'input_json_delta') {
                  state.toolInput += String(delta.partial_json ?? '');
                } else if (delta?.type === 'text_delta' && state.inText) {
                  state.textBuf += String(delta.text ?? '');
                }
                return;
              }
              if (e.type === 'content_block_stop') {
                if (state.toolName) {
                  try {
                    const input = JSON.parse(state.toolInput);
                    if (state.toolName === 'Bash' && input.command) {
                      push(`  ${CYAN}▸${RESET} ${input.command}`);
                    } else {
                      push(`  ${CYAN}▸${RESET} ${state.toolName}`);
                    }
                  } catch {
                    push(`  ${CYAN}▸${RESET} ${state.toolName}`);
                  }
                  state.toolName = '';
                  state.toolInput = '';
                }
                if (state.inText) {
                  if (state.textBuf.trim()) {
                    push(`  ${state.textBuf.trim()}`);
                    state.hadText = true;
                  }
                  state.inText = false;
                  state.textBuf = '';
                }
                return;
              }
              return;
            }
            if (ev.type === 'result' && ev.result && !state.hadText) {
              push(`  ${GREEN}${ev.result}${RESET}`);
            }
          } catch { /* skip malformed */ }
        });

        child.on('close', (code) => resolve(code));
      });

      if (exitCode !== 0) {
        push(`  ${RED}Exited with code ${exitCode ?? 'unknown'}${RESET}`);
      }

      return { name, lines };
    }),
  );

  // Print all buffered output, grouped by repo
  for (const { name, lines } of results) {
    console.log(`\n  ${CYAN}${name}${RESET}`);
    for (const line of lines) console.log(line);
    console.log(`  ${GREEN}Done.${RESET}`);
  }
}

export function waitForKeypress(): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n  ${DIM}Press any key to return…${RESET}`);
    // Open a fresh tty fd — process.stdin may be destroyed after Ink unmounts
    const fd = openSync('/dev/tty', 'r');
    const tty = new ReadStream(fd);
    tty.setRawMode(true);
    tty.resume();
    tty.once('data', () => {
      tty.setRawMode(false);
      tty.destroy();
      resolve();
    });
  });
}
