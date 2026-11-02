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

/** Einstellungen, die eine Vorlage ausmachen (werden gespeichert / geteilt). */
PBG.DESIGN_KEYS = ["text", "font", "size", "bold", "uppercase", "spacing", "textPos", "textColor", "ringColor",
  "ringColor2", "gradient", "ringWidth", "ringLength", "ringRotation", "fade", "opacity", "icon", "iconPos", "logoPos", "logoSize"];

/**
 * Vorlagen. key = URL-Slug (/vorlage/<key>/). name/text je Sprache.
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
    values: { gradient: true, ringColor: "#004d40", ringColor2: "#1565c0", font: "Raleway", uppercase: false, icon: "calendar", iconPos: "start", ringLength: 280 } },
  { key: "ruhestand", name: { de: "Ruhestand", en: "Retired" }, text: { de: "Im Ruhestand", en: "Retired" },
    values: { gradient: true, ringColor: "#5d4037", ringColor2: "#a1887f", font: "Playfair Display", uppercase: false, icon: "leaf", iconPos: "end" } }
];

PBG.presetByKey = function (key) {
  for (var i = 0; i < PBG.PRESETS.length; i++) if (PBG.PRESETS[i].key === key) return PBG.PRESETS[i];
  return null;
};
