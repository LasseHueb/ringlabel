window.PBG = window.PBG || {};

/**
 * Schriftarten (lokal in /fonts, siehe css/fonts.css).
 * label: Text oder {de, en}; weights: verfügbare Schriftschnitte – Schriften ohne 700 ignorieren "Fett".
 */
PBG.FONTS = [
  { id: "Montserrat", label: "Montserrat", weights: [400, 700] },
  { id: "Poppins", label: "Poppins", weights: [400, 700] },
  { id: "Oswald", label: { de: "Oswald (schmal)", en: "Oswald (condensed)" }, weights: [400, 700] },
  { id: "Raleway", label: "Raleway", weights: [400, 700] },
  { id: "Nunito", label: { de: "Nunito (rund)", en: "Nunito (rounded)" }, weights: [400, 700] },
  { id: "Roboto Slab", label: { de: "Roboto Slab (Serife)", en: "Roboto Slab (serif)" }, weights: [400, 700] },
  { id: "Playfair Display", label: "Playfair Display (elegant)", weights: [400, 700] },
  { id: "Space Grotesk", label: { de: "Space Grotesk (Tech)", en: "Space Grotesk (tech)" }, weights: [400, 700] },
  { id: "Caveat", label: { de: "Caveat (Handschrift)", en: "Caveat (handwritten)" }, weights: [400, 700] },
  { id: "Bebas Neue", label: { de: "Bebas Neue (Plakat)", en: "Bebas Neue (poster)" }, weights: [400] },
  { id: "Archivo Black", label: { de: "Archivo Black (kräftig)", en: "Archivo Black (bold)" }, weights: [400] }
];

PBG.fontById = function (id) {
  for (var i = 0; i < PBG.FONTS.length; i++) if (PBG.FONTS[i].id === id) return PBG.FONTS[i];
  return PBG.FONTS[0];
};

/** Standardwerte – alle Maße relativ zur Bildgröße, damit Vorschau und Export identisch sind. */
PBG.DEFAULTS = {
  text: "",
  textTop: "",       // zweiter Text oben (Bogen und voller Ring), höchstens 40 Zeichen
  sizeTop: 60,       // Schriftgröße des Texts oben in % der Ringbreite
  shape: "arc",      // Form: arc (Bogen) | ring (voller Ring) | badge (Schild unten)
  font: "Montserrat",
  size: 70,          // Schriftgröße in % der Ringbreite
  bold: true,
  uppercase: true,
  spacing: 8,        // Buchstabenabstand in % der Schriftgröße
  textPos: 0,        // Verschiebung des Texts entlang des Rings in Grad
  textColor: "#ffffff",
  ringColor: "#1a5ccc",
  ringColor2: "#5a9bff",
  gradient: false,   // Farbverlauf mit ringColor2
  ringWidth: 17,     // in % des Radius
  ringLength: 220,   // Bogenlänge in Grad (180 = Halbkreis, 350 = fast voll)
  ringRotation: 0,   // Drehung des Bogens in Grad (0 = mittig unten, positiv = nach links)
  fade: 30,          // Länge des weichen Übergangs an den Enden in Grad
  opacity: 100,      // Deckkraft des Rings in %
  icon: "",          // Symbol-ID aus PBG.ICONS
  iconPos: "start",  // start | end | both
  logoPos: "end",    // Logo: start (links vom Text) | end (rechts vom Text) | replace (statt Text)
  logoSize: 80,      // Logohöhe in % der Ringbreite
  bg: "transparent"
};

/**
 * Profil-Banner (public/js/banner.js). Formate neutral benannt; safe = Bereich unten links (Anteile von Breite/Höhe),
 * den das Profilbild auf vielen Plattformen verdecken kann.
 */
PBG.BANNER_FORMATS = {
  "4x1": { w: 1584, h: 396, safe: { w: 0.27, y: 0.36 } },
  "3x1": { w: 1500, h: 500, safe: { w: 0.25, y: 0.4 } },
  "16x9": { w: 1920, h: 1080, safe: { w: 0.2, y: 0.6 }, textScale: 1.35 }
};

/**
 * Banner-Einstellungen (gespeichert in eigenen Vorlagen, Dateien und – nur Abweichungen vom Standard – in Design-Links;
 * nie Hintergrundbild oder Logo-Bild). Die Standardwerte ergeben genau das Banner früherer Versionen:
 *   bgColor "frame" = Farbe/Verlauf des Rings, logo "frame" = Logo des Rahmens, logoPos "auto" = Logo je nach
 *   Ausrichtung links/rechts neben bzw. über dem Text, Schriftgrößen 100 %, keine Zusatzzeile.
 */
PBG.BANNER_DEFAULTS = {
  format: "4x1", title: "", subtitle: "", align: "left", bg: "color",
  bgColor: "frame",          // frame | custom | white | lightgray | transparent
  color1: "#1a5ccc", color2: "#5a9bff", gradient: false,
  gradDir: "d",              // Verlauf bei eigener Farbe: h (waagerecht) | v (senkrecht) | d (diagonal)
  logo: "frame",             // frame (wie im Rahmen) | own (eigenes Logo) | none
  logoPos: "auto",           // auto | start | end | above | tl | tr | br  (Ecke unten links ist der Bereich des Profilbilds)
  logoSize: 100,             // % der Standardgröße
  extra: "", extraIcon: "",  // Zusatzzeile (z. B. Website, Kontakt, Ort) mit optionalem Symbol
  titleSize: 100, subtitleSize: 100, extraSize: 100,  // Schriftgrößen in %
  font: "",                  // "" = Schrift des Rahmens, sonst Schrift-ID
  bold: "frame",             // Überschrift: frame (wie im Rahmen) | bold | regular
  textColor: ""              // "" = automatisch (Textfarbe des Rahmens, bei zu wenig Kontrast Weiß/Schwarz), sonst #rrggbb
};
PBG.BANNER_CHOICES = {
  format: ["4x1", "3x1", "16x9"], align: ["left", "center", "right"], bg: ["color", "dots", "lines", "waves"],
  bgColor: ["frame", "custom", "white", "lightgray", "transparent"], gradDir: ["h", "v", "d"],
  logo: ["frame", "own", "none"], logoPos: ["auto", "start", "end", "above", "tl", "tr", "br"], bold: ["frame", "bold", "regular"]
};
PBG.BANNER_MAX = { title: 60, subtitle: 100, extra: 80 };
PBG.BANNER_RANGES = { logoSize: [40, 200], titleSize: [50, 150], subtitleSize: [50, 150], extraSize: [50, 150] };
PBG.BANNER_COLORS = ["color1", "color2"];
PBG.BANNER_FLAGS = ["gradient"];
/** Feste Hintergrundfarben der Schnellwahl. */
PBG.BANNER_SOLID = { white: "#ffffff", lightgray: "#eceff3" };

/** Prüft einen einzelnen Banner-Wert; gibt den bereinigten Wert oder undefined zurück. */
PBG.validBannerValue = function (k, v) {
  if (PBG.BANNER_CHOICES[k]) return PBG.BANNER_CHOICES[k].indexOf(v) >= 0 ? v : undefined;
  if (PBG.BANNER_MAX[k]) return typeof v === "string" && v.length <= PBG.BANNER_MAX[k] ? v : undefined;
  if (PBG.BANNER_RANGES[k]) return typeof v === "number" && isFinite(v) && v >= PBG.BANNER_RANGES[k][0] && v <= PBG.BANNER_RANGES[k][1] ? v : undefined;
  if (PBG.BANNER_COLORS.indexOf(k) >= 0) return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined;
  if (PBG.BANNER_FLAGS.indexOf(k) >= 0) return typeof v === "boolean" ? v : undefined;
  if (k === "extraIcon") return v === "" || (typeof v === "string" && !!PBG.iconById && !!PBG.iconById(v)) ? v : undefined;
  if (k === "font") return v === "" || (typeof v === "string" && PBG.fontById(v).id === v) ? v : undefined;
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

/** Nur die vom Standard abweichenden Banner-Einstellungen (für kurze Design-Links); null, wenn alles Standard ist. */
PBG.bannerDiff = function (b) {
  var out = {};
  Object.keys(PBG.BANNER_DEFAULTS).forEach(function (k) { if (b && b[k] !== undefined && b[k] !== PBG.BANNER_DEFAULTS[k]) out[k] = b[k]; });
  return Object.keys(out).length ? out : null;
};

/** Einstellungen, die eine Vorlage ausmachen (werden gespeichert / geteilt). */
PBG.DESIGN_KEYS = ["text", "font", "size", "bold", "uppercase", "spacing", "textPos", "textColor", "ringColor",
  "ringColor2", "gradient", "ringWidth", "ringLength", "ringRotation", "fade", "opacity", "icon", "iconPos", "logoPos", "logoSize",
  "shape", "textTop", "sizeTop"];

/**
 * Vorlagen. key = URL-Slug (/vorlage/<key>/). name/text (und optional textTop) je Sprache; {year} im Text wird durch
 * das aktuelle Jahr ersetzt. occasion = Zeitfenster eines Anlasses (siehe PBG.isOccasionNow) – solche Vorlagen stehen
 * in der Gruppe „Anlässe“ und im Zeitfenster oben unter „Gerade passend“.
 * Die ersten Vorlagen sind bewusst schlicht (kein Verlauf, Standardschriften, keine Symbole).
 * Keine Logos, Markennamen oder Original-Farbtöne fremder Plattformen.
 */
PBG.PRESETS = [
  // ---------- schlicht ----------
  { key: "jobsuche", name: { de: "Jobsuche", en: "Job search" }, text: { de: "Bereit für Neues", en: "Ready for new roles" },
    values: { ringColor: "#f5b301", textColor: "#1f2937", font: "Montserrat", uppercase: false, ringRotation: 0, ringLength: 220 } },
  { key: "recruiting", name: { de: "Recruiting", en: "Recruiting" }, text: { de: "Wir suchen dich", en: "We're looking for you" },
    values: { ringColor: "#14b8a6", textColor: "#0f172a", font: "Montserrat", uppercase: false, ringRotation: 0, ringLength: 220 } },
  { key: "freelancer", name: { de: "Freelancer", en: "Freelancer" }, text: { de: "Freelancer", en: "Freelancer" },
    values: { ringColor: "#e65100", font: "Poppins", ringRotation: 0, ringLength: 220 } },
  { key: "projekte", name: { de: "Verfügbar für Projekte", en: "Available for projects" }, text: { de: "Verfügbar für Projekte", en: "Available for projects" },
    values: { ringColor: "#00695c", font: "Oswald", ringRotation: 0, ringLength: 290, spacing: 6 } },
  { key: "selbststaendig", name: { de: "Selbstständig", en: "Self-employed" }, text: { de: "#SELBSTSTÄNDIG", en: "#SELFEMPLOYED" },
    values: { ringColor: "#37474f", textColor: "#ffd54f", font: "Montserrat", ringRotation: 0, ringLength: 250 } },
  { key: "mentoring", name: { de: "Mentoring", en: "Mentoring" }, text: { de: "#MENTORING", en: "#MENTORING" },
    values: { ringColor: "#1546a0", font: "Nunito", ringRotation: 0, ringLength: 240 } },
  { key: "speaker", name: { de: "Speaker", en: "Speaker" }, text: { de: "#SPEAKER", en: "#SPEAKER" },
    values: { ringColor: "#b71c1c", font: "Raleway", ringRotation: -35, ringLength: 230 } },
  { key: "ausbildung", name: { de: "Ausbildung", en: "Apprenticeship" }, text: { de: "#SUCHEAUSBILDUNG", en: "#APPRENTICESHIP" },
    values: { ringColor: "#1a237e", textColor: "#ffd54f", font: "Roboto Slab", ringRotation: 0, ringLength: 270 } },
  { key: "ehrenamt", name: { de: "Ehrenamt", en: "Volunteering" }, text: { de: "#EHRENAMT", en: "#VOLUNTEERING" },
    values: { ringColor: "#ad1457", font: "Poppins", ringRotation: 0, ringLength: 240 } },

  // ---------- mit Verlauf, Zusatzschriften und Symbolen ----------
  { key: "jobsuche-sonnenuntergang", name: { de: "Jobsuche Sunset", en: "Job search sunset" }, text: { de: "Bereit für Neues", en: "Ready for new roles" },
    values: { gradient: true, ringColor: "#f4511e", ringColor2: "#d81b60", font: "Montserrat", icon: "sparkle", iconPos: "start" } },
  { key: "jobsuche-ozean", name: { de: "Jobsuche Ozean", en: "Job search ocean" }, text: { de: "Suche neue Herausforderung", en: "Looking for new roles" },
    values: { gradient: true, ringColor: "#0277bd", ringColor2: "#00bfa5", font: "Space Grotesk", uppercase: false, ringLength: 270 } },
  { key: "recruiting-neon", name: { de: "Recruiting Neon", en: "Recruiting neon" }, text: { de: "Jetzt bewerben", en: "Apply now" },
    values: { gradient: true, ringColor: "#6a1b9a", ringColor2: "#ff4081", font: "Space Grotesk", icon: "rocket", iconPos: "end" } },
  { key: "recruiting-gold", name: { de: "Recruiting Gold", en: "Recruiting gold" }, text: { de: "Wir stellen ein", en: "Join us" },
    values: { ringColor: "#0d1b3e", textColor: "#f5c451", font: "Playfair Display", uppercase: false, spacing: 4, icon: "star", iconPos: "both" } },
  { key: "team-gesucht", name: { de: "Komm ins Team", en: "Join the team" }, text: { de: "Komm in unser Team", en: "Join our team" },
    values: { gradient: true, ringColor: "#00897b", ringColor2: "#43a047", font: "Poppins", uppercase: false, icon: "rocket", iconPos: "start", ringLength: 260 } },
  { key: "freelancer-kreativ", name: { de: "Freelancer kreativ", en: "Creative freelancer" }, text: { de: "Freelancerin · Design", en: "Freelance · Design" },
    values: { gradient: true, ringColor: "#ff6f00", ringColor2: "#ec407a", font: "Caveat", uppercase: false, size: 85, spacing: 2, ringLength: 260 } },
  { key: "freelancer-tech", name: { de: "Freelancer Tech", en: "Freelancer tech" }, text: { de: "Freelance Developer", en: "Freelance Developer" },
    values: { gradient: true, ringColor: "#102027", ringColor2: "#00c853", font: "Space Grotesk", icon: "code", iconPos: "start", ringLength: 270 } },
  { key: "ab-sofort-verfuegbar", name: { de: "Ab sofort verfügbar", en: "Available now" }, text: { de: "Ab sofort verfügbar", en: "Available now" },
    values: { gradient: true, ringColor: "#0277bd", ringColor2: "#26c6da", font: "Poppins", icon: "check", iconPos: "start", ringLength: 260 } },
  { key: "gruendung", name: { de: "Gründer:in", en: "Founder" }, text: { de: "GRÜNDER:IN", en: "FOUNDER" },
    values: { gradient: true, ringColor: "#311b92", ringColor2: "#00b0ff", font: "Bebas Neue", size: 85, spacing: 12, icon: "rocket", iconPos: "end" } },
  { key: "mentoring-ideen", name: { de: "Mentoring Ideen", en: "Mentoring ideas" }, text: { de: "Mentor:in für Einsteiger", en: "Mentor for juniors" },
    values: { gradient: true, ringColor: "#f9a825", ringColor2: "#ef6c00", textColor: "#1b1b1b", font: "Nunito", uppercase: false, icon: "bulb", iconPos: "start", ringLength: 270 } },
  { key: "speaker-buehne", name: { de: "Speaker Bühne", en: "Speaker stage" }, text: { de: "Speaker & Trainer", en: "Speaker & Trainer" },
    values: { gradient: true, ringColor: "#b71c1c", ringColor2: "#4a148c", font: "Archivo Black", uppercase: true, size: 62, icon: "mic", iconPos: "start", ringLength: 260 } },
  { key: "coach", name: { de: "Business Coach", en: "Business coach" }, text: { de: "Business Coach", en: "Business Coach" },
    values: { ringColor: "#263238", textColor: "#80cbc4", font: "Playfair Display", uppercase: false, icon: "sparkle", iconPos: "both" } },
  { key: "ehrenamt-herz", name: { de: "Ehrenamt Herz", en: "Volunteer heart" }, text: { de: "Ehrenamtlich aktiv", en: "Volunteering" },
    values: { gradient: true, ringColor: "#c2185b", ringColor2: "#ff7043", font: "Poppins", uppercase: false, icon: "heart", iconPos: "both", ringLength: 260 } },
  { key: "nachhaltigkeit", name: { de: "Nachhaltigkeit", en: "Sustainability" }, text: { de: "Nachhaltig handeln", en: "Act sustainably" },
    values: { gradient: true, ringColor: "#1b5e20", ringColor2: "#8bc34a", font: "Montserrat", uppercase: false, icon: "leaf", iconPos: "start" } },
  { key: "werkstudent", name: { de: "Werkstudent:in", en: "Working student" }, text: { de: "Suche Werkstudentenjob", en: "Looking for student job" },
    values: { gradient: true, ringColor: "#0d47a1", ringColor2: "#7c4dff", font: "Poppins", uppercase: false, icon: "briefcase", iconPos: "start", ringLength: 280 } },
  { key: "praktikum", name: { de: "Praktikum", en: "Internship" }, text: { de: "#SUCHEPRAKTIKUM", en: "#INTERNSHIP" },
    values: { gradient: true, ringColor: "#006064", ringColor2: "#26c6da", font: "Montserrat", icon: "star", iconPos: "end" } },
  { key: "elternzeit", name: { de: "Elternzeit", en: "Parental leave" }, text: { de: "Gerade in Elternzeit", en: "On parental leave" },
    values: { gradient: true, ringColor: "#8e24aa", ringColor2: "#f48fb1", font: "Nunito", uppercase: false, icon: "heart", iconPos: "end", ringLength: 260 } },
  { key: "remote", name: { de: "Remote", en: "Remote" }, text: { de: "#REMOTE", en: "#REMOTE" },
    values: { gradient: true, ringColor: "#283593", ringColor2: "#00acc1", font: "Space Grotesk", icon: "globe", iconPos: "start" } },
  { key: "vernetzen", name: { de: "Lass uns vernetzen", en: "Let's connect" }, text: { de: "Lass uns vernetzen", en: "Let's connect" },
    values: { gradient: true, ringColor: "#3949ab", ringColor2: "#1e88e5", font: "Poppins", uppercase: false, icon: "link", iconPos: "end", ringLength: 260 } },
  { key: "jubilaeum", name: { de: "Jubiläum", en: "Anniversary" }, text: { de: "10 Jahre dabei", en: "10 years on board" },
    values: { ringColor: "#3e2723", textColor: "#ffd54f", font: "Playfair Display", uppercase: false, icon: "star", iconPos: "both" } },
  { key: "neuer-job", name: { de: "Neuer Job", en: "New job" }, text: { de: "#NEUERJOB", en: "#NEWJOB" },
    values: { gradient: true, ringColor: "#ff6d00", ringColor2: "#ffd600", textColor: "#1b1b1b", font: "Archivo Black", size: 62, icon: "sparkle", iconPos: "both" } },
  { key: "messe", name: { de: "Messe & Events", en: "Trade fair" }, text: { de: "Triff mich auf der Messe", en: "Meet me at the fair" },
    occasion: ["02-15/04-30", "09-01/11-15"],
    values: { gradient: true, ringColor: "#004d40", ringColor2: "#1565c0", font: "Raleway", uppercase: false, icon: "calendar", iconPos: "start", ringLength: 280 } },
  // ---------- Formen: Bogen mit Text oben, voller Ring, Badge ----------
  { key: "neue-wege", name: { de: "Neue Wege", en: "New paths" }, text: { de: "Neue Wege", en: "New paths" },
    textTop: { de: "Mein nächstes Kapitel", en: "My next chapter" },
    values: { gradient: true, ringColor: "#1565c0", ringColor2: "#00897b", font: "Montserrat", uppercase: false, sizeTop: 55, ringLength: 230, icon: "sparkle", iconPos: "end" } },
  { key: "austausch", name: { de: "Austausch", en: "Let's talk" }, text: { de: "Ich freue mich auf Austausch", en: "Always happy to exchange ideas" },
    textTop: { de: "Hallo!", en: "Hello!" },
    values: { shape: "ring", gradient: true, ringColor: "#6a1b9a", ringColor2: "#ec407a", font: "Poppins", uppercase: false, ringWidth: 15, sizeTop: 60 } },
  { key: "badge-neugierig", name: { de: "Badge Neugierig", en: "Curious badge" }, text: { de: "Immer neugierig", en: "Always curious" },
    values: { shape: "badge", ringColor: "#263238", textColor: "#ffd54f", font: "Poppins", uppercase: false, ringWidth: 18, size: 60, icon: "bulb", iconPos: "start" } },

  // ---------- Anlässe: Zeitfenster "MM-TT/MM-TT" (über den Jahreswechsel möglich) oder relativ zu Ostern ----------
  { key: "weihnachten", name: { de: "Weihnachten", en: "Christmas" }, text: { de: "Frohe Weihnachten", en: "Merry Christmas" },
    occasion: ["12-01/12-26"],
    values: { shape: "ring", gradient: true, ringColor: "#7f0000", ringColor2: "#c62828", textColor: "#fff8e1", font: "Playfair Display", uppercase: false, ringWidth: 16, icon: "tree", iconPos: "both" } },
  { key: "jahreswechsel", name: { de: "Jahreswechsel", en: "New Year" }, text: { de: "Frohes neues Jahr", en: "Happy New Year" },
    occasion: ["12-27/01-10"],
    values: { gradient: true, ringColor: "#0d1b3e", ringColor2: "#3949ab", textColor: "#ffd54f", font: "Bebas Neue", size: 85, spacing: 12, ringLength: 240, icon: "glass", iconPos: "both" } },
  { key: "ostern", name: { de: "Ostern", en: "Easter" }, text: { de: "Frohe Ostern", en: "Happy Easter" },
    occasion: ["easter-14/easter+1"],
    values: { shape: "badge", ringColor: "#fff1b8", textColor: "#5d4037", font: "Nunito", uppercase: false, ringWidth: 19, size: 64, icon: "egg", iconPos: "start" } },
  { key: "azubi-start", name: { de: "Ausbildungsbeginn", en: "Starting an apprenticeship" }, text: { de: "Azubi seit {year}", en: "Apprentice since {year}" },
    textTop: { de: "Los geht's!", en: "Here we go!" },
    occasion: ["08-01/09-30"],
    values: { gradient: true, ringColor: "#0277bd", ringColor2: "#26c6da", font: "Poppins", uppercase: false, ringLength: 230, sizeTop: 55, icon: "rocket", iconPos: "end" } },
  { key: "ausbildung-geschafft", name: { de: "Ausbildung geschafft", en: "Apprenticeship completed" }, text: { de: "Ausbildung geschafft", en: "Apprenticeship completed" },
    occasion: ["01-15/02-28", "06-01/07-31"],
    values: { shape: "ring", gradient: true, ringColor: "#f9a825", ringColor2: "#ff6f00", textColor: "#1b1b1b", font: "Montserrat", uppercase: false, ringWidth: 15, icon: "gradcap", iconPos: "start" } },
  { key: "neues-jahr-ziele", name: { de: "Neues Jahr im Job", en: "New year at work" }, text: { de: "Neues Jahr, neue Ziele", en: "New year, new goals" },
    occasion: ["01-02/01-31"],
    values: { shape: "badge", gradient: true, ringColor: "#1a237e", ringColor2: "#00838f", font: "Oswald", uppercase: false, ringWidth: 18, size: 60, spacing: 3, icon: "target", iconPos: "start" } },
  { key: "sommerpause", name: { de: "Sommerpause", en: "Summer break" }, text: { de: "Gerade im Urlaub", en: "Currently on holiday" },
    occasion: ["07-01/08-31"],
    values: { gradient: true, ringColor: "#ff8f00", ringColor2: "#ffca28", textColor: "#3e2723", font: "Caveat", uppercase: false, size: 88, spacing: 2, ringLength: 230, ringRotation: -20, icon: "sun", iconPos: "start" } },

  { key: "ruhestand", name: { de: "Ruhestand", en: "Retired" }, text: { de: "Im Ruhestand", en: "Retired" },
    values: { gradient: true, ringColor: "#5d4037", ringColor2: "#a1887f", font: "Playfair Display", uppercase: false, icon: "leaf", iconPos: "end" } }
];

/**
 * Banner-Vorlagen (Abschnitt „Profil-Banner“). Texte je Sprache ({year} = aktuelles Jahr), values = Banner-Einstellungen
 * (siehe PBG.BANNER_DEFAULTS; Format und Logo-Art bleiben beim Übernehmen erhalten). occasionOf = Schlüssel einer
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

/**
 * Heutiges Datum für „Gerade passend“: das Datum des Geräts. Nur auf localhost lässt sich zum Testen ein Datum
 * simulieren: ?datum=JJJJ-MM-TT.
 */
PBG.today = function () {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    var m = /[?&]datum=(\d{4})-(\d{2})-(\d{2})(?:&|$)/.exec(location.search);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12);
  }
  return new Date();
};

/** Ostersonntag (gregorianisch, Algorithmus nach Meeus/Jones/Butcher). */
PBG.easter = function (y) {
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  var n = h + l - 7 * m + 114;
  return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1, 12);
};

/**
 * Liegt date in einem der Zeitfenster der Vorlage? Fenster (jeweils einschließlich):
 *   "12-01/12-26"         Monat-Tag bis Monat-Tag; "12-27/01-10" läuft über den Jahreswechsel
 *   "easter-14/easter+1"  Tage relativ zum Ostersonntag des Jahres von date
 */
PBG.isOccasionNow = function (p, date) {
  if (!p || !p.occasion) return false;
  var day = function (d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  var today = day(date), y = date.getFullYear();
  var point = function (spec) {
    var e = /^easter([+-]\d+)?$/.exec(spec);
    if (e) return day(PBG.easter(y)) + (e[1] ? parseInt(e[1], 10) : 0);
    var md = /^(\d{2})-(\d{2})$/.exec(spec);
    return md ? day(new Date(y, +md[1] - 1, +md[2], 12)) : NaN;
  };
  return p.occasion.some(function (w) {
    var parts = w.split("/"), from = point(parts[0]), to = point(parts[1]);
    if (isNaN(from) || isNaN(to)) return false;
    return from <= to ? today >= from && today <= to : today >= from || today <= to;
  });
};

/** Text einer Vorlage in der aktuellen Sprache, {year} = aktuelles Jahr. */
PBG.presetText = function (p, field, date) {
  return PBG.loc(p[field]).replace(/\{year\}/g, String((date || PBG.today()).getFullYear()));
};

PBG.presetByKey = function (key) {
  for (var i = 0; i < PBG.PRESETS.length; i++) if (PBG.PRESETS[i].key === key) return PBG.PRESETS[i];
  return null;
};
