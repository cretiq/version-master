---
description: "Turn session knowledge into a persistent skill — analyzes the codebase, builds evidence-based docs, so discoveries aren't lost when the conversation ends."
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(mkdir:*)
---

# Create Skill Documentation

Turn session knowledge into a persistent, discoverable skill.

## Step 1: Determine Topic

If `$ARGUMENTS` is provided, use it as the skill topic.

If no arguments, detect from session context:
- What systems were worked on?
- What patterns were discovered or implemented?
- What debugging knowledge was gained?

If the topic is still unclear, ask the user.

## Step 2: Check for Existing Coverage

Search project skills before creating anything:

```
Glob: .claude/skills/*/SKILL.md
```

Read each candidate and check if the topic is already covered.

If an existing skill covers this topic:
```
Skill "{name}" at {path} already covers this topic.
Consider running /docs:update-docs {topic} to enhance it instead.
```
Stop here — don't create duplicates.

## Step 3: Analyze the Domain

Before writing anything, gather evidence from the codebase.

1. **Grep for relevant patterns** — find actual code, not assumed patterns
2. **Map file paths** — document real locations (`src/components/RepoEntry.tsx:15`)
3. **Identify scenarios by frequency:**
   - High (15+ occurrences): Primary scenarios
   - Medium (3-5): Secondary scenarios
   - Low (1-2): Edge cases
4. **Find test files** showing the patterns
5. **Check for known issues** — TODO/FIXME comments, workarounds
6. **Identify related skills** that might need cross-references

## Step 4: Choose Name and Location

**Name:** lowercase, kebab-case, descriptive.

**Location:** `.claude/skills/{name}/` — always project-scoped.

Create the directory:
```bash
mkdir -p .claude/skills/{name}/
```

## Step 5: Write SKILL.md

Follow the skill-creator methodology. The file **must** start with YAML frontmatter.

### Required Structure

```markdown
---
name: {skill-name}
description: "{What it does}. {Specific domain/tech with versions}. Use when user mentions {10+ trigger keywords}."
---

# {Skill Title}

## Purpose
{One-line explanation}

## Architecture
{Mermaid diagram if skill covers 3+ interacting components — omit for simple skills}

## When to Use
{Specific scenarios — mapped from Step 3 frequency analysis}

## Instructions

### Step 1: {First Step}
{Concrete actions with actual file paths from analysis}

### Step 2: {Next Step}
{Continue with evidence-based steps}

## Examples

### Example 1: {High-frequency scenario}
**User Request:** "{realistic phrasing}"
**Expected Action:**
1. {step}
2. {step}

## Edge Cases
- {from Step 3 analysis}

## Known Issues
- {from TODO/FIXME grep}

## Success Criteria
- {measurable outcomes}
```

### Description Formula

Include all of:
- What it does
- Specific tech with versions (Ink 6, React 19, etc.)
- Tool integrations if applicable (Context7, etc.)
- 10+ trigger keywords covering: technical terms, informal phrases, symptoms, components, actions

## Step 6: Create Supporting Files

Only if needed:
```bash
mkdir -p {skill-dir}/references/
```

Add reference files for:
- Large code examples that would bloat SKILL.md
- Configuration templates
- Mapping tables or lookup data

## Step 7: Report

```
## Skill Created
- Name: {name}
- Location: {full path}
- Triggers: {key phrases that activate it}

## Content Summary
- {number} scenarios documented
- {number} file paths referenced
- {number} examples included

## Test It
Start a new conversation and try: "{example trigger phrase}"
```

## Rules

- **Never duplicate** existing skill coverage — check first, always
- **Evidence-based** — every pattern must come from grep/codebase analysis, not assumptions
- **YAML frontmatter is mandatory** — without it, the skill won't load
- **10+ trigger keywords** — the description is how Claude discovers the skill
- **Actual file paths** — use real paths from the codebase, not generic examples
- **Project scope only** — only operate on `.claude/skills/`, never reach outside the project
