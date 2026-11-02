/*
 * Datenmodell des Banner-Editors (nur auf /banner/ und /en/banner/ geladen):
 * Formate, Standardwerte, strenge Prüfung, Banner-Vorlagen und die Umrechnung älterer Banner-Daten.
 * Das Banner ist ein eigenes Werkzeug und übernimmt nichts automatisch vom Rahmen.
 */
window.PBG = window.PBG || {};

/**
 * Formate, neutral benannt. safe = Bereich unten links (Anteile von Breite/Höhe), den das Profilbild auf vielen
 * Plattformen verdecken kann.
 */
PBG.BANNER_FORMATS = {
  "4x1": { w: 1584, h: 396, safe: { w: 0.27, y: 0.36 } },
  "3x1": { w: 1500, h: 500, safe: { w: 0.25, y: 0.4 } },
  "16x9": { w: 1920, h: 1080, safe: { w: 0.2, y: 0.6 }, textScale: 1.35 }
};

/**
 * Banner-Einstellungen (Version 2), gespeichert in eigenen Banner-Vorlagen und Dateien; in Banner-Links nur die
 * Abweichungen vom Standard. Nie Hintergrundbild oder Logo-Bild.
 */
PBG.BANNER_DEFAULTS = {
  format: "4x1", title: "", subtitle: "", align: "left", bg: "color",
  bgColor: "custom",         // custom (eigene Farbe) | white | lightgray | transparent
  color1: "#1a5ccc", color2: "#5a9bff", gradient: false,
  gradDir: "d",              // Verlauf: h (waagerecht) | v (senkrecht) | d (diagonal)
  logo: "own",               // own (eigenes Logo, falls geladen) | none
  logoPos: "auto",           // auto | start | end | above | tl | tr | br  (Ecke unten links ist der Bereich des Profilbilds)
  logoSize: 100,             // % der Standardgröße
  extra: "", extraIcon: "",  // Zusatzzeile (z. B. Website, Kontakt, Ort) mit optionalem Symbol
  titleSize: 100, subtitleSize: 100, extraSize: 100,  // Schriftgrößen in %
  font: "Montserrat",        // Schrift-ID aus PBG.FONTS
  bold: "bold",              // Überschrift: bold | regular
  textColor: ""              // "" = automatisch (Weiß oder fast Schwarz, je nach Hintergrund), sonst #rrggbb
};
PBG.BANNER_CHOICES = {
  format: ["4x1", "3x1", "16x9"], align: ["left", "center", "right"], bg: ["color", "dots", "lines", "waves"],
  bgColor: ["custom", "white", "lightgray", "transparent"], gradDir: ["h", "v", "d"],
  logo: ["own", "none"], logoPos: ["auto", "start", "end", "above", "tl", "tr", "br"], bold: ["bold", "regular"]
};
PBG.BANNER_MAX = { title: 60, subtitle: 100, extra: 80 };
PBG.BANNER_RANGES = { logoSize: [40, 200], titleSize: [50, 150], subtitleSize: [50, 150], extraSize: [50, 150] };
PBG.BANNER_COLORS = ["color1", "color2"];
PBG.BANNER_FLAGS = ["gradient"];
/** Feste Hintergrundfarben der Schnellwahl. */
PBG.BANNER_SOLID = { white: "#ffffff", lightgray: "#eceff3" };

/** Prüft einen einzelnen Banner-Wert (Version 2); gibt den bereinigten Wert oder undefined zurück. */
PBG.validBannerValue = function (k, v) {
  if (PBG.BANNER_CHOICES[k]) return PBG.BANNER_CHOICES[k].indexOf(v) >= 0 ? v : undefined;
  if (PBG.BANNER_MAX[k]) return typeof v === "string" && v.length <= PBG.BANNER_MAX[k] ? v : undefined;
  if (PBG.BANNER_RANGES[k]) return typeof v === "number" && isFinite(v) && v >= PBG.BANNER_RANGES[k][0] && v <= PBG.BANNER_RANGES[k][1] ? v : undefined;
  if (PBG.BANNER_COLORS.indexOf(k) >= 0) return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined;
  if (PBG.BANNER_FLAGS.indexOf(k) >= 0) return typeof v === "boolean" ? v : undefined;
  if (k === "extraIcon") return v === "" || (typeof v === "string" && !!PBG.iconById && !!PBG.iconById(v)) ? v : undefined;
  if (k === "font") return typeof v === "string" && v !== "" && PBG.fontById(v).id === v ? v : undefined;
  if (k === "textColor") return v === "" ? v : typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined;
  return undefined;
};

/**
 * Prüft Banner-Einstellungen aus einer Vorlage, Datei oder einem Link: nur bekannte Schlüssel, nur erlaubte Werte.
 * Gibt { banner, dropped: ["banner.<schlüssel>"] } zurück; banner ist null, wenn nichts Gültiges enthalten ist.
 */
PBG.validateBanner = function (raw) {
  if (raw == null) return { banner: null, dropped: [] };
  if (typeof raw !== "object" || Array.isArray(raw)) return { banner: null, dropped: ["banner"] };
  var out = {}, dropped = [];
  Object.keys(raw).forEach(function (k) {
    var v = Object.prototype.hasOwnProperty.call(PBG.BANNER_DEFAULTS, k) ? PBG.validBannerValue(k, raw[k]) : undefined;
    if (v !== undefined) out[k] = v; else dropped.push("banner." + k);
  });
  return { banner: Object.keys(out).length ? out : null, dropped: dropped };
};

/** Nur die vom Standard abweichenden Banner-Einstellungen (für kurze Links); null, wenn alles Standard ist. */
PBG.bannerDiff = function (b) {
  var out = {};
  Object.keys(PBG.BANNER_DEFAULTS).forEach(function (k) { if (b && b[k] !== undefined && b[k] !== PBG.BANNER_DEFAULTS[k]) out[k] = b[k]; });
  return Object.keys(out).length ? out : null;
};

/* ---------------------------------------------------------------------------------------------------------------
 * Ältere Banner-Daten (Version 1, als das Banner noch Teil der Rahmen-Seite war): Optionen „Wie der Rahmen“ für
 * Hintergrund, Logo, Schrift, Schriftstärke und Textfarbe, leere Überschrift = Text des Rahmens.
 * PBG.bannerFromLegacy rechnet sie mit dem damaligen Rahmen in feste Werte um – das Ergebnis sieht genauso aus.
 * ------------------------------------------------------------------------------------------------------------ */
PBG.BANNER_LEGACY_DEFAULTS = {
  format: "4x1", title: "", subtitle: "", align: "left", bg: "color", bgColor: "frame", color1: "#1a5ccc", color2: "#5a9bff",
  gradient: false, gradDir: "d", logo: "frame", logoPos: "auto", logoSize: 100, extra: "", extraIcon: "",
  titleSize: 100, subtitleSize: 100, extraSize: 100, font: "", bold: "frame", textColor: ""
};

/** Prüft einen Wert im alten Format (zusätzlich „frame“-Optionen und leere Schrift erlaubt). */
PBG.validLegacyBannerValue = function (k, v) {
  if (k === "bgColor") return ["frame", "custom", "white", "lightgray", "transparent"].indexOf(v) >= 0 ? v : undefined;
  if (k === "logo") return ["frame", "own", "none"].indexOf(v) >= 0 ? v : undefined;
  if (k === "bold") return ["frame", "bold", "regular"].indexOf(v) >= 0 ? v : undefined;
  if (k === "font" && v === "") return v;
  return PBG.validBannerValue(k, v);
};

/**
 * Rechnet ein altes Banner (Version 1) in Version 2 um.
 *   old: alte Banner-Einstellungen, design: Rahmen-Design der alten Vorlage/des alten Links (für „Wie der Rahmen“),
 *   frameLogo: Rahmen-Logo (Data-URL oder null), bannerLogo: eigenes Banner-Logo (Data-URL oder null).
 * Gibt { banner, logo (Data-URL oder null), dropped } zurück.
 */
PBG.bannerFromLegacy = function (old, design, frameLogo, bannerLogo) {
  var b = Object.assign({}, PBG.BANNER_LEGACY_DEFAULTS), dropped = [];
  Object.keys(old || {}).forEach(function (k) {
    var v = Object.prototype.hasOwnProperty.call(PBG.BANNER_LEGACY_DEFAULTS, k) ? PBG.validLegacyBannerValue(k, old[k]) : undefined;
    if (v !== undefined) b[k] = v; else dropped.push("banner." + k);
  });
  var f = PBG.frameStyleOf(design);
  var out = Object.assign({}, b);
  // Hintergrund „Wie der Rahmen“ → eigene Farbe mit den Ringfarben (früher immer diagonal)
  if (b.bgColor === "frame") {
    out.bgColor = "custom"; out.color1 = f.ringColor; out.color2 = f.ringColor2; out.gradient = f.gradient; out.gradDir = "d";
  }
  if (!b.font) out.font = f.font;
  if (b.bold === "frame") out.bold = f.bold ? "bold" : "regular";
  // leere Überschrift zeigte früher den Text des Rahmens
  if (!b.title) out.title = String(f.text || "").replace(/\s+/g, " ").trim().slice(0, PBG.BANNER_MAX.title);
  // Textfarbe „automatisch“ bedeutete früher: Textfarbe des Rahmens, bei zu wenig Kontrast Weiß oder #111827
  if (!b.textColor) out.textColor = PBG.legacyTextColor(f.textColor, b, f);
  // Logo „Wie im Rahmen“ → eigenes Logo mit dem Rahmen-Logo
  var logo = null;
  if (b.logo === "frame") logo = frameLogo || null;
  else if (b.logo === "own") logo = bannerLogo || null;
  // „Kein Logo“ bleibt; sonst „eigenes Logo“ – ohne Bild wird wie früher kein Logo gezeichnet
  out.logo = b.logo === "none" ? "none" : "own";
  return { banner: out, logo: logo, dropped: dropped };
};

/**
 * Die fürs Banner nötigen Werte eines Rahmen-Designs (aus einer Rahmen-Vorlage, einer alten Vorlage oder einem alten
 * Link), streng geprüft; fehlende oder ungültige Werte = Standard des Rahmens (PBG.DEFAULTS).
 */
PBG.frameStyleOf = function (design) {
  var d = design && typeof design === "object" && !Array.isArray(design) ? design : {};
  var hex = function (v, def) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : def; };
  var D = PBG.DEFAULTS;
  return {
    ringColor: hex(d.ringColor, D.ringColor), ringColor2: hex(d.ringColor2, D.ringColor2),
    gradient: typeof d.gradient === "boolean" ? d.gradient : D.gradient,
    font: typeof d.font === "string" && PBG.fontById(d.font).id === d.font ? d.font : D.font,
    bold: typeof d.bold === "boolean" ? d.bold : D.bold,
    textColor: hex(d.textColor, D.textColor),
    text: typeof d.text === "string" && d.text.length <= 60 ? d.text : D.text
  };
};

/** Frühere automatische Textfarbe (Version 1), exakt nachgebildet. */
PBG.legacyTextColor = function (frameText, b, f) {
  var U = PBG.util;
  var cols;
  if (b.bgColor === "transparent") return frameText;
  if (b.bgColor === "custom") cols = [b.color1, b.gradient ? b.color2 : b.color1];
  else if (PBG.BANNER_SOLID[b.bgColor]) cols = [PBG.BANNER_SOLID[b.bgColor], PBG.BANNER_SOLID[b.bgColor]];
  else cols = [f.ringColor, f.gradient ? f.ringColor2 : f.ringColor];
  var bgs = cols[0] === cols[1] ? [cols[0]] : cols;
  var worst = function (c) { return Math.min.apply(null, bgs.map(function (x) { return U.contrast(c, x); })); };
  if (worst(frameText) >= 3) return frameText;
  return worst("#ffffff") >= worst("#111827") ? "#ffffff" : "#111827";
};

/**
 * Banner-Vorlagen Texte je Sprache ({year} = aktuelles Jahr), values = Banner-Einstellungen
 * (siehe PBG.BANNER_DEFAULTS; Format, Schrift, Textfarbe und Logo bleiben beim Übernehmen erhalten). occasionOf = Schlüssel einer
 * Anlass-Rahmenvorlage, deren Zeitfenster gilt („Gerade passend“). Eigene Gestaltung – keine Standard-Optik bekannter Netzwerke.
 */
PBG.BANNER_GROUPS = ["job", "recruiting", "freelance", "company", "occasion"];
PBG.BANNER_PRESETS = [
  { key: "b-job-klar", group: "job", name: { de: "Klar & hell", en: "Clear & bright" },
    title: { de: "Bereit für neue Aufgaben", en: "Ready for new challenges" },
    subtitle: { de: "Marketing · Kommunikation · Social Media", en: "Marketing · Communications · Social media" },
    extra: { de: "Braunschweig · offen für Remote", en: "Braunschweig · remote possible" },
    values: { bgColor: "custom", color1: "#fff4dc", gradient: false, bg: "dots", align: "left", extraIcon: "pin" } },
  { key: "b-job-mutig", group: "job", name: { de: "Mutig", en: "Bold" },
    title: { de: "Suche neue Herausforderung", en: "Looking for my next challenge" },
    subtitle: { de: "Projektmanagement · 8 Jahre Erfahrung", en: "Project management · 8 years' experience" },
    extra: { de: "kontakt@beispiel.de", en: "hello@example.com" },
    values: { bgColor: "custom", color1: "#ff6f00", color2: "#d81b60", gradient: true, gradDir: "h", bg: "lines", align: "right", logoPos: "end", extraIcon: "mail" } },
  { key: "b-rec-team", group: "recruiting", name: { de: "Wir wachsen", en: "We're growing" },
    title: { de: "Komm in unser Team", en: "Join our team" },
    subtitle: { de: "Entwicklung · Design · Vertrieb", en: "Engineering · Design · Sales" },
    extra: { de: "beispiel.de/karriere", en: "example.com/careers" },
    values: { bgColor: "custom", color1: "#0d1b3e", color2: "#1565c0", gradient: true, gradDir: "v", bg: "waves", align: "center", logoPos: "above", extraIcon: "globe" } },
  { key: "b-rec-pflege", group: "recruiting", name: { de: "Pflege", en: "Care team" },
    title: { de: "Wir suchen Pflegekräfte", en: "Nurses wanted" },
    subtitle: { de: "Unbefristet · Teilzeit oder Vollzeit · ab sofort", en: "Permanent · part- or full-time · start now" },
    extra: { de: "Braunschweig", en: "Braunschweig" },
    values: { bgColor: "custom", color1: "#e0f2f1", color2: "#a5d6c9", gradient: true, gradDir: "d", bg: "color", align: "left", logoPos: "tr", extraIcon: "pin", titleSize: 110 } },
  { key: "b-free-kreativ", group: "freelance", name: { de: "Kreativ", en: "Creative" },
    title: { de: "Freelance Designerin", en: "Freelance designer" },
    subtitle: { de: "Branding · Illustration · Webdesign", en: "Branding · Illustration · Web design" },
    extra: { de: "Verfügbar ab März", en: "Available from March" },
    values: { bgColor: "custom", color1: "#311b92", color2: "#ec407a", gradient: true, gradDir: "d", bg: "dots", align: "left", logoPos: "start", extraIcon: "calendar" } },
  { key: "b-free-beratung", group: "freelance", name: { de: "Beratung", en: "Consulting" },
    title: { de: "Steuerberatung für Kreative", en: "Tax advice for creatives" },
    subtitle: { de: "Klar, digital, persönlich", en: "Clear, digital, personal" },
    extra: { de: "Termine online buchbar", en: "Book appointments online" },
    values: { bgColor: "white", bg: "lines", align: "right", logoPos: "br", extraIcon: "calendar", titleSize: 90 } },
  { key: "b-firma-schlicht", group: "company", name: { de: "Firma schlicht", en: "Company plain" },
    title: { de: "Beispiel GmbH", en: "Example Ltd" },
    subtitle: { de: "Software für Handwerksbetriebe", en: "Software for trade businesses" },
    extra: { de: "beispiel.de", en: "example.com" },
    values: { bgColor: "lightgray", bg: "color", align: "left", logoPos: "start", logoSize: 130, extraIcon: "globe", titleSize: 115 } },
  { key: "b-firma-team", group: "company", name: { de: "Gemeinsam", en: "Together" },
    title: { de: "Gemeinsam besser", en: "Better together" },
    subtitle: { de: "Unser Team in Braunschweig, Hamburg und remote", en: "Our team in Braunschweig, Hamburg and remote" },
    values: { bgColor: "custom", color1: "#004d40", color2: "#00897b", gradient: true, gradDir: "h", bg: "waves", align: "center", logoPos: "tl" } },
  { key: "b-weihnachten", group: "occasion", occasionOf: "weihnachten", name: { de: "Weihnachten", en: "Christmas" },
    title: { de: "Frohe Weihnachten", en: "Merry Christmas" },
    subtitle: { de: "Danke für ein tolles Jahr – ab dem 2. Januar sind wir wieder für euch da", en: "Thank you for a great year – we're back on 2 January" },
    values: { bgColor: "custom", color1: "#7f0000", color2: "#c62828", gradient: true, gradDir: "d", bg: "dots", align: "center", logoPos: "above", subtitleSize: 90 } },
  { key: "b-jahreswechsel", group: "occasion", occasionOf: "jahreswechsel", name: { de: "Jahreswechsel", en: "New Year" },
    title: { de: "Frohes neues Jahr", en: "Happy New Year" },
    subtitle: { de: "Auf neue Ideen und gemeinsame Projekte", en: "Here's to new ideas and shared projects" },
    values: { bgColor: "custom", color1: "#0d1b3e", color2: "#3949ab", gradient: true, gradDir: "h", bg: "waves", align: "right", logoPos: "end", titleSize: 120 } },
  { key: "b-azubi", group: "occasion", occasionOf: "azubi-start", name: { de: "Ausbildungsbeginn", en: "Apprenticeship start" },
    title: { de: "Azubi seit {year}", en: "Apprentice since {year}" },
    subtitle: { de: "Ausbildung zur Kauffrau für Büromanagement", en: "Training in office management" },
    extra: { de: "Beispiel GmbH · Braunschweig", en: "Example Ltd · Braunschweig" },
    values: { bgColor: "custom", color1: "#0277bd", color2: "#26c6da", gradient: true, gradDir: "d", bg: "lines", align: "left", extraIcon: "pin" } },
  { key: "b-messe", group: "occasion", occasionOf: "messe", name: { de: "Messe", en: "Trade fair" },
    title: { de: "Triff mich auf der Messe", en: "Meet me at the fair" },
    subtitle: { de: "Halle 4 · Stand B12 · 12.–15. März", en: "Hall 4 · Stand B12 · 12–15 March" },
    extra: { de: "Termin vereinbaren: kontakt@beispiel.de", en: "Book a meeting: hello@example.com" },
    values: { bgColor: "custom", color1: "#263238", gradient: false, bg: "dots", align: "left", logoPos: "tr", extraIcon: "mail" } }
];

PBG.bannerPresetByKey = function (key) {
  for (var i = 0; i < PBG.BANNER_PRESETS.length; i++) if (PBG.BANNER_PRESETS[i].key === key) return PBG.BANNER_PRESETS[i];
  return null;
};

/** Liegt das Datum im Zeitfenster des zugehörigen Anlass-Rahmens? */
PBG.isBannerOccasionNow = function (bp, date) {
  return !!(bp && bp.occasionOf && PBG.isOccasionNow(PBG.presetByKey(bp.occasionOf), date));
};

