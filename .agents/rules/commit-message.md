Commit messages for this repository must always follow these rules.

# Main format

Use this format:

<scope>: <subject>

# Language

- Write commit messages in English only.
- Use imperative mood when natural.
- Keep the subject concise, specific, and factual.
- Start the subject with an uppercase letter.
- Do not end the subject with a period.

# Subject length

- Target <= 72 characters.
- Prefer compact wording without losing meaning.
- If the full meaning of the change does not fit clearly in the subject, keep the subject short and add the missing important details in the body.

# Scope selection

Choose the narrowest meaningful scope based on the changed subsystem.

## Available scopes

### 1. CLI

- `cli` — yargs setup, argv parsing, CLI flags, positional arguments, help text, programmatic API entry (`main.ts`).

### 2. Build pipeline

- `build` — App packaging orchestration: `buildNativefierApp`, `prepareElectronApp`, Electron download, `@electron/packager` integration, `nativefier.json` generation.
- `icon` — Icon fetching, conversion, platform formats (icns/ico/png), `icon-scripts/`, shell icon helpers.
- `upgrade` — In-place upgrade of existing Nativefier apps (`--upgrade`), executable/plist metadata helpers.

### 3. Configuration

- `options` — Raw option processing, validation, field modules (`name`, `icon`, `userAgent`), URL normalization, async config file loading.
- `shared` — Shared options types and model between CLI and Electron app (`shared/src/options/`).

### 4. Inference

- `infer` — Auto-detection: page icon/title, platform/arch, browser and Electron versions, user agent inference.

### 5. Electron app runtime (`app/`)

- `app` — Electron main process entrypoint, app lifecycle, portable mode, global shortcuts, downloads, Squirrel startup.
- `window` — `BrowserWindow` behavior, navigation, new-window handling, login window, external URL policy, CSS inject.
- `menu` — Application menu, context menu, tray icon.
- `preload` — Preload script and renderer bridge.

### 6. Quality and repository

- `tests` — Automated tests (unit, integration, Playwright).
- `docs` — User and contributor documentation (`API.md`, `CATALOG.md`, `HACKING.md`, `README.md`, changelog).
- `ci` — GitHub Actions workflows and CI configuration.
- `deps` — Dependency versions, `npm-shrinkwrap` updates, default Electron/Chrome/Node version bumps.
- `tooling` — TypeScript, webpack, ESLint, Prettier, Jest, Docker, and other dev-tool configuration.
- `scripts` — Maintenance scripts (`icon-scripts/`, `.github/generate-changelog`, manual test scripts).
- `ai` — AI agent rules, prompts, repository instructions for coding agents.
- `chore` — Small local maintenance with no meaningful subsystem.
- `refactoring` — Refactoring.

## Scope rules

- Use one scope only.
- Prefer the narrowest subsystem over a broader area.
- Prefer behavioral scopes over technical helper scopes (`src/helpers/`, `src/utils/`).
- If a change spans multiple subsystems, choose the dominant one from the user-visible or architectural perspective.
- Use `cli` for command-line parsing, flags, help text, or the public Node API surface.
- Use `build` for packaging, templating the Electron app tree, or packager-related behavior in `src/build/`.
- Use `icon` or `upgrade` when the main change is inside those pipelines, even if helpers live elsewhere.
- Use `options` for CLI option processing; use `shared` only when types or the options model change without CLI field logic.
- Use `infer` for automatic detection logic in `src/infer/`.
- Use `app`, `window`, `menu`, or `preload` for runtime behavior in the generated Electron app (`app/src/`).
- Use `deps` for version bumps and lockfile changes; use `tooling` for compiler, linter, test runner, or bundler config.
- Use `ci` for workflow files; use `scripts` for standalone automation not covered by `icon-scripts/`.
- Use `chore` only when no more specific scope fits.

# Message style

Prefer describing the actual behavioral or architectural outcome, not low-level edits.

# Special cases

For purely local cleanup with no meaningful subsystem, use:
chore: Remove unused helper

For documentation-only changes, use:
docs: Document new CLI flag in API.md

For test-only changes, use:
tests: Add coverage for inferIcon favicon selection

# Body rules

Do not add a body by default.

Add a body only when the subject would otherwise hide important information that is not obvious from the diff itself.

A body is allowed only when at least one of these is true:

- the commit has an important user-visible caveat or behavior change that may be missed from the title
- the change has a non-obvious limitation, compatibility concern, or rollback risk
- the behavior differs across platforms (macOS, Windows, Linux), Electron versions, or build modes
- the commit introduces a significant architectural decision or tradeoff
- the commit changes CLI options, `nativefier.json` format, persisted app layout, or packager contract
- the commit requires special migration, follow-up work, or reviewer attention

Do not use a body for:

- obvious implementation details
- class, method, file, or helper names that are visible in the diff
- straightforward refactor steps
- internal renames
- simple CLI rewiring
- test additions that directly match the visible change
- documentation updates that are obvious from the modified files

Body rules:

- keep it short
- use bullet points
- include only non-obvious information
- do not restate the diff
- do not list implementation steps
- do not mention file names, type names, or helper names unless they are essential for understanding impact

# Output rules

When asked to generate a commit message:

- return only the final commit message unless additional explanation is requested
- include a body when needed by the rules above
- do not return multiple options unless explicitly requested
- choose the most specific scope supported by the changes

# Examples

Good:
cli: Add example for building with explicit platform and arch

Good:
build: Copy tray icon when packaging for macOS

Good:
icon: Normalize favicon URLs before fetching page icon

Good:
options: Validate user agent override before packager run

Good:
infer: Prefer apple-touch-icon when inferring page icon

Good:
window: Block navigation to external URLs without confirmation

Good:
upgrade: Preserve user data when upgrading app in place

Good:
deps: Bump default Electron to 42.x

Good:
tests: Add coverage for URL normalization helpers

Good (Body included for non-obvious format change):
options: Rename nativefier.json field for internal URLs

- Generated apps from older Nativefier versions still use the old key
- Rebuild existing apps to pick up the new field name

Bad:
feat(build): add tray icon copy

Bad:
Build: Added tray icon copy for macOS.

Bad:
chore: Update build pipeline
