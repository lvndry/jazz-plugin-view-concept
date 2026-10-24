# jazz-plugin-view-concept

A community [Jazz](https://github.com/lvndry/jazz) plugin that adds the slash commands of
[view-concept](https://github.com/Vaillus/view-concept), a local web page where the agent writes
explanations and code reviews and you comment on passages:

- `/view-concept <concept>` — explain a concept in the page.
- `/build-feature [branch]` — build a feature concepts first: model, code, check, docs, PR.
- `/triage-code <code>` — triage existing code, then restructure it.
- `/review-docs <scope>` — bring a repo's docs up to date, on a docs branch of its own.
- `/write-readme <folder>` — write or fix a folder's README, in the terminal.
- `/explain-concept <concept>` — explain a concept in the terminal, with no page.

The plugin is not part of Jazz. It contains no server: each command hands the agent the matching
skill (a copy of view-concept's `skills/`, in `vendor/`) and the path of `bin/view-concept`, which installs the
`view-concept` command with [uv](https://docs.astral.sh/uv/) on first use. The agent runs it, opens
the page, and listens for your comments with `wait_for`.

## Install

Requires [uv](https://docs.astral.sh/uv/). Install, trust and enable are separate steps:

```sh
jazz plugin add lvndry/jazz-plugin-view-concept
jazz plugin inspect io.github.lvndry.view-concept
jazz plugin trust io.github.lvndry.view-concept
jazz plugin enable io.github.lvndry.view-concept --agent <agent-name>
```

Omit `--agent` to enable it for every agent. Then, in a chat: `/view-concept explain KKT conditions`.

## What it can do

- Commands run code, so Jazz gates them: the agent runs `bin/view-concept` through `execute_command`,
  under your approval policy.
- The plugin declares no network destinations and sends no data. The first `bin/view-concept` run
  makes `uv` download view-concept from `https://github.com/Vaillus/view-concept`.
- It subscribes to `session-start` and `user-prompt` only to learn the running agent's id, which the
  page needs to run side threads on that agent.

## Update

```sh
jazz plugin update lvndry/jazz-plugin-view-concept   # skills and commands
uv tool upgrade view-concept                         # the page and CLI
```

To refresh the bundled skills from a view-concept checkout: `sh scripts/sync-skills.sh <checkout>`.
`vendor/UPSTREAM_COMMIT` records the commit they came from.

## Development

```sh
bun install && bun test && bun run typecheck
jazz plugin dev .
```
