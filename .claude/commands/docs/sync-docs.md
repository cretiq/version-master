---
description: "Single command for all skill maintenance — detects changes, updates existing skills, creates missing ones. Replaces manual create-docs/update-docs decisions."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(mkdir:*)
---

# Sync Skill Documentation

Auto-detect what needs updating and what needs creating — one command instead of choosing between update-docs and create-docs.

## Step 1: Determine Scope

If `$ARGUMENTS` is provided, use it as the feature domain(s) to process.

If no arguments, detect scope automatically:
1. Check session context — what systems were worked on?
2. Check recent changes: `git diff --name-only HEAD~5`
3. Group changed files into feature domains (e.g., "git-info", "components", "config")

Output: a list of feature domains to process in subsequent steps.

## Step 2: Inventory Existing Skills

Search project skills to build an inventory:

```
Glob: .claude/skills/*/SKILL.md
```

For each skill found, extract:
- Name and description (from YAML frontmatter)
- Documented file paths and patterns
- Domain keywords (from trigger keywords in description)

## Step 3: Classify Each Domain

For each domain from Step 1, match against the skill inventory from Step 2:

**Matching signals:**
- Skill name contains domain keywords
- Skill description mentions domain terms
- Skill's documented file paths overlap with domain's changed files

**Classification rules:**
- **UPDATE** — 2+ matching signals against an existing skill
- **CREATE** — no match + significant scope (3+ files or major new knowledge area)
- **SKIP** — no match + minor scope (1-2 files, no substantial new knowledge)

**Log the classification, then proceed immediately:**
```
## Sync Plan
- UPDATE: {skill-name} — {reason}
- CREATE: {proposed-name} — {reason}
- SKIP: {domain} — {reason}
```

## Step 4: Execute Updates

For each skill classified as UPDATE:

1. Read the full SKILL.md including any `references/` subdirectory
2. Verify against current codebase:
   - **Grep for documented paths** — do they still exist? Have they moved?
   - **Check documented patterns** — are code examples still accurate?
   - **Look for new implementations** — grep for patterns the skill covers but doesn't document yet
   - **Check for changed conventions** — has the approach evolved?
3. Build a list of gaps (new implementations, changed patterns, incorrect paths, new edge cases)
4. Edit the skill file in-place — add new content, fix outdated content, preserve valid content

**What NOT to do:**
- Don't restructure working skills unnecessarily
- Don't remove content that's still valid
- Don't change the skill's scope or purpose
- Don't add speculative content — only document confirmed patterns

## Step 5: Execute Creates

For each domain classified as CREATE:

1. **Analyze the domain** — grep for relevant patterns, map file paths, identify scenario frequency:
   - High (15+ occurrences): Primary scenarios
   - Medium (3-5): Secondary scenarios
   - Low (1-2): Edge cases
2. **Choose name and location:**
   - Name: lowercase, kebab-case, descriptive
   - Location: `.claude/skills/{name}/`
3. **Create the directory:**
   ```bash
   mkdir -p .claude/skills/{name}/
   ```
4. **Write SKILL.md** with YAML frontmatter and full template:
   ```markdown
   ---
   name: {skill-name}
   description: "{What it does}. {Specific domain/tech}. Use when user mentions {10+ trigger keywords}."
   ---

   # {Skill Title}

   ## Purpose
   {One-line explanation}

   ## When to Use
   {Specific scenarios from frequency analysis}

   ## Instructions
   ### Step 1: ...
   {Concrete actions with actual file paths}

   ## Examples
   ### Example 1: {High-frequency scenario}
   **User Request:** "{realistic phrasing}"
   **Expected Action:**
   1. {step}

   ## Edge Cases
   - {from analysis}

   ## Known Issues
   - {from TODO/FIXME grep}

   ## Success Criteria
   - {measurable outcomes}
   ```
5. Add `references/` only if needed for large examples or config templates

## Step 6: Report

```
## Sync Complete

### Scope Detected
- {domain list with file counts}

### Skills Updated
- {skill-name}: {change summary}

### Skills Created
- {skill-name} at {path} — triggers: {key phrases}

### Domains Skipped
- {domain}: {reason}
```

## Rules

- **Evidence-based** — every pattern must come from grep/codebase analysis, not assumptions
- **YAML frontmatter is mandatory** — without it, skills won't load
- **10+ trigger keywords** — the description is how Claude discovers the skill
- **Actual file paths** — use real paths from the codebase, not generic examples
- **Edit in-place** — update existing files, don't create copies
- **Never duplicate** existing skill coverage — the classification step prevents this
- **Project scope only** — only operate on `.claude/skills/`, never reach outside the project
- **No scope creep** — process only the detected/requested domains
- **Log before acting** — always output the sync plan, then proceed without waiting
