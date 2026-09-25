---
name: seb-commit-message
description: Generate a commit message for the current staged changes or all current working tree changes if no staged changes exist. Use when the user asks only for a commit message, generated from the exact staged snapshot or all working tree changes while enforcing `.agents/rules/commit-message.md`. Never stages or commits.
---

Use staged changes if any staged changes exist.
Otherwise use all current working tree changes.

Generate exactly one commit message for the selected change scope.

Follow `.agents/rules/commit-message.md` exactly.

Return only the final commit message wrapped in triple backticks (```).