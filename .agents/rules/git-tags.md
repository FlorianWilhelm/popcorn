# Git Tagging & Release Rule

- **Never overwrite existing Git tags or push them with `--force`.**
- Pushed Git tags are strictly immutable.
- If changes are needed after a tag has been pushed, create a new release tag instead (following EffVer, e.g. a micro bump).
- Overwriting or force-pushing tags is **only allowed with the user's prior, explicit permission**.
