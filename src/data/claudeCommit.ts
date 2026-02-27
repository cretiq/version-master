import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { ReadStream } from 'node:tty';

export interface ClaudeTask {
  prompt: string;
  allowedTools: string;
}

export const COMMIT_TASK: ClaudeTask = {
  prompt: `You are an automated commit-push bot. Do NOT ask questions — just act.

Steps:
1. Run \`git status\` to see all changes (staged, unstaged, untracked)
2. Stage ALL changes: \`git add -A\`
3. Run \`git diff --cached --stat\` to review what will be committed
4. Commit with a concise conventional message: \`type(scope): description\` (max 72 chars)
5. Push with \`git push -u origin HEAD\`

Rules:
- Never ask the user anything. Just execute.
- If there are no changes at all, say "Nothing to commit" and stop.
- Commit message must be lowercase conventional format.`,
  allowedTools: 'Bash(git *)',
};

export const TIDY_TASK: ClaudeTask = {
  prompt: `You are an automated git tidy bot. Do NOT ask questions — just act.

Steps:
1. Run \`git status\` to list all untracked and modified files
2. If clean — say "Nothing to tidy" and stop
3. Classify each untracked file/directory:
   - IGNORE: build artifacts (dist/, build/, out/), dependencies (node_modules/, vendor/, .venv/, __pycache__/), caches (*.tmp, *.swp, *cache*), OS/IDE (.DS_Store, .idea/, .vscode/settings.json), secrets (.env, .env.*, *.pem, *.key), logs (*.log), backups (*.bak, *.backup), generated (coverage/, .nyc_output/)
   - COMMIT: source code, configs, docs, tests, CI files, lock files, .gitignore itself
   - When unsure, read the file to determine if generated or authored — if still unclear, commit it
4. Read existing .gitignore (create if missing), add new IGNORE entries grouped by category, don't duplicate
5. Stage .gitignore + all COMMIT files by name (never \`git add .\` or \`git add -A\`)
6. Commit with a concise conventional message: \`type(scope): description\` (max 72 chars)
7. Push with \`git push -u origin HEAD\`

Rules:
- Never ask the user anything. Just execute.
- Commit message must be lowercase conventional format.`,
  allowedTools: 'Bash(git *),Read,Edit,Write,Grep,Glob',
};

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

export async function runClaudeTask(repoPath: string, task: ClaudeTask): Promise<void> {
  console.log(`\n${DIM}  ${repoPath}${RESET}`);

  const exitCode = await new Promise<number | null>((resolve) => {
    const child = spawn(
      'claude',
      [
        '-p', task.prompt,
        '--allowedTools', task.allowedTools,
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

    const state: ParseState = { toolName: '', toolInput: '', inText: false, hadText: false };
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
