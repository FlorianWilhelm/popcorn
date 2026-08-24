# Meet Update Rotator

Chrome-Erweiterung, die in einem ausgewählten Google Meet die fünf anwesenden Personen vorschlägt, deren letztes Projektupdate am längsten zurückliegt.

Das Tracking hängt am **Namen des Meetings**, nicht am Termin, Wochentag oder Meeting-Code. Ein Meeting, das mal montags und mal donnerstags stattfindet, wird trotzdem als dasselbe erkannt.

## Installation

1. ZIP entpacken.
2. In Chrome `chrome://extensions` öffnen.
3. Oben rechts **Entwicklermodus** aktivieren.
4. **Entpackte Erweiterung laden** klicken und den Ordner `meet-update-rotator` auswählen.
5. Erweiterung an die Symbolleiste pinnen.

## Grundprinzip

Standardmäßig ist die Erweiterung in jedem Meeting **aus**. Sie liest dann nur den Meeting-Namen, sonst nichts, und rührt die Personenliste nicht an.

### Tracking aktivieren

Im gewünschten Meeting auf das Symbol klicken. Die Erweiterung zeigt den erkannten Namen, zum Beispiel `Team Weekly DS & NLP`. Der Name lässt sich vor dem Aktivieren noch anpassen, dann **Tracking aktivieren**.

Bei Ad-hoc-Meetings ohne Kalendertermin steht im Seitentitel nur der Meeting-Code. Dann bleibt das Namensfeld leer und du tippst den Namen selbst ein. Ab dann wird über diesen Namen gematcht.

### Ablauf im getrackten Meeting

1. Beim ersten Öffnen kommen alle gefundenen Personen mit Zeitstempel 0 in die Liste, also 1. Januar 1970.
2. Angezeigt werden die anwesenden Personen, aufsteigend nach letztem Update.
3. Die Top 5 mit Toggle. Toggle an setzt das heutige Datum, Toggle aus stellt den vorherigen Zeitstempel wieder her.
4. Beim nächsten Termin mit demselben Namen läuft es ab Schritt 2 weiter.

- **Weitere Personen**: erzwingt eine neue Auswahl der nächsten Kandidaten. Nach sechs Stunden passiert das automatisch.
- **Aktualisieren (Icon)**: liest die Anwesenheit manuell neu ein, behält aber die aktuelle Auswahl bei, damit beim Abhaken nichts wegspringt.
- **Abwesende einbeziehen**: nimmt auch Personen auf, die gerade nicht im Call sind.

## Tabs

- **Update**: die aktuellen Kandidaten für das nächste Update.
- **Personen**: vollständige Liste des Meetings, Personen hinzufügen oder entfernen, Zeitstempel per Toggle korrigieren.
- **Meetings**: alle getrackten Meetings. Name direkt im Feld bearbeiten, **Öffnen** wechselt zur Liste eines anderen Meetings, **×** beendet das Tracking und löscht den Verlauf.
- **Einstellungen**: Anzahl der Update-Kandidaten konfigurieren (Standard: 5) und automatisches Live-Aktualisieren einstellen (Standard: alle 5 Sekunden).

## Wenn sich der Kalendertitel ändert

Zwei Wege, beide unkritisch:

- Meist erkennt die Erweiterung das Meeting weiter am Meeting-Code und ordnet den neuen Titel automatisch als weiteren Erkennungsnamen zu. Sie sagt das im Statusbereich.
- Sonst erscheint die Aktivierungsansicht. Dort unten die bestehende Liste auswählen und **Zuordnen** klicken. Der neue Titel wird ergänzt, der Verlauf bleibt erhalten.

Alte Namen bleiben als Erkennung gespeichert. Ein Rückbenennen im Kalender bricht also nichts.

## Speicherung

Die Daten liegen in `chrome.storage.local`, nicht in einem Cookie. Das ist stabiler, überlebt das Löschen von Website-Daten und ist an das Chrome-Profil gebunden. Export und Import laufen über eine JSON-Datei.

```json
{
  "version": 2,
  "meetings": {
    "m_abc123_x9f2k": {
      "id": "m_abc123_x9f2k",
      "name": "Team Weekly DS & NLP",
      "aliases": ["team weekly ds & nlp", "team weekly ds und nlp"],
      "codes": ["abc-defg-hij"],
      "people": {
        "erika mustermann": { "name": "Erika Mustermann", "last": 1755000000000, "prev": 0 }
      }
    }
  }
}
```

`last` ist ein Unix-Zeitstempel in Millisekunden, `0` heißt noch nie vorgetragen. Beim Import fragt die Erweiterung, ob ersetzt oder zusammengeführt werden soll. Beim Zusammenführen gewinnt pro Person der jüngere Zeitstempel.

## Grenzen

- Google Meet hat keine öffentliche Browser-API für Teilnehmerliste und Meeting-Titel. Die Erweiterung liest den DOM und `document.title`. Ändert Google das Markup, muss `content.js` nachgezogen werden. Der Code stützt sich bewusst nur auf `role="listitem"`, `data-participant-id` und den Seitentitel statt auf obfuskierte Klassennamen.
- Eingeladene, aber nicht erschienene Personen zeigt Meet nur bei bestimmten Kalender-Setups an. Fehlende Personen lassen sich im Tab Personen von Hand ergänzen.
- Namen sind der Schlüssel. Zwei Personen mit identischem Anzeigenamen werden als eine geführt.
