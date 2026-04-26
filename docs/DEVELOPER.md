# Entwicklerdokumentation

Diese Datei ist der Einstiegspunkt für die technische Dokumentation von DSA-Bot v2. Sie gibt einen schnellen Überblick über die Architektur und verlinkt auf die weiterführenden Entwicklerdokumente in diesem Verzeichnis.

## Inhaltsverzeichnis

- [Architekturüberblick](./architecture.md): beschreibt Startphase, Modulgrenzen und die zentralen Laufzeitbausteine des Bots.
- [Interaktions- und Command-Flow](./command-lifecycle.md): erklärt, wie Slash-Commands und Komponenten von Discord bis zur fachlichen Ausführung verarbeitet werden.
- [Domänenmodell und Datenquellen](./domain-model.md): dokumentiert Charakterdaten, Regeldaten, Tabellen und wichtige fachliche Event-Strukturen.
- [Persistenz und Event-History](./persistence-and-history.md): beschreibt, wie Charakterzustand und fachliche Verlaufsdaten gespeichert und später ausgewertet werden.
- [Konfiguration und Logging](./configuration.md): fasst `.env`, `config.json`, Logging-Level, Ausgabeformate und `traceId`-basiertes Tracing zusammen.
- [Beitragen und lokale Entwicklung](./contributing.md): beschreibt lokales Setup, Entwicklungsablauf, Validierung und Konventionen für neue Features.

## Ziel des Projekts

DSA-Bot v2 ist ein Discord-Bot für Das Schwarze Auge 5. Edition. Der Bot verarbeitet Slash-Commands und Komponenten-Interaktionen, greift auf statische Regeldaten aus JSON-Dateien zu, verwaltet Charakterzustand und schreibt fachliche Event-Historie in eine NDJSON-Datei.

Die Laufzeit ist eventgetrieben. Discord-Interaktionen werden an fachliche Event-Module weitergereicht, die Antworten erzeugen und optional Event-Payloads für Persistenz und Verlauf zurückgeben.

## Schnellüberblick zur Architektur

- `bot.js` ist der produktive Einstiegspunkt.
- `deploy-commands.js` registriert Slash-Commands in Discord.
- `handlers/` bindet technische Discord-Ereignisse.
- `events/` enthält die fachliche Bot-Logik.
- `commands/` definiert Slash-Command-Schemas.
- `common/` enthält Hilfslogik, Persistenz, Logging und Utilities.
- `data/`, `tables/` und `chars/` liefern die fachlichen Datenquellen.
- `storage/event-history.ndjson` enthält persistierte Event-Historie.

## Empfohlene Leserichtung

1. [Architekturüberblick](./architecture.md)
2. [Interaktions- und Command-Flow](./command-lifecycle.md)
3. [Domänenmodell und Datenquellen](./domain-model.md)
4. [Persistenz und Event-History](./persistence-and-history.md)
5. [Konfiguration und Logging](./configuration.md)
6. [Beitragen und lokale Entwicklung](./contributing.md)

## Navigationshilfe

Die Dokumentation ist absichtlich nach Aufgabenbereichen getrennt:

- Wenn du verstehen willst, wie der Bot aufgebaut ist, beginne mit [Architekturüberblick](./architecture.md).
- Wenn du einen Command oder Button erweitern willst, lies danach [Interaktions- und Command-Flow](./command-lifecycle.md).
- Wenn du an Charakteren, Fertigkeiten, Waffen oder Regeldaten arbeitest, gehe zu [Domänenmodell und Datenquellen](./domain-model.md).
- Wenn du Verlauf, Verlaufsabfragen oder serialisierte Event-Payloads anfasst, ist [Persistenz und Event-History](./persistence-and-history.md) die richtige Referenz.
- Wenn ein Problem nach Umgebung, Berechtigungen oder Laufzeitdiagnose aussieht, prüfe [Konfiguration und Logging](./configuration.md).
- Wenn du lokal entwickeln oder neue Features nach Projektkonvention ergänzen willst, nutze [Beitragen und lokale Entwicklung](./contributing.md).

## Wichtige Einstiegspunkte im Code

- `bot.js`: Start, Konfiguration, Client-Setup, Manager und Login.
- `handlers/interactionCreate.js`: Routing für Slash-Commands und Komponenten.
- `managers/eventHandlerManager.js`: Registrierung von `handlers/` und `events/`.
- `commands/`: Definition der Discord-Slash-Commands.
- `events/`: Ausführung fachlicher Bot-Logik.
- `common/eventHistoryProvider.js`: Persistenz und Auswertung fachlicher Historie.

## Hinweise zum aktuellen Stand

Die Dokumentationsstruktur unter `docs/` ist bewusst modular aufgebaut. Die verlinkten Kerndokumente sind als erste inhaltliche Versionen ausgearbeitet und können bei künftigen Änderungen des Bots schrittweise erweitert oder präzisiert werden.

Das Repository enthält sowohl aktuelle als auch ältere Strukturspuren, insbesondere durch `index.js` neben `bot.js`. Für neue Entwicklungsarbeit sollte `bot.js` als primäre Referenz betrachtet werden.