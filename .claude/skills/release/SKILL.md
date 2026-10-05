---
name: release
description: Cut a POPCORN release. Checks for a clean, up-to-date main, runs all checks, bumps the EffVer version, commits, tags, pushes, and watches the GitHub release build.
argument-hint: "[micro|meso|macro]"
disable-model-invocation: true
allowed-tools: Read, Bash(git status:*), Bash(git fetch:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git log:*), Bash(git diff:*), Bash(git ls-remote:*), Bash(git add:*), Bash(git commit:*), Bash(git tag:*), Bash(npm ci), Bash(npm run check), Bash(npm run bump:*), Bash(node scripts/package.js:*), Bash(gh run:*), Bash(gh release view:*)
---

# Release POPCORN

Cut a release of the extension. The requested effort level is: `$ARGUMENTS` (empty means ask).

Work through the steps in order. If a check fails, **stop and report** what is wrong and how to fix it. Do not fix it yourself by committing, stashing, switching branches, pulling, or deleting anything unless the user asks you to.

Hard rules (see CLAUDE.md, "Git Tags and Releases"):

- Never overwrite, delete, or force-push a tag that exists on `origin`. If something is wrong after the tag is pushed, fix it forward with a new micro release.
- Never use `git push --force` or `git push --tags`.
- Never edit version strings by hand. `npm run bump` is the only way to change them.

## 1. Preflight

1. Run `git fetch origin --tags`.
2. **Branch**: `git branch --show-current` must be `main`. The release workflow builds whatever commit the tag points to, so releases are only cut from `main`.
3. **Clean tree**: `git status --porcelain` must print nothing, including untracked files.
4. **In sync with origin**: run `git rev-list --left-right --count origin/main...HEAD`.
   - Behind or diverged: stop and suggest `git pull --ff-only`.
   - Ahead: allowed, but list the unpushed commits in the summary, because they will be pushed with the release.
5. **Dependencies**: if `node_modules/` is missing, run `npm ci`.
6. **Changelog**: read the `## [Unreleased]` section of `CHANGELOG.md`. It must contain at least one entry, otherwise stop: the bump script would release without changelog notes.
7. **Changelog completeness**: find the latest tag (`git tag --sort=-v:refname | head -1`) and run `git log --oneline <tag>..HEAD`. If a `feat:` or `fix:` commit has no matching changelog entry, point it out in step 3. This does not block the release.

## 2. Checks

Run `npm run check` (ESLint, Prettier check, unit tests). Running only the unit tests is not enough, because `release.yml` runs the full check and the release fails if lint or formatting fails. Stop on any failure and show the relevant output.

## 3. Choose the effort level

Read the current version from `package.json` and compute the three candidates: micro `x.y.(z+1)`, meso `x.(y+1).0`, macro `(x+1).0.0`.

If `$ARGUMENTS` is `micro`, `meso`, or `macro`, use it and skip the question. Otherwise, recommend a level based on the `[Unreleased]` entries. In EffVer the level describes how much effort the change costs the people who use the extension:

- **micro**: no effort. Bug fixes, visual polish, new optional features. Nobody has to relearn or redo anything.
- **meso**: some effort. A user notices a changed workflow or format and may have to adapt, for example a changed Markdown export format, a moved or renamed control, or a changed default.
- **macro**: significant effort. Users have to redo setup, migrate or re-import data by hand, or relearn the UI. Examples are a storage change without migration, a removed core feature, or a UI overhaul.

Ask with AskUserQuestion. Put the recommended level first and mark it "(Recommended)". Show the resulting version in each label, for example "meso → v0.32.0". Use the description to give a one-line reason, and mention any changelog gaps from step 1. The answer is the user's go-ahead for commit, tag, and push.

Then check that the new tag `vX.Y.Z` does not exist yet:

- local: `git rev-parse -q --verify refs/tags/vX.Y.Z` must fail
- remote: `git ls-remote --tags origin refs/tags/vX.Y.Z` must print nothing

If it exists, stop. Never reuse a version.

## 4. Bump and verify

1. Run `npm run bump -- <level>`. It updates `package.json`, `src/manifest.json`, `src/popup.html`, `CHROME_STORE_LISTING.md`, and `CHANGELOG.md` (it promotes `[Unreleased]` to `[X.Y.Z] - <today>` and updates the compare links).
2. Run `git status --porcelain`. Only those five files may be modified.
3. Read the top of `CHANGELOG.md` and check that `[Unreleased]` is now empty and the new section holds the entries.
4. Run `node scripts/package.js vX.Y.Z`. This performs the same version check and packaging as the CI. Afterwards `git status --porcelain` must still list only the five files.

If anything here fails, stop and explain. Offer to undo the bump with `git restore` on the five files, but only run it if the user agrees.

## 5. Commit and tag

Commit only those five files, following the existing history:

```
chore: bump version to vX.Y.Z (EffVer <level>)
```

Then create an annotated tag on that commit: `git tag -a vX.Y.Z -m "POPCORN vX.Y.Z"`.

## 6. Push

Push the branch first, then only the new tag:

```
git push origin main
git push origin vX.Y.Z
```

If the branch push is rejected, do **not** push the tag. Report the problem and ask the user how to proceed. The local commit and tag are not published yet at this point.

## 7. Watch the release build

Pushing the tag triggers `.github/workflows/release.yml`. Wait for its run on the tagged commit in the background (`run_in_background`), so the user can keep working:

```
sha=$(git rev-parse vX.Y.Z^{commit}); for i in $(seq 1 20); do id=$(gh run list --workflow release.yml --commit "$sha" --limit 1 --json databaseId --jq '.[0].databaseId'); [ -n "$id" ] && break; sleep 3; done; gh run view "$id" --json url --jq .url; gh run watch "$id" --exit-status
```

Tell the user the run URL. When the run finishes:

- **Success**: run `gh release view vX.Y.Z --json url,assets --jq '.url, .assets[].name'` and check that `popcorn-vX.Y.Z.zip` is attached.
- **Failure**: show `gh run view <id> --log-failed` and explain the cause. For a flaky failure, offer `gh run rerun <id> --failed`. For a real problem, offer to fix it and cut a new micro release. Never move or re-push the tag.

## 8. Wrap up

Report the version, effort level, commit, tag, and GitHub Release URL. Then remind the user of the manual step the CI does not do: upload `popcorn-vX.Y.Z.zip` (attached to the GitHub Release, also in `dist/`) in the Chrome Web Store Developer Dashboard. See `CHROME_STORE_LISTING.md`. If the release changed visible UI, also mention `npm run screenshots` to refresh the store assets.
