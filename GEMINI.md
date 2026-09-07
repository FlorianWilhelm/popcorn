# Project Guidelines & Rules

## Git & Tagging Rules
- **No Tag Overwrites**: Niemals bestehende Git-Tags überschreiben oder mit `--force` pushen.
- **Tag Immutability**: Einmal gepushte Git-Tags sind unveränderlich. Wenn nach dem Pushen eines Tags noch Änderungen oder Fixes hinzukommen, wird stattdessen ein neuer Release-Tag mit entsprechender EffVer-Version vergeben (z. B. Micro-Bump `v0.28.1`).
- **Explicit Permission**: Das Überschreiben oder Force-Pushen von Tags ist ausschließlich nach expliziter Erlaubnis des Nutzers gestattet.
