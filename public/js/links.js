/*
 * Gemeinsames Gerüst für Design-Links (Rahmen: #d=…, Banner: #b=…), den Link-Dialog und die Hinweis-Leiste.
 * Das Fragment (#…) schickt der Browser nie an den Server; nach dem Lesen wird es aus der Adresse entfernt.
 * Logos, Fotos und Hintergrundbilder kommen nie in einen Link – das stellt der jeweilige Editor sicher.
 */
window.PBG = window.PBG || {};

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var t = function (k, v) { return PBG.t(k, v); };
  var U = PBG.util;
  var els = {};
  var saveHandler = null;

  function bind() {
    els = {
      dialog: $("link-dialog"), url: $("link-url"), copy: $("link-copy"), status: $("link-status"), logoNote: $("link-logo-note"),
      notice: $("link-notice"), noticeText: $("link-notice-text"), noticeSave: $("link-notice-save"), noticeGoto: $("link-notice-goto"),
      noticeClose: $("link-notice-close")
    };
    if (els.dialog) {
      els.copy.addEventListener("click", copy);
      els.url.addEventListener("focus", function () { els.url.select(); });
      els.dialog.addEventListener("click", function (e) { if (e.target === els.dialog) U.closeDialog(els.dialog); });
    }
    if (els.notice) {
      els.noticeClose.addEventListener("click", function () { els.notice.hidden = true; });
      els.noticeSave.addEventListener("click", function () { if (saveHandler) saveHandler(); });
    }
  }

  function copy() {
    var url = els.url.value;
    var ok = function () { U.setStatus(els.status, t("link.copied")); els.url.select(); };
    var fallback = function () {
      // execCommand im Dialog selbst, weil der Rest der Seite bei offenem Dialog nicht bedienbar ist
      els.url.focus();
      els.url.select();
      var done = false;
      try { done = document.execCommand("copy"); } catch (e) { done = false; }
      if (done) ok(); else U.setStatus(els.status, t("link.copyFailed"), true);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fallback);
    else fallback();
  }

  PBG.Links = {
    bind: bind,

    /** Objekt → Base64url(JSON) für den Fragment-Wert. */
    encode: function (obj) { return U.base64urlEncode(JSON.stringify(obj)); },

    /** Link zur aktuellen Seite (Sprache bleibt erhalten) mit #<param>=… */
    url: function (param, obj) {
      return location.origin + location.pathname + "#" + param + "=" + PBG.Links.encode(obj);
    },

    /**
     * Liest #…<param>=… aus der Adresse. Gibt null zurück, wenn der Parameter fehlt, sonst { error: i18n-Schlüssel }
     * oder { data, raw }. Prüft Länge, Base64url, UTF-8 und dass ein einfaches Objekt enthalten ist.
     */
    read: function (param, maxLen, hash) {
      var m = new RegExp("^#(?:.*&)?" + param + "=([^&]*)").exec(hash == null ? location.hash : hash);
      if (!m) return null;
      var raw = m[1];
      if (raw.length > maxLen) return { error: "link.errorTooLong" };
      var data;
      try { data = JSON.parse(U.base64urlDecode(raw)); } catch (e) { return { error: "link.errorInvalid" }; }
      if (!data || typeof data !== "object" || Array.isArray(data)) return { error: "link.errorInvalid" };
      return { data: data, raw: raw };
    },

    /** Fragment entfernen (auch bei Fehlern), damit es nicht versehentlich mit der Adresse weitergeteilt wird. */
    strip: function () {
      try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) { /* alte Browser */ }
    },

    openDialog: function (url, hasLogo) {
      els.url.value = url;
      els.logoNote.hidden = !hasLogo;
      U.setStatus(els.status, "");
      U.showDialog(els.dialog);
      copy();
    },

    /**
     * Hinweis-Leiste über dem Editor. opts.save: Funktion für „Als eigene Vorlage speichern“ (oder null),
     * opts.goto: { href, label } für einen Link-Button (z. B. „Banner öffnen“).
     */
    notice: function (msg, isError, opts) {
      opts = opts || {};
      els.noticeText.textContent = msg;
      els.notice.classList.toggle("error", !!isError);
      saveHandler = opts.save || null;
      els.noticeSave.hidden = !saveHandler;
      if (opts.goto) {
        els.noticeGoto.href = opts.goto.href;
        els.noticeGoto.textContent = opts.goto.label;
        els.noticeGoto.hidden = false;
      } else els.noticeGoto.hidden = true;
      els.notice.hidden = false;
    },

    /** Speichern-Angebot beenden (z. B. wenn eine andere Vorlage gewählt wurde). */
    endSave: function () {
      saveHandler = null;
      if (els.noticeSave) els.noticeSave.hidden = true;
    },

    noticeElement: function () { return els.notice; },

    /** Verständliche Meldung für teilweise ungültige Links: fields = Liste von Bezeichnungen, unknown = Anzahl unbekannter Angaben. */
    loadedMessage: function (fields, unknown) {
      fields = fields.slice();
      if (unknown) fields.push(t("link.unknown", { count: unknown }));
      return { text: t("link.loaded") + (fields.length ? " " + t("link.partial", { fields: fields.join(", ") }) : ""), partial: fields.length > 0 };
    }
  };
})();
