---
description: "Single command for all skill maintenance — detects changes, updates existing skills, creates missing ones. Produces lean, high-value documentation only."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(mkdir:*), Bash(rm -rf:*)
---

# Sync Skill Documentation

Auto-detect what needs updating and what needs creating. Produces only high-value knowledge — things expensive to discover from code.

## Step 1: Determine Scope

If `$ARGUMENTS` is a git range (e.g. `HEAD~20`, `abc123..HEAD`):
1. Run `git log --oneline $ARGUMENTS` and `git diff $ARGUMENTS --stat` to understand scope
2. Run `git diff $ARGUMENTS -- <relevant paths>` to read actual diffs for substance
3. Group into feature domains based on what actually changed (not just filenames)

If `$ARGUMENTS` is a feature name, use it as the domain(s) to process.

If no arguments, detect scope automatically:
1. Check session context — what systems were worked on?
2. Check recent changes: `git diff --name-only HEAD~5`
3. Group changed files into feature domains

**Codebase calibration:** Count source files (`find packages/*/src src/ -name '*.ts' -o -name '*.tsx' -o -name '*.cs' -o -name '*.py' 2>/dev/null | wc -l`).
- <50 files: Aggressive filtering — only document what's truly hard to discover
- 50-200: Moderate — conventions, gotchas, coordination patterns
- 200+: Include some orientation since exploration is expensive

Output: a list of feature domains to process.

## Step 2: Inventory Existing Skills

```
Glob: .claude/skills/*/SKILL.md
```

For each skill found, extract name, description, and domain keywords.

## Step 3: Classify Each Domain

For each domain from Step 1, match against the skill inventory:

**Classification rules:**
- **UPDATE** — matching signals against an existing skill
- **CREATE** — no match + significant new knowledge area
- **SKIP** — no match + minor scope or only discoverable knowledge

**Log the classification, then proceed immediately:**
```
## Sync Plan
- UPDATE: {skill-name} — {reason}
- CREATE: {proposed-name} — {reason}
- SKIP: {domain} — {reason}
```

## Step 3.5: Value Filter

Before writing any content, classify each piece of knowledge:

> "Could Claude discover this in ≤3 tool calls (Grep, Read, Glob)?"

- **YES → Don't document.** File paths, function signatures, props, CSS classes, import maps, endpoint lists, component descriptions, schema definitions, type inventories.
- **NO → Document.** Conventions ("always do X when Y"), coordination patterns (how distant parts interact), rationale ("X not Y because Z"), gotchas (what breaks silently), troubleshooting (symptom → cause → fix), operational procedures, non-obvious cross-file relationships.

Apply this filter to every piece of content before including it. When in doubt, leave it out.

## Step 4: Execute Updates

For each skill classified as UPDATE:

1. Read the full SKILL.md
2. Verify against current codebase — are documented patterns still accurate?
3. Look for new non-obvious knowledge that should be added
4. Remove any inventory that crept in (file listings, CSS classes, prop descriptions)
5. Edit the skill file in-place

**What NOT to do:**
- Don't add file path inventories or architecture diagrams
- Don't document things discoverable via grep
- Don't add "Examples" sections (user request → expected action)
- Don't add "Success Criteria" sections

## Step 5: Execute Creates

For each domain classified as CREATE:

1. **Gather non-obvious knowledge** — grep for patterns, but document the *conventions and rationale*, not the patterns themselves
2. **Choose name:** lowercase, kebab-case. Location: `.claude/skills/{name}/`
3. **Create directory:** `mkdir -p .claude/skills/{name}/`
4. **Write SKILL.md** with this structure:

```markdown
---
name: {skill-name}
description: "{What it covers}. {Specific domain/tech}. Use when user mentions {10+ trigger keywords}."
---

# {Title}

## Conventions
Patterns to follow when adding/modifying this area. The "right" way to do things.

## Gotchas
What breaks silently. Non-obvious failure modes. Things that look correct but aren't.

## Coordination
How distant parts interact. State flow across components/services.

## Rationale
Why X instead of Y. Trade-offs. Context to avoid re-litigating decisions.

## Troubleshooting
Symptoms → causes → fixes.

## Operational
Deploy procedures, env vars, external API quirks.
```

**All sections are optional** — only include ones with actual content. An empty skill is better than a padded one.

## Step 6: Self-Check and Report

**Self-check:** For each section written, verify:
1. It wouldn't be faster to just grep the codebase for this information
2. It contains knowledge that takes >3 tool calls to discover
3. It doesn't duplicate CLAUDE.md content

If a section fails the self-check, delete it.

```
## Sync Complete

### Skills Updated
- {skill-name}: {change summary}

### Skills Created
- {skill-name} — {what non-obvious knowledge it captures}

### Domains Skipped
- {domain}: {reason}
```

## Rules

- **Value over volume** — a 20-line skill with only gotchas beats a 200-line skill with file inventories
- **Evidence-based** — every pattern must come from codebase analysis, not assumptions
- **YAML frontmatter is mandatory** — without it, skills won't load
- **10+ trigger keywords** in description — this is how Claude discovers the skill
- **Edit in-place** — update existing files, don't create copies
- **Never duplicate** CLAUDE.md content or existing skill coverage
- **Project scope only** — only operate on `.claude/skills/`
- **No scope creep** — process only the detected/requested domains
