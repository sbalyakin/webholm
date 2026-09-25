---
name: seb-commit
description: Perform the full guarded git commit workflow for this repository. Use when the user asks to commit current work, save changes to git, or run a commit flow that stages changes, proposes a commit message, waits for explicit approval, and creates the commit. Do not use for message-only requests; use seb-commit-message instead.
---

# Commit Workflow

Run a guarded commit flow. Use the git index as the commit source of truth.

## Required Inputs

Read `.agents/rules/commit-message.md` before generating any commit message.

Inspect git state first:

```bash
git status --short
```

Treat status codes as:
- first column: staged state
- second column: unstaged state

## Workflow

### 1. Check for changes

If there are no staged changes and no unstaged changes, tell the user there are no changes to commit and stop.

### 2. Handle unstaged changes

If any unstaged changes exist, stop before staging anything.

Tell the user:
- this command will stage all current changes before commit
- the approved commit will use that fully staged snapshot

Ask for confirmation with exactly these options:
- `1` continue
- `2` cancel

Accept only `1` or `2` at this step.

If the user says `2`, stop without making changes.

If the user says `1`, stage everything:

```bash
git add -A
```

After staging, use the fully staged index as the selected commit scope.

### 3. Use staged snapshot directly

If there are no unstaged changes but staged changes already exist, do not restage or widen scope.

Use the current staged index as the selected commit scope.

### 4. Analyze selected scope

Inspect only the selected staged snapshot:

```bash
git diff --cached --stat
git diff --cached
git diff --cached --name-only
```

Generate one commit message for that exact snapshot. Follow `.agents/rules/commit-message.md` exactly.
Display the commit message wrapped in triple backticks.

Do not commit in the same reply where you first propose the message.

### 5. Get approval

Show the single proposed commit message and ask for approval.

Accept only:
- `1` to approve
- `2` to generate a new commit message for the same selected scope
- a custom commit message from the user

If the user says `2`, regenerate one new message for the same selected scope and ask again.

If the user provides a custom message, use it exactly. Do not rewrite it unless the user explicitly asks.

### 6. Create the commit

Create the git commit with the approved message.

After commit, report:
- the final commit message
- the created commit hash

## Guardrails

- Do not skip the approval step.
- Do not auto-approve the commit message.
- Commit only the exact staged snapshot that was approved.
- Do not stage more changes after message approval.
- Do not include extra explanation in the final success message unless needed.
- If user approval is required, stop and wait.
- If the user gives an invalid numeric response at either approval gate, restate the allowed options and wait.
