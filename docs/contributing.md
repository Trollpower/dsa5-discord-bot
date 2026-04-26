# Beitragen und lokale Entwicklung

Diese Datei beschreibt, wie an DSA-Bot v2 lokal entwickelt wird, welche Arbeitsabläufe sich für Änderungen bewährt haben und welche Konventionen bei Erweiterungen des Bots eingehalten werden sollten.

## Ziel dieser Datei

Die Datei richtet sich an Entwickler, die:

- das Repository lokal starten wollen
- neue Commands oder Events ergänzen
- bestehende Fachlogik anpassen
- Änderungen vor dem Einsatz auf einem Discord-Testserver prüfen wollen

Sie ergänzt die README um eine stärker entwicklerorientierte Sicht auf Setup, Arbeitsweise und Änderungsregeln.

## Lokales Setup

Für lokale Entwicklung werden mindestens diese Bausteine benötigt:

- Node.js 18 oder höher
- eine gültige `.env`
- eine `config.json`
- installierte Projektabhängigkeiten

### Abhängigkeiten installieren

```powershell
npm install
```

### Konfiguration anlegen

Falls noch keine lokale Konfiguration existiert:

```powershell
Copy-Item config.example.json config.json
```

Danach müssen `.env` und `config.json` an die lokale Entwicklungsumgebung angepasst werden.

## Lokaler Start

Der empfohlene Entwicklungsstart erfolgt über `nodemon`:

```powershell
npm run dev
```

Für ausführlichere Startinformationen gibt es zusätzlich:

```powershell
npm run dev:verbose
```

Im Alltag ist `npm run dev` der normale Einstieg, weil Dateiänderungen automatisch erkannt werden und der Bot neu startet.

## Linting

Das Projekt verwendet ESLint.

```powershell
npm run lint
```

Die ESLint-Konfiguration liegt in `eslint.config.js`.

Wichtige Stilvorgaben daraus sind unter anderem:

- Tabs statt Spaces für Einrückung
- einfache Anführungszeichen
- Semikolons
- konsistente Objekt- und Schlüsselwort-Abstände

Linting ist aktuell die wichtigste automatisierte Qualitätsprüfung im Repository.

## Entwicklungsablauf für typische Änderungen

Welche Schritte nötig sind, hängt davon ab, was genau geändert wird.

### Nur Fachlogik ändern

Wenn nur Berechnungen, Embeds oder interne Verarbeitung angepasst werden, reichen in der Regel Änderungen in:

- `events/`
- `common/`
- eventuell `data/` oder `tables/`

In diesem Fall ist meist kein erneutes Slash-Command-Deployment nötig.

### Slash-Command-Struktur ändern

Wenn sich Name, Beschreibung, Optionen oder Subcommands eines Slash-Commands ändern, müssen mindestens zwei Ebenen angepasst werden:

- die Definition in `commands/`
- die fachliche Verarbeitung in `events/`

Anschließend müssen die Commands erneut bei Discord registriert werden:

```powershell
node deploy-commands.js
```

Ohne diesen Schritt sieht Discord die neue oder geänderte Command-Struktur nicht.

### Charakter- oder Verlaufslogik ändern

Wenn Änderungen Character-Zustand oder Event-History betreffen, sollten zusätzlich diese Stellen geprüft werden:

- `common/persistence.js`
- `common/eventHistoryProvider.js`
- betroffene Character-Dateien unter `chars/`
- gegebenenfalls das Schema unter `schemas/character.schema.json`

## Neuen Slash-Command hinzufügen

Ein neuer Slash-Command folgt im Projekt typischerweise diesem Muster.

### 1. Command definieren

Lege eine Datei unter `commands/` an, die `data` als `SlashCommandBuilder` exportiert.

Dort werden mindestens festgelegt:

- Command-Name
- Beschreibung
- Optionen, Subcommands oder Subcommand-Gruppen

### 2. Event-Logik ergänzen

Lege die fachliche Logik in einer passenden Datei unter `events/` an.

Ein Event-Modul sollte typischerweise enthalten:

- `type`
- `name`
- optional `customIds`
- `execute(interaction, character, client)`

### 3. Deployment ausführen

Nach Änderungen an `commands/`:

```powershell
node deploy-commands.js
```

### 4. Funktional testen

Danach sollte der Command auf einem Testserver gegen echte Discord-Interactions geprüft werden.

## Buttons und andere Komponenten ergänzen

Für Buttons oder ähnliche Komponenten ist kein eigenes Slash-Command-Deployment nötig, solange sich das registrierte Command-Schema nicht ändert.

Wichtige Regeln dabei:

- Custom-IDs mit klaren Präfixen gestalten
- Matching über `customIds` im Event-Modul sicherstellen
- Payloads aus `customId` defensiv parsen
- Fehlerfälle ephemer beantworten, wenn der Benutzer direkt betroffen ist

## Manuelle Testabläufe

Das Projekt hat aktuell kein umfassendes automatisiertes Test-Setup. Deshalb ist manuelles Testen auf einem Discord-Testserver ein zentraler Teil der Entwicklungsarbeit.

Sinnvolle Prüfungen nach Änderungen sind:

- Bot startet ohne Fehler
- betroffene Slash-Commands sind in Discord sichtbar
- Command-Optionen und Autocomplete funktionieren wie erwartet
- Event-Antworten erscheinen korrekt
- Character-Änderungen werden wirklich in `chars/` gespeichert
- relevante Event-Payloads landen in `storage/event-history.ndjson`
- Logs enthalten bei Bedarf sinnvolle `traceId`-gebundene Informationen

## Praktische Teststrategie

Eine gute Reihenfolge für lokale Änderungen ist:

1. Code ändern
2. `npm run lint` ausführen
3. Bot lokal mit `npm run dev` starten
4. falls nötig `node deploy-commands.js` ausführen
5. betroffene Interaktionen auf dem Testserver manuell prüfen

Diese Reihenfolge ist im aktuellen Projekt deutlich verlässlicher als rein statische Prüfung, weil viele Fehler erst im Zusammenspiel mit Discord-Interactions sichtbar werden.

## Arbeiten an Character-Dateien

Character-Dateien unter `chars/` sind sowohl Fachdaten als auch Teil des laufenden Zustands.

Deshalb gilt bei Änderungen:

- Änderungen an Character-Dateien können echtes Laufzeitverhalten beeinflussen
- Schema-Änderungen unter `schemas/character.schema.json` sollten bei Character-Modelländerungen mitgedacht werden
- neue bot-spezifische Komfortfelder sollten im Domänenmodell dokumentiert werden

Wenn möglich, sollten Character-Dateien nach strukturellen Änderungen gegen das Schema geprüft werden.

## Arbeiten an Regeldaten

Regeldaten liegen überwiegend unter `data/` und `tables/`.

Bei Änderungen in diesen Bereichen ist besonders wichtig:

- keine unbeabsichtigten Umbenennungen zentraler Namen
- bestehende Referenzen in Commands, Event-Modulen und Character-Daten mitdenken
- Auswirkungen auf Fuzzy-Matching und Auswahl-Optionen beachten

Regeldatenänderungen wirken oft breiter als zunächst sichtbar, weil dieselben Namen in mehreren Commands wiederverwendet werden.

## Logging-Konventionen

Für neue oder geänderte Logik sollten bestehende Logging-Muster beibehalten werden.

Empfohlen ist:

- `logger.debug(...)` für technische Diagnose und Zwischenschritte
- `logger.info(...)` für fachlich relevante Ereignisse
- `logger.warn(...)` für ungewöhnliche, aber tolerierbare Zustände
- `logger.error(...)` für Fehlerfälle

Wenn ein Ablauf an eine Interaction gebunden ist, sollte `traceId`-basiertes Logging mitgenutzt werden, damit zusammengehörige Logeinträge nachvollziehbar bleiben.

## Konventionen für Event-Payloads

Event-Payloads sind im Projekt nicht nur interne Rückgabewerte, sondern Grundlage für Event-History und spätere Auswertung.

Deshalb sollten neue Event-Payloads:

- serialisierbar sein
- einen klaren `name` tragen
- fachlich nachvollziehbare Felder enthalten
- keine unnötigen Discord-spezifischen Laufzeitobjekte enthalten

Wenn ein Feature später in Verlauf, Statistik oder Schnellzugriffen auftauchen soll, muss die Event-Payload entsprechend brauchbare Daten enthalten.

## Docker in der Entwicklung

Für lokale Entwicklung ist der direkte Node-Start meist einfacher. Docker ist dagegen hilfreich, wenn Laufzeit- oder Deployment-Verhalten container-nah geprüft werden soll.

Nützliche Befehle sind:

```powershell
docker compose up -d --build
docker compose logs -f
docker compose down
docker compose run --rm deploy
```

Dabei gilt weiterhin:

- `chars/`, `storage/` und `config.json` werden als Volumes eingebunden
- persistente Daten liegen außerhalb des Images

## Typische Fehler bei Änderungen

Besonders häufig treten in diesem Repository diese Probleme auf:

- Command-Struktur wurde geändert, aber nicht neu deployt
- `alias` oder Character-Zuordnung fehlen für den testenden Benutzer
- Event-Modul gibt kein persistierbares Event zurück, obwohl Verlauf erwartet wird
- Character wurde verändert, aber nicht gespeichert
- neue Character-Felder wurden eingeführt, aber im Schema oder in der Doku nicht berücksichtigt

## Dokumentationspflege

Wenn neue Strukturen, Konfigurationsschalter oder Datenmodelle eingeführt werden, sollten die Entwicklerdokumente mitgezogen werden.

Typischerweise betrifft das:

- `architecture.md` bei neuen Schichten oder Initialisierungspfaden
- `command-lifecycle.md` bei neuen Interaktionsmustern
- `domain-model.md` bei neuen Character-Feldern oder Event-Payloads
- `persistence-and-history.md` bei neuen Persistenz- oder Verlaufspfaden
- `configuration.md` bei neuen Konfigurationsschlüsseln oder Logging-Verhalten

## Orientierung für Folgekapitel

- Für Architektur und Schichten siehe `architecture.md`.
- Für Command-Routing und Request-Flows siehe `command-lifecycle.md`.
- Für Character- und Event-Modelle siehe `domain-model.md`.
- Für Persistenz und History siehe `persistence-and-history.md`.
- Für Laufzeitparameter und Logging siehe `configuration.md`.