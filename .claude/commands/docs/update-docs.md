---
description: "Keep skills accurate — finds outdated docs, compares against current code, and fixes gaps. Prevents skill rot after refactors or new features."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*)
---

# Update Skill Documentation

Analyze recent changes and update relevant skill documentation to stay current.

## Step 1: Determine Scope

If `$ARGUMENTS` is provided, use it as the search scope (skill name, topic, or feature area).

If no arguments, detect scope from context:
1. Check recent git changes: `git diff --name-only HEAD~5` and `git diff --stat`
2. Identify which systems/features were touched
3. Map changed files to likely skill domains

## Step 2: Find Relevant Skills

Search project skills for matches against the scope:

```
Glob: .claude/skills/*/SKILL.md
```

Read each candidate SKILL.md. A skill is relevant if:
- Its name or description matches the scope keywords
- Its documented file paths overlap with changed files
- Its domain covers the changed feature area

If no relevant skills found, report this and suggest `/docs:create-docs` instead. Stop.

## Step 3: Analyze Each Relevant Skill

For each matching skill, read it thoroughly including any `references/` subdirectory.

Then verify against the current codebase:
- **Grep for documented paths** — do they still exist? Have they moved?
- **Check documented patterns** — are code examples still accurate?
- **Look for new implementations** — grep for patterns the skill covers but doesn't document yet
- **Check for changed conventions** — has the approach evolved since the skill was written?

Build a list of gaps:
- New implementations not yet documented
- Changed patterns with outdated examples
- Missing edge cases discovered during this session
- Incorrect file paths or line references
- New tools or integrations the skill should mention

## Step 4: Apply Updates

Edit each skill file in-place (wherever it lives — project or global).

**What to update:**
- Add new scenarios and examples
- Fix outdated file paths and code snippets
- Add newly discovered edge cases
- Update architecture diagrams if structure changed
- Expand trigger keywords if new terms emerged
- Update known issues/gaps sections

**What NOT to do:**
- Don't restructure working skills unnecessarily
- Don't remove content that's still valid
- Don't change the skill's scope or purpose
- Don't add speculative content — only document confirmed patterns

## Step 5: Report

Summarize what was analyzed and changed:

```
## Skills Analyzed
- {skill-name} at {path} — {relevant | no changes needed}

## Updates Applied
- {skill-name}: {brief description of what changed}
  - Added: {new content}
  - Fixed: {corrected content}
  - Removed: {outdated content}

## Suggestions
- {any follow-up actions, e.g., "Consider creating a skill for X"}
```

## Rules

- **Edit in-place** — update existing files, don't create copies
- **Preserve structure** — maintain the skill's existing organization
- **Evidence-based only** — only add patterns confirmed by grep/codebase analysis
- **Project scope only** — only operate on `.claude/skills/`, never reach outside the project
- **No scope creep** — update what's relevant to the detected changes, nothing more
