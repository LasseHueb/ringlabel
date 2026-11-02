# RingLabel – Profilbild-Rahmen mit eigenem Text

Eine einzige, komplett kostenlose Web-Seite für runde Profilbild-Rahmen: eigener Text, eigenes Logo, eigene Farben und Schriften. Ohne Anmeldung, ohne Backend, ohne Hinweis im Bild.

**Grundprinzip:** Fotos und Logos werden ausschließlich im Browser verarbeitet und **nie** hochgeladen. Keine Cookies, keine Statistik, keine Anfragen an fremde Server.

Live: <https://lassehueb.github.io/ringlabel/>

## Funktionen

| Bereich | Was es gibt |
|---|---|
| **Editor** | Foto laden (JPG, PNG, WebP, HEIC), Zuschnitt per Ziehen/Zoomen, gebogener Text, alle Schriften, Farben und Farbverläufe, Symbole und Emojis im Ring, Ringbreite/-länge/-drehung, Live-Vorschau |
| **Profil-Banner** | Abschnitt `#banner` unter dem Editor: breites Banner (4:1, 3:1, 16:9) mit Farben, Schrift und Logo des Rahmens, Überschrift, Unterzeile, Ausrichtung, Muster oder eigenem Hintergrundbild; markierter Bereich für das Profilbild; PNG in voller Größe |
| **Formen** | „Bogen“ (Standard), „Voller Ring“ (geschlossen rund um das Foto) und „Badge“ (abgerundetes Schild unten, Text gerade); bei Bogen und vollem Ring optional ein zweiter „Text oben“ |
| **Anlässe** | 8 Vorlagen für Feiertage und besondere Momente (Weihnachten, Jahreswechsel, Ostern, Ausbildungsbeginn, Ausbildung geschafft, Messe & Events, Neues Jahr im Job, Sommerpause); im passenden Zeitfenster oben unter „Gerade passend“ |
| **Vorlagen** | 34 mitgelieferte Vorlagen, dazu Ideen für Jobsuche, Recruiting, Selbstständige und Firmen mit „Vorlage übernehmen“ |
| **Logo** | PNG, JPG, WebP oder SVG, auf höchstens 512 px verkleinert; links vom Text, rechts vom Text oder statt Text; Größe einstellbar |
| **Design als Link** | „Link zu diesem Design kopieren“ im Vorlagen-Bereich und bei jeder eigenen Vorlage; wer den Link öffnet, hat sofort denselben Rahmen im Editor (ohne Foto und Logo) |
| **Eigene Vorlagen** | „Als eigene Vorlage speichern“ (alle Design-Einstellungen und Logo, nie das Foto) im lokalen Speicher des Browsers; umbenennen, löschen, als JSON-Datei exportieren und importieren (streng geprüft, höchstens 1 MB) |
| **Export** | PNG in 1080 × 1080 oder 2048 × 2048 px, Hintergrund transparent oder weiß, auf dem Handy direkt teilen |
| **Teilen** | „Link kopieren“ und die Teilen-Funktion des Geräts – geteilt wird nur die Startseite |
| **Sprachen** | Deutsch unter `/`, Englisch unter `/en/`; Umschalter „DE \| EN“ im Header, keine automatische Weiterleitung |
| **Recht** | Impressum und Datenschutzerklärung (Angaben in `config/site.json` → `legal`, nur auf Deutsch), Unabhängigkeitshinweis im Footer |

Frühere Adressen (`/rahmen/…`, `/vorlage/…`, `/premium/`, `/unternehmen/`, `/admin/`, `/team/`) leiten über die `404.html` auf die Startseite weiter; `/rahmen/<name>/` und `/vorlage/<name>/` öffnen dabei die gleichnamige Vorlage. Unbekannte Pfade unter `/en/` landen auf `/en/`.

## Profil-Banner

Unter dem Rahmen-Editor (Sprungmarke `#banner`, keine eigene Unterseite) entsteht ein breites Banner im Design des aktuellen Rahmens. Code: `public/js/banner.js`, Markup: `src/partials/banner.html`, Formate und Prüfung: `public/js/presets.js`.

| Format | Größe |
|---|---|
| Breit 4:1 | 1584 × 396 px |
| Breit 3:1 | 1500 × 500 px |
| 16:9 | 1920 × 1080 px |

- **Aus dem Rahmen übernommen:** Ringfarbe und Verlauf (als Hintergrund), Schrift (Überschrift fett, wenn „Fett“ an ist), Textfarbe und Logo. Hebt sich die Textfarbe nicht genug von beiden Hintergrundfarben ab (Kontrast unter 3:1), nimmt das Banner Weiß oder fast Schwarz und zeigt einen Hinweis. Eine leere Überschrift zeigt den Text des Rahmens.
- **Felder:** Überschrift (höchstens 60 Zeichen, eine Zeile, wird bei Bedarf verkleinert), Unterzeile (höchstens 100 Zeichen, bis zu zwei Zeilen), Ausrichtung links / mittig / rechts.
- **Hintergrund:** Farbe bzw. Verlauf, drei selbst gezeichnete Muster (Punkte, Linien, Wellen) oder ein eigenes Bild (JPG, PNG, WebP; nur im Browser, auf höchstens 4000 px verkleinert, Zoom und Verschieben per Ziehen, Mausrad oder Pfeiltasten, mit Farbschleier auf der Textseite).
- **Bereich, den das Profilbild verdecken kann:** links unten, je Format in `PBG.BANNER_FORMATS[…].safe` (Anteil der Breite, Beginn in der Höhe). Er ist in der Vorschau schraffiert, aber nie im Download. Bei Ausrichtung „links“ beginnen Text und Logo rechts davon; bei „rechts“ reicht der Text nicht hinein.
- **Speichern:** „Als eigene Vorlage speichern“ und der Datei-Export speichern zusätzlich ein optionales Objekt `banner` (`format`, `title`, `subtitle`, `align`, `bg` – Werte siehe `PBG.BANNER_CHOICES`/`PBG.BANNER_MAX`). Ein Hintergrundbild wird nie gespeichert. Ältere Vorlagen ohne `banner` bleiben gültig und lassen das aktuelle Banner unverändert; beim Import werden ungültige Banner-Werte verworfen und gemeldet. Der Design-Link (`#d=…`) enthält keine Banner-Einstellungen.

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

Ein Design lässt sich als Link weitergeben, z. B. `https://ringlabel.de/#d=eyJ2IjoxLCJ0ZXh0Ijoi…` (auf `/en/` entsprechend `/en/#d=…`).

- **Format:** `#d=` + Base64url (ohne `=`) von kompaktem JSON `{"v":1,"text":…,"font":…, …}` mit allen Schlüsseln aus `PBG.DESIGN_KEYS`. Foto und Logo sind nie enthalten; ist ein Logo gesetzt, weist der Dialog darauf hin.
- **Version:** `v` ist die Formatversion (`LINK_VERSION` in `public/js/app.js`). Ändert sich das Format, bekommt es eine neue Nummer und `parseDesignLink` liest ältere Versionen weiter. Links mit unbekannter Version werden mit einer Meldung abgelehnt.
- **Prüfung beim Öffnen:** dieselbe wie beim Datei-Import (`validValue`): nur bekannte Schlüssel, Zahlen im Bereich der Regler, Farben nur als `#rrggbb`, Text höchstens 60 Zeichen, nur vorhandene Schriften und Symbole. Ungültiges wird verworfen und in einer Meldung genannt; ist gar nichts gültig, zu lang (über 2000 Zeichen) oder kaputt, erscheint die Standardvorlage mit einem Hinweis.
- **Datenschutz:** Der Teil nach `#` wird vom Browser nicht an den Server geschickt. Nach dem Laden entfernt `history.replaceState` das Fragment aus der Adresse, damit es nicht versehentlich weitergeteilt wird. Ein Link, der in einen schon offenen Tab eingefügt wird (nur das Fragment ändert sich), wird ebenfalls geladen.
- **Vorrang:** `#d=…` gilt vor `?vorlage=…`; ohne Fragment funktioniert `?vorlage=<name>` wie bisher.

## Sprachversionen

| Sprache | Adresse | `lang` | OG-Bild |
|---|---|---|---|
| Deutsch (Standard, `x-default`) | `/` | `de` | `img/og/home.jpg` |
| Englisch | `/en/` | `en` | `img/og/home-en.jpg` |

Beide Startseiten verweisen per `hreflang` aufeinander (plus `x-default` → Deutsch), haben je einen eigenen Canonical und stehen mit ihren Alternativen in der Sitemap. Impressum und Datenschutzerklärung gibt es nur auf Deutsch; der englische Footer verlinkt sie als „Legal notice (in German)“ und „Privacy policy (in German)“.

**Wo die Texte stehen:**

- `src/content.mjs` → `locales.de` / `locales.en`: Title, Description, H1, Einleitung, Text-Ideen, FAQ, strukturierte Daten (`app`), Texte im OG-Bild (`ogImage`) sowie Header, Footer, Hinweise und Unabhängigkeitshinweis (`ui`)
- `public/js/i18n.js` → `PBG.I18N.de` / `PBG.I18N.en`: alle Editor-Texte. Der Build übersetzt das Editor-Markup (`src/partials/editor.html`) damit schon vorab und bricht ab, wenn auf `/en/` ein Schlüssel fehlt. Im Browser richtet sich die Sprache nach `<html lang>`.
- `public/js/presets.js` und `public/js/icons.js`: Vorlagen-Namen und -Texte, Schrift- und Symbolnamen als `{ de, en }`. Englische Vorlagen-Texte kurz halten – sie dürfen auf dem Ring nicht verkleinert werden müssen.

**Weitere Sprache hinzufügen:** In `src/content.mjs` einen Eintrag in `locales` mit denselben Schlüsseln wie `de` ergänzen (`path: "/<code>/"`, `og: "/img/og/home-<code>.jpg"`), ein Wörterbuch `PBG.I18N.<code>` in `i18n.js` und die Fassungen in `presets.js`/`icons.js` ergänzen, dann `node scripts/render-images.mjs <code>` ausführen. Umschalter, `hreflang`, Sitemap und 404-Weiterleitung übernehmen die neue Sprache automatisch.

## Projektstruktur

```
config/site.json          Name, Adresse, Angaben für Impressum/Datenschutz
public/                   Statische Dateien, werden 1:1 ausgeliefert
  js/renderer.js          Canvas-Rendering (Foto, Ring, gebogener Text, Symbole, Logo)
  js/app.js               Editor-Logik, Logo, eigene Vorlagen, Teilen-Dialog
  js/banner.js            Profil-Banner (Renderer, Bedienung, Download)
  js/platform.js          Konfiguration, lokaler Speicher, Farbschema
  js/presets.js           Schriften, Standardwerte, Vorlagen
  js/icons.js             Symbole und Emojis für den Ring
  js/i18n.js              Editor-Texte (Deutsch + Englisch)
  img/ fonts/ vendor/     OG-Bilder und Icons, lokale Schriften (OFL), heic2any
src/
  content.mjs             Texte der Startseiten je Sprache (Title, Einleitung, Ideen, FAQ, Header/Footer)
  layout.mjs              Seitenlayout, Meta-Tags, strukturierte Daten, Unabhängigkeitshinweis
  partials/editor.html    Editor-Markup
  partials/banner.html    Markup des Profil-Banners
  pages/core.mjs          Startseiten (/ und /en/)
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

## Veröffentlichung über GitHub Pages

Der Workflow `.github/workflows/pages.yml` baut bei jedem Push auf `main`, prüft das Ergebnis und veröffentlicht `dist/`.

1. *Settings → Pages → Source: GitHub Actions*
2. Ohne weitere Einstellungen läuft die Seite unter `https://<name>.github.io/<repo>/`; der Unterordner wird automatisch als `BASE_PATH` gesetzt.
3. Eigene Domain: Variable `SITE_URL` (z. B. `https://www.deine-domain.de`) unter *Settings → Secrets and variables → Actions → Variables* setzen und die Domain unter *Settings → Pages → Custom domain* eintragen.

Unter `/<repo>/` liegt die `robots.txt` nicht im Domain-Stamm und wird von Suchmaschinen ignoriert; die Sitemap bei Bedarf direkt in der Search Console einreichen.

## Archiv: Bezahl- und Firmen-Version

Premium (Einmalkauf über Stripe), Firmen-Pakete mit Admin-Bereich und Team-Links sowie das Supabase-Backend sind aus diesem Stand entfernt. Der vollständige Code liegt unverändert auf dem Branch [`archiv/premium`](https://github.com/LasseHueb/ringlabel/tree/archiv/premium).
