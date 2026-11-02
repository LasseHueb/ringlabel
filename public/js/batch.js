/*
 * „Mehrere Fotos“ (#mehrere-fotos): das aktuelle Rahmen-Design auf bis zu 30 Fotos anwenden und alle als ZIP laden.
 *
 * Datenschutz: Alle Fotos werden nur im Browser verarbeitet – nie hochgeladen und nie gespeichert (kein localStorage,
 * keine eigenen Vorlagen, keine Links). Sie leben nur im Arbeitsspeicher dieser Seite.
 *
 * Speicher (iPad/Handy): Jedes Foto wird beim Laden auf höchstens 2048 px verkleinert und dann komprimiert als Blob
 * gehalten (JPEG, bei PNG-Dateien PNG); dazu nur eine kleine Vorschau-Quelle (320 px). Für Export und „Ausschnitt
 * anpassen“ wird jeweils ein Foto kurz dekodiert; Canvas werden nach dem Rendern freigegeben (Größe 0).
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  if (!$("mehrere-fotos") || !PBG.editor || !PBG.zip) return;
  var t = PBG.t;
  var ed = PBG.editor;

  var MAX_PHOTOS = 30;
  var MAX_SIDE = 2048;       // Fotos werden beim Laden auf höchstens 2048 px verkleinert
  var THUMB_SRC = 320;       // Vorschau-Quelle je Foto
  var THUMB_CSS = 120;       // angezeigte Größe der Vorschau
  var TEXT_MAX = 60;

  var items = [];            // { id, name, blob, thumbSrc, view: {zoom, offsetX, offsetY}, text, el, canvas, note, ... }
  var session = null;        // „Ausschnitt anpassen“: { item, saved, canvas }
  var job = null;            // laufender ZIP-Export: { cancelled }
  var loading = false;
  var nextId = 1;

  var els = {
    section: $("mehrere-fotos"), count: $("batch-count"), input: $("batch-input"), drop: $("batch-drop"),
    status: $("batch-status"), list: $("batch-list"), empty: $("batch-empty"), toolbar: $("batch-toolbar"),
    zip: $("batch-zip"), zipLabel: $("batch-zip-label"), removeAll: $("batch-remove-all"),
    progress: $("batch-progress"), progressBar: $("batch-progress-bar"), progressText: $("batch-progress-text"),
    cancel: $("batch-cancel"),
    cropBar: $("crop-session"), cropTitle: $("crop-session-title"), cropApply: $("crop-apply"), cropCancel: $("crop-cancel")
  };

  // ---------- Hilfsfunktionen ----------
  /** Text mit Einzahl-Fassung: Schlüssel + "One", wenn count 1 ist. */
  function tn(key, vars) { return t(vars.count === 1 ? key + "One" : key, vars); }

  function setStatus(msg, isError) {
    els.status.textContent = msg || "";
    els.status.classList.toggle("error", !!isError);
  }

  /** Canvas sofort freigeben (Safari gibt den Speicher erst bei Größe 0 zurück). */
  function release(c) { if (c) { c.width = 0; c.height = 0; } }

  function canvasToBlob(c, type, quality) {
    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { if (b) resolve(b); else reject(new Error("toBlob")); }, type, quality);
    });
  }

  /** Blob → Canvas (für Export und Ausschnitt). */
  function blobToCanvas(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        img.src = "";
        resolve(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function scaledCanvas(src, maxSide) {
    var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
    var sc = Math.min(1, maxSide / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * sc));
    c.height = Math.max(1, Math.round(h * sc));
    var x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  /** Zustand fürs Zeichnen eines Fotos: aktuelles Design, eigener Text (falls gesetzt), Ausschnitt des Fotos. */
  function itemState(item) {
    var s = ed.state();
    return Object.assign({}, s, {
      text: item.text ? item.text : s.text,
      zoom: item.view.zoom, offsetX: item.view.offsetX, offsetY: item.view.offsetY
    });
  }

  /** Platzhalter im Textfeld eines Fotos: der aktuelle Haupttext (wird verwendet, solange das Feld leer ist). */
  function textPlaceholder() {
    return ed.state().text || t("batch.textPlaceholder");
  }

  function textReplaced() {
    var s = ed.state();
    return !!ed.logo() && s.logoPos === "replace";
  }

  // ---------- Dateinamen im ZIP ----------
  /** Original-Dateiname ohne Endung, unzulässige Zeichen ersetzt; + „-rahmen.png“, Dubletten durchnummeriert. */
  function fileName(item, used) {
    var stem = String(item.name || "").replace(/\.[^.\/\\]{1,5}$/, "");
    if (stem.normalize) stem = stem.normalize("NFC");   // macOS liefert Umlaute oft zerlegt (NFD)
    stem = stem.replace(/[\\\/:*?"<>|\u0000-\u001f\u007f]+/g, "-").replace(/\s+/g, " ").replace(/^[\s.-]+|[\s.-]+$/g, "");
    if (stem.length > 80) stem = stem.slice(0, 80).replace(/[\s.-]+$/, "");
    if (!stem) stem = t("batch.fileFallback");
    var suffix = t("batch.fileSuffix");
    var name = stem + suffix + ".png", n = 1;
    while (used[name.toLowerCase()]) { n++; name = stem + suffix + "-" + n + ".png"; }
    used[name.toLowerCase()] = true;
    return name;
  }

  // ---------- Fotos hinzufügen ----------
  function addFiles(fileList) {
    if (loading || job || session) { setStatus(t(session ? "batch.busyCrop" : "batch.busy"), true); return; }
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    var images = files.filter(ed.isImageFile);
    var notImages = files.length - images.length;
    var free = MAX_PHOTOS - items.length;
    var accept = images.slice(0, Math.max(free, 0));
    var rejected = images.length - accept.length;
    var failed = [];
    if (!accept.length) {
      var why = rejected ? tn("batch.tooMany", { max: MAX_PHOTOS, count: rejected }) : tn("batch.notImages", { count: notImages });
      setStatus(why, true);
      return;
    }

    loading = true;
    updateUI();
    var done = 0;
    var chain = Promise.resolve();
    accept.forEach(function (file) {
      chain = chain.then(function () {
        setStatus(t("batch.loading", { done: done + 1, total: accept.length }));
        return loadOne(file).catch(function () { failed.push(file.name || "?"); }).then(function () { done++; });
      });
    });
    chain.then(function () {
      loading = false;
      var msgs = [tn("batch.added", { count: accept.length - failed.length })];
      if (rejected) msgs.push(tn("batch.tooMany", { max: MAX_PHOTOS, count: rejected }));
      if (failed.length) msgs.push(t("batch.failed", { names: failed.join(", ") }));
      if (notImages) msgs.push(tn("batch.notImages", { count: notImages }));
      setStatus(msgs.join(" "), !!(rejected || failed.length || notImages));
      updateUI();
      els.input.value = "";
    });
  }

  /** Lädt ein Foto speicherschonend: dekodieren, auf 2048 px verkleinern, komprimiert ablegen, Original freigeben. */
  function loadOne(file) {
    return ed.decodeFile(file).then(function (img) {
      var big = scaledCanvas(img, MAX_SIDE);
      if (img.src) img.src = "";
      var png = /png$/i.test(file.type) || /\.png$/i.test(file.name || "");
      var thumbSrc = scaledCanvas(big, THUMB_SRC);
      return canvasToBlob(big, png ? "image/png" : "image/jpeg", 0.92).then(function (blob) {
        release(big);
        var item = { id: nextId++, name: file.name || "", blob: blob, thumbSrc: thumbSrc, view: { zoom: 1, offsetX: 0, offsetY: 0 }, text: "" };
        items.push(item);
        buildItem(item);
        renderThumb(item);
      }, function (e) { release(big); release(thumbSrc); throw e; });
    });
  }

  // ---------- Liste ----------
  function buildItem(item) {
    var li = document.createElement("li");
    li.className = "batch-item";
    var c = document.createElement("canvas");
    c.className = "batch-thumb";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", t("batch.previewLabel", { name: item.name }));
    var name = document.createElement("p");
    name.className = "batch-name";
    name.textContent = item.name;
    name.title = item.name;

    var field = document.createElement("div");
    field.className = "batch-text";
    var inputId = "batch-text-" + item.id;
    var label = document.createElement("label");
    label.className = "visually-hidden";
    label.setAttribute("for", inputId);
    label.textContent = t("batch.textLabel", { name: item.name });
    var input = document.createElement("input");
    input.type = "text";
    input.id = inputId;
    input.maxLength = TEXT_MAX;
    input.autocomplete = "off";
    input.placeholder = textPlaceholder();
    input.title = t("batch.textHint");
    input.addEventListener("input", function () {
      item.text = input.value.slice(0, TEXT_MAX);
      scheduleThumb(item);
    });
    field.appendChild(label);
    field.appendChild(input);

    var note = document.createElement("p");
    note.className = "batch-note";
    note.hidden = true;

    var actions = document.createElement("div");
    actions.className = "batch-actions";
    var adjust = document.createElement("button");
    adjust.type = "button";
    adjust.className = "text-button";
    adjust.textContent = t("batch.adjust");
    adjust.setAttribute("aria-label", t("batch.adjustLabel", { name: item.name }));
    adjust.addEventListener("click", function () { startCrop(item); });
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button danger";
    remove.textContent = t("batch.remove");
    remove.setAttribute("aria-label", t("batch.removeLabel", { name: item.name }));
    remove.addEventListener("click", function () { removeItem(item); });
    actions.appendChild(adjust);
    actions.appendChild(remove);

    li.appendChild(c);
    li.appendChild(name);
    li.appendChild(field);
    li.appendChild(note);
    li.appendChild(actions);
    els.list.appendChild(li);
    item.el = li; item.canvas = c; item.note = note; item.input = input; item.field = field; item.adjust = adjust; item.remove = remove;
    field.hidden = textReplaced();
  }

  function removeItem(item) {
    if (job || session) return;
    var idx = items.indexOf(item);
    if (idx < 0) return;
    var focusNext = items[idx + 1] || items[idx - 1];
    items.splice(idx, 1);
    release(item.thumbSrc); release(item.canvas);
    item.el.remove();
    item.blob = item.thumbSrc = null;
    setStatus(t("batch.removed", { name: item.name }));
    updateUI();
    if (focusNext) focusNext.remove.focus(); else els.input.focus();
  }

  function removeAll() {
    if (job || session || !items.length) return;
    if (!window.confirm(t("batch.confirmRemoveAll", { count: items.length }))) return;
    items.forEach(function (it) { release(it.thumbSrc); release(it.canvas); it.el.remove(); it.blob = it.thumbSrc = null; });
    items = [];
    setStatus(t("batch.removedAll"));
    updateUI();
    els.input.focus();
  }

  function updateUI() {
    els.count.textContent = items.length ? t("batch.count", { count: items.length, max: MAX_PHOTOS }) : "";
    els.empty.hidden = items.length > 0;
    els.toolbar.hidden = items.length === 0;
    var busy = !!(job || session || loading);
    els.zip.disabled = busy || !items.length;
    els.removeAll.disabled = busy || !items.length;
    els.input.disabled = busy || items.length >= MAX_PHOTOS;
    els.drop.classList.toggle("is-disabled", els.input.disabled);
    items.forEach(function (it) {
      it.adjust.disabled = busy;
      it.remove.disabled = busy;
      it.el.classList.toggle("is-editing", !!(session && session.item === it));
    });
    var size = selectedSize();
    els.zipLabel.textContent = t("batch.download", { size: size });
  }

  function selectedSize() {
    var r = document.querySelector('input[name="batchSize"]:checked');
    return r ? Number(r.value) : 1080;
  }

  // ---------- Vorschauen (klein, gedrosselt) ----------
  function renderThumb(item) {
    if (!item.thumbSrc || !item.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = Math.round(THUMB_CSS * dpr);
    var c = item.canvas;
    if (c.width !== size) { c.width = size; c.height = size; }
    var s = itemState(item);
    var info = PBG.render(c.getContext("2d"), s, item.thumbSrc, size, { logo: ed.logo(), background: s.bg });
    var msg = info.overflow ? t("batch.textTooLong") : info.scale < 0.995 ? t("batch.textShrunk", { percent: Math.round(info.scale * 100) }) : "";
    item.note.textContent = msg;
    item.note.hidden = !msg;
    // Schrift noch nicht geladen: nach dem Laden erneut zeichnen
    ed.ensureFont(s).then(function () { if (!item.fontDone) { item.fontDone = true; scheduleThumb(item); } });
  }

  var queue = [], queued = false;
  function scheduleThumb(item) {
    if (queue.indexOf(item) < 0) queue.push(item);
    if (queued) return;
    queued = true;
    requestAnimationFrame(drainQueue);
  }
  /** Höchstens wenige Vorschauen pro Frame, damit Regler und Eingaben flüssig bleiben. */
  function drainQueue() {
    var start = performance.now();
    while (queue.length && performance.now() - start < 12) {
      var it = queue.shift();
      if (items.indexOf(it) >= 0) renderThumb(it);
    }
    if (queue.length) requestAnimationFrame(drainQueue); else queued = false;
  }

  var lastKey = "", lastLogo = null, refreshTimer = 0;
  /** Design geändert (app.js meldet jedes Neuzeichnen): nur bei echter Änderung alle Vorschauen neu, gedrosselt. */
  function onDesign() {
    var s = ed.state();
    var key = JSON.stringify(PBG.DESIGN_KEYS.map(function (k) { return s[k]; }).concat([s.bg]));
    var logo = ed.logo();
    if (key === lastKey && logo === lastLogo) return;
    lastKey = key; lastLogo = logo;
    var hide = textReplaced(), ph = textPlaceholder();
    items.forEach(function (it) { it.field.hidden = hide; it.input.placeholder = ph; });
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { items.forEach(scheduleThumb); }, 120);
  }

  // ---------- Ausschnitt anpassen im normalen Editor ----------
  function startCrop(item) {
    if (session || job || loading) return;
    blobToCanvas(item.blob).then(function (canvas) {
      session = { item: item, saved: ed.getPhoto(), canvas: canvas };
      ed.setPhoto(canvas, item.name, item.view, item.text);
      els.cropTitle.textContent = t("batch.cropTitle", { name: item.name });
      els.cropBar.hidden = false;
      updateUI();
      var stage = ed.stage();
      stage.scrollIntoView({ behavior: "smooth", block: "center" });
      $("preview").focus({ preventScroll: true });
    }).catch(function () { setStatus(t("batch.cropError"), true); });
  }

  function endCrop(apply) {
    if (!session) return;
    var sess = session, item = sess.item;
    var cur = ed.getPhoto();
    var done;
    if (apply && cur.photo === sess.canvas) {
      item.view = { zoom: cur.zoom, offsetX: cur.offsetX, offsetY: cur.offsetY };
      done = Promise.resolve();
    } else if (apply && cur.photo) {
      // Während der Bearbeitung wurde im Editor ein anderes Foto geladen: dieses übernehmen
      var thumbSrc = scaledCanvas(cur.photo, THUMB_SRC);
      var big = scaledCanvas(cur.photo, MAX_SIDE);
      done = canvasToBlob(big, "image/jpeg", 0.92).then(function (blob) {
        release(big);
        release(item.thumbSrc);
        item.blob = blob; item.thumbSrc = thumbSrc;
        item.view = { zoom: cur.zoom, offsetX: cur.offsetX, offsetY: cur.offsetY };
      });
    } else {
      done = Promise.resolve();
    }
    return done.then(function () {
      // Vorheriges Einzelfoto samt Ausschnitt wiederherstellen
      ed.setPhoto(sess.saved.photo, sess.saved.name, sess.saved);
      // Arbeitskopien freigeben: das Session-Canvas und ein während der Bearbeitung geladenes anderes Foto
      release(sess.canvas);
      if (cur.photo && cur.photo !== sess.canvas && cur.photo !== sess.saved.photo) release(cur.photo);
      session = null;
      els.cropBar.hidden = true;
      renderThumb(item);
      setStatus(t(apply ? "batch.cropApplied" : "batch.cropCancelled", { name: item.name }));
      updateUI();
      if (!els.section.open) els.section.open = true;
      item.el.scrollIntoView({ behavior: "smooth", block: "center" });
      item.adjust.focus({ preventScroll: true });
    });
  }

  // ---------- ZIP-Export ----------
  function progress(done, total) {
    els.progressBar.max = total;
    els.progressBar.value = done;
    els.progressText.textContent = t("batch.progress", { done: done, total: total });
  }

  function exportZip() {
    if (!items.length || job || session || loading) return;
    var size = selectedSize();
    var list = items.slice();
    var used = {};
    var writer = new PBG.zip.Writer();
    var me = job = { cancelled: false };
    els.progress.hidden = false;
    setStatus("");
    progress(0, list.length);
    updateUI();
    els.cancel.focus();

    var fontsReady = Promise.all(list.map(function (it) { return ed.ensureFont(itemState(it)); }));
    var chain = fontsReady;
    list.forEach(function (item, i) {
      chain = chain.then(function () {
        if (me.cancelled) return;
        return blobToCanvas(item.blob).then(function (photo) {
          var s = itemState(item);
          var out = document.createElement("canvas");
          out.width = out.height = size;
          PBG.render(out.getContext("2d"), s, photo, size, { logo: ed.logo(), background: s.bg });
          release(photo);
          return canvasToBlob(out, "image/png").then(function (png) {
            release(out);
            if (me.cancelled) return;
            return writer.add(fileName(item, used), png);
          });
        }).then(function () {
          if (me.cancelled) return;
          progress(i + 1, list.length);
          // dem Browser Luft lassen (Abbrechen-Button, Bildschirm)
          return new Promise(function (r) { setTimeout(r, 0); });
        });
      });
    });

    chain.then(function () {
      if (me.cancelled) { setStatus(t("batch.cancelled")); return; }
      var zip = writer.finish();
      var url = URL.createObjectURL(zip);
      var a = document.createElement("a");
      a.href = url;
      a.download = t("batch.zipName");
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      setStatus(t("batch.done", { count: list.length, size: size }));
    }).catch(function () {
      setStatus(t("batch.error"), true);
    }).then(function () {
      writer = null;
      job = null;
      els.progress.hidden = true;
      updateUI();
      els.zip.focus();
    });
  }

  // ---------- Bedienung ----------
  function bind() {
    els.input.addEventListener("change", function () { addFiles(els.input.files); });
    var depth = 0;
    els.drop.addEventListener("dragenter", function (e) { e.preventDefault(); depth++; els.drop.classList.add("drag-over"); });
    els.drop.addEventListener("dragover", function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    els.drop.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; els.drop.classList.remove("drag-over"); } });
    els.drop.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      els.drop.classList.remove("drag-over");
      addFiles(e.dataTransfer && e.dataTransfer.files);
    });
    els.zip.addEventListener("click", exportZip);
    els.cancel.addEventListener("click", function () {
      if (!job) return;
      job.cancelled = true;
      els.progressText.textContent = t("batch.cancelling");
    });
    els.removeAll.addEventListener("click", removeAll);
    document.querySelectorAll('input[name="batchSize"]').forEach(function (r) { r.addEventListener("change", updateUI); });
    els.cropApply.addEventListener("click", function () { endCrop(true); });
    els.cropCancel.addEventListener("click", function () { endCrop(false); });
    els.cropBar.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); endCrop(false); } });
    document.addEventListener("pbg:design", onDesign);
    // Sprungmarke #mehrere-fotos öffnet den eingeklappten Bereich
    var openFromHash = function () { if (location.hash === "#mehrere-fotos") els.section.open = true; };
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }

  bind();
  updateUI();
  onDesign();

  /** Für Tests und Fehlersuche: Anzahl und Speicherbedarf der gehaltenen Daten (keine Fotos). */
  PBG.batch = {
    count: function () { return items.length; },
    bytes: function () { return items.reduce(function (n, it) { return n + (it.blob ? it.blob.size : 0) + (it.thumbSrc ? it.thumbSrc.width * it.thumbSrc.height * 4 : 0); }, 0); }
  };
})();
