/*
 * „Meine Vorlagen“ – gemeinsamer Baustein für Rahmen- und Banner-Editor.
 * Vorlagen liegen nur im lokalen Speicher dieses Browsers (je Werkzeug ein eigener Schlüssel), nie mit Foto oder
 * Hintergrundbild. Export/Import als JSON-Datei mit Typ-Feld („frame“ bzw. „banner“).
 *
 * PBG.OwnList(opts) – opts:
 *   key, type, version     Speicher-Schlüssel, Dateityp, Version des Dateiformats
 *   els                    { list, empty, form, name, importInput, status }
 *   validate(raw)          → { template, dropped[] } oder null (streng: nur bekannte Schlüssel und gültige Werte)
 *   current(name)          → Vorlage aus dem aktuellen Design (mit id, name, created)
 *   apply(tpl)             Vorlage im Editor anwenden
 *   thumb(canvas, tpl, px) Vorschaubild zeichnen
 *   link(tpl)              Link-Dialog öffnen (optional)
 *   exportData(tpl)        → Inhalt der Datei (ohne format/type/version/name)
 *   prepareImport(raw)     → { raw, note?, noteGoto? } oder { error, goto? } – Typ prüfen, alte Dateien umwandeln
 *   checkLogos(tpl, dropped) → Promise (Logos prüfen, ungültige entfernen; optional)
 *   onChange()             nach jedem Neuzeichnen der Liste (z. B. Markierung der aktiven Vorlage)
 */
window.PBG = window.PBG || {};

(function () {
  "use strict";

  var FORMAT = "ringlabel-vorlage";
  var MAX = 50;
  var FILE_MAX = 1024 * 1024;   // Import-Dateien höchstens 1 MB
  var NAME_MAX = 40;
  var t = function (k, v) { return PBG.t(k, v); };

  PBG.OwnList = function (opts) {
    var els = opts.els;
    var templates = [];

    function msg(text, isError, go) {
      PBG.util.setStatus(els.status, text, isError);
      if (go) {
        els.status.appendChild(document.createTextNode(" "));
        var a = document.createElement("a");
        a.href = go.href;
        a.textContent = go.label;
        els.status.appendChild(a);
      }
    }

    function load() {
      var list = [];
      try { list = JSON.parse(PBG.storage.get(opts.key) || "[]"); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      templates = list.map(function (raw) { var r = opts.validate(raw); return r && r.template; }).filter(Boolean).slice(0, MAX);
    }

    /** Speichert die Liste; gibt null oder eine Fehlermeldung zurück. */
    function persist() {
      var err = PBG.storage.trySet(opts.key, JSON.stringify(templates));
      return err === "full" ? t("own.errorFull") : err === "blocked" ? t("own.errorBlocked") : null;
    }

    function smallButton(label, cls, onClick) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "text-button " + (cls || "");
      b.textContent = label;
      b.addEventListener("click", onClick);
      return b;
    }

    function startRename(li, tpl) {
      var form = document.createElement("form");
      form.className = "own-rename";
      var input = document.createElement("input");
      input.type = "text";
      input.maxLength = NAME_MAX;
      input.value = tpl.name;
      input.setAttribute("aria-label", t("own.renameLabel", { name: tpl.name }));
      var ok = document.createElement("button");
      ok.type = "submit";
      ok.className = "btn btn-secondary";
      ok.textContent = t("own.renameSave");
      var cancel = smallButton(t("own.renameCancel"), "", function () { render(); });
      form.appendChild(input); form.appendChild(ok); form.appendChild(cancel);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = input.value.trim().slice(0, NAME_MAX);
        if (!name) { msg(t("own.nameMissing"), true); input.focus(); return; }
        var old = tpl.name;
        tpl.name = name;
        var err = persist();
        if (err) { tpl.name = old; msg(err, true); return; }
        render();
        msg(t("own.renamed", { name: name }));
      });
      li.querySelector(".own-actions").replaceWith(form);
      input.focus();
      input.select();
    }

    function exportTemplate(tpl) {
      var data = Object.assign({ format: FORMAT, type: opts.type, version: opts.version, name: tpl.name }, opts.exportData(tpl));
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var s = PBG.util.slug(tpl.name);
      PBG.util.download(blob, t(opts.type === "banner" ? "own.filenameBanner" : "own.filename") + (s ? "-" + s : "") + ".json");
      msg(t("own.exported", { name: tpl.name }));
    }

    function render() {
      var list = els.list;
      list.innerHTML = "";
      els.empty.hidden = templates.length > 0;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var size = Math.round(56 * dpr);
      templates.forEach(function (tpl) {
        var li = document.createElement("li");
        li.className = "own-item";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "preset own-preset";
        btn.dataset.key = "own:" + tpl.id;
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", t("own.apply", { name: tpl.name }));
        var c = document.createElement("canvas");
        c.setAttribute("aria-hidden", "true");
        var label = document.createElement("span");
        label.textContent = tpl.name;
        btn.appendChild(c);
        btn.appendChild(label);
        btn.addEventListener("click", function () { opts.apply(tpl); });
        opts.thumb(c, tpl, size);
        var actions = document.createElement("div");
        actions.className = "own-actions";
        actions.appendChild(smallButton(t("own.rename"), "", function () { startRename(li, tpl); }));
        if (opts.link) {
          var linkBtn = smallButton(t("link.copyOwn"), "", function () { opts.link(tpl); });
          linkBtn.setAttribute("aria-label", t("link.copyOwnLabel", { name: tpl.name }));
          actions.appendChild(linkBtn);
        }
        actions.appendChild(smallButton(t("own.export"), "", function () { exportTemplate(tpl); }));
        actions.appendChild(smallButton(t("own.delete"), "danger", function () {
          if (!window.confirm(t("own.confirmDelete", { name: tpl.name }))) return;
          var idx = templates.indexOf(tpl);
          templates.splice(idx, 1);
          var err = persist();
          if (err) { templates.splice(idx, 0, tpl); msg(err, true); return; }
          if (opts.onDelete) opts.onDelete(tpl);
          render();
          msg(t("own.deleted", { name: tpl.name }));
        }));
        li.appendChild(btn);
        li.appendChild(actions);
        list.appendChild(li);
      });
      if (opts.onChange) opts.onChange();
    }

    /** Speichert das aktuelle Design als eigene Vorlage; report(msg, isError) zeigt das Ergebnis. Gibt die Vorlage oder null zurück. */
    function save(name, report) {
      report = report || msg;
      if (templates.length >= MAX) { report(t("own.limit", { max: MAX }), true); return null; }
      var tpl = opts.current(name);
      templates.unshift(tpl);
      var err = persist();
      if (err) { templates.shift(); report(err, true); return null; }
      render();
      report(t("own.saved", { name: name }), false);
      return tpl;
    }

    function importFile(file) {
      if (!file) return;
      if (file.size > FILE_MAX) { msg(t("own.errorFileSize"), true); return; }
      if (file.type && !/json/.test(file.type) && !/\.json$/i.test(file.name || "")) { msg(t("own.errorFileType"), true); return; }
      if (templates.length >= MAX) { msg(t("own.limit", { max: MAX }), true); return; }
      var reader = new FileReader();
      reader.onerror = function () { msg(t("own.errorFile"), true); };
      reader.onload = function () {
        var raw;
        try { raw = JSON.parse(String(reader.result)); } catch (e) { msg(t("own.errorFile"), true); return; }
        if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.format !== FORMAT) { msg(t("own.errorFile"), true); return; }
        var prep = opts.prepareImport(raw);
        if (prep.error) { msg(prep.error, true, prep.goto); return; }
        var r = opts.validate(prep.raw);
        if (!r) { msg(t("own.errorFile"), true); return; }
        var tpl = r.template;
        tpl.id = PBG.util.newId();
        var check = opts.checkLogos ? opts.checkLogos(tpl, r.dropped) : Promise.resolve();
        check.then(function () {
          templates.unshift(tpl);
          var err = persist();
          if (err) { templates.shift(); msg(err, true); return; }
          render();
          opts.apply(tpl);
          var text = t("own.imported", { name: tpl.name });
          if (r.dropped.length) text += " " + t("own.importDropped", { fields: r.dropped.join(", ") });
          if (prep.note) text += " " + prep.note;
          msg(text, r.dropped.length > 0, prep.noteGoto);
        });
      };
      reader.readAsText(file);
    }

    function bind() {
      load();
      render();
      els.form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = els.name.value.trim().slice(0, NAME_MAX);
        if (!name) { msg(t("own.nameMissing"), true); els.name.focus(); return; }
        if (save(name)) els.name.value = "";
      });
      els.importInput.addEventListener("change", function () {
        importFile(els.importInput.files && els.importInput.files[0]);
        els.importInput.value = "";
      });
    }

    return {
      bind: bind, render: render, save: save, persist: persist, msg: msg,
      list: function () { return templates; },
      /** Fügt eine fertige Vorlage vorne ein (Datenübernahme); gibt null oder Fehlermeldung zurück. */
      add: function (tpl) {
        if (templates.length >= MAX) return t("own.limit", { max: MAX });
        templates.unshift(tpl);
        var err = persist();
        if (err) templates.shift();
        return err;
      },
      FORMAT: FORMAT, FILE_MAX: FILE_MAX, NAME_MAX: NAME_MAX
    };
  };
})();
