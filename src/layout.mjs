/*
 * Gemeinsames Seitenlayout für alle generierten Seiten.
 * Reines Node.js, keine Abhängigkeiten.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { locales, languages } from "./content.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const editorHtml = readFileSync(join(here, "partials/editor.html"), "utf8");
const bannerHtml = readFileSync(join(here, "partials/banner.html"), "utf8");

/** Editor-Wörterbücher aus public/js/i18n.js (dieselbe Datei, die der Browser lädt). */
const i18n = (() => {
  const sandbox = { document: { documentElement: { lang: "de" } } };
  sandbox.window = sandbox;
  vm.runInNewContext(readFileSync(join(here, "../public/js/i18n.js"), "utf8"), sandbox);
  return sandbox.PBG.I18N;
})();

/** Texte (ui) der Sprache lang; Standard ist Deutsch. */
export function ui(lang) {
  return (locales[lang] || locales.de).ui;
}

/** HTML-Escaping für Text in Attributen und Inhalten. */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Ersetzt {app} und {base} in Inhaltstexten. */
export function fill(ctx, s) {
  return String(s ?? "")
    .replaceAll("{app}", ctx.cfg.appName)
    .replaceAll("{base}", ctx.cfg.basePath);
}

/**
 * Unabhängigkeitshinweis – die einzige Stelle, an der ein soziales Netzwerk namentlich genannt wird (Footer und Impressum).
 * Das Element trägt die Klasse „independence-note“ und enthält nur Text: scripts/check-dist.mjs nimmt genau
 * dieses Element von der Prüfung auf Netzwerk-Begriffe aus.
 */
export function independenceNote(ctx, lang = "de", cls = "") {
  const text = esc(ui(lang).independence).replaceAll("{app}", esc(ctx.cfg.appName));
  return `<p class="${cls ? cls + " " : ""}independence-note">${text}</p>`;
}

/**
 * Editor-Markup in der Sprache lang. Die Vorlage (partials/editor.html) ist deutsch; für andere Sprachen werden
 * Texte und Attribute mit data-i18n* schon beim Build übersetzt (kein Aufblitzen deutscher Texte, gut für Suchmaschinen).
 */
export function editor(ctx, lang = "de") {
  return localize(ctx, editorHtml, lang);
}

/** Profil-Banner (partials/banner.html) in der Sprache lang – übersetzt wie der Editor. */
export function banner(ctx, lang = "de") {
  return localize(ctx, bannerHtml, lang);
}

function localize(ctx, source, lang) {
  let html = source.replaceAll("{{base}}", ctx.cfg.basePath);
  if (lang === "de") return html;
  const dict = i18n[lang];
  if (!dict) throw new Error(`Keine Editor-Texte für „${lang}“ in public/js/i18n.js`);
  const tr = (key) => {
    if (dict[key] == null) throw new Error(`Editor-Text „${key}“ fehlt für „${lang}“ in public/js/i18n.js`);
    return esc(dict[key].replaceAll("{app}", ctx.cfg.appName));
  };
  // Elemente mit data-i18n enthalten nur Text
  html = html.replace(/(<(\w+)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)[^<]*(<\/\2>)/g, (m, open, tag, key, close) => open + tr(key) + close);
  html = html.replace(/<[^>]*\sdata-i18n-aria="([^"]+)"[^>]*>/g, (tag, key) => tag.replace(/\saria-label="[^"]*"/, ` aria-label="${tr(key)}"`));
  html = html.replace(/<[^>]*\sdata-i18n-placeholder="([^"]+)"[^>]*>/g, (tag, key) => tag.replace(/>$/, ` placeholder="${tr(key)}">`));
  // Beschriftung der Download-Buttons setzen app.js und banner.js; hier nur der Startwert
  html = html.replace(/(<span id="download-label">)[^<]*/, (m, open) => open + tr("export.download").replace("{size}", "1080"));
  html = html.replace(/(<span id="banner-download-label">)[^<]*/, (m, open) => open + tr("banner.download").replace("{w}", "1584").replace("{h}", "396"));
  html = html.replace(/(<canvas id="banner-preview"[^>]*aria-label=")[^"]*/, (m, open) => open + tr("banner.canvasLabel").replace("{w}", "1584").replace("{h}", "396"));
  const left = html.match(/data-i18n="[^"]+"[^>]*>[^<]*[äöüÄÖÜß][^<]*</);
  if (left) throw new Error(`Unübersetzter Editor-Text: ${left[0]}`);
  return html;
}

const ICON_SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/></svg>';

export function privacyNote(lang = "de") {
  const l = ui(lang);
  return `<p class="privacy-note" role="note">
    <span class="badge">${ICON_SHIELD}<strong>${esc(l.privacyBadge)}</strong></span>
    <span>${esc(l.privacyText)}</span>
  </p>`;
}

export function trustRow(lang = "de") {
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<ul class="trust-row">
    ${ui(lang).trust.map((x) => `<li>${check}${esc(x)}</li>`).join("")}
  </ul>`;
}

export function faqSection(ctx, faq, heading = ui("de").faqHeading) {
  return `<section class="section faq narrow" aria-labelledby="faq-h">
    <h2 id="faq-h">${esc(heading)}</h2>
    ${faq.map(([q, a]) => `<details><summary>${esc(fill(ctx, q))}</summary><p>${fill(ctx, a)}</p></details>`).join("\n    ")}
  </section>`;
}

export function faqJsonLd(ctx, faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: fill(ctx, q),
      acceptedAnswer: { "@type": "Answer", text: fill(ctx, a).replace(/<[^>]+>/g, "") }
    }))
  };
}

export function webAppJsonLd(ctx, url, lang = "de") {
  const c = ctx.cfg;
  const a = (locales[lang] || locales.de).app;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: c.appName,
    url,
    applicationCategory: "DesignApplication",
    operatingSystem: a.operatingSystem,
    browserRequirements: a.browserRequirements,
    inLanguage: lang,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", name: a.offer, price: "0", priceCurrency: "EUR" },
    featureList: a.features
  };
}

/** Sprachumschalter „DE | EN“: verlinkt auf die Startseite der jeweils anderen Sprache, keine automatische Weiterleitung. */
function langSwitch(ctx, lang) {
  const links = languages.map((l) => l === lang
    ? `<a href="${ctx.u(locales[l].path)}" lang="${l}" aria-current="page">${l.toUpperCase()}</a>`
    : `<a href="${ctx.u(locales[l].path)}" lang="${l}" hreflang="${l}">${l.toUpperCase()}</a>`);
  return `<nav class="lang-switch" aria-label="${esc(ui(lang).language)}">${links.join('<span aria-hidden="true">|</span>')}</nav>`;
}

function header(ctx, lang) {
  const u = ctx.u;
  const l = ui(lang);
  return `<header class="site-header">
    <a class="brand" href="${u(locales[lang].path)}" aria-label="${esc(ctx.cfg.appName)} – ${esc(l.home)}">
      <svg class="brand-logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/><path d="M3.5 21A13.5 13.5 0 0 0 28.5 21" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>
      <span class="brand-name">${esc(ctx.cfg.appName)}</span>
    </a>
    ${langSwitch(ctx, lang)}
    <div class="segmented" role="radiogroup" aria-label="${esc(l.theme)}" id="theme-switch">
      <button type="button" role="radio" data-theme-value="auto" title="${esc(l.themeAuto)}" aria-checked="true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18V3z" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span class="visually-hidden">${esc(l.themeAuto)}</span>
      </button>
      <button type="button" role="radio" data-theme-value="light" title="${esc(l.themeLight)}" aria-checked="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>
        <span class="visually-hidden">${esc(l.themeLight)}</span>
      </button>
      <button type="button" role="radio" data-theme-value="dark" title="${esc(l.themeDark)}" aria-checked="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>
        <span class="visually-hidden">${esc(l.themeDark)}</span>
      </button>
    </div>
  </header>`;
}

function footer(ctx, lang) {
  const u = ctx.u;
  const t = ui(lang);
  // Impressum und Datenschutz gibt es nur auf Deutsch
  const hl = lang === "de" ? "" : ' hreflang="de"';
  const legal = [["/impressum/", t.imprint], ["/datenschutz/", t.privacy]];
  return `<footer class="site-footer">
    <ul class="footer-nav" aria-label="${esc(t.legalNav)}">${legal.map(([p, l]) => `<li><a href="${u(p)}"${hl}>${esc(l)}</a></li>`).join("")}</ul>
    ${independenceNote(ctx, lang, "small")}
    <p>© ${new Date().getFullYear()} ${esc(ctx.cfg.legal.name)}</p>
  </footer>`;
}

/**
 * Vollständige HTML-Seite.
 * opts: path, title, description, main (HTML), preset, noindex, canonical, og, jsonLd[], scripts[], editor(bool), bodyClass,
 *       lang (Standard "de"), alternates ([[hreflang, path], …] für Seiten, die es in mehreren Sprachen gibt)
 */
export function page(ctx, opts) {
  const c = ctx.cfg;
  const u = ctx.u;
  const lang = opts.lang || "de";
  const loc = locales[lang];
  const alternates = (opts.alternates || []).map(([hl, p]) => `<link rel="alternate" hreflang="${hl}" href="${esc(ctx.abs(p))}">`).join("\n  ");
  const title = opts.titleFull || `${opts.title} | ${c.appName}`;
  const canonical = ctx.abs(opts.canonical || opts.path);
  const og = ctx.abs(opts.og || "/img/og/default.jpg");
  const ld = (opts.jsonLd || []).map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`).join("\n  ");
  const editorScripts = opts.editor
    ? ["/js/i18n.js", "/js/presets.js", "/js/icons.js", "/js/renderer.js", "/js/platform.js", "/js/app.js", "/js/banner.js"]
    : ["/js/i18n.js", "/js/platform.js"];
  const scripts = ["/js/config.js", ...editorScripts, ...(opts.scripts || [])];
  const ver = ctx.version;

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(opts.description)}">
  <link rel="canonical" href="${esc(canonical)}">
  ${alternates ? alternates + "\n  " : ""}${opts.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f5f7fa" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0f1419" media="(prefers-color-scheme: dark)">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(c.appName)}">
  <meta property="og:locale" content="${loc.ogLocale}">
  <meta property="og:title" content="${esc(opts.ogTitle || opts.title)}">
  <meta property="og:description" content="${esc(opts.description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(og)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(opts.ogTitle || opts.title)}">
  <meta name="twitter:card" content="summary_large_image">
  ${c.twitterHandle ? `<meta name="twitter:site" content="${esc(c.twitterHandle)}">` : ""}
  <link rel="icon" href="${u("/favicon.svg")}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${u("/img/apple-touch-icon.png")}">
  <link rel="manifest" href="${u("/manifest.webmanifest")}">
  <link rel="preload" href="${u("/fonts/montserrat-latin-700-normal.woff2")}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${u("/fonts/nunito-latin-400-normal.woff2")}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${u("/css/fonts.css")}?v=${ver}">
  <link rel="stylesheet" href="${u("/css/styles.css")}?v=${ver}">
  <script>try{var t=localStorage.getItem("pbg-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
  ${scripts.map((s) => `<script defer src="${u(s)}?v=${ver}"></script>`).join("\n  ")}
  ${ld}
</head>
<body${opts.preset ? ` data-preset="${esc(opts.preset)}"` : ""}${opts.bodyClass ? ` class="${esc(opts.bodyClass)}"` : ""}>
  ${opts.editor ? `<a class="skip-link" href="#controls">${esc(loc.ui.skip)}</a>` : ""}
  ${header(ctx, lang)}
  <main id="main">
  ${opts.main}
  </main>
  ${footer(ctx, lang)}
</body>
</html>
`;
}
