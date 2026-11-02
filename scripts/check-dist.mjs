#!/usr/bin/env node
/*
 * Prüft den fertigen Build in dist/ (nach node scripts/build.mjs):
 *   - alle internen Links und Ressourcen (href, src, content, Sitemap, Manifest, CSS-url()) zeigen auf existierende Dateien
 *   - alle internen URLs beginnen mit BASE_PATH (wichtig für GitHub Pages unter /<repo>/)
 *   - nirgends der alte Name „ProfilRing“ bzw. „profilring“
 *   - keine Namen oder Rahmen-Begriffe sozialer Netzwerke (Abgrenzung), in allen Sprachversionen; einzige Ausnahme ist
 *     das Element mit der Klasse „independence-note“ (Unabhängigkeitshinweis, siehe independenceNote in src/layout.mjs)
 *   - nirgends „Premium“, „PRO“ oder „Stripe“ (alles ist kostenlos) und kein Hinweis „Erstellt mit“ im Bild; kein supabase.js
 *   - Impressum und Datenschutz ohne Platzhalter oder [eckige Klammern]
 *   - keine Skripte, Styles, Schriften oder Bilder von fremden Servern (die Datenschutzerklärung schließt das aus)
 *   - Vorlagen (js/presets.js): keine an bekannte Netzwerk-Rahmen angelehnte Gestaltung (grüner oder lila Bogen unten/links
 *     mit heller Hashtag-Schrift in Großbuchstaben), Texte ohne Netzwerk-Begriffe, gültige Zeitfenster bei Anlässen;
 *     Banner-Vorlagen (js/banner-model.js) mit gültigen Werten
 *   - Rahmen- und Banner-Seite laden nur ihre eigenen Skripte und Stile; beide Werkzeug-Seiten je Sprache mit
 *     Canonical und hreflang (de, en, x-default)
 *   - Übersetzungen (js/i18n*.js) auf Deutsch und Englisch vollständig
 *   - Skript der 404-Seite ohne Syntaxfehler; Rahmen- und Banner-Seiten beider Sprachen in der Sitemap
 * Aufruf: node scripts/check-dist.mjs   (Exit-Code 1 bei Fehlern)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const sandbox = {};
sandbox.window = sandbox;
vm.runInNewContext(readFileSync(join(dist, "js/config.js"), "utf8"), sandbox);
const { siteUrl, basePath = "" } = sandbox.PBG_CONFIG;

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p); else files.push(p);
  }
})(dist);

const errors = [];
const rel = (f) => relative(dist, f);

// ---------- Links ----------
function exists(url, from) {
  url = url.split("#")[0].split("?")[0];
  if (!url) return true;
  if (!url.startsWith("/")) url = "/" + relative(dist, join(dirname(from), url)).replaceAll("\\", "/");
  else if (basePath && url !== basePath && !url.startsWith(basePath + "/")) return false;
  else url = url.slice(basePath.length);
  const p = join(dist, decodeURIComponent(url));
  return url.endsWith("/") ? existsSync(join(p, "index.html")) : existsSync(p);
}

let checked = 0;
for (const f of files.filter((f) => /\.(html|xml|webmanifest|txt|css)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  const urls = [
    ...s.matchAll(/(?:href|src|content)="([^"]+)"/g),
    ...s.matchAll(/<loc>([^<]+)<\/loc>/g),
    ...s.matchAll(/"(?:src|start_url)":\s*"([^"]+)"/g),
    ...s.matchAll(/^Sitemap: (\S+)/gm),
    ...s.matchAll(/url\(["']?([^"')]+)["']?\)/g)
  ].map((m) => m[1].replace(/&amp;/g, "&"));
  for (let u of urls) {
    if (u.startsWith(siteUrl + "/")) u = u.slice(siteUrl.length);
    else if (/^[a-z]+:/i.test(u) || u.startsWith("//")) continue; // extern, data:, mailto: …
    else if (!/\.css$/.test(f) && !u.startsWith("/")) continue; // Meta-Inhalte wie content="width=…"
    checked++;
    if (!exists(u, f)) errors.push(`Toter Link in ${rel(f)}: ${u}`);
  }
}

// ---------- Alter Name ----------
const binary = (f) => /\.(woff2|png|jpe?g|webp|ico)$/.test(f);
for (const f of files.filter((f) => !binary(f))) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    const m = line.match(/profilring/i);
    if (m) errors.push(`Alter Name „${m[0]}“ in ${rel(f)}:${i + 1}`);
  });
}

// ---------- Abgrenzung von sozialen Netzwerken ----------
const networkTerms = /linked\s?in|open[\s-]?to[\s-]?work|opentowork|openforwork|offen\s?für\s?jobs|hiring/i;
// Der Unabhängigkeitshinweis ist ein <p class="… independence-note">, das nur Text enthält. Genau dieses Element
// wird vor der Prüfung entfernt (durch Leerzeichen ersetzt, damit Zeilennummern stimmen) – sonst gibt es keine Ausnahme.
const noteRe = /<p class="(?:[\w-]+ )*independence-note(?: [\w-]+)*">[^<]*<\/p>/g;
for (const f of files.filter((f) => !binary(f))) {
  let s = readFileSync(f, "utf8");
  if (/\.html$/.test(f)) {
    s = s.replace(noteRe, (m) => m.replace(/[^\n]/g, " "));
    if (s.includes("independence-note")) errors.push(`Unabhängigkeitshinweis in ${rel(f)} ist kein reines Text-Element <p class="independence-note">`);
  }
  s.split("\n").forEach((line, i) => {
    const m = line.match(networkTerms);
    if (m) errors.push(`Netzwerk-Begriff „${m[0]}“ in ${rel(f)}:${i + 1}`);
  });
}

// ---------- Alles kostenlos: keine Bezahl-Begriffe, kein Hinweis „Erstellt mit“ ----------
const words = /\b(Premium|PRO|Stripe)\b|Erstellt mit/;
for (const f of files) {
  if (binary(f) || /(^|\/)LICENSE-[^/]+\.txt$/.test(rel(f))) continue;
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    const m = line.match(words);
    if (m) errors.push(`„${m[1] || m[0]}“ in ${rel(f)}:${i + 1}`);
  });
}
if (existsSync(join(dist, "vendor/supabase.js"))) errors.push("vendor/supabase.js darf nicht ausgeliefert werden");

// ---------- Rechtstexte müssen vollständig ausgefüllt sein ----------
for (const page of ["impressum/index.html", "datenschutz/index.html"]) {
  const f = join(dist, page);
  if (!existsSync(f)) { errors.push(`${page} fehlt`); continue; }
  const main = (readFileSync(f, "utf8").match(/<main[\s\S]*<\/main>/) || [""])[0];
  if (/class="placeholder"/.test(main)) errors.push(`Gelb markierter Platzhalter in ${page}`);
  const text = main.replace(/<[^>]+>/g, " ");
  for (const m of text.matchAll(/\[[^\]]*\]/g)) errors.push(`Platzhalter ${m[0].trim()} in ${page}`);
}

// ---------- Keine Ressourcen von fremden Servern (Links zum Anklicken sind erlaubt) ----------
for (const f of files.filter((f) => /\.(html|css)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  const res = [
    ...[...s.matchAll(/<(?:script|img|iframe|source|video|audio)\b[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]),
    ...[...s.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/rel="canonical"/.test(t)).map((t) => (t.match(/href="([^"]+)"/) || [])[1]),
    ...[...s.matchAll(/(?:url\(|@import\s+)["']?([^"')\s;]+)/g)].map((m) => m[1])
  ].filter(Boolean);
  for (const u of res) {
    if ((/^(https?:)?\/\//.test(u)) && !u.startsWith(siteUrl + "/")) errors.push(`Ressource von fremdem Server in ${rel(f)}: ${u}`);
  }
}

// ---------- Jede Werkzeug-Seite lädt nur, was sie braucht; Canonical und hreflang ----------
{
  const tools = {
    frame: { pages: ["index.html", "en/index.html"], forbidden: ["js/banner.js", "js/banner-model.js", "js/i18n-banner.js", "css/banner.css"] },
    banner: { pages: ["banner/index.html", "en/banner/index.html"], forbidden: ["js/app.js", "js/renderer.js", "js/batch.js", "js/zip.js", "js/i18n-frame.js", "css/frame.css"] }
  };
  for (const [tool, { pages, forbidden }] of Object.entries(tools)) {
    for (const pg of pages) {
      const f = join(dist, pg);
      if (!existsSync(f)) { errors.push(`Seite fehlt: ${pg}`); continue; }
      const s = readFileSync(f, "utf8");
      for (const x of forbidden) if (s.includes(`${basePath}/${x}`)) errors.push(`${pg} (${tool}) lädt ${x}`);
      if (!/<link rel="canonical"/.test(s)) errors.push(`${pg}: Canonical fehlt`);
      for (const l of ["de", "en", "x-default"]) if (!s.includes(`hreflang="${l}"`)) errors.push(`${pg}: hreflang „${l}“ fehlt`);
    }
  }
}

// ---------- 404-Weiterleitung lauffähig, beide Werkzeug-Seiten in der Sitemap ----------
{
  const m = readFileSync(join(dist, "404.html"), "utf8").match(/<script>([\s\S]*?)<\/script>/);
  try { new Function(m ? m[1] : ""); } catch (e) { errors.push(`404.html: Skript fehlerhaft (${e.message})`); }
  const sm = readFileSync(join(dist, "sitemap.xml"), "utf8");
  for (const p of ["/", "/en/", "/banner/", "/en/banner/"]) if (!sm.includes(`<loc>${siteUrl}${p}</loc>`)) errors.push(`sitemap.xml: ${p} fehlt`);
}

// ---------- Übersetzungen vollständig (Deutsch und Englisch) ----------
{
  const box = { location: { hostname: "", search: "" }, document: { documentElement: { lang: "de" }, querySelectorAll: () => [] } };
  box.window = box;
  for (const f of ["i18n.js", "i18n-frame.js", "i18n-banner.js"]) {
    try { vm.runInNewContext(readFileSync(join(dist, "js", f), "utf8"), box); } catch (e) { errors.push(`js/${f} lässt sich nicht laden: ${e.message}`); }
  }
  const I = (box.PBG && box.PBG.I18N) || {};
  const de = Object.keys(I.de || {}), en = Object.keys(I.en || {});
  for (const k of de) if (!(k in (I.en || {}))) errors.push(`Übersetzung fehlt (en): ${k}`);
  for (const k of en) if (!(k in (I.de || {}))) errors.push(`Übersetzung fehlt (de): ${k}`);
  if (!de.length) errors.push("Übersetzungen nicht gefunden (js/i18n.js)");
}

// ---------- Vorlagen: keine Netzwerk-Rahmen-Optik, gültige Anlass-Zeitfenster ----------
{
  const box = { location: { hostname: "", search: "" } };
  box.window = box;
  box.PBG = { lang: "de", loc: (o) => (o && typeof o === "object" ? o.de : o) || "" };
  // presets.js (Rahmen-Vorlagen), icons.js und banner-model.js (Banner-Vorlagen, nur auf der Banner-Seite geladen)
  for (const f of ["presets.js", "icons.js", "banner-model.js"]) vm.runInNewContext(readFileSync(join(dist, "js", f), "utf8"), box);
  const P = box.PBG;
  if (!(P.BANNER_PRESETS || []).length) errors.push("Banner-Vorlagen fehlen (js/banner-model.js)");
  const hsl = (hex) => {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  };
  const greenOrPurple = (hex) => { const [h, s, l] = hsl(hex); return s > 0.2 && l > 0.08 && l < 0.85 && ((h >= 80 && h <= 170) || (h >= 255 && h <= 320)); };
  // Banner-Vorlagen: keine Netzwerk-Begriffe in Namen und Texten, Anlass-Verweise auf vorhandene Rahmen-Anlässe
  for (const bp of P.BANNER_PRESETS || []) {
    for (const lang of ["de", "en"]) {
      const text = ["name", "title", "subtitle", "extra"].map((f) => (bp[f] && bp[f][lang]) || "").join(" ");
      const m = text.match(networkTerms);
      if (m) errors.push(`Banner-Vorlage „${bp.key}“ (${lang}): Netzwerk-Begriff „${m[0]}“`);
    }
    const vb = P.validateBanner(bp.values);
    if (vb.dropped.length) errors.push(`Banner-Vorlage „${bp.key}“: ungültige Werte ${vb.dropped.join(", ")}`);
    if (bp.occasionOf && !(P.presetByKey(bp.occasionOf) || {}).occasion) errors.push(`Banner-Vorlage „${bp.key}“: Anlass „${bp.occasionOf}“ fehlt`);
  }
  for (const p of P.PRESETS) {
    const v = Object.assign({}, P.DEFAULTS, p.values);
    for (const lang of ["de", "en"]) {
      const text = ((p.text && p.text[lang]) || "") + " " + ((p.textTop && p.textTop[lang]) || "") + " " + ((p.name && p.name[lang]) || "");
      const m = text.match(networkTerms);
      if (m) errors.push(`Vorlage „${p.key}“ (${lang}): Netzwerk-Begriff „${m[0]}“`);
      const main = (p.text && p.text[lang]) || "";
      const hashtagCaps = /^\s*#/.test(main) && (v.uppercase || main === main.toUpperCase());
      const light = hsl(v.textColor)[2] > 0.8;
      const colors = [v.ringColor].concat(v.gradient ? [v.ringColor2] : []);
      if (v.shape !== "badge" && v.ringRotation >= -10 && hashtagCaps && light && colors.some(greenOrPurple)) {
        errors.push(`Vorlage „${p.key}“ (${lang}): grüner/lila Bogen unten mit heller Hashtag-Schrift in Großbuchstaben – zu nah an Netzwerk-Rahmen`);
      }
    }
    if (p.occasion) {
      const ok = Array.isArray(p.occasion) && p.occasion.length && p.occasion.every((w) => {
        const parts = String(w).split("/");
        const valid = (x) => /^easter([+-]\d{1,3})?$/.test(x) || (/^(\d{2})-(\d{2})$/.test(x) && +x.slice(0, 2) >= 1 && +x.slice(0, 2) <= 12 && +x.slice(3) >= 1 && +x.slice(3) <= 31);
        return parts.length === 2 && parts.every(valid);
      });
      if (!ok) errors.push(`Vorlage „${p.key}“: ungültiges Zeitfenster ${JSON.stringify(p.occasion)} (erwartet z. B. "12-01/12-26" oder "easter-14/easter+1")`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`✗ ${errors.length} Fehler (${checked} URLs geprüft).`);
  process.exit(1);
}
console.log(`✓ dist/ in Ordnung: ${checked} interne URLs geprüft, keine toten Links, keine verbotenen Begriffe.`);
