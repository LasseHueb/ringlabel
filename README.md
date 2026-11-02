# RingLabel – Profilbild-Rahmen mit eigenem Text

Eine einzige, komplett kostenlose Web-Seite für runde Profilbild-Rahmen: eigener Text, eigenes Logo, eigene Farben und Schriften. Ohne Anmeldung, ohne Backend, ohne Hinweis im Bild.

**Grundprinzip:** Fotos und Logos werden ausschließlich im Browser verarbeitet und **nie** hochgeladen. Keine Cookies, keine Statistik, keine Anfragen an fremde Server.

Live: <https://lassehueb.github.io/ringlabel/>

## Funktionen

| Bereich | Was es gibt |
|---|---|
| **Editor** | Foto laden (JPG, PNG, WebP, HEIC), Zuschnitt per Ziehen/Zoomen, gebogener Text, alle Schriften, Farben und Farbverläufe, Symbole und Emojis im Ring, Ringbreite/-länge/-drehung, Live-Vorschau |
| **Vorlagen** | 32 mitgelieferte Vorlagen, dazu Ideen für Jobsuche, Recruiting, Selbstständige und Firmen mit „Vorlage übernehmen“ |
| **Logo** | PNG, JPG, WebP oder SVG, auf höchstens 512 px verkleinert; links vom Text, rechts vom Text oder statt Text; Größe einstellbar |
| **Eigene Vorlagen** | „Als eigene Vorlage speichern“ (alle Design-Einstellungen und Logo, nie das Foto) im lokalen Speicher des Browsers; umbenennen, löschen, als JSON-Datei exportieren und importieren (streng geprüft, höchstens 1 MB) |
| **Export** | PNG in 1080 × 1080 oder 2048 × 2048 px, Hintergrund transparent oder weiß, auf dem Handy direkt teilen |
| **Teilen** | „Link kopieren“ und die Teilen-Funktion des Geräts – geteilt wird nur die Startseite |
| **Sprachen** | Deutsch unter `/`, Englisch unter `/en/`; Umschalter „DE \| EN“ im Header, keine automatische Weiterleitung |
| **Recht** | Impressum und Datenschutzerklärung (Angaben in `config/site.json` → `legal`, nur auf Deutsch), Unabhängigkeitshinweis im Footer |

Frühere Adressen (`/rahmen/…`, `/vorlage/…`, `/premium/`, `/unternehmen/`, `/admin/`, `/team/`) leiten über die `404.html` auf die Startseite weiter; `/rahmen/<name>/` und `/vorlage/<name>/` öffnen dabei die gleichnamige Vorlage. Unbekannte Pfade unter `/en/` landen auf `/en/`.

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
  js/platform.js          Konfiguration, lokaler Speicher, Farbschema
  js/presets.js           Schriften, Standardwerte, Vorlagen
  js/icons.js             Symbole und Emojis für den Ring
  js/i18n.js              Editor-Texte (Deutsch + Englisch)
  img/ fonts/ vendor/     OG-Bilder und Icons, lokale Schriften (OFL), heic2any
src/
  content.mjs             Texte der Startseiten je Sprache (Title, Einleitung, Ideen, FAQ, Header/Footer)
  layout.mjs              Seitenlayout, Meta-Tags, strukturierte Daten, Unabhängigkeitshinweis
  partials/editor.html    Editor-Markup
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
