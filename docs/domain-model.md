# Domänenmodell und Datenquellen

Diese Datei beschreibt die fachlichen Datenmodelle von DSA-Bot v2. Im Zentrum stehen Character-Daten, statische Regeldaten, tabellarische Hilfsdaten und die Event-Payloads, die während der Laufzeit zwischen Fachlogik, Persistenz und Verlaufssystem ausgetauscht werden.

## Überblick

Das fachliche Modell des Projekts besteht aus vier Bereichen:

1. Character-Daten unter `chars/`
2. Regeldaten unter `data/`
3. Hilfs- und Auswertungstabellen unter `tables/`
4. fachliche Event-Payloads aus `events/` und `common/`

Diese Bereiche haben unterschiedliche Rollen:

- Character-Daten sind instanzbezogen und veränderlich.
- Regeldaten sind statisch und beschreiben die Spielwelt oder Regeln.
- Tabellen liefern standardisierte Zuordnungen und Auswertungsgrundlagen.
- Event-Payloads beschreiben konkrete Vorgänge während der Bot-Nutzung.

## Character-Modell

Character-Dateien liegen als JSON unter `chars/` und werden zur Laufzeit in `common/character.js` als `Character`-Instanzen verwendet.

Ein Character besteht im Projekt typischerweise aus:

- `name` und optional `displayName`
- Attributen unter `eigenschaften`
- Kampfwerten und Ressourcen
- Talent-, Zauber-, Liturgie- und Sonderfertigkeitslisten
- verfügbaren Waffen und Rüstungen
- Laufzeit-bezogenen Komfortfeldern wie Quick-Probe-Favoriten

### Typische Character-Felder

Ein vollständiger Character hat in der Praxis unter anderem folgende Bereiche:

- `name`: interner Character-Name
- `displayName`: Anzeigename für Embeds und Antworten
- `spieler`: zugehörige Spieler
- `eigenschaften`: Werte für `MU`, `KL`, `IN`, `CH`, `FF`, `GE`, `KO`, `KK`
- `kampftechniken`: Liste aus `{ name, ktw }`
- `talente`: Liste aus `{ name, fertigkeitswert }`
- `zauber`, `liturgien`, `rituale`, `elfenlieder`, `zaubermelodien`: fachgebietsabhängige Fertigkeitslisten
- `sonderfertigkeiten`, `vorteile`, `nachteile`: Merkmalslisten
- `waffen`, `angelegteWaffen`: verfügbare und aktuell genutzte Waffen
- `ruestungen`, `angelegteRuestung`: verfügbare und aktuell genutzte Rüstung
- `lep`, optional `asp`: Ressourcen mit aktuellem und maximalem Wert
- `zk`, `sk`, `gs`: weitere abgeleitete oder feste Werte
- `quickProbeFavorites`: gespeicherte Schnellzugriffe für Probe-, Angriff- oder KSF-Aktionen

### Beispielhafte Character-Struktur

Die Datei `chars/npc.json` zeigt das Grundmuster gut:

- `eigenschaften` enthält die acht Kernattribute
- `kampftechniken` bildet waffenbezogene Werte ab
- `talente` bildet allgemeine Fertigkeiten ab
- weitere Magie- oder Liturgielisten können zusätzlich vorhanden sein

### Laufzeitverhalten des Character-Modells

Die Klasse `Character` in `common/character.js` ergänzt die rohen JSON-Daten um Verhalten.

Wichtige Methoden sind:

- `getBelastungsmalus()`: berechnet die Belastung anhand der angelegten Rüstung und relevanter Sonderfertigkeiten
- `getRuestungsschutz()`: liefert den aktuellen Rüstungsschutz
- `besteLeiteigenschaft(waffe)`: bestimmt für Waffen mit Leit-Eigenschaft die beste relevante Eigenschaft und den daraus entstehenden Bonus

Außerdem normalisiert der Konstruktor `quickProbeFavorites`, damit zur Laufzeit ein konsistentes Favoritenformat vorhanden ist.

## Character-Daten: Pflicht und Praxis

Das Projekt hat inzwischen ein formales JSON-Schema für Character-Dateien unter `schemas/character.schema.json`. Unabhängig davon wird in der Fachlogik weiterhin praktisch vorausgesetzt, dass bestimmte zentrale Felder vorhanden sind, sobald ein Command sie verwendet.

Besonders häufig vorausgesetzt werden:

- `eigenschaften`
- `kampftechniken`
- `talente`
- `sonderfertigkeiten`
- `waffen` und `angelegteWaffen`
- `ruestungen` und `angelegteRuestung`
- `lep`

Je nach Command können weitere Bereiche nötig sein, etwa `asp`, `zauber` oder `liturgien`.

## Formales JSON Schema

Zusätzlich zu dieser textuellen Beschreibung gibt es jetzt ein formales JSON Schema unter `schemas/character.schema.json`.

Zweck des Schemas:

- Validierung von Character-Dateien in Editoren oder CI
- bessere Dokumentation der erwarteten Felder
- sauberere Trennung zwischen Kernfeldern, optionalen Bereichen und Bot-spezifischen Komfortdaten

Der aktuelle Zuschnitt des Schemas ist bewusst pragmatisch:

- zentrale Kernfelder wie `name`, `eigenschaften`, `kampftechniken` und `talente` sind verpflichtend
- häufige optionale Bereiche wie `lep`, `asp`, `zauber`, `liturgien`, `sonderfertigkeiten`, `waffen` und `ruestungen` sind beschrieben
- `quickProbeFavorites` ist als polymorphes Feld modelliert und erlaubt `null`, Probe-Favoriten, Angriffs-Favoriten und KSF-Favoriten
- auf Root-Ebene bleiben zusätzliche Felder vorerst erlaubt, damit bestehende Character-Dateien nicht unnötig brechen

Ein minimales Beispiel für die Verwendung des Schemas liegt unter `docs/character-schema-example.json`.

### Beispiel für die Schema-Einbindung

Ein Character-JSON kann das Schema über das `$schema`-Feld referenzieren:

```json
{
	"$schema": "../schemas/character.schema.json",
	"name": "Belasca",
	"eigenschaften": {
		"MU": 14,
		"KL": 14,
		"IN": 16,
		"CH": 11,
		"FF": 12,
		"GE": 14,
		"KO": 12,
		"KK": 10
	},
	"kampftechniken": [],
	"talente": []
}
```

### Was das Schema bewusst noch nicht erzwingt

Das aktuelle Schema ist nützlich, aber absichtlich nicht maximal streng. Es erzwingt noch nicht:

- vollständige fachliche Konsistenz zwischen Character und Regeldaten
- dass eingetragene Waffen wirklich in `waffenData` existieren
- dass alle Commands für jeden Character sinnvoll ausführbar sind
- dass jedes optionale Fachgebiet wie `zauber`, `liturgien` oder `rituale` vorhanden sein muss

Das ist Absicht: Das Schema soll den gelebten Ist-Zustand des Projekts abbilden und sofort nutzbar sein, ohne die bestehenden Character-Dateien künstlich zu verengen.

## Regeldaten unter `data/`

Das Verzeichnis `data/` enthält statische fachliche Stammdaten. Diese Dateien beschreiben die regeltechnischen Objekte, mit denen Commands und Events arbeiten.

In `data/index.js` werden die JSON-Dateien importiert und als gruppierte Exporte bereitgestellt, zum Beispiel:

- `fertigkeitenData`
- `zauberData`
- `liturgienData`
- `ritualeData`
- `zaubermelodienData`
- `elfenliederData`
- `vorteileData`
- `nachteileData`
- `sonderfertigkeitenData`
- `waffenData`
- `ruestungenData`

Jedes Objekt wird dabei um ein Feld `quelle` ergänzt. Das ist ein leichtes Metadatum, mit dem sich Datenquelle und Anzeige später nachvollziehen lassen.

### Typische Regeldatenobjekte

Die Struktur hängt vom Fachbereich ab:

- Fertigkeiten enthalten typischerweise `name`, `kategorie`, `eigenschaften`, eventuell `beh` und `alias`
- Waffen enthalten unter anderem `name`, `technik`, `tp`, optional `at`, `leit` und `schwelle`
- Rüstungen enthalten Werte wie `name`, `rs` und `be`

Diese Daten werden in der Regel nicht verändert, sondern von Event-Modulen gelesen und mit Character-Daten kombiniert.

## Tabellen unter `tables/`

Das Verzeichnis `tables/` enthält tabellarische Regelwerte, zum Beispiel für Zustände oder Auswertungen. Im Unterschied zu `data/` stehen hier weniger breite Stammdaten und stärker standardisierte Zuordnungen im Vordergrund.

Typische Anwendungsfälle sind:

- Ableitung textlicher Zustände
- Lookup von Qualitätsstufen oder Modifikatoren
- standardisierte Tabellenwerte für Effekte

Konzeptionell gilt:

- `data/` beschreibt regelhafte Objekte wie Waffen oder Fertigkeiten
- `tables/` beschreibt Zuordnungen, Stufen oder numerische Tabellenwerte

## Character, Regeldaten und Tabellen im Zusammenspiel

Ein typischer fachlicher Vorgang kombiniert mehrere Datenquellen gleichzeitig.

Beispiel Probe:

1. das Event-Modul liest den Character des Benutzers
2. es sucht die Fertigkeit in den Datenexporten aus `data/`
3. es kombiniert Fertigkeitseigenschaften, Character-Attribute und Modifikatoren
4. es berechnet daraus Ergebnis, Fertigkeitspunkte und Qualitätsstufe
5. es erzeugt daraus Antwort und Event-Payload

Beispiel Angriff:

1. das Event-Modul wählt eine Character-Waffe oder löst einen Waffennamen fuzzy auf
2. es liest die Waffenregeln aus `waffenData`
3. es kombiniert Kampftechnik, Belastung, Leit-Eigenschaft und Waffendaten
4. es erzeugt Trefferwurf, Schadenswurf und Rückgabedaten

## Event-Payloads als fachliche Verlaufsobjekte

Ein zentrales fachliches Modell des Projekts ist nicht nur der Character, sondern auch das Event-Objekt, das aus einer Aktion entsteht.

Diese Event-Payloads sind wichtig, weil sie:

- das Ergebnis einer Aktion fachlich beschreiben
- in die Event-History geschrieben werden
- später für Features wie Verlauf, Wiederholung oder Schnellzugriffe genutzt werden können

### Gemeinsame Eigenschaften von Event-Payloads

Viele Event-Payloads folgen einem gemeinsamen Grundmuster:

- `type`: meist `event`
- `name`: fachlicher Event-Name wie `probe` oder `angriff`
- weitere Felder mit fachlichen Eingaben, Zwischenergebnissen und Resultaten

Die Payloads sind absichtlich reichhaltiger als reine UI-Daten. Sie tragen nicht nur das Endergebnis, sondern auch Informationen, die für Verlauf, Nachvollziehbarkeit und Folgeaktionen relevant sind.

## Beispiel: Probe-Event

`events/probe.js` erzeugt ein Event mit unter anderem folgenden Feldern:

- `type: 'event'`
- `name: 'probe'`
- `data`: Liste der Einzelwürfe und Zielwerte pro Eigenschaft
- `fertigkeit`: die verwendete Fertigkeit
- `fw`: verbleibende Fertigkeitspunkte
- `bonusMalus`
- `talent`: das konkrete Character-Talent
- `belastung`
- `bestanden`
- `kritischBestanden`
- `kritischFehlschlag`
- `cheated`

Das Modell ist damit nicht nur ein Antwortobjekt für Discord, sondern eine vollständige fachliche Beschreibung des Probenvorgangs.

### Bedeutung der Felder im Probe-Event

- `fertigkeit` beschreibt das regelhafte Zielobjekt
- `talent` beschreibt den Character-spezifischen Wert derselben Fertigkeit
- `data` enthält die konkrete Würfelauswertung auf Attributebene
- `fw` und die booleschen Ergebnisfelder bilden das fachliche Resultat ab
- `bonusMalus`, `belastung` und `cheated` beschreiben Rahmenbedingungen der Berechnung

## Beispiel: Angriff-Event

`events/angriff.js` nutzt Hilfslogik aus `common/combat.js` und erzeugt ein Event mit unter anderem folgenden Feldern:

- `type: 'event'`
- `name: 'angriff'`
- `waffe`
- `kampffertigkeit`
- `schaden`
- `parsedRoll`
- `atRoll`
- `atBestaetigt`
- `bonusMalusAngriff`
- `bonusMalusSchaden`
- `belastung`
- `le`
- `cheated`

Hier wird gut sichtbar, dass Event-Payloads auch technische Hilfswerte enthalten dürfen, wenn diese fachlich relevant oder für Nachvollziehbarkeit nützlich sind.

## Komfort- und Verlaufsdaten im Character

Nicht alle Character-Felder sind reine Kernregeldaten. Einige Felder dienen der Bedienbarkeit oder dem Verlauf.

Ein wichtiges Beispiel ist `quickProbeFavorites`.

Dieses Feld kann Einträge für verschiedene Aktionstypen enthalten:

- Probe-Favoriten mit `category`, `name`, optional `label` und `bonusMalus`
- KSF-Favoriten mit `type: 'ksf'`, `subcommand`, optional `stufe` oder `basismanoever`
- Angriffsfavoriten mit `type: 'angriff'`, `waffenName`, optional `label` und `bonusMalus`

Damit zeigt sich, dass Character-Dateien nicht nur reine Rollenspielwerte enthalten, sondern auch bot-spezifische Bedieninformationen.

## Modellierungsregeln für neue Features

Wenn neue fachliche Features ergänzt werden, sollten die Datenmodelle nach diesen Prinzipien erweitert werden:

- Character-Dateien nur um Daten erweitern, die wirklich charactergebunden sind
- statische Regelobjekte in `data/` statt in Character-Dateien modellieren
- tabellarische Zuordnungen in `tables/` statt in Event-Modulen hart zu kodieren
- Event-Payloads so gestalten, dass sie serialisierbar und fachlich aussagekräftig sind
- UI-spezifische Antwortdaten nicht mit dem eigentlichen Fachmodell verwechseln

Praktische Faustregel:

- gehört der Wert dauerhaft zu einer Figur, dann eher `chars/`
- gehört der Wert zu einem Regelobjekt, dann eher `data/`
- gehört der Wert zu einer Lookup-Tabelle, dann eher `tables/`
- gehört der Wert zu einem einzelnen Vorgang, dann eher in die Event-Payload

## Bekannte Modellgrenzen

Das aktuelle Projektmodell ist pragmatisch gewachsen. Daraus ergeben sich einige Grenzen:

- Es gibt kein formales Schema für Character-Dateien.
- Es gibt keinen zentralen Typvertrag für alle Event-Payloads.
- Einige Character-Felder sind bot-spezifische Komfortdaten und keine reinen DSA-Regeldaten.
- Die Trennung zwischen allgemeinen Regeldaten und tabellarischen Hilfsdaten ist konzeptionell klar, aber nicht durch ein formales Typmodell abgesichert.

Diese Datei beschreibt deshalb den gelebten Ist-Zustand des Repositories und nicht ein bereits vollständig normiertes Datenmodell.

## Orientierung für Folgekapitel

- Für die statische Systemeinordnung siehe `architecture.md`.
- Für den konkreten Ablauf von Commands und Buttons siehe `command-lifecycle.md`.
- Für Persistenz, History und Serialisierung siehe `persistence-and-history.md`.