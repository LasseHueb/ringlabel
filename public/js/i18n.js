/*
 * Übersetzungen des Editors. Die Sprache folgt dem lang-Attribut der Seite
 * (<html lang="de"> auf /, <html lang="en"> auf /en/). Der Build übersetzt das Editor-Markup
 * (src/partials/editor.html) mit diesen Wörterbüchern schon vorab und bricht ab, wenn ein Schlüssel fehlt.
 * Platzhalter in {geschweiften Klammern} werden zur Laufzeit ersetzt.
 */
window.PBG = window.PBG || {};

PBG.I18N = {
  de: {
    "app.title": "Profilbild-Rahmen erstellen",
    "theme.label": "Farbschema",
    "theme.auto": "System",
    "theme.light": "Hell",
    "theme.dark": "Dunkel",
    "a11y.controls": "Einstellungen",
    "a11y.preview": "Vorschau",

    "preview.canvasLabel": "Vorschau des Profilbilds mit Ring. Text: {text}. Mit Pfeiltasten verschieben, mit Plus und Minus zoomen.",
    "preview.hint": "Ziehen zum Verschieben · Mausrad, Pinch oder +/− zum Zoomen · Pfeiltasten verschieben",

    "upload.heading": "1. Foto",
    "upload.drop": "Foto hierher ziehen oder",
    "upload.choose": "Datei auswählen",
    "upload.formats": "JPG, PNG, WebP oder HEIC – bleibt auf deinem Gerät",
    "upload.loading": "Foto wird geladen …",
    "upload.heicLoading": "HEIC-Foto wird umgewandelt …",
    "upload.error": "Dieses Bild konnte nicht geöffnet werden. Bitte versuche JPG, PNG oder WebP.",
    "upload.errorType": "Bitte wähle eine Bilddatei aus.",
    "upload.loaded": "Foto geladen: {name}",
    "upload.remove": "Foto entfernen",
    "crop.zoom": "Zoom",
    "crop.reset": "Ausschnitt zurücksetzen",

    "presets.heading": "2. Vorlage",
    "presets.hint": "Startpunkt wählen – danach alles frei anpassbar.",
    "presets.more": "Alle {count} Vorlagen anzeigen",
    "presets.less": "Weniger anzeigen",
    "presets.builtin": "Vorlagen",

    "own.heading": "Meine Vorlagen",
    "own.empty": "Noch keine eigenen Vorlagen. Gestalte deinen Rahmen und speichere ihn hier – auf diesem Gerät, ohne Foto.",
    "own.nameLabel": "Name der Vorlage",
    "own.namePlaceholder": "z. B. Team-Rahmen 2027",
    "own.save": "Als eigene Vorlage speichern",
    "own.saved": "„{name}“ wurde auf diesem Gerät gespeichert.",
    "own.nameMissing": "Bitte gib einen Namen für die Vorlage ein.",
    "own.apply": "Vorlage „{name}“ verwenden",
    "own.withLogo": "mit Logo",
    "own.rename": "Umbenennen",
    "own.renameLabel": "Neuer Name für „{name}“",
    "own.renameSave": "Speichern",
    "own.renameCancel": "Abbrechen",
    "own.renamed": "Vorlage umbenannt in „{name}“.",
    "own.export": "Als Datei exportieren",
    "own.exported": "„{name}“ wurde als Datei gespeichert.",
    "own.import": "Aus Datei importieren",
    "own.imported": "„{name}“ wurde importiert.",
    "own.importDropped": "Ungültige oder unbekannte Angaben wurden verworfen: {fields}.",
    "own.delete": "Löschen",
    "own.confirmDelete": "Vorlage „{name}“ wirklich löschen? Das lässt sich nicht rückgängig machen.",
    "own.deleted": "„{name}“ wurde gelöscht.",
    "own.limit": "Es sind höchstens {max} eigene Vorlagen möglich. Lösche zuerst eine alte Vorlage.",
    "own.errorFull": "Der Speicher deines Browsers ist voll. Lösche alte Vorlagen oder verwende ein kleineres Logo – oder exportiere die Vorlage als Datei.",
    "own.errorBlocked": "Dein Browser erlaubt keine lokale Speicherung (z. B. im privaten Modus). Exportiere die Vorlage stattdessen als Datei.",
    "own.errorFile": "Diese Datei ist keine gültige Vorlage.",
    "own.errorFileSize": "Die Datei ist zu groß (höchstens 1 MB).",
    "own.errorFileType": "Bitte eine Vorlagen-Datei im JSON-Format wählen.",
    "own.unnamed": "Importierte Vorlage",
    "own.filename": "ringlabel-vorlage",

    "link.copyDesign": "Link zu diesem Design kopieren",
    "link.copyOwn": "Link kopieren",
    "link.copyOwnLabel": "Link zu „{name}“ kopieren",
    "link.title": "Link zu diesem Design",
    "link.lead": "Wer den Link öffnet, hat sofort denselben Rahmen im Editor und setzt nur noch sein eigenes Foto ein. Dein Foto ist nicht im Link enthalten.",
    "link.fieldLabel": "Link",
    "link.copy": "Kopieren",
    "link.copied": "Link kopiert!",
    "link.copyFailed": "Automatisches Kopieren ist nicht möglich. Markiere den Link und kopiere ihn selbst.",
    "link.logoNote": "Das Logo ist nicht im Link enthalten. Teile es zusätzlich oder exportiere die Vorlage als Datei.",
    "link.loaded": "Design aus Link geladen.",
    "link.partial": "Einige Angaben im Link waren ungültig und wurden durch Standardwerte ersetzt: {fields}.",
    "link.unknown": "{count} unbekannte Angabe(n)",
    "link.save": "Als eigene Vorlage speichern",
    "link.defaultName": "Design aus Link",
    "link.errorInvalid": "Dieser Link enthält kein gültiges Design – vielleicht wurde er beim Kopieren abgeschnitten oder verändert. Es wird die Standardvorlage angezeigt.",
    "link.errorTooLong": "Dieser Link ist zu lang und wurde deshalb nicht geladen. Es wird die Standardvorlage angezeigt.",
    "link.errorVersion": "Dieser Link stammt aus einer anderen Version von {app} und kann hier nicht geöffnet werden. Es wird die Standardvorlage angezeigt.",
    "link.dismiss": "Hinweis schließen",


    "text.heading": "3. Text",
    "text.label": "Text auf dem Ring",
    "text.top": "Text oben (optional)",
    "text.topPlaceholder": "z. B. Hallo!",
    "text.sizeTop": "Schriftgröße oben",
    "text.placeholder": "Dein Text, z. B. Suche Job im Marketing",
    "text.font": "Schriftart",
    "text.size": "Schriftgröße",
    "text.bold": "Fett",
    "text.uppercase": "Großbuchstaben",
    "text.spacing": "Buchstabenabstand",
    "text.position": "Position auf dem Bogen",
    "text.color": "Textfarbe",
    "text.shrunk": "Der Text ist lang und wurde automatisch auf {percent} % verkleinert.",
    "text.tooLong": "Der Text ist zu lang für den Ring. Kürze ihn oder verlängere den Ring.",
    "text.tooLongShape": "Der Text ist zu lang. Kürze ihn oder verkleinere die Schrift.",
    "text.topShrunk": "Der Text oben ist lang und wurde automatisch auf {percent} % verkleinert.",
    "text.topTooLong": "Der Text oben ist zu lang. Kürze ihn oder verkleinere die Schrift.",
    "text.lowContrast": "Geringer Kontrast zwischen Text und Ring ({ratio}:1) – der Text könnte schwer lesbar sein.",
    "text.replacedByLogo": "Das Logo steht statt des Texts auf dem Ring. Um wieder Text zu zeigen, wähle unter „Logo“ eine andere Position.",

    "icon.label": "Symbol im Ring",
    "icon.none": "Kein Symbol",
    "icon.pos": "Position des Symbols",
    "icon.start": "Vor dem Text",
    "icon.end": "Nach dem Text",
    "icon.both": "Beidseitig",
    "emoji.label": "Emoji einfügen",

    "logo.heading": "4. Logo",
    "logo.hint": "Am besten wirkt ein Logo mit transparentem Hintergrund. Es bleibt auf deinem Gerät.",
    "logo.choose": "Logo hochladen",
    "logo.remove": "Logo entfernen",
    "logo.formats": "PNG, JPG, WebP oder SVG",
    "logo.pos": "Position",
    "logo.start": "Links vom Text",
    "logo.end": "Rechts vom Text",
    "logo.replace": "Statt Text",
    "logo.size": "Logogröße",
    "logo.loading": "Logo wird geladen …",
    "logo.loaded": "Logo geladen: {name}",
    "logo.removed": "Logo entfernt.",
    "logo.errorType": "Bitte ein Logo als PNG, JPG, WebP oder SVG wählen.",
    "logo.errorSize": "Die Datei ist zu groß (höchstens {max} MB).",
    "logo.error": "Dieses Logo konnte nicht geöffnet werden. Bitte PNG, JPG, WebP oder SVG verwenden.",

    "ring.heading": "5. Ring",
    "ring.color": "Ringfarbe",
    "ring.widthBadge": "Höhe des Badges",
    "shape.label": "Form",
    "shape.arc": "Bogen",
    "shape.ring": "Voller Ring",
    "shape.badge": "Badge",
    "shape.hintArc": "Text unten auf einem Bogen; ein Text oben bekommt einen eigenen kurzen Bogen.",
    "shape.hintRing": "Geschlossener Ring rund um das Foto, Text unten und optional oben.",
    "shape.hintBadge": "Abgerundetes Schild unten über dem Foto, Text gerade. Ein Text oben wird hier nicht angezeigt.",
    "ring.gradient": "Farbverlauf",
    "ring.color2": "Zweite Farbe",
    "ring.width": "Ringbreite",
    "ring.length": "Ringlänge",
    "ring.rotation": "Drehung des Rings",
    "ring.fade": "Weicher Übergang an den Enden",
    "ring.opacity": "Deckkraft",

    "export.heading": "6. Export",
    "export.bg": "Hintergrund außerhalb des Kreises",
    "export.transparent": "Transparent",
    "export.white": "Weiß",
    "export.size": "Auflösung",
    "export.download": "PNG herunterladen · {size} px",
    "export.share": "Bild teilen",
    "export.info": "Tipp: Die meisten Netzwerke schneiden Profilbilder automatisch rund zu.",
    "export.done": "Bild wurde erstellt.",
    "export.shareError": "Teilen ist fehlgeschlagen. Nutze stattdessen „Herunterladen“.",
    "export.filename": "profilbild-rahmen.png",

    "share.title": "Gefällt dir dein Rahmen?",
    "share.lead": "Teile die App mit deinem Netzwerk – das hilft uns sehr, kostenlos zu bleiben.",
    "share.text": "Ich habe meinen Profilbild-Rahmen mit {app} gestaltet – kostenlos und ohne Foto-Upload:",
    "share.copy": "Link kopieren",
    "share.copied": "Link kopiert!",
    "share.more": "Teilen …",
    "share.close": "Schließen",
    "share.dontShow": "Nicht mehr anzeigen",

    "hex.label": "Hex-Code",
    "hex.invalid": "Ungültiger Hex-Code",
    "unit.deg": "°",
    "unit.pct": "%"
  },

  en: {
    "app.title": "Create a profile picture frame",
    "theme.label": "Colour scheme",
    "theme.auto": "System",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "a11y.controls": "Settings",
    "a11y.preview": "Preview",

    "preview.canvasLabel": "Preview of the profile picture with ring. Text: {text}. Use arrow keys to move, plus and minus to zoom.",
    "preview.hint": "Drag to move · scroll wheel, pinch or +/− to zoom · arrow keys move",

    "upload.heading": "1. Photo",
    "upload.drop": "Drop a photo here or",
    "upload.choose": "choose a file",
    "upload.formats": "JPG, PNG, WebP or HEIC – stays on your device",
    "upload.loading": "Loading photo …",
    "upload.heicLoading": "Converting HEIC photo …",
    "upload.error": "This image could not be opened. Please try JPG, PNG or WebP.",
    "upload.errorType": "Please choose an image file.",
    "upload.loaded": "Photo loaded: {name}",
    "upload.remove": "Remove photo",
    "crop.zoom": "Zoom",
    "crop.reset": "Reset crop",

    "presets.heading": "2. Template",
    "presets.hint": "Pick a starting point – everything can be customised afterwards.",
    "presets.more": "Show all {count} templates",
    "presets.less": "Show less",
    "presets.builtin": "Templates",

    "own.heading": "My templates",
    "own.empty": "No templates of your own yet. Design your frame and save it here – on this device, without your photo.",
    "own.nameLabel": "Template name",
    "own.namePlaceholder": "e.g. Team frame 2027",
    "own.save": "Save as my template",
    "own.saved": "“{name}” was saved on this device.",
    "own.nameMissing": "Please enter a name for the template.",
    "own.apply": "Use template “{name}”",
    "own.withLogo": "with logo",
    "own.rename": "Rename",
    "own.renameLabel": "New name for “{name}”",
    "own.renameSave": "Save",
    "own.renameCancel": "Cancel",
    "own.renamed": "Template renamed to “{name}”.",
    "own.export": "Export as file",
    "own.exported": "“{name}” was saved as a file.",
    "own.import": "Import from file",
    "own.imported": "“{name}” was imported.",
    "own.importDropped": "Invalid or unknown entries were discarded: {fields}.",
    "own.delete": "Delete",
    "own.confirmDelete": "Really delete template “{name}”? This cannot be undone.",
    "own.deleted": "“{name}” was deleted.",
    "own.limit": "You can keep at most {max} templates. Please delete an old one first.",
    "own.errorFull": "Your browser's storage is full. Delete old templates or use a smaller logo – or export the template as a file.",
    "own.errorBlocked": "Your browser does not allow local storage (e.g. in private mode). Export the template as a file instead.",
    "own.errorFile": "This file is not a valid template.",
    "own.errorFileSize": "The file is too large (max. 1 MB).",
    "own.errorFileType": "Please choose a template file in JSON format.",
    "own.unnamed": "Imported template",
    "own.filename": "ringlabel-template",

    "link.copyDesign": "Copy link to this design",
    "link.copyOwn": "Copy link",
    "link.copyOwnLabel": "Copy link to “{name}”",
    "link.title": "Link to this design",
    "link.lead": "Anyone who opens the link gets the same frame in the editor straight away and only needs to add their own photo. Your photo is not part of the link.",
    "link.fieldLabel": "Link",
    "link.copy": "Copy",
    "link.copied": "Link copied!",
    "link.copyFailed": "Automatic copying isn't available. Select the link and copy it yourself.",
    "link.logoNote": "The logo is not included in the link. Share it separately or export the template as a file.",
    "link.loaded": "Design loaded from link.",
    "link.partial": "Some settings in the link were invalid and have been reset to defaults: {fields}.",
    "link.unknown": "{count} unknown setting(s)",
    "link.save": "Save as my template",
    "link.defaultName": "Design from link",
    "link.errorInvalid": "This link doesn't contain a valid design – it may have been cut off or changed when it was copied. Showing the default template instead.",
    "link.errorTooLong": "This link is too long and was not loaded. Showing the default template instead.",
    "link.errorVersion": "This link comes from a different version of {app} and can't be opened here. Showing the default template instead.",
    "link.dismiss": "Dismiss message",


    "text.heading": "3. Text",
    "text.label": "Text on the ring",
    "text.top": "Top text (optional)",
    "text.topPlaceholder": "e.g. Hello!",
    "text.sizeTop": "Top font size",
    "text.placeholder": "Your text, e.g. Looking for a marketing role",
    "text.font": "Font",
    "text.size": "Font size",
    "text.bold": "Bold",
    "text.uppercase": "Uppercase",
    "text.spacing": "Letter spacing",
    "text.position": "Position on the arc",
    "text.color": "Text colour",
    "text.shrunk": "The text is long and was automatically reduced to {percent} %.",
    "text.tooLong": "The text is too long for the ring. Shorten it or make the ring longer.",
    "text.tooLongShape": "The text is too long. Shorten it or reduce the font size.",
    "text.topShrunk": "The top text is long and was automatically reduced to {percent} %.",
    "text.topTooLong": "The top text is too long. Shorten it or reduce the font size.",
    "text.lowContrast": "Low contrast between text and ring ({ratio}:1) – the text may be hard to read.",
    "text.replacedByLogo": "The logo replaces the text on the ring. To show text again, choose another position under “Logo”.",

    "icon.label": "Symbol on the ring",
    "icon.none": "No symbol",
    "icon.pos": "Symbol position",
    "icon.start": "Before the text",
    "icon.end": "After the text",
    "icon.both": "Both sides",
    "emoji.label": "Insert emoji",

    "logo.heading": "4. Logo",
    "logo.hint": "A logo with a transparent background works best. It stays on your device.",
    "logo.choose": "Upload logo",
    "logo.remove": "Remove logo",
    "logo.formats": "PNG, JPG, WebP or SVG",
    "logo.pos": "Position",
    "logo.start": "Left of the text",
    "logo.end": "Right of the text",
    "logo.replace": "Instead of text",
    "logo.size": "Logo size",
    "logo.loading": "Loading logo …",
    "logo.loaded": "Logo loaded: {name}",
    "logo.removed": "Logo removed.",
    "logo.errorType": "Please choose a PNG, JPG, WebP or SVG logo.",
    "logo.errorSize": "The file is too large (max. {max} MB).",
    "logo.error": "This logo could not be opened. Please use PNG, JPG, WebP or SVG.",

    "ring.heading": "5. Ring",
    "ring.color": "Ring colour",
    "ring.widthBadge": "Badge height",
    "shape.label": "Shape",
    "shape.arc": "Arc",
    "shape.ring": "Full ring",
    "shape.badge": "Badge",
    "shape.hintArc": "Text at the bottom on an arc; a top text gets its own short arc.",
    "shape.hintRing": "Closed ring around the photo, text at the bottom and optionally at the top.",
    "shape.hintBadge": "Rounded badge at the bottom of the photo, straight text. A top text is not shown here.",
    "ring.gradient": "Gradient",
    "ring.color2": "Second colour",
    "ring.width": "Ring width",
    "ring.length": "Ring length",
    "ring.rotation": "Ring rotation",
    "ring.fade": "Soft fade at the ends",
    "ring.opacity": "Opacity",

    "export.heading": "6. Export",
    "export.bg": "Background outside the circle",
    "export.transparent": "Transparent",
    "export.white": "White",
    "export.size": "Resolution",
    "export.download": "Download PNG · {size} px",
    "export.share": "Share image",
    "export.info": "Tip: most networks crop profile pictures to a circle automatically.",
    "export.done": "Image created.",
    "export.shareError": "Sharing failed. Please use “Download” instead.",
    "export.filename": "profile-frame.png",

    "share.title": "Like your frame?",
    "share.lead": "Share the app with your network – it really helps us stay free.",
    "share.text": "I made my profile picture frame with {app} – free and without uploading my photo:",
    "share.copy": "Copy link",
    "share.copied": "Link copied!",
    "share.more": "Share …",
    "share.close": "Close",
    "share.dontShow": "Don't show again",

    "hex.label": "Hex code",
    "hex.invalid": "Invalid hex code",
    "unit.deg": "°",
    "unit.pct": "%"
  }
};

PBG.lang = (document.documentElement.lang || "de").slice(0, 2);
if (!PBG.I18N[PBG.lang]) PBG.lang = "de";

/** Übersetzt einen Schlüssel; fällt auf Deutsch und dann auf den Schlüssel zurück. */
PBG.t = function (key, vars) {
  var dict = PBG.I18N[PBG.lang] || PBG.I18N.de;
  var str = dict[key] != null ? dict[key] : (PBG.I18N.de[key] != null ? PBG.I18N.de[key] : key);
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] != null ? vars[name] : m;
    });
  }
  return str;
};

/** Wählt den Eintrag der aktuellen Sprache aus einem {de, en}-Objekt. */
PBG.loc = function (obj) {
  if (!obj || typeof obj === "string") return obj || "";
  return obj[PBG.lang] || obj.de || "";
};

/** Setzt alle Texte im DOM anhand der data-i18n*-Attribute. */
PBG.applyI18n = function (root) {
  root = root || document;
  var vars = {
    app: (PBG.config && PBG.config.appName) || ""
  };
  root.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = PBG.t(el.getAttribute("data-i18n"), vars);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    el.setAttribute("placeholder", PBG.t(el.getAttribute("data-i18n-placeholder"), vars));
  });
  root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    el.setAttribute("aria-label", PBG.t(el.getAttribute("data-i18n-aria"), vars));
  });
  root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
    el.setAttribute("title", PBG.t(el.getAttribute("data-i18n-title"), vars));
  });
};
