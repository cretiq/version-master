import { useState, useEffect } from 'react';
import { getClaudeUsage } from '../data/claudeUsage.js';
import type { ClaudeUsage } from '../types.js';

export function useClaudeUsage(enabled: boolean): ClaudeUsage | null {
  const [usage, setUsage] = useState<ClaudeUsage | null>(() => getClaudeUsage());

  useEffect(() => {
    if (!enabled) return;
    setUsage(getClaudeUsage());
    const id = setInterval(() => setUsage(getClaudeUsage()), 5_000);
    return () => clearInterval(id);
  }, [enabled]);

  return usage;
}
