import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(execFileCb);
const TIMEOUT = 5000;

const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.swift': 'Swift',
  '.cs': 'C#',
  '.fs': 'F#',
  '.rs': 'Rust',
  '.go': 'Go',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.dart': 'Dart',
  '.php': 'PHP',
  '.lua': 'Lua',
  '.zig': 'Zig',
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.h': 'C',
  '.hpp': 'C++',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.html': 'HTML',
  '.svelte': 'Svelte',
  '.vue': 'Vue',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.xaml': 'XAML',
};

// Extensions to ignore (config, data, assets — not "languages")
const IGNORE_EXTS = new Set([
  '.json', '.yaml', '.yml', '.toml', '.xml', '.md', '.txt', '.lock',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.map', '.d.ts',
  '.env', '.gitignore', '.editorconfig', '.prettierrc',
]);

export async function detectTechStack(repoPath: string): Promise<string[]> {
  try {
    const { stdout } = await execFile(
      'git', ['-C', repoPath, 'ls-files'],
      { timeout: TIMEOUT, maxBuffer: 1024 * 1024 },
    );

    const counts = new Map<string, number>();

    for (const line of stdout.split('\n')) {
      if (!line) continue;
      const dot = line.lastIndexOf('.');
      if (dot === -1) continue;
      const ext = line.slice(dot).toLowerCase();
      if (IGNORE_EXTS.has(ext)) continue;
      const lang = EXT_TO_LANG[ext];
      if (!lang) continue;
      counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }

    // Sort by file count descending, return top languages
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

    // Only include languages with meaningful presence (>= 1% of total or at least 2 files)
    const total = sorted.reduce((sum, [, n]) => sum + n, 0);
    const threshold = Math.max(2, Math.floor(total * 0.01));

    return sorted
      .filter(([, n]) => n >= threshold)
      .map(([lang]) => lang);
  } catch {
    return [];
  }
}
