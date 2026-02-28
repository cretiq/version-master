import React from "react";
import { Text } from "ink";
import { Chalk } from "chalk";
import type { ClaudeUsage } from "../types.js";

const EMPTY_CHAR = "░";
const EMPTY_COLOR = "#333344";
const LABEL_DIM = "#888899";
const PACE_MARKER_COLOR = "#ffcc00";

const SESSION_WINDOW = 5 * 3600; // 18000s
const WEEKLY_WINDOW = 7 * 86400; // 604800s

const stops: [number, number, number, number][] = [
  [0,     0x06, 0xb6, 0xd4],
  [0.08,  0x0e, 0xa5, 0xe9],
  [0.17,  0x38, 0x8a, 0xd8],
  [0.25,  0x3b, 0x82, 0xf6],
  [0.33,  0x4f, 0x74, 0xf3],
  [0.42,  0x63, 0x66, 0xf1],
  [0.50,  0x79, 0x5e, 0xf3],
  [0.58,  0x8b, 0x5c, 0xf6],
  [0.67,  0xa7, 0x52, 0xf0],
  [0.75,  0xc0, 0x4c, 0xec],
  [0.83,  0xd9, 0x46, 0xef],
  [0.92,  0xe8, 0x47, 0xc4],
  [1,     0xec, 0x48, 0x99],
];

function lerp(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < stops.length - 2 && clamped > stops[i + 1]![0]) i++;
  const [t0, r0, g0, b0] = stops[i]!;
  const [t1, r1, g1, b1] = stops[i + 1]!;
  const f = (clamped - t0) / (t1 - t0);
  return [
    Math.round(r0 + (r1 - r0) * f),
    Math.round(g0 + (g1 - g0) * f),
    Math.round(b0 + (b1 - b0) * f),
  ];
}

const tc = new Chalk({ level: 3 });

function hex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function colorAt(t: number): string {
  const [r, g, b] = lerp(t);
  return hex(r, g, b);
}

/** Format session countdown as "H:MM → 15:30" */
function fmtSessionCountdown(resetsAt: number): string {
  const remaining = Math.max(0, resetsAt - Math.floor(Date.now() / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const resetDate = new Date(resetsAt * 1000);
  const time = resetDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${h}:${String(m).padStart(2, "0")} → ${time}`;
}

/** Format weekly countdown as "Xd XXh → Sun 01:30" */
function fmtWeekCountdown(resetsAt: number): string {
  const remaining = Math.max(0, resetsAt - Math.floor(Date.now() / 1000));
  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const resetDate = new Date(resetsAt * 1000);
  const day = resetDate.toLocaleDateString("en-US", { weekday: "short" });
  const time = resetDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `Wk ${d}d${String(h).padStart(2, "0")}h → ${day} ${time}`;
}

/** Compute elapsed % of time window (0–100) for pace marker placement */
function computeElapsedPct(resetsAt: number, windowSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = resetsAt - windowSeconds;
  const elapsed = Math.max(0, Math.min(now - windowStart, windowSeconds));
  return (elapsed / windowSeconds) * 100;
}

interface GaugeBarProps {
  label: string;
  pct: number;
  stale: boolean;
  barWidth: number;
  paceMarkerPct: number;
}

function renderBar({ label, pct, stale, barWidth, paceMarkerPct }: GaugeBarProps): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filledCount = Math.floor((clamped / 100) * barWidth);
  const markerPos = Math.min(barWidth - 1, Math.max(0, Math.floor((paceMarkerPct / 100) * barWidth)));

  // Determine the background color a cell would normally have
  function cellBg(i: number): string {
    if (i < filledCount) {
      const t = filledCount > 1 ? i / (filledCount - 1) : 0;
      return colorAt(t);
    }
    // ░ is ~25% fill — approximate its visual appearance on black terminal
    return "#0d0d11";
  }

  let bar = "";
  for (let i = 0; i < barWidth; i++) {
    if (i === markerPos) {
      bar += tc.hex(PACE_MARKER_COLOR)("█");
    } else if (i < filledCount) {
      const t = filledCount > 1 ? i / (filledCount - 1) : 0;
      bar += tc.hex(colorAt(t))("█");
    } else {
      bar += tc.hex(EMPTY_COLOR)(EMPTY_CHAR);
    }
  }

  const pctStr = `${Math.round(clamped)}%`;
  const endColor = filledCount > 0 ? colorAt(1) : colorAt(0);
  const staleMarker = stale ? tc.hex(LABEL_DIM)("?") : "";

  return `${tc.hex(LABEL_DIM)(label)} ▕${bar}▏ ${tc.hex(endColor)(pctStr)}${staleMarker}`;
}

/** Visual width of a renderBar output (no ANSI codes) */
function barVisualWidth(labelLen: number, barWidth: number, pctStr: string, stale: boolean): number {
  return labelLen + 2 + barWidth + 2 + pctStr.length + (stale ? 1 : 0);
}

interface ClaudeGaugeProps {
  usage: ClaudeUsage | null;
  width: number;
}

export function ClaudeGauge({ usage, width }: ClaudeGaugeProps) {
  if (!usage) return <Text>{" "}</Text>;

  const stale = (Date.now() / 1000 - usage.updated) > 300;
  const firstLabel = `Ses ${fmtSessionCountdown(usage.fiveHourResetsAt)}`;
  const secondLabel = fmtWeekCountdown(usage.sevenDayResetsAt);

  const sesElapsed = computeElapsedPct(usage.fiveHourResetsAt, SESSION_WINDOW);
  const wkElapsed = computeElapsedPct(usage.sevenDayResetsAt, WEEKLY_WINDOW);

  const SEP = "  ·  ";
  const halfWidth = Math.floor((width - SEP.length) / 2);

  const leftOverhead = firstLabel.length + 2 + 2 + 5;
  const rightOverhead = secondLabel.length + 2 + 2 + 5;
  const barWidth = Math.max(10, halfWidth - Math.max(leftOverhead, rightOverhead));

  const bar5h = renderBar({ label: firstLabel, pct: usage.fiveHourPct, stale, barWidth, paceMarkerPct: sesElapsed });
  const bar7d = renderBar({ label: secondLabel, pct: usage.sevenDayPct, stale, barWidth, paceMarkerPct: wkElapsed });

  const pct5h = `${Math.round(Math.max(0, Math.min(100, usage.fiveHourPct)))}%`;
  const pct7d = `${Math.round(Math.max(0, Math.min(100, usage.sevenDayPct)))}%`;
  const leftPad = " ".repeat(Math.max(0, halfWidth - barVisualWidth(firstLabel.length, barWidth, pct5h, stale)));
  const rightPad = " ".repeat(Math.max(0, halfWidth - barVisualWidth(secondLabel.length, barWidth, pct7d, stale)));

  const separator = tc.dim(SEP);

  return <Text>{leftPad}{bar5h}{separator}{rightPad}{bar7d}</Text>;
}
