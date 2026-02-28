import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ClaudeUsage } from "../types.js";

const USAGE_PATH = join(homedir(), ".claude", "cache", "oauth-usage.json");

export function getClaudeUsage(): ClaudeUsage | null {
  try {
    const raw = JSON.parse(readFileSync(USAGE_PATH, "utf-8"));
    const fiveHourPct = parseFloat(raw.five_hour_pct);
    const sevenDayPct = parseFloat(raw.seven_day_pct);
    const updated = raw.updated;
    if (isNaN(fiveHourPct) || isNaN(sevenDayPct) || typeof updated !== "number") {
      return null;
    }
    const fiveHourResetsAt = raw.five_hour_reset
      ? Math.floor(new Date(raw.five_hour_reset).getTime() / 1000)
      : updated + 5 * 3600;
    const sevenDayResetsAt = raw.seven_day_reset
      ? Math.floor(new Date(raw.seven_day_reset).getTime() / 1000)
      : updated + 7 * 86400;
    return { fiveHourPct, sevenDayPct, fiveHourResetsAt, sevenDayResetsAt, updated };
  } catch {
    return null;
  }
}
