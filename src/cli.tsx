#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { runClaudeCommitPush, waitForKeypress } from './data/claudeCommit.js';
import { ParallelCommitView } from './components/ParallelCommitView.js';

async function main() {
  const forcePicker = process.argv.includes('--pick');
  let spawnRequest: string[] | null = null;

  while (true) {
    spawnRequest = null;

    const instance = render(
      <App
        forcePicker={forcePicker}
        onSpawnClaude={(repoPaths) => {
          spawnRequest = repoPaths;
          instance.unmount();
        }}
      />
    );

    await instance.waitUntilExit();

    const paths = spawnRequest as string[] | null;
    if (paths) {
      if (paths.length === 1) {
        await runClaudeCommitPush(paths[0]!);
        await waitForKeypress();
      } else {
        const commitView = render(<ParallelCommitView repoPaths={paths} />);
        await commitView.waitUntilExit();
      }
    } else {
      break;
    }
  }
}

main();
