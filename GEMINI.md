# Project Guidelines & Rules

See [CLAUDE.md](CLAUDE.md) for the full agent guide (architecture, conventions, workflow). Everything in this repository is written in English.

## Git & Tagging Rules
- **No Tag Overwrites**: Never overwrite existing Git tags or push them with `--force`.
- **Tag Immutability**: Once pushed, Git tags are immutable. If changes or fixes are needed after a tag has been pushed, create a new release tag with the appropriate EffVer version instead (e.g. micro bump `v0.28.1`).
- **Explicit Permission**: Overwriting or force-pushing tags is only allowed with the user's explicit permission.
