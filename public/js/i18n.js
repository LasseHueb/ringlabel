/*
 * Übersetzungen – gemeinsamer Teil für beide Werkzeuge (Rahmen- und Banner-Editor): Kernfunktionen (PBG.t, PBG.loc,
 * PBG.applyI18n) und Texte, die beide Seiten brauchen (eigene Vorlagen, Links, Logo-Fehler, „Gerade passend“ …).
 * Werkzeug-Texte stehen in i18n-frame.js (Rahmen) und i18n-banner.js (Banner); jede Seite lädt nur ihre Datei.
 * Die Sprache folgt dem lang-Attribut der Seite (<html lang="de"> bzw. "en"). Der Build übersetzt das Markup der
 * Editoren mit diesen Wörterbüchern vorab und bricht ab, wenn ein Schlüssel fehlt.
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
    "presets.current": "Gerade passend",
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
    "own.filenameBanner": "ringlabel-banner",
    "own.wrongTypeBanner": "Diese Datei enthält eine Banner-Vorlage. Importiere sie auf der Banner-Seite.",
    "own.wrongTypeFrame": "Diese Datei enthält eine Rahmen-Vorlage. Importiere sie auf der Rahmen-Seite.",
    "own.noBanner": "Diese Datei enthält kein Banner, nur einen Rahmen. Importiere sie auf der Rahmen-Seite.",
    "own.alsoBanner": "Die Datei enthält auch ein Banner – das kannst du auf der Banner-Seite importieren.",
    "own.alsoFrame": "Die Datei enthält auch einen Rahmen – den kannst du auf der Rahmen-Seite importieren.",
    "link.hasBanner": "Dieser Link enthält auch ein Banner.",
    "link.openBanner": "Banner öffnen",
    "nav.toBanner": "Zur Banner-Seite",
    "nav.toFrame": "Zur Rahmen-Seite",
    "link.copyDesign": "Link zu diesem Design kopieren",
    "link.copyOwn": "Link kopieren",
    "link.copyOwnLabel": "Link zu „{name}“ kopieren",
    "link.title": "Link zu diesem Design",
    "link.lead": "Wer den Link öffnet, hat sofort dasselbe Design im Editor. Fotos, Logos und Hintergrundbilder sind nicht im Link enthalten.",
    "link.close": "Schließen",
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
    "logo.loading": "Logo wird geladen …",
    "logo.loaded": "Logo geladen: {name}",
    "logo.errorType": "Bitte ein Logo als PNG, JPG, WebP oder SVG wählen.",
    "logo.errorSize": "Die Datei ist zu groß (höchstens {max} MB).",
    "logo.error": "Dieses Logo konnte nicht geöffnet werden. Bitte PNG, JPG, WebP oder SVG verwenden.",
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
    "presets.current": "Right now",
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
    "own.filenameBanner": "ringlabel-banner",
    "own.wrongTypeBanner": "This file contains a banner template. Import it on the banner page.",
    "own.wrongTypeFrame": "This file contains a frame template. Import it on the frame page.",
    "own.noBanner": "This file contains only a frame, no banner. Import it on the frame page.",
    "own.alsoBanner": "The file also contains a banner – you can import it on the banner page.",
    "own.alsoFrame": "The file also contains a frame – you can import it on the frame page.",
    "link.hasBanner": "This link also contains a banner.",
    "link.openBanner": "Open banner",
    "nav.toBanner": "Go to the banner page",
    "nav.toFrame": "Go to the frame page",
    "link.copyDesign": "Copy link to this design",
    "link.copyOwn": "Copy link",
    "link.copyOwnLabel": "Copy link to “{name}”",
    "link.title": "Link to this design",
    "link.lead": "Anyone who opens the link gets the same design in the editor straight away. Photos, logos and background images are not part of the link.",
    "link.close": "Close",
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
    "logo.loading": "Loading logo …",
    "logo.loaded": "Logo loaded: {name}",
    "logo.errorType": "Please choose a PNG, JPG, WebP or SVG logo.",
    "logo.errorSize": "The file is too large (max. {max} MB).",
    "logo.error": "This logo could not be opened. Please use PNG, JPG, WebP or SVG.",
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
