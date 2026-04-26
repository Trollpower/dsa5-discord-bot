# Konfiguration und Logging

Diese Datei beschreibt die Konfigurationsquellen des Bots und das aktuelle Logging-System. Ziel ist eine klare Trennung zwischen geheimen Laufzeitwerten, projektbezogenen Bot-Einstellungen und der technischen Beobachtbarkeit während Entwicklung und Betrieb.

## Überblick

Die Konfiguration des Projekts verteilt sich auf drei Ebenen:

1. `.env` für Umgebungsvariablen und Secrets
2. `config.json` für projekt- und bot-spezifische Einstellungen
3. Logging-Konfiguration über Umgebungsvariablen und `common/logger.js`

Diese Ebenen haben unterschiedliche Aufgaben:

- `.env` enthält laufzeitspezifische Werte wie Tokens und IDs
- `config.json` enthält fachliche und bot-interne Einstellungen wie Alias-Zuordnungen oder Event-History-Optionen
- das Logging-System steuert, wie sichtbar und wie detailliert technische Abläufe protokolliert werden

## Umgebungsvariablen aus `.env`

Die Datei `.env` wird beim Start früh geladen, bevor der Discord-Client aufgebaut wird.

### Zentrale Umgebungsvariablen

Die wichtigsten Werte sind:

- `DISCORD_TOKEN`: Bot-Token für den Login bei Discord
- `CLIENT_ID`: Discord Application Client ID
- `GUILD_ID_TESTSERVER`: Guild-ID für Testserver-Deployment von Slash-Commands
- `GUILD_ID_PINKY`: Guild-ID für das zweite konfigurierte Deploymentziel
- `LOG_LEVEL`: gewünschte Logstufe
- `LOG_FORMAT`: gewünschtes Logformat

### Pflichtwerte beim Start

Beim produktiven Einstieg in `bot.js` werden aktuell mindestens diese Variablen als zwingend behandelt:

- `DISCORD_TOKEN`
- `CLIENT_ID`

Wenn eine dieser Variablen fehlt, wird der Bot mit einem Fehlerlog beendet. Dadurch scheitert die Anwendung kontrolliert, statt später in einer undefinierten Laufzeitphase zu brechen.

### Rolle der Guild-IDs

Die Guild-IDs sind vor allem für `deploy-commands.js` relevant. Dort werden Slash-Commands gezielt in die konfigurierten Guilds geschrieben.

Das bedeutet:

- fehlende Guild-IDs verhindern nicht zwingend den Start des Bots
- sie sind aber für das erwartete Deployment-Verhalten wichtig

## Projektkonfiguration in `config.json`

Neben `.env` verwendet das Projekt eine eigene JSON-Konfiguration in `config.json`.

Eine Vorlage dafür liegt in `config.example.json`.

Diese Datei wird nicht als Secret behandelt, sondern als bot-spezifische Konfiguration. Sie steuert insbesondere Character-Zuordnungen, GM-Funktionen und optionale Komfort-Features.

## Wichtige Schlüssel in `config.json`

### `meister`

`meister` ist eine Liste von Discord-Benutzernamen mit Meisterrechten.

Diese Liste wird in `bot.js` über `BaseInteraction.prototype.isMeister()` für Berechtigungsprüfungen genutzt. Zusätzlich können temporäre Meisterrechte zur Laufzeit über `temporaryMeisters` vergeben werden.

### `alias`

`alias` ordnet Discord-Benutzernamen einem Character-Namen zu.

Das ist eine zentrale Konfiguration für die Character-Auflösung, weil viele Commands implizit vom aktiven oder zugeordneten Character ausgehen.

### `gruppen`

`gruppen` enthält benannte Character-Gruppen. Diese Struktur ist fachlich relevant für gruppenbezogene Features und administrative Kommandos.

### `enableGMChanceImprovement`

Dieser Schalter aktiviert eine Meister-bezogene Manipulationslogik in bestimmten Kampffunktionen. Die Konfiguration ist damit kein reines UI-Feature, sondern beeinflusst fachliches Verhalten und Debugging.

### `probeQuickButtonsEnabled`

Aktiviert oder deaktiviert die Schnell-Probe-Buttonleiste, insbesondere im Umfeld von Probe-Workflows.

### `probeQuickButtonsCount`

Historischer Konfigurationswert für die Anzahl von Schnellzugriffen. Die aktuelle UI verwendet ein festeres Layout, der Wert ist aber weiterhin Teil der Konfiguration und sollte dokumentiert bleiben.

### `eventHistoryProvider`

Bestimmt, welcher History-Provider verwendet wird. Aktuell ist `ndjson` der relevante produktive Wert.

### `eventHistoryNdjsonPath`

Zielpfad für die Event-History-Datei. Standardmäßig liegt diese unter `storage/event-history.ndjson`.

### `eventHistoryBlockedPayloadTypes`

Optionale Liste von `__type`-Namen, deren Payloads nicht in die Event-History geschrieben werden sollen.

## Beispielkonfiguration

Die Vorlage `config.example.json` enthält den Grundaufbau bereits gut:

- Meisterliste
- Alias-Zuordnungen
- Gruppen
- History-Konfiguration
- Komfort- und Feature-Schalter

Die produktive `config.json` zeigt, dass diese Datei im laufenden Projekt auch konkrete Character- und Benutzerzuordnungen trägt und damit Teil der praktischen Betriebslogik ist.

## Zusammenspiel von `.env` und `config.json`

Die beiden Konfigurationsquellen ergänzen sich:

- `.env` sagt dem Bot, mit welchem Discord-Kontext und welcher Laufzeitumgebung er arbeitet
- `config.json` sagt dem Bot, wie sich die Anwendung innerhalb dieses Kontexts verhalten soll

Praktische Faustregel:

- alles, was geheim oder umgebungsabhängig ist, gehört eher in `.env`
- alles, was fachlich oder bot-spezifisch konfigurierbar ist, gehört eher in `config.json`

## Logging-System

Das Logging ist in `common/logger.js` implementiert. Es ist bewusst klein gehalten, aber für den Bot zentral, weil es strukturierte Einträge, Levelsteuerung, farbige Pretty-Ausgabe und `traceId`-basierte Nachverfolgung unterstützt.

## Log-Level

Unterstützt werden aktuell diese Stufen:

- `debug`
- `info`
- `warn`
- `error`

Die aktive Logstufe wird aus `LOG_LEVEL` gelesen. Wenn kein gültiger Wert gesetzt ist, verwendet das System `info` als Standard.

Die Levelsteuerung funktioniert klassisch:

- bei `info` erscheinen `info`, `warn` und `error`
- bei `debug` zusätzlich auch Debug-Logs

## Logformate

Das Logging kennt zwei Formate:

- `pretty`
- `json`

Das aktive Format wird aus `LOG_FORMAT` gelesen. Der Standard ist `pretty`.

### `pretty`

Im Pretty-Format werden Logeinträge menschenlesbar in einer Zeile ausgegeben, einschließlich:

- Zeitstempel
- Log-Level
- Eventname
- ausgewählter Metadaten
- farblicher Hervorhebung bestimmter Felder

Dieses Format ist besonders für lokale Entwicklung und interaktive Fehleranalyse geeignet.

### `json`

Im JSON-Format wird jeder Logeintrag als strukturierte JSON-Zeile ausgegeben. Das ist besonders sinnvoll für:

- Containerbetrieb
- Logaggregation
- maschinelle Analyse
- Weiterleitung an Logging-Plattformen

## Struktur eines Logeintrags

Ein Logeintrag enthält im Kern:

- `ts`
- `level`
- `event`
- `meta`

Die Metadaten können je nach Aufruf weitere Felder enthalten, etwa Character-Namen, Eventnamen, Fehlerobjekte oder technische Kontextinformationen.

## `traceId` für Request-Nachverfolgung

Eine wichtige Eigenschaft des Loggers ist die Unterstützung von `traceId`.

Bei eingehenden Interactions wird eine `traceId` erzeugt und an der Interaction gespeichert. Diese Kennung kann dann durch mehrere Logzeilen eines gesamten Request-Flows mitgeführt werden.

Das ist besonders nützlich bei:

- Fehleranalyse in Event-Modulen
- Nachverfolgung komplexer Interaction-Abläufe
- Zuordnung zwischen Discord-Interaktion, History-Record und Logausgaben

Die `traceId` wird unter anderem im Zusammenspiel von `handlers/interactionCreate.js`, `common/logger.js` und der Event-History verwendet.

## Fehler- und Metadatenbehandlung im Logger

Der Logger serialisiert Metadaten defensiv. Dabei werden unter anderem:

- `Error`-Objekte strukturiert ausgegeben
- `bigint` in Strings umgewandelt
- zirkuläre Referenzen abgefangen
- Highlight-Felder wie `eventName` und `fertigkeit` in der Pretty-Ausgabe gesondert hervorgehoben

Damit sind auch komplexere Debug-Ausgaben möglich, ohne dass das Logging an problematischen Laufzeitobjekten scheitert.

## Logging in der Praxis

Für den praktischen Einsatz gelten im Projekt aktuell diese sinnvollen Regeln:

- `debug` für technische Detaildiagnose bei Würfeln, Routing oder Persistenz
- `info` für normale Laufzeitereignisse wie erfolgreich gestartete Komponenten oder ausgeführte Events
- `warn` für unerwartete, aber nicht sofort fatale Situationen
- `error` für Fehler, die Laufzeitverhalten oder Nutzerinteraktionen beeinträchtigen

## Konfiguration und Docker

Im Containerbetrieb werden `.env`, `config.json`, `chars/` und `storage/` getrennt behandelt.

Wichtig dabei:

- `.env` liefert die Umgebungsvariablen für den Containerstart
- `config.json` wird als Datei gemountet
- `chars/` und `storage/` werden ebenfalls als Volumes eingebunden

Das bedeutet, dass betriebliche Konfiguration und veränderliche Persistenzdaten außerhalb des Images bleiben. Diese Trennung ist für reproduzierbare Builds und stabile Laufzeitdaten wichtig.

## Typische Konfigurationsfehler

Bei Problemen sind diese Fehlerbilder besonders häufig:

- `DISCORD_TOKEN` oder `CLIENT_ID` fehlen
- Guild-IDs passen nicht zur gewünschten Deployment-Umgebung
- `alias` enthält keinen Eintrag für den aktuellen Benutzer
- `eventHistoryNdjsonPath` zeigt auf einen unerwarteten Pfad
- `LOG_LEVEL` oder `LOG_FORMAT` sind ungültig und fallen deshalb auf Standardwerte zurück

## Orientierung für Folgekapitel

- Für den Start- und Architekturkontext siehe `architecture.md`.
- Für Character-Zuordnung und Interaction-Flow siehe `command-lifecycle.md`.
- Für Persistenz und Event-History siehe `persistence-and-history.md`.