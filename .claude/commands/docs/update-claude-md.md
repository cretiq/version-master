---
description: "Keep project CLAUDE.md accurate — verifies documented paths, conventions, and architecture against the real codebase. Prevents config drift."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*)
---

# Update Project CLAUDE.md

Verify and update the project's CLAUDE.md against the actual codebase. CLAUDE.md is loaded into every conversation — it's the most expensive context real estate. Every token must earn its place.

**Target file:** `.claude/CLAUDE.md` (or project root `CLAUDE.md` — wherever the project keeps it).

## Step 1: Determine Scope

If `$ARGUMENTS` is provided, focus on that section/topic only.

If no arguments, detect from context:
1. Check recent git changes: `git diff --name-only HEAD~10`
2. Read current CLAUDE.md — identify which sections are affected by changed files
3. Scope the update to affected sections

## Step 2: Verify Existing Content

Read CLAUDE.md and for each claim, verify it against the codebase:

1. **Paths** — do documented paths still exist? `Glob` each one.
2. **Conventions** — are stated patterns still followed? `Grep` for examples.
3. **Glossary terms** — are abbreviations/terms still used in the code?
4. **Non-obvious notes** — are rationale/gotchas still accurate?

Flag discrepancies:
- Path moved/deleted → update or remove
- Convention changed → correct it
- New non-obvious knowledge from recent changes → add it

## Step 3: Value Filter

Before adding anything new, apply the same filter as sync-docs:

> "Could Claude discover this in ≤3 tool calls?"

**Belongs in CLAUDE.md** (loaded every conversation):
- Project identity — what is this, tech stack, package structure (1-2 lines)
- Glossary — domain abbreviations that appear in code/commits/conversations
- Key paths — the 5-10 entry points for orientation (not an exhaustive file tree)
- Non-obvious gotchas — things that apply broadly and would bite you in any task

**Belongs in skills** (loaded on-demand):
- Detailed conventions for a specific subsystem
- Troubleshooting steps
- Operational procedures
- Coordination patterns between components

**Belongs nowhere** (discoverable):
- File inventories, component lists, endpoint lists
- Type definitions, schema dumps
- Prop descriptions, CSS class lists

If something is already covered by a skill, CLAUDE.md should have at most a one-line mention, not a duplicate explanation.

## Step 4: Apply Updates

Edit CLAUDE.md in-place.

**Rules:**
- Keep existing section ordering — don't reorganize
- Add to existing sections rather than creating new ones
- Remove items confirmed deleted from the codebase
- Match the existing style (read the file — don't impose a template)
- When unsure about removing, ask the user

## Step 5: Size Check

After edits, verify CLAUDE.md is still lean:
- Under ~50 lines for small projects (<50 source files)
- Under ~100 lines for medium projects
- If it's growing past these, content probably belongs in a skill instead

## Step 6: Report

```
## CLAUDE.md Verification

### Changes
- {section}: {what changed and why}

### Suggestions
- {anything needing manual verification or that should move to a skill}
```

## Rules

- **Every token must earn its place** — CLAUDE.md costs context in every single conversation
- **Evidence-based** — only change what's confirmed by grep/glob
- **Don't duplicate skills** — detailed knowledge belongs in skills, not CLAUDE.md
- **Keep it concise** — quick reference, not comprehensive guide
- **Ask before removing** — if unsure whether something is still relevant, ask
