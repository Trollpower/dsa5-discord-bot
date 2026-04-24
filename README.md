# DSA-Bot v2

Ein Discord-Bot für **Das Schwarze Auge 5. Edition (DSA5)** Rollenspielsitzungen. Automatisiert Würfelwürfe, Charakterverwaltung und Kampfmechaniken.

## Inhaltsverzeichnis

- [DSA-Bot v2](#dsa-bot-v2)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [⚠️ Wichtiger Hinweis](#️-wichtiger-hinweis)
  - [🎲 Features](#-features)
  - [🔧 Installation \& Konfiguration](#-installation--konfiguration)
    - [1. Voraussetzungen](#1-voraussetzungen)
    - [2. Environment Variables (.env Datei)](#2-environment-variables-env-datei)
    - [2.1 Konfiguration in `config.json`](#21-konfiguration-in-configjson)
    - [3. Installation](#3-installation)
    - [4. Commands Deployment](#4-commands-deployment)
    - [5. Bot starten](#5-bot-starten)
    - [6. Docker: Image bauen und Container starten](#6-docker-image-bauen-und-container-starten)
    - [7. Docker Compose (optional)](#7-docker-compose-optional)
      - [Slash-Commands via Docker Compose deployen](#slash-commands-via-docker-compose-deployen)
  - [🎯 Verfügbare Commands](#-verfügbare-commands)
    - [**Grundlegende Commands**](#grundlegende-commands)
      - [`/help`](#help)
      - [`/ping`](#ping)
      - [`/roll`](#roll)
      - [`/show`](#show)
    - [**GM-Befehl (nur Meister)**](#gm-befehl-nur-meister)
      - [`/gm`](#gm)
      - [`/gruppe`](#gruppe)
    - [**Schnellzugriff**](#schnellzugriff)
      - [`/quick`](#quick)
    - [**Charakter-Management**](#charakter-management)
      - [`/char`](#char)
    - [**Eigenschaften \& Fertigkeiten**](#eigenschaften--fertigkeiten)
      - [`/eigenschaft`](#eigenschaft)
      - [`/probe`](#probe)
    - [**Kampf-System**](#kampf-system)
      - [`/angriff`](#angriff)
      - [`/parade`](#parade)
      - [`/ausweichen`](#ausweichen)
      - [`/initiative`](#initiative)
    - [**Ressourcen-Management**](#ressourcen-management)
      - [`/lep`](#lep)
      - [`/asp`](#asp)
      - [`/ksf`](#ksf)
      - [`/schip`](#schip)
    - [**Utility Commands**](#utility-commands)
      - [`/persist`](#persist)
      - [`/server`](#server)
      - [`/tables`](#tables)
  - [🎮 Spieler-Alias System](#-spieler-alias-system)
  - [📊 Probe- und Kampf-Tracking pro Charakter](#-probe--und-kampf-tracking-pro-charakter)
  - [📁 Projektstruktur](#-projektstruktur)
  - [🚀 Development](#-development)
    - [Commands hinzufügen](#commands-hinzufügen)
    - [Charaktere hinzufügen](#charaktere-hinzufügen)
  - [🔒 Sicherheit](#-sicherheit)
  - [📝 Changelog](#-changelog)
    - [v2.0.0](#v200)
    - [Aktueller Stand](#aktueller-stand)
  - [Rechtlicher Hinweis zu DSA5](#rechtlicher-hinweis-zu-dsa5)

## ⚠️ Wichtiger Hinweis

**Dies ist ein privates Projekt!**
- Es werden **keine Garantien** oder **Gewährleistungen** übernommen
- **Keine Verantwortung** für Schäden oder Datenverlust
- Support wird nur in **Ausnahmefällen** (wenn überhaupt) geleistet
- Verwendung auf **eigene Verantwortung**

## 🎲 Features

- **Charakterverwaltung**: Spielercharaktere laden und verwalten
- **Würfelsystem**: Unterstützung für DSA5-spezifische Würfelwürfe (3W20-Proben, Qualitätsstufen)
- **Kampfsystem**: Angriffe, Paraden, Initiative und mehr
- **Fertigkeitsproben**: Alle DSA5-Fertigkeiten und Eigenschaften
- **Schnellzugriff-Leiste**: `/quick` zeigt dynamische Button-Leiste mit Proben, KSF, Angriff, Parade und Ausweichen; drei Reihen (Letzte, Favoriten, Top) mit Emoji-Kennzeichnung (💪 Probe, 🗡️ KSF, ⚔️ Angriff, 🛡️ Parade, 💨 Ausweichen)
- **Persistierung**: Charakterdaten und Event-History (NDJSON)
- **Probe-Verlauf**: `/char proben` und `/gm char proben` zeigen die letzten 50 Proben als Embed mit Ergebnis, QS und Datum an
- **GM-Befehl**: `/gm` bietet Meisterwerkzeuge für Event-Log-Verwaltung, Cheat-Werte und temporäre Meister-Berechtigungen
- **Integrierte Hilfe**: `/help` zeigt alle Commands, Unterbefehle und Optionen als Embed-Übersicht
- **Aliase**: Zuordnung von Discord-Benutzern zu Charakteren

## 🔧 Installation & Konfiguration

### 1. Voraussetzungen
- Node.js 18.0.0 oder höher
- Discord Bot Token

### 2. Environment Variables (.env Datei)

Erstelle eine `.env` Datei im Projektverzeichnis:

```env
# Discord Bot Configuration
DISCORD_TOKEN=dein_discord_bot_token_hier
CLIENT_ID=deine_discord_client_id_hier
GUILD_ID_TESTSERVER=deine_test_guild_id_hier
GUILD_ID_PINKY=deine_haupt_guild_id_hier

# Logging (debug, info, warn, error)
LOG_LEVEL=info
LOG_FORMAT=pretty
```

`LOG_LEVEL=debug` aktiviert detailreiche technische Logs (z. B. Würfel- und Cheat-Entscheidungen).
`LOG_FORMAT=pretty` zeigt menschenlesbare Logs, `LOG_FORMAT=json` erzeugt strukturierte JSON-Logs.
Alle Interaction-bezogenen Logs enthalten außerdem eine `traceId` zur zusammenhängenden Nachverfolgung.

### 2.1 Konfiguration in `config.json`

Eine Vorlagedatei `config.example.json` liegt im Repository. Kopiere sie und passe sie an:

```powershell
Copy-Item config.example.json config.json
```

`config.json` selbst ist in `.gitignore` und wird nicht eingecheckt.

Zusätzlich zur Alias-/Meister-Konfiguration sind folgende Schalter relevant:

```json
{
  "probeQuickButtonsEnabled": true,
  "probeQuickButtonsCount": 8,
  "eventHistoryProvider": "ndjson",
  "eventHistoryNdjsonPath": "storage/event-history.ndjson",
  "eventHistoryBlockedPayloadTypes": ["InteractionResponse"]
}
```

- `probeQuickButtonsEnabled`: aktiviert/deaktiviert die Schnell-Probe-Buttonleiste bei `/probe`.
- `probeQuickButtonsCount`: historischer Konfigurationswert; die aktuelle Leiste nutzt ein festes 3-Reihen-Layout (3/3/5).
- `eventHistoryProvider`: aktuell unterstützter Wert ist `ndjson`.
- `eventHistoryNdjsonPath`: Ziel-Datei für Event-History (eine JSON-Zeile pro Event).
- `eventHistoryBlockedPayloadTypes`: optionale Liste geblockter `__type`-Werte im Payload; solche Events werden nicht persistiert.

### 3. Installation
```powershell
npm install
```

### 4. Commands Deployment
```powershell
node deploy-commands.js
```

### 5. Bot starten
```powershell
npm run dev
# oder ohne nodemon
node bot.js
```

### 6. Docker: Image bauen und Container starten

Voraussetzungen:
- Docker Desktop bzw. Docker Engine

Image bauen:
```powershell
docker build -t dsa-bot-v2 .
```

Das Image verwendet ein **Multi-Stage-Build**:
- **Build Stage** (`node:20-bookworm-slim`): installiert Abhängigkeiten
- **Runtime Stage** (`gcr.io/distroless/nodejs20-debian12`): nur Node.js-Runtime, keine Shell, minimale Angriffsfläche

Container mit Volumes manuell starten:
```powershell
docker run --env-file .env \
  -v ./chars:/app/chars \
  -v ./storage:/app/storage \
  -v ./config.json:/app/config.json:ro \
  dsa-bot-v2
```

Slash-Commands manuell deployen (Einmalausführung):
```powershell
docker run --rm --env-file .env \
  -v ./config.json:/app/config.json:ro \
  dsa-bot-v2 deploy-commands.js
```

Hinweise:
- `chars/`, `storage/` und `config.json` werden **nicht** ins Image gebacken (`.dockerignore`), sondern zur Laufzeit als Bind-Mounts eingehängt.
- Der `storage/`-Ordner wird beim Container-Start automatisch angelegt, falls er noch nicht existiert.
- Da das Image auf Distroless basiert, ist kein `docker exec ... sh` möglich. Für Debugging: Tag `:debug` verwenden (`gcr.io/distroless/nodejs20-debian12:debug`).
- Für detaillierte Laufzeitanalyse kann `LOG_LEVEL=debug` in der `.env` gesetzt werden.

### 7. Docker Compose (optional)

Das Projekt enthält eine `docker-compose.yml`.

Starten (Build + Run im Hintergrund):
```powershell
docker compose up -d --build
```

Die `docker-compose.yml` bindet automatisch folgende Verzeichnisse/Dateien als Volumes ein:

| Pfad auf dem Host | Pfad im Container | Zweck |
|---|---|---|
| `./chars/` | `/app/chars` | Charakter-JSON-Dateien (lesen + schreiben) |
| `./storage/` | `/app/storage` | Event-History (`event-history.ndjson`) |
| `./config.json` | `/app/config.json` | Bot-Konfiguration (read-only) |

Logs anzeigen:
```powershell
docker compose logs -f
```

Stoppen und Container entfernen:
```powershell
docker compose down
```

#### Slash-Commands via Docker Compose deployen

Die `docker-compose.yml` enthält einen separaten `deploy`-Service mit dem Profil `deploy`.
Er startet **nicht** beim normalen `docker compose up`, sondern nur auf expliziten Aufruf:

```powershell
docker compose run --rm deploy
```

`--rm` entfernt den Container nach Abschluss automatisch, da es sich um einen Einmal-Task handelt.

## 🎯 Verfügbare Commands

### **Grundlegende Commands**

#### `/help`
- **Beschreibung**: Zeigt eine Embed-basierte Befehlsübersicht
- **Inhalt**:
  - alle registrierten Slash-Commands
  - Unterbefehle und Subcommand-Gruppen
  - optionale und erforderliche Parameter je Aufruf
- **Darstellung**:
  - pro Command ein Embed-Feld
  - Discord rendert die Felder als mehrere Spalten, wenn genug Platz vorhanden ist
  - Pflichtparameter werden als `<parameter>` dargestellt
  - optionale Parameter werden als `[parameter]` dargestellt

#### `/ping`
- **Beschreibung**: Ping-Pong Test
- **Subcommands**:
  - `user` - Info über einen Benutzer

#### `/roll`
- **Beschreibung**: Allgemeine Würfelwürfe
- **Parameter**:
  - `würfel` (erforderlich) - Würfelnotation (z.B. "3D6+4")

#### `/show`
- **Beschreibung**: Anzeige von Spieldaten
- **Parameter**:
  - `detailname` (erforderlich) - Name des anzuzeigenden Elements (Autocomplete verfügbar)

### **GM-Befehl (nur Meister)**

#### `/gm`
- **Beschreibung**: Meisterwerkzeuge – nur für Benutzer mit Meister-Berechtigung
- **Subcommand Group `events`**:
  - `count [charakter]` – Anzahl der Events im NDJSON-Log anzeigen
  - `trim anzahl:<N>` – Log auf die letzten N Events kürzen
  - `list [charakter]` – Events nach Name und Häufigkeit auflisten
- **Subcommand Group `char`**:
  - `cheating-get charactername` – Cheating-Werte eines Charakters anzeigen
  - `cheating-set charactername wert` – `cheating.general` eines Charakters setzen (0–100)
  - `cheating-set-crit charactername wert` – `cheating.crit` eines Charakters setzen (0–100)
  - `proben [charactername]` – Letzte 50 Proben aller oder eines bestimmten Charakters als Embed anzeigen
- **Subcommand Group `user`**:
  - `meister` – Temporäre Meister-Berechtigungen via Button-Grid vergeben/entziehen (grün = hinzufügen, rot = entfernen); Berechtigungen gelten nur bis zum nächsten Neustart
  - `pc benutzer charactername` – Spielercharakter für einen Discord-Benutzer festlegen (Autocomplete)

#### `/gruppe`
- **Beschreibung**: Gruppen von Charakteren verwalten – nur für Benutzer mit Meister-Berechtigung
- **Subcommands**:
  - `erstellen name:<Name>` – Neue Gruppe erstellen
  - `löschen name:<Name>` – Gruppe löschen (Autocomplete)
  - `hinzufügen name:<Gruppe> charakter:<Charakter>` – Charakter zu einer Gruppe hinzufügen (Autocomplete)
  - `entfernen name:<Gruppe> charakter:<Charakter>` – Charakter aus einer Gruppe entfernen (Autocomplete)
  - `anzeigen [name:<Gruppe>]` – Gruppe(n) anzeigen; ohne Name werden alle Gruppen aufgelistet (Autocomplete)
  - `probe name:<Gruppe> fertigkeitsname:<Fertigkeit> [bonus-malus]` – Probe für alle Charaktere einer Gruppe durchführen; Ergebnisse werden nach QS sortiert als Embeds angezeigt (Autocomplete)
- **Hinweis**: Gruppen werden in `config.json` unter `gruppen` persistiert

### **Schnellzugriff**

#### `/quick`
- **Beschreibung**: Zeigt Schnellzugriff-Buttons für Proben, KSF, Angriff, Parade und Ausweichen
- **Darstellung**: Ephemeral-Nachricht mit bis zu drei Button-Reihen:
  - **Reihe 1 (grün/Success)**: Letzte 5 Aktionen (Proben, KSF, Angriffe, Paraden, Ausweichen) in chronologischer Reihenfolge
  - **Reihe 2 (blau/Primary)**: Bis zu 3 Favoriten aus `/char favorit1/2/3` (Proben, KSF oder Angriffe)
  - **Reihe 3 (grau/Secondary)**: Top 5 häufigste Aktionen aus dem Event-Log
- **Emojis**: 💪 Probe, 🗡️ KSF, ⚔️ Angriff, 🛡️ Parade, 💨 Ausweichen
- **Verhalten**: Klick auf einen Button führt die Aktion sofort aus

### **Charakter-Management**

#### `/char`
- **Beschreibung**: Charakterverwaltung
- **Subcommands**:
  - `info` - Charakterinformationen anzeigen
  - `favorit1` / `favorit2` / `favorit3` - Favoriten für die `/quick`-Buttonleiste setzen
    - **Probe-Favorit**: `fertigkeit` (Autocomplete) + optional `name`, `bonus-malus`
    - **KSF-Favorit**: `ksf` (Auswahl) + optional `stufe` (1-3, nur Wuchtschlag/Finte), `basismanoever` (Autocomplete, nur Sturmangriff/Todesstoß/Vorstoß/Entwaffnen/Zu Fall bringen), `name`, `bonus-malus`
    - **Angriff-Favorit**: `angriff` (Autocomplete, angelegte Waffen) + optional `name`, `bonus-malus`
    - Es kann pro Slot nur **eine** der drei Optionen angegeben werden
    - Duplikate über Slots hinweg werden automatisch entfernt
  - `proben` - die letzten 50 Proben des Charakters als Embed anzeigen (QS, FP, Datum, Uhrzeit)
- **Subcommand Groups**:
  - `rüstung` - Rüstungsverwaltung
    - `hinzufügen` - Rüstung ins Inventar hinzufügen

### **Eigenschaften & Fertigkeiten**

#### `/eigenschaft`
- **Beschreibung**: Eigenschaftsproben
- **Subcommands**: 
  - `mut` - Mut-Probe
  - `klugheit` - Klugheit-Probe
  - `intuition` - Intuition-Probe
  - *(weitere Eigenschaften verfügbar)*
- **Parameter**:
  - `bonus-malus` (optional) - Modifikator für die Probe

#### `/probe`
- **Beschreibung**: Fertigkeitsproben für alle DSA-Fertigkeiten und magischen Fähigkeiten
- **Parameter**:
  - `fertigkeitsname` (optional) - Name der Fertigkeit (Autocomplete)
  - `bonus-malus` (optional) - Modifikator für die Probe

**Verfügbare Fertigkeiten:**

**Talente:**
- Alchimie, Bekehren & Überzeugen, Betören, Boote & Schiffe, Brett- & Glücksspiel
- Einschüchtern, Etikette, Fährtensuchen, Fahrzeuge, Fesseln, Fischen & Angeln
- Fliegen, Gassenwissen, Gaukeleien, Geographie, Geschichtswissen, Götter & Kulte
- Handel, Heilkunde Gift, Heilkunde Krankheiten, Heilkunde Seele, Heilkunde Wunden
- Holzbearbeitung, Klettern, Körperbeherrschung, Kraftakt, Kriegskunst
- Lebensmittelbearbeitung, Lederbearbeitung, Magiekunde, Malen & Zeichnen
- Mechanik, Menschenkenntnis, Metallbearbeitung, Musizieren, Orientierung
- Pflanzenkunde, Rechnen, Rechtskunde, Reiten, Sagen & Legenden
- Schlösserknacken, Schwimmen, Selbstbeherrschung, Singen, Sinnesschärfe
- Sphärenkunde, Steinbearbeitung, Sternkunde, Stoffbearbeitung, Tanzen
- Taschendiebstahl, Tierkunde, Überreden, Verbergen, Verkleiden
- Wildnisleben, Willenskraft, Zechen

**Zauber:**
- Alle DSA-Zauber (z.B. Ablativum, Adlerauge, Armatrutz, Fulminictus, etc.)

**Liturgien:**
- Alle DSA-Liturgien (z.B. Angriffslust, Bann der Furcht, Bannstrahl, etc.)

**Weitere magische Fähigkeiten:**
- Rituale, Zaubermelodien, Elfenlieder, Segnungen, Zeremonien, Hexenflüche

*Hinweis: Das Autocomplete-System zeigt dir beim Tippen passende Vorschläge an.*

### **Kampf-System**

#### `/angriff`
- **Beschreibung**: Angriffswürfe
- **Parameter**:
  - `bonus-malus` (optional) - Angriffsmodifikator
  - `charwaffenname` (optional) - Waffenname (Autocomplete)

#### `/parade`
- **Beschreibung**: Paradeversuche
- **Parameter**: *(siehe Implementierung)*

#### `/ausweichen`
- **Beschreibung**: Ausweichmanöver
- **Parameter**: *(siehe Implementierung)*

#### `/initiative`
- **Beschreibung**: Initiativewürfe
- **Parameter**: *(siehe Implementierung)*

### **Ressourcen-Management**

#### `/lep`
- **Beschreibung**: Lebenspunkte verwalten
- **Parameter**: *(siehe Implementierung)*

#### `/asp`
- **Beschreibung**: Astralpunkte verwalten
- **Subcommands**:
  - `plus` - Astralpunkte hinzufügen
  - `minus` - Astralpunkte abziehen
- **Parameter**:
  - `wieviel` (erforderlich) - Absoluter Wert oder Würfelwurf

#### `/ksf`
- **Beschreibung**: Kampfsonderfertigkeiten ausführen
- **Subcommands**: `wuchtschlag`, `finte`, `sturmangriff`, `todesstoß`, `vorstoß`, `entwaffnen`, `zufallbringen`
- **Parameter** (je nach Subcommand):
  - `stufe` (nur Wuchtschlag/Finte) - Stufe 1-3
  - `waffenname` (optional) - Waffe (Autocomplete)
  - `basismanoever` (optional, nicht bei Wuchtschlag/Finte) - Basismanöver kombinieren (Autocomplete)
  - `bonus-malus` (optional) - Modifikator

#### `/schip`
- **Beschreibung**: Schicksalspunkte
- **Parameter**: *(keine Parameter)*

### **Utility Commands**

#### `/persist`
- **Beschreibung**: Datenpersistierung
- **Parameter**: *(siehe Implementierung)*

#### `/server`
- **Beschreibung**: Server-Informationen
- **Parameter**: *(siehe Implementierung)*

#### `/tables`
- **Beschreibung**: DSA-Tabellen anzeigen
- **Parameter**: *(siehe Implementierung)*

## 🎮 Spieler-Alias System

Das Bot-System verwendet ein Alias-System zur Zuordnung von Discord-Benutzern zu DSA-Charakteren.

**Konfiguration in `config.json`:**
```json
{
    "alias": {
        "discord_username": "Charaktername",
        "anderer_user": "Anderer Charakter"
    }
}
```

## 📊 Probe- und Kampf-Tracking pro Charakter

Die Auswertung für die `/quick`-Buttonleiste erfolgt aus der Event-History in `storage/event-history.ndjson`:

- **Letzte Aktionen**: letzte 5 Events pro Charakter (Proben, KSF, Angriffe, Paraden, Ausweichen) ohne Duplikate
- **Top-Aktionen**: Häufigkeitsauswertung aller Events pro Charakter
- **Favoriten**: in der Charakterdatei als `quickProbeFavorites` (unterstützt Proben, KSF und Angriffe)

Die Felder `lastExecutedProbes` und `noOfExecutions` werden nicht mehr in den Charakterdateien gepflegt.

Der `/schip`-Befehl nutzt ebenfalls das letzte passende Event des Charakters aus der Event-History (mit Fallback auf In-Memory-History).

## 📁 Projektstruktur

```
├── bot.js                 # Hauptbot-Datei
├── config.json           # Spielkonfiguration (Aliase, Meister)
├── deploy-commands.js    # Command-Deployment
├── .env                  # Environment Variables (nicht in Git!)
├── commands/            # Discord Slash Commands
├── events/              # Event Handler
├── chars/               # Charakterdateien (JSON)
├── data/                # Spieldaten (Waffen, Zauber, etc.)
├── tables/              # DSA-Tabellen
└── common/              # Gemeinsame Funktionen
```

## 🚀 Development

### Commands hinzufügen
1. Neue Datei in `commands/` erstellen
2. Entsprechenden Event Handler in `events/` erstellen
3. Commands mit `node deploy-commands.js` deployen

### Charaktere hinzufügen
- JSON-Dateien in `chars/` Verzeichnis ablegen
- Format entsprechend bestehender Charaktere

## 🔒 Sicherheit

- **Credentials nie in Git committen!**
- `.env` Datei ist in `.gitignore` enthalten
- Regelmäßige Token-Rotation empfohlen

## 📝 Changelog

### v2.0.0
- Migration auf ES6 Module
- Environment Variables für Credentials
- Verbesserte Sicherheit
- Modernisierte Codebase

### Aktueller Stand
- Logging auf strukturiertes Logger-System mit `LOG_LEVEL`, `LOG_FORMAT` und `traceId`
- `deploy-commands.js` auf ESM umgestellt
- `/probe` um Schnell-Buttonleiste (3 Reihen) erweitert; Button-Auswahldialog ist ephemeral
- `/probe`-Schnell-Buttons berücksichtigen Bonus/Malus: gleiche Fertigkeit mit unterschiedlichem BM erscheint als separater Button; BM-Suffix `(+N)` / `(-N)` im Button-Label
- `/quick` – neuer dedizierter Schnellzugriff-Befehl mit Buttons für Proben, KSF, Angriff, Parade und Ausweichen
- `/quick`-Buttons zeigen Emojis: 💪 Probe, 🗡️ KSF, ⚔️ Angriff, 🛡️ Parade, 💨 Ausweichen
- `/char favorit1/2/3` unterstützt jetzt Proben, KSF (mit Stufe/Basismanöver) und Angriff (mit Waffenname) als Favoriten
- Event-History trackt alle Kampfaktionen (Probe, KSF, Angriff, Parade, Ausweichen) für Schnellzugriff-Buttons
- Anzahl "letzte Proben"-Buttons von 3 auf 5 erhöht
- `/char favorit1/2/3` – optionaler `bonus-malus`-Parameter; wird gespeichert und im Button angezeigt
- `/char proben` – letzten 50 Proben des Charakters als farbigen Embed anzeigen (⭐/💩/✅/❌, QS, FP, Datum+Uhrzeit)
- `/gm` – neuer Meister-Befehl mit Event-Log-Verwaltung, Cheat-Werten und temporären Meister-Berechtigungen per Button
- `/gm char proben` – Probe-Verlauf über alle oder einen bestimmten Charakter
- `/gm user pc` – Spielercharakter für einen Discord-Benutzer festlegen (ersetzt `/config pc`)
- `/config` entfernt; Funktionalität vollständig in `/gm` integriert
- `/help` zeigt `/gm`- und `/gruppe`-Subcommands nur für Meister an; andere Benutzer sehen nur den Hinweis
- `/gruppe` – neuer Meister-Befehl zur Gruppenverwaltung: Gruppen erstellen/löschen, Charaktere hinzufügen/entfernen, Gruppen anzeigen und Sammelproben für alle Gruppenmitglieder durchführen
- Probe-Tracking über Event-History (`storage/event-history.ndjson`) und `quickProbeFavorites` integriert




## Rechtlicher Hinweis zu DSA5

Dieses Projekt verwendet Begriffe, Mechaniken und Inhalte aus dem Rollenspiel **Das Schwarze Auge 5. Edition (DSA5)**.

**DSA5 ist ein eingetragenes Warenzeichen der Ulisses Medien & Spiel Distribution GmbH.**

Alle Rechte an DSA5, den Regelwerken, Namen, Begriffen und Inhalten liegen bei Ulisses Spiele. Die Veröffentlichung dieses Bots wurde freundlicherweise von der Ulisses Medien & Spiel Distribution GmbH genehmigt. Dieses Projekt steht dennoch in keiner offiziellen Verbindung zu Ulisses Spiele und dient ausschließlich privaten, nicht-kommerziellen Zwecken.