#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { runClaudeCommitPush, waitForKeypress } from './data/claudeCommit.js';

async function main() {
  const forcePicker = process.argv.includes('--pick');
  let spawnRequest: string | null = null;

  while (true) {
    spawnRequest = null;

    const instance = render(
      <App
        forcePicker={forcePicker}
        onSpawnClaude={(repoPath) => {
          spawnRequest = repoPath;
          instance.unmount();
        }}
      />
    );

    await instance.waitUntilExit();

    if (spawnRequest) {
      await runClaudeCommitPush(spawnRequest);
      await waitForKeypress();
    } else {
      break;
    }
  }
}

main();
