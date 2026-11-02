window.PBG = window.PBG || {};

/*
 * Symbole für den Ring. 24×24-Pfade; "stroke" = als Linie zeichnen.
 * Teilweise angelehnt an Material Icons (Apache License 2.0); die Symbole für Anlässe sind selbst gezeichnet.
 */
PBG.ICONS = [
  { id: "star", label: { de: "Stern", en: "Star" }, d: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
  { id: "sparkle", label: { de: "Funkeln", en: "Sparkle" }, d: "M12 1.5l2.4 8.1L22.5 12l-8.1 2.4L12 22.5l-2.4-8.1L1.5 12l8.1-2.4z" },
  { id: "heart", label: { de: "Herz", en: "Heart" }, d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { id: "check", label: { de: "Haken", en: "Check" }, d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" },
  { id: "rocket", label: { de: "Rakete", en: "Rocket" }, evenodd: true,
    d: "M12 1.5c3.2 2.6 4.8 6.3 4.8 10.6V16H7.2v-3.9C7.2 7.8 8.8 4.1 12 1.5zM12 6.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 1 0 0-3.8zM7.2 12.5L4 15.7v3.6l3.2-1.6zM16.8 12.5l3.2 3.2v3.6l-3.2-1.6zM9.6 17h4.8L12 22.5z" },
  { id: "bulb", label: { de: "Idee", en: "Idea" }, d: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" },
  { id: "leaf", label: { de: "Blatt", en: "Leaf" }, d: "M21 3C9.5 3 3.5 8.6 3.5 15.6c0 1.5.4 2.9 1 4.1L2.8 21.4l1.1 1.1 1.7-1.7c1.3.8 2.9 1.2 4.6 1.2C17.8 22 21 13.6 21 3zM7.4 18.3c2.2-4.7 5.3-7.9 9.6-10.3-3.2 3.2-5.6 6.6-7.3 11z" },
  { id: "briefcase", label: { de: "Koffer", en: "Briefcase" }, d: "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" },
  { id: "mic", label: { de: "Mikrofon", en: "Microphone" }, d: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" },
  { id: "globe", label: { de: "Globus", en: "Globe" }, stroke: true,
    d: "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 1 0 0-19zM12 2.5c-2.6 2.6-3.9 5.8-3.9 9.5s1.3 6.9 3.9 9.5M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5M3 9h18M3 15h18" },
  { id: "calendar", label: { de: "Kalender", en: "Calendar" }, d: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" },
  { id: "link", label: { de: "Verbindung", en: "Link" }, stroke: true,
    d: "M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" },
  { id: "code", label: { de: "Code", en: "Code" }, stroke: true, d: "M8 6l-6 6 6 6M16 6l6 6-6 6M14 3.5l-4 17" },
  // ---------- Anlässe (selbst gezeichnet) ----------
  { id: "tree", label: { de: "Tannenbaum", en: "Fir tree" }, d: "M12 1.8l5.2 6.6h-2.6l4.6 6.1h-3l4.1 5.4H3.7l4.1-5.4h-3l4.6-6.1H6.8zM10.7 20h2.6v2.6h-2.6z" },
  { id: "snowflake", label: { de: "Schneeflocke", en: "Snowflake" }, stroke: true, d: "M12 12L12 2.5M12 6.2l1.93 -2.3M12 6.2l-1.93 -2.3M12 12L3.77 7.25M6.98 9.1l-1.03 -2.82M6.98 9.1l-2.95 0.52M12 12L3.77 16.75M6.98 14.9l-2.95 -0.52M6.98 14.9l-1.03 2.82M12 12L12 21.5M12 17.8l-1.93 2.3M12 17.8l1.93 2.3M12 12L20.23 16.75M17.02 14.9l1.03 2.82M17.02 14.9l2.95 -0.52M12 12L20.23 7.25M17.02 9.1l2.95 0.52M17.02 9.1l1.03 -2.82" },
  { id: "glass", label: { de: "Sektglas", en: "Glass of bubbly" }, stroke: true, d: "M9 2.5h6l-.6 7.2a2.4 2.4 0 0 1-4.8 0zM12 12.2V20.5M8.8 21h6.4M18 3.5l1.5-1M18.6 6.5h1.8M5.4 6.5H3.6M6 3.5l-1.5-1" },
  { id: "egg", label: { de: "Osterei", en: "Easter egg" }, evenodd: true, d: "M12 2.3c-3.7 0-6.6 6.3-6.6 11.2a6.6 6.6 0 0 0 13.2 0c0-4.9-2.9-11.2-6.6-11.2zM6.7 12.6l1.8-1.3 1.8 1.3 1.7-1.3 1.8 1.3 1.7-1.3 1.8 1.3v1.9l-1.8-1.3-1.7 1.3-1.8-1.3-1.7 1.3-1.8-1.3-1.8 1.3z" },
  { id: "gradcap", label: { de: "Abschlusshut", en: "Graduation cap" }, d: "M12 3.5L1.5 8.8 12 14.1l10.5-5.3zM6 11.6v4.6c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3v-4.6l-6 3zM20 9.8h1.3v6.4H20z" },
  { id: "sun", label: { de: "Sonne", en: "Sun" }, stroke: true, d: "M12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 1 0 0-8.4zM18.8 12L21.6 12M16.81 7.19L18.79 5.21M12 5.2L12 2.4M7.19 7.19L5.21 5.21M5.2 12L2.4 12M7.19 16.81L5.21 18.79M12 18.8L12 21.6M16.81 16.81L18.79 18.79" },
  { id: "mail", label: { de: "Brief", en: "Mail" }, stroke: true, d: "M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5" },
  { id: "pin", label: { de: "Ortsmarke", en: "Location pin" }, evenodd: true, d: "M12 2.2a7 7 0 0 0-7 7c0 5.1 7 12.6 7 12.6s7-7.5 7-12.6a7 7 0 0 0-7-7zM12 6.5a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 1 0 0-5.4z" },
  { id: "target", label: { de: "Ziel", en: "Target" }, stroke: true, d: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18zM12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 1 0 0-9.6zM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 1 0 0-1.6z" }
];

/** Emojis für die Schnellauswahl. */
PBG.EMOJIS = ["⭐", "✨", "🚀", "💼", "💡", "🎯", "🤝", "❤️", "🌱", "🌍", "🎓", "📣", "✅", "🔥", "👋", "🏳️‍🌈"];

PBG.iconById = function (id) {
  for (var i = 0; i < PBG.ICONS.length; i++) if (PBG.ICONS[i].id === id) return PBG.ICONS[i];
  return null;
};

PBG._iconPaths = {};
PBG.iconPath = function (icon) {
  if (!window.Path2D) return null;
  if (!PBG._iconPaths[icon.id]) PBG._iconPaths[icon.id] = new Path2D(icon.d);
  return PBG._iconPaths[icon.id];
};
