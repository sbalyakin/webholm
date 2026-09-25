# AI Agent Rules (Canonical)

## Priority (lower number wins)

1. User request in the active session.
2. This file.
3. `.agents/rules/karpathy-rules.md` (behavioral defaults: think first, simplicity, surgical changes, goal-driven execution).
4. Project docs in `docs/`.
5. Tool/platform safety constraints.

## Project knowledge

`docs/` is the project knowledge base. It holds what the code does not show on its own: layer boundaries, contracts, data flow, testing strategy, and decisions with their reasons.

- `docs/architecture.md`: layers, import rules, Electron adapters, `webholm.json` transport, where to change things, secure renderer.
- `docs/testing.md`: test layers, what each layer catches, commands.
- `docs/technical-roadmap.md`: ESM, dependency, packager, and native tooling decisions.
- `HACKING.md`: setup, dev workflow, maintainer procedures.
- `API.md`: user-facing CLI options.

Before you change a subsystem, read the doc section that covers it.

Keep the docs true to the code. When your change makes a doc statement wrong, such as a renamed file or constant, a new option, a changed layer rule or test command, update the doc in the same change. When a doc statement you relied on already contradicts the code, fix the doc; this is part of the task, not unrelated cleanup. If the code looks wrong instead of the doc, tell the user. When you and the user settle a decision with lasting impact, record it with its reason in the doc for that area.

Record facts and decisions, not change history, because `CHANGELOG.md` and git cover history. Keep each fact in one file and link to it from others. Create a new file under `docs/` only for a topic no existing file covers, and add it to the list above.

## Communication

- Lead with the result or action. Add context only when it adds value.
- Concise output. No openers, preambles, or closers.
- Comments in code: English. Chat with the user: language of the user's last message.

## Output formatting

- Hyphens only in compound words and numeric ranges. Never use `--`, ` - `, em-dash, or en-dash as a stylistic break.
- Avoid parenthetical asides; rewrite linearly.
