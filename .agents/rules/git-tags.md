# Git Tagging & Release Rule

- **Niemals bestehende Git-Tags überschreiben oder mit `--force` pushen.**
- Gepushte Git-Tags sind strikt unveränderlich.
- Falls nach dem Pushen eines Tags Änderungen hinzukommen, wird stattdessen ein neuer Release-Tag (nach EffVer z. B. Micro-Bump) erstellt.
- Das Überschreiben oder Force-Pushen von Tags darf **nur nach vorheriger, expliziter Erlaubnis des Nutzers** erfolgen.
