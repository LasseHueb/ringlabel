# RingLabel – Profilbild-Rahmen mit eigenem Text

Zwei komplett kostenlose Werkzeuge im Browser: der **Profilbild-Rahmen-Editor** (Startseite) für runde Rahmen mit eigenem Text, Logo, Farben und Schriften und der **Profil-Banner-Editor** (`/banner/`) für breite Banner. Ohne Anmeldung, ohne Backend, ohne Hinweis im Bild.

**Grundprinzip:** Fotos, Logos und Hintergrundbilder werden ausschließlich im Browser verarbeitet und **nie** hochgeladen. Keine Cookies, keine Statistik, keine Anfragen an fremde Server.

Live: <https://lassehueb.github.io/ringlabel/>

## Funktionen

| Bereich | Was es gibt |
|---|---|
| **Editor** | Foto laden (JPG, PNG, WebP, HEIC), Zuschnitt per Ziehen/Zoomen, gebogener Text, alle Schriften, Farben und Farbverläufe, Symbole und Emojis im Ring, Ringbreite/-länge/-drehung, Live-Vorschau |
| **Mehrere Fotos** | Abschnitt `#mehrere-fotos` (einklappbar): aktuelles Design auf bis zu 30 Fotos anwenden, eigener Text pro Foto, Ausschnitt einzeln anpassen, alle als ZIP (1080 oder 2048 px) – nur im Browser |
| **Profil-Banner** | Eigene Seite `/banner/` (`/en/banner/`): breites Banner (4:1, 3:1, 16:9) mit eigener Hintergrundfarbe (auch Verlauf, Weiß, Hellgrau, transparent), eigenem Logo, drei Textzeilen, Muster oder Hintergrundbild, 12 Banner-Vorlagen, eigenen Banner-Vorlagen und Banner-Links; Farben aus einer Rahmen-Vorlage übernehmbar; markierter Bereich für das Profilbild; PNG in voller Größe |
| **Formen** | „Bogen“ (Standard), „Voller Ring“ (geschlossen rund um das Foto) und „Badge“ (abgerundetes Schild unten, Text gerade); bei Bogen und vollem Ring optional ein zweiter „Text oben“ |
| **Anlässe** | 8 Vorlagen für Feiertage und besondere Momente (Weihnachten, Jahreswechsel, Ostern, Ausbildungsbeginn, Ausbildung geschafft, Messe & Events, Neues Jahr im Job, Sommerpause); im passenden Zeitfenster oben unter „Gerade passend“ |
| **Vorlagen** | 34 mitgelieferte Vorlagen, dazu Ideen für Jobsuche, Recruiting, Selbstständige und Firmen mit „Vorlage übernehmen“ |
| **Logo** | PNG, JPG, WebP oder SVG, auf höchstens 512 px verkleinert; links vom Text, rechts vom Text oder statt Text; Größe einstellbar |
| **Design als Link** | „Link zu diesem Design kopieren“ (Rahmen, `/#d=…`) bzw. „Link zu diesem Banner kopieren“ (`/banner/#b=…`) und bei jeder eigenen Vorlage; wer den Link öffnet, hat sofort dasselbe Design im Editor (ohne Foto, Logo und Hintergrundbild) |
| **Eigene Vorlagen** | Je Werkzeug „Als eigene Vorlage speichern“ (alle Einstellungen und Logo, nie Foto oder Hintergrundbild) im lokalen Speicher des Browsers; umbenennen, löschen, als JSON-Datei exportieren und importieren (streng geprüft, höchstens 1 MB, mit Typ „frame“ bzw. „banner“) |
| **Export** | PNG in 1080 × 1080 oder 2048 × 2048 px, Hintergrund transparent oder weiß, auf dem Handy direkt teilen |
| **Teilen** | „Link kopieren“ und die Teilen-Funktion des Geräts – geteilt wird nur die Startseite |
| **Sprachen** | Deutsch unter `/` und `/banner/`, Englisch unter `/en/` und `/en/banner/`; Umschalter „DE \| EN“ im Header führt auf dieselbe Seite in der anderen Sprache, keine automatische Weiterleitung |
| **Recht** | Impressum und Datenschutzerklärung (Angaben in `config/site.json` → `legal`, nur auf Deutsch), Unabhängigkeitshinweis im Footer |

Frühere Adressen (`/rahmen/…`, `/vorlage/…`, `/premium/`, `/unternehmen/`, `/admin/`, `/team/`) leiten über die `404.html` auf die Startseite weiter; `/rahmen/<name>/` und `/vorlage/<name>/` öffnen dabei die gleichnamige Vorlage. Unbekannte Pfade unter `/en/` landen auf `/en/`, unbekannte Pfade unter `/banner/` bzw. `/en/banner/` auf der Banner-Seite der Sprache. Die frühere Sprungmarke `/#banner` (`/en/#banner`) leitet per Skript auf `/banner/` (`/en/banner/`) weiter.

## Seitenaufbau und gemeinsame Dateien

| Seite | Adresse | Inhalt |
|---|---|---|
| Rahmen-Editor | `/`, `/en/` | Editor, Vorlagen, eigene Rahmen-Vorlagen, Mehrere Fotos, Ideen, FAQ, Hinweis „Passend dazu: Profil-Banner erstellen“ |
| Banner-Editor | `/banner/`, `/en/banner/` | Banner-Editor, Banner-Vorlagen, eigene Banner-Vorlagen, FAQ (nur Banner), Hinweis „Passend dazu: Profilbild-Rahmen erstellen“ |

Gemeinsam sind Kopfzeile (Logo, Navigation „Profilbild-Rahmen“ / „Profil-Banner“ mit Markierung der aktiven Seite, Sprachwechsel auf dieselbe Seite, Design-Umschalter; auf schmalen Handys eine Zeile mit Kurzbezeichnungen) und Footer (`src/layout.mjs`). Jede Seite lädt nur, was sie braucht (`TOOL_ASSETS` in `src/layout.mjs`, geprüft von `npm run check`):

| Datei | Rahmen | Banner | Inhalt |
|---|---|---|---|
| `css/styles.css`, `css/fonts.css` | ✓ | ✓ | Grundlayout, Kopfzeile, Formulare, Dialoge, „Meine Vorlagen“, Schriften |
| `css/frame.css` / `css/banner.css` | ✓ | – / ✓ | Stile des jeweiligen Editors |
| `js/i18n.js` | ✓ | ✓ | Übersetzungs-Funktionen und gemeinsame Texte (Vorlagen, Links, Logo, Navigation) |
| `js/i18n-frame.js` / `js/i18n-banner.js` | ✓ / – | – / ✓ | Texte des jeweiligen Editors |
| `js/common.js` | ✓ | ✓ | Farben und Kontrast, Hex-Codes, Base64url, Dialoge, Download, Logo laden (`PBG.util`, `PBG.color`) |
| `js/links.js` | ✓ | ✓ | Design-Links lesen und erzeugen, Link-Dialog, Hinweis-Leiste (`PBG.Links`) |
| `js/own.js` | ✓ | ✓ | „Meine Vorlagen“ mit Umbenennen, Export/Import, Typ-Prüfung (`PBG.OwnList`) |
| `js/presets.js`, `js/icons.js`, `js/platform.js` | ✓ | ✓ | Schriften, Rahmen-Vorlagen (auf der Banner-Seite für „Farben aus einer Rahmen-Vorlage“), Symbole, Speicher, Farbschema |
| `js/renderer.js`, `js/app.js`, `js/batch.js`, `js/zip.js` | ✓ | – | Rahmen-Renderer und -Editor, Mehrere Fotos |
| `js/banner-model.js`, `js/banner.js` | – | ✓ | Banner-Formate, Standardwerte, Prüfung, Vorlagen, Umrechnung alter Daten; Banner-Editor |

Der Rahmen-Editor enthält keinen Banner-Code, der Banner-Editor keinen Code des Rahmen-Editors.

## Übernahme älterer Daten

Bis zur Trennung lag das Banner auf der Startseite und konnte Farben, Schrift, Textfarbe, Logo und Überschrift „wie der Rahmen“ übernehmen. Nichts davon geht verloren:

- **Eigene Vorlagen:** Kombinierte Vorlagen (`rl-own-templates` mit `banner`/`bannerLogo`) bleiben unverändert; der Rahmen-Teil steht weiter unter „Meine Vorlagen“ der Startseite. Beim ersten Öffnen der Banner-Seite wird der Banner-Teil jeder solchen Vorlage einmalig als eigene Banner-Vorlage mit gleichem Namen übernommen (`rl-own-banners`). Der Merker `rl-banners-migrated` verhindert eine zweite Übernahme; gleiche Name-und-Datum-Paare werden nie doppelt angelegt. Gelöscht wird nichts.
- **Umrechnung:** `PBG.bannerFromLegacy` (`public/js/banner-model.js`) setzt die damaligen Rahmen-Werte fest ein: „Wie der Rahmen“ → „Eigene Farbe“ mit den Ringfarben (Verlauf diagonal, wie früher), „Wie im Rahmen“ bei Logo → „Eigenes Logo“ mit dem Rahmen-Logo, leere Schrift und Schriftstärke → die des Rahmens, leere Überschrift → Text des Rahmens, automatische Textfarbe → die damals berechnete Farbe (`PBG.legacyTextColor`). Das Banner sieht danach pixelgleich aus.
- **Dateien:** Alte Export-Dateien ohne `type` enthalten Rahmen und Banner. Die Rahmen-Seite importiert den Rahmen-Teil, die Banner-Seite den Banner-Teil – jeweils mit Hinweis und Link, dass der andere Teil auf der anderen Seite importiert werden kann. Neue Dateien tragen `"type": "frame"` bzw. `"type": "banner"`; eine Datei des falschen Typs wird mit Hinweis und Link zur richtigen Seite abgelehnt.
- **Links:** Alte Links `/#d=…` mit `banner` öffnen auf der Startseite den Rahmen und zeigen „Dieser Link enthält auch ein Banner“ mit dem Button „Banner öffnen“, der `/banner/#d=…` mit genau diesem Link öffnet; die Banner-Seite rechnet das Banner dann um. Ein reiner Rahmen-Link auf der Banner-Seite verweist auf die Rahmen-Seite.

## Mehrere Fotos

Unter dem Rahmen-Editor (Sprungmarke `#mehrere-fotos`, öffnet den eingeklappten Bereich) lässt sich das aktuelle Rahmen-Design auf bis zu 30 Fotos gleichzeitig anwenden. Code: `public/js/batch.js`, ZIP-Schreiber: `public/js/zip.js`, Markup: `src/partials/batch.html` (die Leiste „Ausschnitt anpassen“ steht in `src/partials/editor.html`).

- **Fotos:** JPG, PNG, WebP oder HEIC wie beim Einzelfoto (gleicher Lade-Code über `PBG.editor.decodeFile`), auswählen oder hineinziehen; mehr als 30 und Nicht-Bilder werden mit Hinweis abgelehnt.
- **Design:** Form, Text, Text oben, Logo, Farben und Hintergrund kommen aus dem Editor; ändert sich etwas, werden alle Vorschauen gedrosselt neu gezeichnet (nur bei echter Design-Änderung, wenige pro Frame).
- **Eigener Text pro Foto** (höchstens 60 Zeichen, z. B. ein Name); leer = Haupttext (steht als Platzhalter im Feld). Bei Logo „Statt Text“ ist das Feld ausgeblendet.
- **Ausschnitt:** automatisch zentriert. „Ausschnitt anpassen“ lädt das Foto in den normalen Editor (mit seinem eigenen Text in der Vorschau); „Übernehmen“ speichert den neuen Ausschnitt, „Abbrechen“ lässt ihn unverändert. Das vorher geladene Einzelfoto samt Ausschnitt kommt in beiden Fällen zurück.
- **ZIP:** „Alle als ZIP herunterladen“ rendert nacheinander in 1080 oder 2048 px (Hintergrund wie unter „6. Export“), mit Fortschritt („3 von 10“, für Screenreader angesagt) und Abbrechen. Datei `ringlabel-rahmen.zip` (Englisch `ringlabel-frames.zip`); Bilder `<Originalname>-rahmen.png` (`-frame.png`), Namen in Unicode-NFC, unzulässige Zeichen (`\ / : * ? " < > |`, Steuerzeichen) durch `-` ersetzt, Dubletten ohne Rücksicht auf Groß-/Kleinschreibung durchnummeriert (`team-rahmen.png`, `team-rahmen-2.png`).
- **ZIP-Format:** selbst geschrieben, Methode „stored“ (unkomprimiert, PNGs sind schon komprimiert), CRC32, Dateinamen UTF-8 mit Flag-Bit 11; kein ZIP64 (bis 4 GB / 65 535 Dateien).
- **Speicher:** Fotos werden beim Laden einzeln dekodiert, auf höchstens 2048 px verkleinert und komprimiert als Blob gehalten (JPEG, PNG-Dateien als PNG), dazu nur eine 320-px-Vorschauquelle; Canvas werden nach dem Rendern auf Größe 0 gesetzt. Gemessen (Chromium, 30 Fotos à 4000 × 3000 px): gehaltene Fotodaten 16 MB; der Seitenprozess belegt nach Speicherbereinigung rund 60 MB mehr als ohne Fotos.
- **Datenschutz:** Die Fotos werden nie gespeichert – nicht im lokalen Speicher, nicht in eigenen Vorlagen, nicht in Design-Links – und beim Schließen oder Neuladen der Seite verworfen.

## Profil-Banner

Eigene Seite `/banner/` (`/en/banner/`), unabhängig vom Rahmen-Editor. Code: `public/js/banner.js`, Markup: `src/partials/banner.html`, Formate, Standardwerte, Prüfung, Banner-Vorlagen und Umrechnung alter Daten: `public/js/banner-model.js`, Seitentexte und FAQ: `bannerPage` in `src/content.mjs`.

| Format | Größe |
|---|---|
| Breit 4:1 | 1584 × 396 px |
| Breit 3:1 | 1500 × 500 px |
| 16:9 | 1920 × 1080 px |

- **Eigene Standardwerte** (`PBG.BANNER_DEFAULTS`): eigene Farbe `#1a5ccc` (zweite Farbe `#5a9bff`, ohne Verlauf), Schrift Montserrat, Überschrift fett, Textfarbe automatisch, eigenes Logo (falls geladen). Das Banner übernimmt nichts automatisch vom Rahmen. Beim Öffnen ohne Link erscheint die Vorlage „Klar & hell“.
- **Texte:** Überschrift (höchstens 60 Zeichen, eine Zeile), Unterzeile (100 Zeichen, bis zu zwei Zeilen), Zusatzzeile (80 Zeichen, z. B. Website, Kontakt oder Ort) mit optionalem Symbol aus der Symbol-Auswahl (u. a. Weltkugel, Brief, Ortsmarke). Je Zeile ein Regler für die Schriftgröße (50–150 %). Zu lange Texte werden verkleinert bzw. gekürzt, mit Hinweis. Schrift, Schriftstärke der Überschrift (fett/normal) und Textfarbe frei wählbar.
- **Hintergrundfarbe:** „Eigene Farbe“ (optional Verlauf mit zweiter Farbe, waagerecht, senkrecht oder diagonal), „Weiß“, „Hellgrau“ oder „Transparent“ (PNG mit Alphakanal, in der Vorschau als Schachbrett; Hinweis, dass viele Plattformen transparente Flächen füllen). Darüber optional ein dezentes Muster (Punkte, Linien, Wellen – die Musterfarbe passt sich dem Hintergrund an) oder ein eigenes Bild (nur im Browser, Zoom und Verschieben, Farbschleier in der gewählten Hintergrundfarbe).
- **Lesbare Textfarbe:** Ohne eigene Textfarbe nimmt das Banner Weiß oder fast Schwarz (`#111827`) – was sich auf allen Hintergrundfarben besser abhebt. Bei „Transparent“ fast Schwarz mit Hinweis; bei einer eigenen Textfarbe mit wenig Kontrast (unter 3:1) erscheint ebenfalls ein Hinweis.
- **Farben aus einer Rahmen-Vorlage übernehmen:** Dialog mit den eingebauten Rahmen-Vorlagen und den eigenen Rahmen-Vorlagen dieses Geräts (nur gelesen, `PBG.frameStyleOf`). Übernommen werden nur Ringfarbe(n) als Hintergrund, Verlauf, Schrift und Textfarbe – Texte, Muster und Logo bleiben.
- **Logo im Banner:** „Eigenes Logo“ (PNG, JPG, WebP, SVG; im Browser auf höchstens 1024 px verkleinert) oder „Kein Logo“. Position: automatisch (neben dem Text bzw. darüber), links oder rechts vom Text, über dem Text oder in einer Ecke (oben links, oben rechts, unten rechts – unten links liegt das Profilbild). Regler für die Logogröße.
- **Bereich, den das Profilbild verdecken kann:** links unten, je Format in `PBG.BANNER_FORMATS[…].safe`. In der Vorschau schraffiert, nie im Download. Text und Logo weichen ihm aus (bei „links“ und „rechts“ immer, bei „mittig“, sobald eine Logo-Position gewählt ist; das Logo oben links bleibt oberhalb des Bereichs).
- **Banner-Vorlagen:** 12 Vorlagen in den Gruppen Jobsuche, Recruiting, Freelancer & Selbstständige, Firma & Team und Anlässe (`PBG.BANNER_PRESETS`). Eine Vorlage übernimmt Text, Farben, Muster und Logo-Position; Format, Schrift, Schriftstärke und Logo-Art bleiben, die Textfarbe wird automatisch. Anlass-Banner (Weihnachten, Jahreswechsel, Ausbildungsbeginn, Messe) nutzen über `occasionOf` die Zeitfenster der Anlass-Rahmen und erscheinen dann unter „Gerade passend“.
- **Neue Banner-Vorlage:** Eintrag in `PBG.BANNER_PRESETS` mit `key`, `group`, `name`, `title`, `subtitle`, optional `extra` (je `{ de, en }`, `{year}` möglich), `values` (Schlüssel aus `PBG.BANNER_DEFAULTS`) und optional `occasionOf`. `npm run check` prüft Werte, Texte auf Netzwerk-Begriffe und Anlass-Verweise; `npm run images` aktualisiert die Übersicht `public/img/beispiele/banner-vorlagen.png`.
- **Eigene Banner-Vorlagen:** `rl-own-banners`, je Vorlage `{ id, name, banner, logo, created }` mit allen Einstellungen (`PBG.BANNER_DEFAULTS`) und gegebenenfalls dem Logo als PNG (höchstens 512 px). Datei-Export: `{ "format": "ringlabel-vorlage", "type": "banner", "version": 2, "name", "banner", "logo" }`. Ein Hintergrundbild wird nie gespeichert. Beim Import werden ungültige Werte verworfen und gemeldet.
- **Banner-Link:** `/banner/#b=` + Base64url von kompaktem JSON `{"v":1, …}` mit nur den vom Standard abweichenden Einstellungen (`PBG.bannerDiff`), nie Logo oder Bild. `v` ist die Formatversion der Banner-Links (`LINK_VERSION` in `banner.js`, unabhängig von `#d=`); höchstens 3000 Zeichen. Geprüft wird wie beim Import (`PBG.validBannerValue`); Ungültiges wird verworfen und gemeldet, das Fragment danach entfernt.

![Banner-Vorlagen](public/img/beispiele/banner-vorlagen.png)

## Anlässe und „Gerade passend“

![Anlässe](public/img/beispiele/anlaesse.png)

Vorlagen mit einem Zeitfenster (`occasion` in `public/js/presets.js`) stehen im Editor in der Gruppe „Anlässe“. Liegt das heutige Datum des Geräts im Zeitfenster, erscheinen sie stattdessen oben im Vorlagen-Bereich unter „Gerade passend“. Das passiert nur im Browser; es wird nichts übertragen.

| Anlass | Schlüssel | Zeitfenster |
|---|---|---|
| Weihnachten | `weihnachten` | 1.12.–26.12. |
| Jahreswechsel | `jahreswechsel` | 27.12.–10.1. |
| Ostern | `ostern` | 14 Tage vor Ostersonntag bis Ostermontag (jedes Jahr neu berechnet) |
| Ausbildungsbeginn | `azubi-start` | 1.8.–30.9. |
| Ausbildung geschafft | `ausbildung-geschafft` | 15.1.–28.2. und 1.6.–31.7. (Prüfungszeiten) |
| Messe & Events | `messe` | 15.2.–30.4. und 1.9.–15.11. (Messesaison) |
| Neues Jahr im Job | `neues-jahr-ziele` | 2.1.–31.1. |
| Sommerpause | `sommerpause` | 1.7.–31.8. |

**Neuen Anlass hinzufügen:**

1. In `public/js/presets.js` im Abschnitt „Anlässe“ einen Eintrag ergänzen:
   ```js
   { key: "schulstart", name: { de: "Schulstart", en: "Back to school" }, text: { de: "Schulstart {year}", en: "Back to school {year}" },
     occasion: ["08-15/09-15"],
     values: { shape: "badge", ringColor: "#2e7d32", textColor: "#ffffff", font: "Poppins", uppercase: false, icon: "star", iconPos: "start" } },
   ```
   - `occasion`: ein oder mehrere Zeitfenster `"MM-TT/MM-TT"` (jeweils einschließlich; `"12-27/01-10"` läuft über den Jahreswechsel) oder relativ zu Ostern, z. B. `"easter-14/easter+1"`.
   - `{year}` im Text wird durch das aktuelle Jahr ersetzt; `textTop` (Text oben) ist optional.
   - Texte kurz halten: Sie sollen auf den Ring bzw. das Badge passen, ohne verkleinert zu werden.
2. Bei Bedarf ein Symbol in `public/js/icons.js` ergänzen (24 × 24-Pfad, selbst gezeichnet, `stroke: true` für Linien).
3. `npm run build && npm run check` – die Prüfung meldet ungültige Zeitfenster und eine Gestaltung, die an Netzwerk-Rahmen erinnert (grüner oder lila Bogen unten/links mit heller Hashtag-Schrift in Großbuchstaben).
4. `npm run images` aktualisiert die Übersicht `public/img/beispiele/anlaesse.png`.

**Testen mit anderem Datum:** Nur auf `localhost` bzw. `127.0.0.1` lässt sich ein Datum simulieren, z. B. `http://localhost:8080/?datum=2026-12-24`. Auf der veröffentlichten Seite wird der Parameter ignoriert und immer das Datum des Geräts verwendet.

## Formen und Text oben

| Bogen mit Text oben | Voller Ring | Badge |
|---|---|---|
| ![Bogen mit Text oben](public/img/beispiele/neue-wege.png) | ![Voller Ring](public/img/beispiele/austausch.png) | ![Badge](public/img/beispiele/badge-neugierig.png) |

- **Bogen** (`shape: "arc"`, Standard): wie bisher. Ein Text oben bekommt einen eigenen kurzen Bogen in Ringfarbe (bei Verlauf mit gespiegelten Farben) mit denselben weichen Enden (höchstens 30°).
- **Voller Ring** (`shape: "ring"`): geschlossener Ring ohne weiche Enden; Ringlänge und weicher Übergang sind ausgeblendet. Ein Verlauf läuft von unten (Ringfarbe) nach oben (zweite Farbe). Die Drehung dreht Texte und Verlauf.
- **Badge** (`shape: "badge"`): abgerundetes Schild unten mittig über dem Foto, Text gerade, Farbe und Deckkraft wie der Ring. Die Ringbreite heißt hier „Höhe des Badges“; Text oben, Position auf dem Bogen, Ringlänge, Drehung und weicher Übergang sind ausgeblendet. Das Logo sitzt links oder rechts im Schild oder allein darin.
- **Text oben** (`textTop`, höchstens 40 Zeichen, `sizeTop` = eigene Schriftgröße in % der Ringbreite, Standard 60): läuft oben gebogen und ist von außen lesbar. Schrift, Farbe, Großbuchstaben und Buchstabenabstand wie beim Haupttext; Symbole, Emojis und Logo gehören zum Haupttext. Höchstens 150° lang; längere Texte werden wie der Haupttext verkleinert, mit Hinweis.
- **Kompatibilität:** `shape`, `textTop` und `sizeTop` stehen in `PBG.DESIGN_KEYS` und werden in eigenen Vorlagen, im Datei-Export/-Import und im Design-Link gespeichert und beim Import streng geprüft. Ihre Standardwerte (`"arc"`, `""`, `60`) ergeben das bisherige Aussehen – ältere Vorlagen, Dateien und Links sehen unverändert aus (geprüft: 144 Designs pixelgleich mit dem vorigen Stand). Das Link-Format bleibt deshalb Version 1.
- **Beispielbilder:** `npm run images` erzeugt neben OG-Bildern und Icons auch `public/img/beispiele/*.png` (für dieses README).

## Design als Link

Ein Rahmen-Design lässt sich als Link weitergeben, z. B. `https://ringlabel.de/#d=eyJ2IjoxLCJ0ZXh0Ijoi…` (auf `/en/` entsprechend `/en/#d=…`). Banner haben ein eigenes Link-Format (`/banner/#b=…`, siehe [Profil-Banner](#profil-banner)).

- **Format:** `#d=` + Base64url (ohne `=`) von kompaktem JSON `{"v":1,"text":…,"font":…, …}` mit allen Schlüsseln aus `PBG.DESIGN_KEYS`. Foto und Logo sind nie enthalten; ist ein Logo gesetzt, weist der Dialog darauf hin. Ältere Links können zusätzlich `banner` enthalten – siehe [Übernahme älterer Daten](#übernahme-älterer-daten).
- **Version:** `v` ist die Formatversion (`LINK_VERSION` in `public/js/app.js`). Ändert sich das Format, bekommt es eine neue Nummer und `parseDesignLink` liest ältere Versionen weiter. Links mit unbekannter Version werden mit einer Meldung abgelehnt.
- **Prüfung beim Öffnen:** dieselbe wie beim Datei-Import (`validValue`): nur bekannte Schlüssel, Zahlen im Bereich der Regler, Farben nur als `#rrggbb`, Text höchstens 60 Zeichen, nur vorhandene Schriften und Symbole. Ungültiges wird verworfen und in einer Meldung genannt; ist gar nichts gültig, zu lang (über 4000 Zeichen nach `d=`) oder kaputt, erscheint die Standardvorlage mit einem Hinweis. Die Grenze liegt bei 4000, weil ein älterer gültiger Link mit vollen Textfeldern aus 3-Byte-Zeichen (Rahmen + Banner) rund 3200 Zeichen erreichen kann.
- **Datenschutz:** Der Teil nach `#` wird vom Browser nicht an den Server geschickt. Nach dem Laden entfernt `history.replaceState` das Fragment aus der Adresse, damit es nicht versehentlich weitergeteilt wird. Ein Link, der in einen schon offenen Tab eingefügt wird (nur das Fragment ändert sich), wird ebenfalls geladen.
- **Vorrang:** `#d=…` gilt vor `?vorlage=…`; ohne Fragment funktioniert `?vorlage=<name>` wie bisher.

## Sprachversionen

| Sprache | Adresse | `lang` | OG-Bild |
|---|---|---|---|
| Deutsch (Standard, `x-default`) | `/`, `/banner/` | `de` | `img/og/home.jpg`, `img/og/banner.jpg` |
| Englisch | `/en/`, `/en/banner/` | `en` | `img/og/home-en.jpg`, `img/og/banner-en.jpg` |

Die beiden Fassungen jeder Werkzeug-Seite verweisen per `hreflang` aufeinander (plus `x-default` → Deutsch), haben je einen eigenen Canonical und stehen mit ihren Alternativen in der Sitemap. Impressum und Datenschutzerklärung gibt es nur auf Deutsch; der englische Footer verlinkt sie als „Legal notice (in German)“ und „Privacy policy (in German)“.

**Wo die Texte stehen:**

- `src/content.mjs` → `locales.de` / `locales.en`: Title, Description, H1, Einleitung, Text-Ideen, FAQ, strukturierte Daten (`app`), Texte im OG-Bild (`ogImage`), dieselben Angaben für die Banner-Seite (`bannerPage`) sowie Header, Navigation, Footer, Hinweise und Unabhängigkeitshinweis (`ui`)
- `public/js/i18n.js` (gemeinsam), `i18n-frame.js` (Rahmen-Editor), `i18n-banner.js` (Banner-Editor) → `PBG.I18N.de` / `PBG.I18N.en`: alle Editor-Texte. Der Build übersetzt das Markup (`src/partials/*.html`) damit schon vorab und bricht ab, wenn auf `/en/` ein Schlüssel fehlt; `npm run check` prüft, dass Deutsch und Englisch dieselben Schlüssel haben. Im Browser richtet sich die Sprache nach `<html lang>`.
- `public/js/presets.js` und `public/js/icons.js`: Vorlagen-Namen und -Texte, Schrift- und Symbolnamen als `{ de, en }`. Englische Vorlagen-Texte kurz halten – sie dürfen auf dem Ring nicht verkleinert werden müssen.

**Weitere Sprache hinzufügen:** In `src/content.mjs` einen Eintrag in `locales` mit denselben Schlüsseln wie `de` ergänzen (`path: "/<code>/"`, `og: "/img/og/home-<code>.jpg"`, `bannerPage.path: "/<code>/banner/"`), Wörterbücher `PBG.I18N.<code>` in `i18n.js`, `i18n-frame.js` und `i18n-banner.js` und die Fassungen in `presets.js`/`icons.js` ergänzen, dann `node scripts/render-images.mjs <code>` ausführen. Umschalter, `hreflang`, Sitemap und 404-Weiterleitung übernehmen die neue Sprache automatisch.

## Projektstruktur

```
config/site.json          Name, Adresse, Angaben für Impressum/Datenschutz
public/                   Statische Dateien, werden 1:1 ausgeliefert
  js/common.js            Gemeinsame Hilfsfunktionen (Farben, Base64url, Dialoge, Download, Logo laden)
  js/links.js             Design-Links, Link-Dialog, Hinweis-Leiste (beide Werkzeuge)
  js/own.js               „Meine Vorlagen“ (beide Werkzeuge, je eigener Speicher-Schlüssel)
  js/renderer.js          Canvas-Rendering des Rahmens (Foto, Ring, gebogener Text, Symbole, Logo)
  js/app.js               Rahmen-Editor: Bedienung, Logo, eigene Vorlagen, Links, Teilen-Dialog
  js/batch.js             Mehrere Fotos (Liste, Vorschauen, Ausschnitt, ZIP-Export)
  js/zip.js               ZIP-Schreiber („stored“, CRC32, UTF-8-Dateinamen)
  js/banner-model.js      Banner: Formate, Standardwerte, Prüfung, Vorlagen, Umrechnung alter Daten
  js/banner.js            Banner-Editor (Renderer, Bedienung, eigene Vorlagen, Links, Download)
  js/platform.js          Konfiguration, lokaler Speicher, Farbschema
  js/presets.js           Schriften, Standardwerte, Rahmen-Vorlagen
  js/icons.js             Symbole und Emojis
  js/i18n.js              Übersetzungs-Funktionen und gemeinsame Texte (Deutsch + Englisch)
  js/i18n-frame.js        Texte des Rahmen-Editors
  js/i18n-banner.js       Texte des Banner-Editors
  css/styles.css          Gemeinsame Stile; css/frame.css und css/banner.css je Editor
  img/ fonts/ vendor/     OG-Bilder und Icons, lokale Schriften (OFL), heic2any
src/
  content.mjs             Texte der Seiten je Sprache (Title, Einleitung, Ideen, FAQ, Banner-Seite, Header/Footer)
  layout.mjs              Seitenlayout, Kopfzeile mit Navigation, Meta-Tags, strukturierte Daten, Skripte je Seite
  partials/editor.html    Markup des Rahmen-Editors
  partials/batch.html     Markup von „Mehrere Fotos“
  partials/banner.html    Markup des Banner-Editors
  partials/linkui.html    Link-Dialog und Hinweis-Leiste (beide Werkzeuge)
  pages/core.mjs          Rahmen-Editor (/ und /en/)
  pages/banner.mjs        Banner-Editor (/banner/ und /en/banner/)
  pages/legal.mjs         Impressum und Datenschutzerklärung
scripts/
  build.mjs               Statischer Build nach dist/ (ohne Abhängigkeiten)
  check-dist.mjs          Prüfung des Builds (siehe unten)
  serve.mjs               Lokaler Webserver
  render-images.mjs       Erzeugt OG-Bilder und Icons mit dem echten Renderer
```

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20. Weitere Pakete werden nicht benötigt.

```bash
npm run dev          # baut nach dist/ und startet http://localhost:8080
npm run build        # nur bauen
npm run check        # dist/ prüfen
```

OG-Bilder und Icons neu erzeugen (Playwright nur vorübergehend, keine Projekt-Abhängigkeit):

```bash
npm i --no-save playwright && npx playwright install chromium
npm run images                        # alle Sprachen und Icons
node scripts/render-images.mjs en     # nur das englische OG-Bild (dist/ muss gebaut sein)
```

## Prüfung

`npm run check` (läuft auch im Deploy-Workflow) schlägt fehl bei:

- toten internen Links oder Ressourcen und URLs ohne `BASE_PATH`
- den Begriffen „Premium“, „PRO“, „Stripe“ oder „Erstellt mit“
- Namen oder Rahmen-Begriffen sozialer Netzwerke, in allen Sprachversionen – einzige Ausnahme ist das Element `<p class="independence-note">` (Unabhängigkeitshinweis, `independenceNote` in `src/layout.mjs`); es darf nur Text enthalten
- Platzhaltern oder `[eckigen Klammern]` in Impressum und Datenschutz
- Skripten, Styles, Schriften oder Bildern von fremden Servern
- dem alten Namen
- ungültigen Banner-Vorlagen, Skripten oder Stilen des jeweils anderen Werkzeugs auf einer Werkzeug-Seite, fehlendem Canonical oder `hreflang` (de, en, x-default), fehlenden Werkzeug-Seiten in der Sitemap, einem fehlerhaften Skript in der `404.html`
- unvollständigen Übersetzungen (ein Schlüssel nur auf Deutsch oder nur auf Englisch)

## Veröffentlichung über GitHub Pages

Der Workflow `.github/workflows/pages.yml` baut bei jedem Push auf `main`, prüft das Ergebnis und veröffentlicht `dist/`.

1. *Settings → Pages → Source: GitHub Actions*
2. Ohne weitere Einstellungen läuft die Seite unter `https://<name>.github.io/<repo>/`; der Unterordner wird automatisch als `BASE_PATH` gesetzt.
3. Eigene Domain: Variable `SITE_URL` (z. B. `https://www.deine-domain.de`) unter *Settings → Secrets and variables → Actions → Variables* setzen und die Domain unter *Settings → Pages → Custom domain* eintragen.

Unter `/<repo>/` liegt die `robots.txt` nicht im Domain-Stamm und wird von Suchmaschinen ignoriert; die Sitemap bei Bedarf direkt in der Search Console einreichen.

## Archiv: Bezahl- und Firmen-Version

Premium (Einmalkauf über Stripe), Firmen-Pakete mit Admin-Bereich und Team-Links sowie das Supabase-Backend sind aus diesem Stand entfernt. Der vollständige Code liegt unverändert auf dem Branch [`archiv/premium`](https://github.com/LasseHueb/ringlabel/tree/archiv/premium).
