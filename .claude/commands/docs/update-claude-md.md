---
description: "Keep CLAUDE.md accurate — verifies documented paths, conventions, and architecture against the real codebase. Prevents config drift."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*)
---

# Update CLAUDE.md

Verify and update `CLAUDE.md` against the actual codebase.

**Target file:** `CLAUDE.md` (project root)

## Step 1: Determine Scope

If `$ARGUMENTS` is provided, focus on that section/topic only.

If no arguments, detect from context:
1. Check recent git changes: `git diff --name-only HEAD~10`
2. Map changed files to CLAUDE.md sections (see Section Map below)
3. Scope the update to affected sections

## Step 2: Locate the Codebase

Determine the current worktree root:
```bash
git rev-parse --show-toplevel
```

This is the codebase to verify against. All grep/glob searches run here.

## Step 3: Verify Each Section

Work through the relevant sections of CLAUDE.md. For each, compare documented content against the actual codebase.

### Section Map

| CLAUDE.md Section | What to Verify | How |
|---|---|---|
| **Project Structure** | Directory tree still matches | `ls` the documented dirs, check for new top-level dirs |
| **Architecture** | Component patterns still hold | Grep for documented patterns, verify imports |
| **Dependencies** | Package versions still accurate | Check `package.json` |
| **Key Conventions** | Naming patterns still followed | Grep for component/module naming patterns |
| **Build & Run** | Commands still work | Verify scripts in `package.json` |
| **File Paths** | Referenced files still exist | Glob for documented paths |

### For Each Section:

1. **Read the section** from CLAUDE.md
2. **Grep/Glob to verify** each documented path, pattern, or convention
3. **Check for new additions** — are there new components, modules, etc. that should be documented?
4. **Flag discrepancies:**
   - Path no longer exists → needs removal or update
   - New pattern not documented → needs addition
   - Convention changed → needs correction

## Step 4: Check for Missing Sections

Look for significant codebase features not covered by CLAUDE.md:

- **New top-level directories** that aren't in Project Structure
- **New architectural patterns** not in Architecture
- **New component categories** not documented
- **New data modules** or integrations
- **New conventions** that have emerged (check recent commits for recurring patterns)

## Step 5: Apply Updates

Edit `CLAUDE.md` in-place.

**Update rules:**
- Keep the same section ordering — don't reorganize
- Keep the same concise style — bullet points, tables, code blocks
- Add new entries to existing sections rather than creating new sections
- Only create a new section if the topic genuinely doesn't fit anywhere
- Remove documented items only if they're confirmed deleted from the codebase
- When in doubt about removing something, add a comment like `<!-- verify: still used? -->` instead

**Style to match:**
- Terse headings (e.g., "Key Conventions", not "Key Naming Conventions and Patterns")
- Bullet points with `**bold label:**` followed by path or explanation
- Tables for structured data
- Code blocks for commands, paths, and architecture diagrams

## Step 6: Report

```
## CLAUDE.md Verification Report

### Verified Sections
- {section} — ✅ accurate / ⚠️ updated / ❌ stale content found

### Changes Applied
- {section}: {what changed and why}

### New Content Added
- {section}: {what was added}

### Suggestions
- {anything that needs manual verification or team input}
```

## Rules

- **Edit `CLAUDE.md` at project root only**
- **Evidence-based** — only change what's confirmed by grep/glob against the codebase
- **Preserve structure** — maintain existing section order and formatting style
- **Keep it concise** — CLAUDE.md is a quick reference, not a comprehensive guide. Detailed content belongs in skills.
- **Don't duplicate skills** — if something is thoroughly covered by a skill, CLAUDE.md should have a brief summary at most
- **Ask before removing** — if unsure whether something is still relevant, ask the user
