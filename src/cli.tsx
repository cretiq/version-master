import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { runClaudeTask, waitForKeypress, COMMIT_TASK, TIDY_TASK, type ClaudeTask } from './data/claudeCommit.js';
import { ParallelCommitView } from './components/ParallelCommitView.js';
import type { SpawnMode } from './app.js';

async function main() {
  const forcePicker = process.argv.includes('--pick');
  let spawnRequest: { paths: string[]; mode: SpawnMode } | null = null;

  const TASKS: Record<SpawnMode, ClaudeTask> = {
    commit: COMMIT_TASK,
    tidy: TIDY_TASK,
  };

  const clear = () => process.stdout.write('\x1b[2J\x1b[H');

  while (true) {
    spawnRequest = null;
    clear();

    const instance = render(
      <App
        forcePicker={forcePicker}
        onSpawn={(repoPaths, mode) => {
          spawnRequest = { paths: repoPaths, mode };
          instance.unmount();
        }}
      />
    );

    await instance.waitUntilExit();

    const req = spawnRequest as { paths: string[]; mode: SpawnMode } | null;
    if (req) {
      const task = TASKS[req.mode];
      if (req.paths.length === 1) {
        await runClaudeTask(req.paths[0]!, task);
        await waitForKeypress();
      } else {
        const view = render(<ParallelCommitView repoPaths={req.paths} task={task} />);
        await view.waitUntilExit();
      }
    } else {
      break;
    }
  }
}

main();
