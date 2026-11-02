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
const batchHtml = readFileSync(join(here, "partials/batch.html"), "utf8");
const linkUiHtml = readFileSync(join(here, "partials/linkui.html"), "utf8");

/** Editor-Wörterbücher aus public/js/i18n*.js (dieselben Dateien, die der Browser lädt; hier alle zusammen). */
const i18n = (() => {
  const sandbox = { document: { documentElement: { lang: "de" } } };
  sandbox.window = sandbox;
  for (const f of ["i18n.js", "i18n-frame.js", "i18n-banner.js"]) vm.runInNewContext(readFileSync(join(here, "../public/js", f), "utf8"), sandbox);
  return sandbox.PBG.I18N;
})();

/**
 * Was jede Seite lädt – jede Seite nur das, was sie braucht.
 *   frame:  Rahmen-Editor (/ und /en/)          banner: Banner-Editor (/banner/ und /en/banner/)
 *   (ohne): Rechtstexte – nur Grundfunktionen (Farbschema)
 * Gemeinsam: i18n.js, common.js, presets.js, icons.js, platform.js, links.js, own.js und styles.css.
 */
const TOOL_ASSETS = {
  frame: {
    scripts: ["/js/i18n.js", "/js/i18n-frame.js", "/js/common.js", "/js/presets.js", "/js/icons.js", "/js/renderer.js", "/js/platform.js",
      "/js/links.js", "/js/own.js", "/js/app.js", "/js/zip.js", "/js/batch.js"],
    css: ["/css/frame.css"]
  },
  banner: {
    scripts: ["/js/i18n.js", "/js/i18n-banner.js", "/js/common.js", "/js/presets.js", "/js/icons.js", "/js/banner-model.js", "/js/platform.js",
      "/js/links.js", "/js/own.js", "/js/banner.js"],
    css: ["/css/banner.css"]
  },
  none: { scripts: ["/js/i18n.js", "/js/platform.js"], css: [] }
};

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

/** Hinweis-Leiste und Link-Dialog (partials/linkui.html), gemeinsam für beide Werkzeuge. */
export function linkUi(ctx, lang = "de") {
  return localize(ctx, linkUiHtml, lang);
}

/** „Mehrere Fotos“ (partials/batch.html) in der Sprache lang – übersetzt wie der Editor. */
export function batch(ctx, lang = "de") {
  return localize(ctx, batchHtml, lang);
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
  html = html.replace(/(<span id="batch-zip-label">)[^<]*/, (m, open) => open + tr("batch.download").replace("{size}", "1080"));
  html = html.replace(/(<span id="banner-download-label">)[^<]*/, (m, open) => open + tr("banner.download").replace("{w}", "1584").replace("{h}", "396"));
  html = html.replace(/(<canvas id="banner-preview"[^>]*aria-label=")[^"]*/, (m, open) => open + tr("banner.canvasLabel").replace("{w}", "1584").replace("{h}", "396"));
  const left = html.match(/data-i18n="[^"]+"[^>]*>[^<]*[äöüÄÖÜß][^<]*</);
  if (left) throw new Error(`Unübersetzter Editor-Text: ${left[0]}`);
  return html;
}

const ICON_SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z" fill="currentColor"/></svg>';

/** Datenschutz-Hinweis; over = { badge, text } für andere Texte (Banner-Seite). */
export function privacyNote(lang = "de", over = {}) {
  const l = ui(lang);
  return `<p class="privacy-note" role="note">
    <span class="badge">${ICON_SHIELD}<strong>${esc(over.badge || l.privacyBadge)}</strong></span>
    <span>${esc(over.text || l.privacyText)}</span>
  </p>`;
}

export function trustRow(lang = "de", items) {
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<ul class="trust-row">
    ${(items || ui(lang).trust).map((x) => `<li>${check}${esc(x)}</li>`).join("")}
  </ul>`;
}

/** Hinweis am Seitenende auf das jeweils andere Werkzeug („Passend dazu: …“). */
export function crossLink(ctx, lang, to) {
  const l = ui(lang);
  const c = to === "banner" ? l.crossToBanner : l.crossToFrame;
  const href = ctx.u(to === "banner" ? locales[lang].bannerPage.path : locales[lang].path);
  return `<aside class="section cross-link" aria-label="${esc(c.link)}">
    <p><strong>${esc(c.text)}</strong> <a href="${href}">${esc(c.link)}</a></p>
    <p class="small muted">${esc(c.hint)}</p>
  </aside>`;
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

/** WebApplication; over = { features } für die Banner-Seite. */
export function webAppJsonLd(ctx, url, lang = "de", over = {}) {
  const c = ctx.cfg;
  const a = Object.assign({}, (locales[lang] || locales.de).app, over);
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

/**
 * Sprachumschalter „DE | EN“: wechselt auf dieselbe Seite in der anderen Sprache (langPaths), sonst auf deren Startseite.
 * Keine automatische Weiterleitung.
 */
function langSwitch(ctx, lang, langPaths) {
  const links = languages.map((l) => {
    const href = ctx.u((langPaths && langPaths[l]) || locales[l].path);
    return l === lang
      ? `<a href="${href}" lang="${l}" aria-current="page">${l.toUpperCase()}</a>`
      : `<a href="${href}" lang="${l}" hreflang="${l}">${l.toUpperCase()}</a>`;
  });
  return `<nav class="lang-switch" aria-label="${esc(ui(lang).language)}">${links.join('<span aria-hidden="true">|</span>')}</nav>`;
}

/** Navigation zwischen den beiden Werkzeugen; auf schmalen Bildschirmen mit Kurzbezeichnungen. */
function toolNav(ctx, lang, tool) {
  const l = ui(lang);
  const item = (key, path, label, short) => `<a href="${ctx.u(path)}"${tool === key ? ' aria-current="page"' : ""}><span class="nav-long">${esc(label)}</span><span class="nav-short" aria-hidden="true">${esc(short)}</span></a>`;
  return `<nav class="tool-nav" aria-label="${esc(l.navLabel)}">
      ${item("frame", locales[lang].path, l.navFrame, l.navFrameShort)}
      ${item("banner", locales[lang].bannerPage.path, l.navBanner, l.navBannerShort)}
    </nav>`;
}

function header(ctx, lang, tool, langPaths) {
  const u = ctx.u;
  const l = ui(lang);
  return `<header class="site-header">
    <a class="brand" href="${u(locales[lang].path)}" aria-label="${esc(ctx.cfg.appName)} – ${esc(l.home)}">
      <svg class="brand-logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/><path d="M3.5 21A13.5 13.5 0 0 0 28.5 21" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>
      <span class="brand-name">${esc(ctx.cfg.appName)}</span>
    </a>
    ${toolNav(ctx, lang, tool)}
    ${langSwitch(ctx, lang, langPaths)}
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
 * opts: path, title, description, main (HTML), preset, noindex, canonical, og, jsonLd[], scripts[], bodyClass,
 *       tool ("frame" | "banner" | undefined: was die Seite lädt, aktive Navigation), skip (Ziel des Sprunglinks),
 *       lang (Standard "de"), alternates ([[hreflang, path], …]), langPaths ({ de, en }: dieselbe Seite je Sprache)
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
  const assets = TOOL_ASSETS[opts.tool || "none"];
  const scripts = ["/js/config.js", ...assets.scripts, ...(opts.scripts || [])];
  // Frühere Sprungmarke #banner der Startseite → eigene Banner-Seite (GitHub Pages kann nicht serverseitig weiterleiten)
  const bannerRedirect = opts.tool === "frame"
    ? `<script>if(location.hash==="#banner")location.replace(${JSON.stringify(u(loc.bannerPage.path))});</script>\n  ` : "";
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
  ${assets.css.map((c) => `<link rel="stylesheet" href="${u(c)}?v=${ver}">`).join("\n  ")}
  ${bannerRedirect}<script>try{var t=localStorage.getItem("pbg-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
  ${scripts.map((s) => `<script defer src="${u(s)}?v=${ver}"></script>`).join("\n  ")}
  ${ld}
</head>
<body${opts.preset ? ` data-preset="${esc(opts.preset)}"` : ""}${opts.bodyClass ? ` class="${esc(opts.bodyClass)}"` : ""}>
  ${opts.skip ? `<a class="skip-link" href="#${opts.skip}">${esc(loc.ui.skip)}</a>` : ""}
  ${header(ctx, lang, opts.tool, opts.langPaths)}
  <main id="main">
  ${opts.main}
  </main>
  ${footer(ctx, lang)}
</body>
</html>
`;
}
