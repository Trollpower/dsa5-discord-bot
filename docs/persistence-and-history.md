# Persistenz und Event-History

Diese Datei beschreibt, wie DSA-Bot v2 veränderlichen Zustand speichert und wie fachliche Ereignisse für Verlauf, Schnellzugriffe und Auswertungen persistiert werden. Im Projekt gibt es dafür zwei unterschiedliche Mechanismen:

1. dateibasierte Character-Persistenz
2. eventbasierte Verlaufspersistenz als NDJSON

## Überblick

Die beiden Persistenzarten haben unterschiedliche Aufgaben:

- Character-Persistenz speichert den aktuellen Zustand einer Figur
- Event-History speichert einzelne fachliche Vorgänge als chronologische Ereignisse

Praktisch bedeutet das:

- wenn sich ein Character dauerhaft ändert, muss die Character-Datei geschrieben werden
- wenn ein Command später nachvollziehbar oder auswertbar sein soll, muss ein Event in die History gelangen

Beide Mechanismen ergänzen sich, ersetzen sich aber nicht gegenseitig.

## Character-Persistenz

Die Character-Persistenz liegt in `common/persistence.js`.

### Schreiben eines Characters

`persistCharacter(character)` schreibt den vollständigen Character als JSON-Datei in das Verzeichnis `chars/`.

Wichtig dabei:

- der Dateiname wird aus `character.name.toLowerCase()` gebildet
- geschrieben wird immer der komplette JSON-Inhalt
- das Format ist eingerückt und dadurch manuell lesbar

Der Persistenzpfad ist damit bewusst simpel: keine Datenbank, keine Transaktionen, keine Teilupdates. Der Character-Zustand ist immer direkt in einer JSON-Datei sichtbar.

### Lesen eines Characters

`retrieveCharacter(filename)` liest eine Character-Datei aus `chars/` und parst deren JSON-Inhalt.

Der Rückgabewert ist zunächst ein rohes JSON-Objekt. Die Laufzeitumwandlung in eine `Character`-Instanz erfolgt außerhalb von `common/persistence.js`, etwa in der Character-Initialisierung.

### Konfigurationspersistenz

Neben Character-Dateien gibt es mit `persistConfig(config)` eine zweite einfache Dateischreibfunktion. Sie speichert `config.json` im Projektroot.

## Wann Character-Persistenz verwendet wird

Character-Persistenz wird immer dann benötigt, wenn ein Command den dauerhaften Zustand einer Figur ändert.

Typische Beispiele im Projekt:

- Waffen oder Rüstungen hinzufügen, anlegen oder entfernen
- Ressourcen wie LeP oder AsP verändern
- Favoriten oder andere bot-spezifische Komfortdaten ändern
- Characters explizit über den Persist-Command speichern

Ein Beispiel dafür ist die Character-Bearbeitung in `events/char.js`. Dort werden Character-Objekte verändert und anschließend über `persistCharacter(...)` gespeichert.

## Persist-Command

Für manuelle Speicheroperationen gibt es `commands/persist.js` und die fachliche Verarbeitung in `events/persist.js`.

Der Command unterstützt im Kern vier Fälle:

1. alle aktuell geladenen Characters speichern
2. einen einzelnen Character speichern
3. einen Character von der Platte neu laden und erneut in die Laufzeit übernehmen
4. alle Characters von der Platte neu laden

Das macht den Persist-Command zu einem administrativen Werkzeug für den laufenden Bot-Betrieb und für Entwicklungs- oder Korrekturabläufe.

## Event-History

Die Event-History wird über `common/eventHistoryProvider.js` umgesetzt.

Im Gegensatz zur Character-Persistenz speichert sie nicht den Zustand einer Figur, sondern einzelne fachliche Aktionen in zeitlicher Reihenfolge.

### Provider-Konzept

Die History ist als Provider-System aufgebaut.

Aktuell relevant sind zwei Varianten:

- `NdjsonEventHistoryProvider` für echte Persistenz
- `NoopEventHistoryProvider` als Fallback ohne Speicherung

Welcher Provider verwendet wird, bestimmt `createEventHistoryProvider(config)` anhand der Konfiguration.

### Konfiguration des Providers

Wichtige Konfigurationswerte sind:

- `eventHistoryProvider`
- `eventHistoryNdjsonPath`
- `eventHistoryBlockedPayloadTypes`

Wenn `eventHistoryProvider` auf `ndjson` steht, wird eine NDJSON-Datei verwendet. Unbekannte Provider fallen auf den Noop-Provider zurück.

## NDJSON als Speicherformat

Der Standardpfad für die Event-History ist `storage/event-history.ndjson`.

NDJSON bedeutet: eine JSON-Struktur pro Zeile. Dadurch ergeben sich praktische Vorteile:

- neue Events können einfach angehängt werden
- die Datei bleibt zeilenweise verarbeitbar
- beschädigte Einzelzeilen zerstören nicht automatisch die ganze Datei
- Verlauf lässt sich auch manuell inspizieren

Beim Start des NDJSON-Providers wird das Zielverzeichnis bei Bedarf automatisch angelegt.

## Schreiben in die Event-History

Das Schreiben läuft über `appendEvents(...)` des Providers.

Ein Schreibvorgang besteht aus diesen Schritten:

1. aus Interaction, Character-Name und Event-Payload wird ein History-Record gebaut
2. der Record wird in eine serialisierbare Plain-Object-Struktur überführt
3. unerwünschte Payload-Typen werden geprüft und bei Bedarf blockiert
4. der Datensatz wird als einzelne JSON-Zeile an die NDJSON-Datei angehängt

### Struktur eines History-Records

Ein gespeicherter Datensatz enthält unter anderem:

- `id`
- `ts`
- `guildId`
- `channelId`
- `userId`
- `characterName`
- `eventName`
- `payload`
- `traceId`

Die Datei `storage/event-history.ndjson` zeigt dieses Format direkt in realen Beispielen.

### Beispielhafte gespeicherte Daten

In der Praxis enthält ein Probe-Ereignis zum Beispiel:

- Metadaten des Discord-Kontexts wie Guild-, Channel- und User-ID
- den betroffenen Character-Namen
- den fachlichen Event-Namen `probe`
- eine Payload mit Würfen, Fertigkeit, Fertigkeitspunkten und Ergebnisfeldern
- die `traceId` zur Zuordnung im Logging

## Serialisierung der Event-Payloads

Die History speichert nicht rohe Laufzeitobjekte, sondern serialisierte Plain-Object-Daten. Dafür gibt es in `common/eventHistoryProvider.js` eine eigene Serialisierungslogik.

Die Serialisierung behandelt unter anderem:

- `bigint` als String
- `Error` als Objekt mit `name`, `message` und `stack`
- `Date` als ISO-String
- Funktionen als Ersatztext
- rekursive oder zyklische Referenzen über Schutz gegen `[Circular]`
- nicht-Plain-Objects mit `__type`, damit ihre Herkunft sichtbar bleibt

Zusätzlich wird die Tiefe der Serialisierung begrenzt. Dadurch werden zu tiefe oder komplexe Objektgraphen abgeschnitten, statt die Persistenz unkontrolliert wachsen zu lassen.

## Blockierte Payload-Typen

Nicht jede Struktur soll in die History geschrieben werden. Standardmäßig ist insbesondere `InteractionResponse` als blockierter Typ hinterlegt.

Der Ablauf ist:

- nach der Serialisierung wird rekursiv geprüft, ob im Payload ein blockierter `__type` vorkommt
- wenn das der Fall ist, wird das Event nicht persistiert

Das schützt die History davor, Discord-spezifische Antwortobjekte oder andere unerwünschte Laufzeittypen zu speichern.

## Lesen aus der Event-History

Der NDJSON-Provider bietet mehrere Lese- und Auswertungsfunktionen. Diese arbeiten dateibasiert und lesen die NDJSON-Datei direkt ein.

### Allgemeine Leseoperationen

- `readLastEvent(...)`: letzter passender Datensatz eines Characters
- `countEvents(characterName)`: Anzahl gespeicherter Events
- `listEvents(characterName)`: gruppierte Übersicht von Event-Namen, teils inklusive Fertigkeits- oder Waffenbezug
- `trimEvents(keepLast)`: Datei auf die letzten N Datensätze reduzieren

### Probe-bezogene Leseoperationen

- `readRecentProbes(...)`: letzte unterschiedliche Proben eines Characters
- `readTopProbes(...)`: häufigste Proben eines Characters
- `readProbeHistory(...)`: letzte Probe-Ereignisse mit Ergebnisdaten

### KSF-bezogene Leseoperationen

- `readRecentKsf(...)`: zuletzt verwendete unterschiedliche KSF-Kombinationen
- `readTopKsf(...)`: häufigste KSF-Verwendungen

### Gemischte Leseoperationen

- `readRecentMixed(...)`: letzte unterschiedliche Mischmenge aus Probe, KSF, Angriff, Parade und Ausweichen
- `readTopMixed(...)`: häufigste Aktionen über mehrere Event-Arten hinweg

Diese Methoden sind die fachliche Grundlage für Komfortfunktionen wie Schnellzugriffe, Favoriten oder Verlaufsansichten.

## Verbindung zwischen Event-Modul und History

Der direkte Übergabepunkt zwischen Fachlogik und History liegt im Interaction-Handler.

Wenn ein Event-Modul ein Event oder ein Event-Array zurückgibt, passiert im Anschluss:

1. Eintrag in `DiscordClient.histories`
2. Persistenz über `DiscordClient.eventHistoryProvider.appendEvents(...)`

Wenn ein Event-Modul nichts zurückgibt, entsteht auch kein History-Eintrag.

Das ist wichtig für neue Features: History-Persistenz entsteht nicht automatisch durch `reply(...)`, sondern nur durch den Rückgabewert des Event-Moduls.

## In-Memory-History vs. persistierte History

Das Projekt nutzt zwei Verlaufsebenen:

- `DiscordClient.histories` als flüchtige In-Memory-Ablage
- NDJSON-Datei als dauerhafte Verlaufspersistenz

Die In-Memory-History ist nur für die laufende Bot-Session verfügbar. Die NDJSON-Datei überlebt Neustarts und ist die maßgebliche Quelle für Verlaufsauswertungen über längere Zeiträume.

## Typische Anwendungsfälle der History

Die Event-History ist im Projekt nicht nur Debug- oder Audit-Information, sondern echte Fachgrundlage für Features.

Typische Anwendungsfälle sind:

- Anzeige der letzten Proben eines Characters
- Ermittlung häufig verwendeter Proben oder KSFs
- Aufbau gemischter Schnellzugriffe aus realem Nutzungsverhalten
- nachvollziehbare Analyse von Würfelergebnissen und Entscheidungen

## Grenzen und Eigenschaften der aktuellen Persistenz

Die aktuelle Persistenz ist bewusst pragmatisch und lokal dateibasiert. Das bringt Stärken und Grenzen mit sich.

Vorteile:

- leicht verständlich
- einfach manuell prüfbar
- ohne externe Infrastruktur nutzbar
- gut für Entwicklung und kleine Betriebsumgebungen geeignet

Grenzen:

- keine Transaktionen
- keine Mehrinstanz-Synchronisation
- parallele Schreibzugriffe sind nicht besonders robust abgesichert
- Auswertungen lesen die History-Datei vollständig ein und skalieren daher nur begrenzt

## Orientierung für Folgekapitel

- Für die fachliche Struktur von Charactern und Event-Payloads siehe `domain-model.md`.
- Für den Request-Flow bis zur Rückgabe eines Events siehe `command-lifecycle.md`.
- Für Konfiguration und Logging rund um Persistenz und Verlauf siehe `configuration.md`.