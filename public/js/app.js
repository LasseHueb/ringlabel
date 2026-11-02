/*
 * Profilbild-Rahmen-Editor – UI-Logik. Fotos werden ausschließlich lokal im Browser verarbeitet.
 * Alle Funktionen stehen allen zur Verfügung; es gibt kein Backend.
 * Startvorlage über <body data-preset="jobsuche"> oder ?vorlage=jobsuche; ein geteiltes Design über #d=… (siehe „Design als Link“).
 */
(function () {
  "use strict";

  var MAX_PHOTO_SIDE = 3200;   // größere Fotos werden beim Laden verkleinert (Speicher auf Mobilgeräten)
  var MAX_ZOOM = 4;
  var MAX_LOGO_SIDE = 512;     // Logos werden beim Laden auf höchstens 512 px verkleinert
  var MAX_LOGO_FILE_MB = 10;
  var RANGE_KEYS = ["size", "sizeTop", "spacing", "textPos", "ringWidth", "ringLength", "ringRotation", "fade", "opacity", "logoSize"];
  /** Regler, die je Form keine Wirkung haben und ausgeblendet werden. */
  var HIDDEN_BY_SHAPE = { arc: [], ring: ["ringLength", "fade"], badge: ["textTop", "sizeTop", "textPos", "ringLength", "ringRotation", "fade"] };
  var COLOR_KEYS = ["textColor", "ringColor", "ringColor2"];

  var $ = function (id) { return document.getElementById(id); };
  var t = PBG.t;
  var cfg = PBG.config || {};
  var body = document.body;

  if (!$("editor")) return; // Seite ohne Editor

  // ---------- Zustand ----------
  var state = Object.assign({}, PBG.DEFAULTS, { zoom: 1, offsetX: 0, offsetY: 0, exportSize: 1080 });
  var photo = null;          // verkleinerter Canvas mit dem Foto (nur im Arbeitsspeicher)
  var photoName = "";
  var logo = null;           // Logo als Canvas (nur im Arbeitsspeicher, nie hochgeladen)
  var logoDataUrl = "";      // dasselbe Logo als PNG-Data-URL (für eigene Vorlagen im lokalen Speicher)
  var activePreset = null;
  var lastInfo = { scale: 1, overflow: false, topScale: 1, topOverflow: false };

  var els = {
    preview: $("preview"), stage: $("stage"),
    fileInput: $("file-input"), dropzone: $("dropzone"), uploadStatus: $("upload-status"),
    zoom: $("zoom"), resetCrop: $("reset-crop"), removePhoto: $("remove-photo"),
    presets: $("presets"), presetsCurrent: $("presets-current"), currentSection: $("current-presets"),
    presetsOccasions: $("presets-occasions"), occasionSection: $("occasion-presets"),
    text: $("text"), textReplaced: $("text-replaced"), font: $("font"), bold: $("bold"), uppercase: $("uppercase"),
    textTop: $("textTop"), shapeHint: $("shape-hint"), ringWidthLabel: $("ringWidth-label"),
    ownList: $("own-list"), ownEmpty: $("own-empty"), ownSaveForm: $("own-save-form"), ownName: $("own-name"),
    ownImport: $("own-import"), ownStatus: $("own-status"),
    logoInput: $("logo-input"), logoRemove: $("logo-remove"), logoStatus: $("logo-status"), logoSettings: $("logo-settings"),
    icon: $("icon"), iconPos: $("iconPos"), emojiRow: $("emoji-row"),
    gradient: $("gradient"), ringColor2Field: $("ringColor2-field"),
    textWarning: $("text-warning"), contrastWarning: $("contrast-warning"),
    download: $("download"), downloadLabel: $("download-label"), share: $("share"), exportStatus: $("export-status"),
    shareDialog: $("share-dialog"), shareStatus: $("share-status"), shareDontShow: $("share-dont-show"),
    linkDesign: $("link-design"), linkDialog: $("link-dialog"), linkUrl: $("link-url"), linkCopy: $("link-copy"),
    linkStatus: $("link-status"), linkLogoNote: $("link-logo-note"),
    linkNotice: $("link-notice"), linkNoticeText: $("link-notice-text"), linkNoticeSave: $("link-notice-save"), linkNoticeClose: $("link-notice-close")
  };

  // ---------- Hilfsfunktionen ----------
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function normalizeHex(v) {
    v = String(v || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(v)) v = v.replace(/(.)/g, "$1$1");
    return /^[0-9a-f]{6}$/i.test(v) ? "#" + v.toLowerCase() : null;
  }

  function luminance(hex) {
    return PBG.color.hexToRgb(hex).reduce(function (sum, c, i) {
      c /= 255;
      c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return sum + c * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  }

  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function formatValue(key, v) {
    var el = $(key);
    var unit = el && el.dataset.unit;
    if (key === "zoom") return Math.round(v * 100) + " %";
    if (unit === "deg") return Math.round(v) + "°";
    if (unit === "pct") return Math.round(v) + " %";
    return String(v);
  }

  function setStatus(el, msg, isError) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", !!isError);
  }

  function showDialog(d) {
    if (d.showModal) { if (!d.open) d.showModal(); }
    else d.setAttribute("open", "");
  }

  function closeDialog(d) {
    if (d.close) d.close(); else d.removeAttribute("open");
  }

  // ---------- Schriften ----------
  var fontPromises = {};
  var fontsLoaded = {};
  function fontKey(s) { return (s.bold ? "700 " : "400 ") + s.font; }
  function ensureFont(s) {
    var key = fontKey(s);
    if (!fontPromises[key]) {
      var f = PBG.fontById(s.font);
      var w = s.bold && f.weights.indexOf(700) >= 0 ? "700" : "400";
      var p = document.fonts && document.fonts.load
        ? document.fonts.load(w + ' 40px "' + s.font + '"', "ABCÄÖÜ abc").catch(function () {})
        : Promise.resolve();
      fontPromises[key] = p.then(function () { fontsLoaded[key] = true; });
    }
    return fontPromises[key];
  }

  // ---------- Rendern ----------
  var rafPending = false;
  function requestRender() {
    // Schrift noch nicht geladen: nach dem Laden erneut zeichnen
    if (!fontsLoaded[fontKey(state)]) ensureFont(state).then(requestRender);
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      renderAll();
    });
  }

  function sizeCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var cssW = canvas.clientWidth || canvas.width;
    var px = Math.max(16, Math.round(cssW * dpr));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    return px;
  }

  function renderState() {
    return state;
  }

  function renderOpts(extra) {
    return Object.assign({ logo: logo }, extra || {});
  }

  function renderAll() {
    var s = renderState();
    var size = sizeCanvas(els.preview);
    lastInfo = PBG.render(els.preview.getContext("2d"), s, photo, size, renderOpts());
    updateWarnings();
    els.preview.setAttribute("aria-label", t("preview.canvasLabel", { text: state.text || "–" }));
    // Profil-Banner (banner.js) übernimmt Farben, Schrift und Logo des Rahmens
    document.dispatchEvent(new Event("pbg:design"));
  }

  function updateWarnings() {
    var msgs = [];
    if (lastInfo.overflow) msgs.push(t(state.shape === "ring" || state.shape === "badge" ? "text.tooLongShape" : "text.tooLong"));
    else if (lastInfo.scale < 0.995) msgs.push(t("text.shrunk", { percent: Math.round(lastInfo.scale * 100) }));
    if (lastInfo.topOverflow) msgs.push(t("text.topTooLong"));
    else if (lastInfo.topScale < 0.995) msgs.push(t("text.topShrunk", { percent: Math.round(lastInfo.topScale * 100) }));
    els.textWarning.textContent = msgs.join(" ");
    els.textWarning.hidden = !msgs.length;

    var ratio = contrast(state.textColor, state.ringColor);
    if (state.gradient) ratio = Math.min(ratio, contrast(state.textColor, state.ringColor2));
    var low = ratio < 3 && !!state.text && !(logo && state.logoPos === "replace");
    els.contrastWarning.textContent = low ? t("text.lowContrast", { ratio: ratio.toFixed(1).replace(".", PBG.lang === "de" ? "," : ".") }) : "";
    els.contrastWarning.hidden = !low;
  }

  // ---------- Formular <-> Zustand ----------
  function buildFontOptions() {
    var current = state.font;
    els.font.innerHTML = "";
    PBG.FONTS.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f.id;
      o.textContent = PBG.loc(f.label);
      els.font.appendChild(o);
    });
    els.font.value = current;
  }

  function buildIconOptions() {
    if (!els.icon) return;
    var current = state.icon;
    els.icon.innerHTML = "";
    var none = document.createElement("option");
    none.value = "";
    none.textContent = t("icon.none");
    els.icon.appendChild(none);
    PBG.ICONS.forEach(function (ic) {
      var o = document.createElement("option");
      o.value = ic.id;
      o.textContent = PBG.loc(ic.label);
      els.icon.appendChild(o);
    });
    els.icon.value = current;
  }

  function buildEmojiRow() {
    if (!els.emojiRow) return;
    els.emojiRow.innerHTML = "";
    PBG.EMOJIS.forEach(function (e) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "emoji-btn";
      b.textContent = e;
      b.setAttribute("aria-label", t("emoji.label") + " " + e);
      b.addEventListener("click", function () {
        var el = els.text;
        var pos = el.selectionStart != null ? el.selectionStart : el.value.length;
        var end = el.selectionEnd != null ? el.selectionEnd : pos;
        var v = el.value.slice(0, pos) + e + el.value.slice(end);
        if (v.length > Number(el.maxLength || 60)) return;
        el.value = v;
        state.text = v;
        el.focus();
        try { el.setSelectionRange(pos + e.length, pos + e.length); } catch (err) { /* alt */ }
        changed();
      });
      els.emojiRow.appendChild(b);
    });
  }

  /** Blendet Regler aus, die bei der gewählten Form keine Wirkung haben, und passt Beschriftungen an. */
  function updateShapeUI() {
    var shape = HIDDEN_BY_SHAPE[state.shape] ? state.shape : "arc";
    Object.keys(HIDDEN_BY_SHAPE.badge.concat(HIDDEN_BY_SHAPE.ring).reduce(function (o, k) { o[k] = 1; return o; }, {})).forEach(function (k) {
      var el = $(k);
      var field = el && (el.closest(".field") || el);
      if (field) field.hidden = HIDDEN_BY_SHAPE[shape].indexOf(k) >= 0;
    });
    els.ringWidthLabel.textContent = t(shape === "badge" ? "ring.widthBadge" : "ring.width");
    els.shapeHint.textContent = t(shape === "badge" ? "shape.hintBadge" : shape === "ring" ? "shape.hintRing" : "shape.hintArc");
    document.querySelectorAll('input[name="shape"]').forEach(function (r) { r.checked = r.value === shape; });
  }

  function syncControls() {
    els.text.value = state.text;
    els.textTop.value = state.textTop;
    els.font.value = state.font;
    els.bold.checked = state.bold;
    els.bold.disabled = PBG.fontById(state.font).weights.indexOf(700) < 0;
    els.uppercase.checked = state.uppercase;
    els.gradient.checked = state.gradient;
    els.ringColor2Field.hidden = !state.gradient;
    els.icon.value = state.icon;
    els.iconPos.value = state.iconPos;
    els.iconPos.disabled = !state.icon;
    RANGE_KEYS.forEach(function (k) {
      $(k).value = state[k];
      updateOutput(k);
    });
    COLOR_KEYS.forEach(function (k) {
      $(k).value = state[k];
      $(k + "-hex").value = state[k].toUpperCase();
      $(k + "-hex").removeAttribute("aria-invalid");
    });
    els.zoom.value = state.zoom;
    updateOutput("zoom");
    document.querySelectorAll('input[name="logoPos"]').forEach(function (r) { r.checked = r.value === state.logoPos; });
    updateLogoUI();
    updateShapeUI();
    document.querySelectorAll('input[name="bg"]').forEach(function (r) { r.checked = r.value === state.bg; });
    document.querySelectorAll('input[name="exportSize"]').forEach(function (r) { r.checked = Number(r.value) === state.exportSize; });
    els.downloadLabel.textContent = t("export.download", { size: state.exportSize });
  }

  function updateOutput(key) {
    var out = $(key + "-out");
    var text = formatValue(key, state[key]);
    if (out) out.textContent = text;
    $(key).setAttribute("aria-valuetext", text);
  }

  function changed() {
    if (activePreset) {
      activePreset = null;
      markPreset();
    }
    requestRender();
  }

  function bindControls() {
    els.text.addEventListener("input", function () { state.text = els.text.value; changed(); });
    els.textTop.addEventListener("input", function () { state.textTop = els.textTop.value; changed(); });
    document.querySelectorAll('input[name="shape"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        state.shape = r.value;
        updateShapeUI();
        changed();
      });
    });

    els.font.addEventListener("change", function () {
      var f = PBG.fontById(els.font.value);
      state.font = f.id;
      els.bold.disabled = f.weights.indexOf(700) < 0;
      changed();
    });

    ["bold", "uppercase"].forEach(function (k) {
      els[k].addEventListener("change", function () { state[k] = els[k].checked; changed(); });
    });

    els.gradient.addEventListener("change", function () {
      state.gradient = els.gradient.checked;
      els.ringColor2Field.hidden = !state.gradient;
      changed();
    });

    els.icon.addEventListener("change", function () {
      state.icon = els.icon.value;
      els.iconPos.disabled = !state.icon;
      changed();
    });
    els.iconPos.addEventListener("change", function () { state.iconPos = els.iconPos.value; changed(); });

    RANGE_KEYS.forEach(function (k) {
      $(k).addEventListener("input", function () {
        state[k] = parseFloat($(k).value);
        updateOutput(k);
        changed();
      });
    });

    COLOR_KEYS.forEach(function (k) {
      var picker = $(k), hex = $(k + "-hex");
      picker.addEventListener("input", function () {
        state[k] = picker.value.toLowerCase();
        hex.value = state[k].toUpperCase();
        hex.removeAttribute("aria-invalid");
        changed();
      });
      hex.addEventListener("input", function () {
        var v = normalizeHex(hex.value);
        if (v) {
          state[k] = v;
          picker.value = v;
          hex.removeAttribute("aria-invalid");
          hex.removeAttribute("title");
          changed();
        } else {
          hex.setAttribute("aria-invalid", "true");
          hex.setAttribute("title", t("hex.invalid"));
        }
      });
      hex.addEventListener("blur", function () {
        hex.value = state[k].toUpperCase();
        hex.removeAttribute("aria-invalid");
      });
    });

    els.zoom.addEventListener("input", function () { setZoom(parseFloat(els.zoom.value)); });

    document.querySelectorAll('input[name="bg"]').forEach(function (r) {
      r.addEventListener("change", function () { if (r.checked) state.bg = r.value; });
    });
    document.querySelectorAll('input[name="exportSize"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        var v = Number(r.value);
        state.exportSize = v;
        els.downloadLabel.textContent = t("export.download", { size: v });
      });
    });

    els.resetCrop.addEventListener("click", function () {
      state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
      els.zoom.value = 1; updateOutput("zoom");
      requestRender();
    });
    els.removePhoto.addEventListener("click", function () {
      photo = null; photoName = "";
      state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
      els.zoom.value = 1; updateOutput("zoom");
      els.removePhoto.hidden = true;
      els.fileInput.value = "";
      setStatus(els.uploadStatus, "");
      requestRender();
    });
  }

  // ---------- Vorlagen ----------
  var PRESETS_VISIBLE = 9;   // so viele Vorlagen sind sichtbar, der Rest per „Alle … anzeigen“

  /**
   * Verteilt die Vorlagen: normale Vorlagen in die Liste „Vorlagen“, Anlässe nach „Anlässe“ – außer sie liegen im
   * Zeitfenster (Datum des Geräts), dann stehen sie oben unter „Gerade passend“.
   */
  function presetGroups() {
    var today = PBG.today();
    var g = { regular: [], current: [], occasions: [] };
    PBG.PRESETS.forEach(function (p) {
      if (!p.occasion) g.regular.push(p);
      else if (PBG.isOccasionNow(p, today)) g.current.push(p);
      else g.occasions.push(p);
    });
    return g;
  }

  function buildPresets() {
    if (!els.presets) return;
    var groups = presetGroups();
    [[els.presets, groups.regular], [els.presetsCurrent, groups.current], [els.presetsOccasions, groups.occasions]].forEach(function (pair) {
      pair[0].innerHTML = "";
      pair[1].forEach(function (p) { pair[0].appendChild(presetButton(p)); });
    });
    els.currentSection.hidden = !groups.current.length;
    els.occasionSection.hidden = !groups.occasions.length;
    var more = $("more-presets");
    if (more) {
      var count = groups.regular.length;
      var setLabel = function () {
        var open = !els.presets.classList.contains("collapsed");
        more.textContent = open ? t("presets.less") : t("presets.more", { count: count });
        more.setAttribute("aria-expanded", String(open));
      };
      more.onclick = function () { els.presets.classList.toggle("collapsed"); setLabel(); };
      more.hidden = count <= PRESETS_VISIBLE;
      setLabel();
    }
    renderPresetThumbs();
    markPreset();
  }

  function presetButton(p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset";
    btn.dataset.key = p.key;
    btn.dataset.name = PBG.loc(p.name);
    btn.setAttribute("aria-pressed", "false");
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.textContent = PBG.loc(p.name);
    btn.appendChild(c);
    btn.appendChild(label);
    btn.addEventListener("click", function () { applyPreset(p); });
    return btn;
  }

  function presetState(p) {
    var s = {};
    PBG.DESIGN_KEYS.forEach(function (k) { s[k] = PBG.DEFAULTS[k]; });
    Object.assign(s, p.values, { text: PBG.presetText(p, "text"), textTop: PBG.presetText(p, "textTop") });
    return s;
  }

  var thumbObserver = null;
  function renderPresetThumbs() {
    if (!els.presets) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var size = Math.round(56 * dpr);
    function draw(btn) {
      var p = PBG.presetByKey(btn.dataset.key);
      var c = btn.querySelector("canvas");
      c.width = c.height = size;
      var s = Object.assign({ zoom: 1, offsetX: 0, offsetY: 0 }, presetState(p));
      ensureFont(s).then(function () { PBG.render(c.getContext("2d"), s, null, size); });
    }
    var btns = document.querySelectorAll("#presets .preset, #presets-current .preset, #presets-occasions .preset");
    // Vorschaubilder erst zeichnen, wenn sie sichtbar werden (schnellerer Seitenaufbau)
    if (window.IntersectionObserver) {
      if (thumbObserver) thumbObserver.disconnect();
      thumbObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { draw(e.target); thumbObserver.unobserve(e.target); }
        });
      }, { rootMargin: "200px" });
      btns.forEach(function (b) { thumbObserver.observe(b); });
    } else {
      btns.forEach(draw);
    }
  }

  function applyPreset(p) {
    // Foto-Ausschnitt, Export und Logo-Einstellungen bleiben beim Wechsel der Vorlage erhalten
    var keep = { zoom: state.zoom, offsetX: state.offsetX, offsetY: state.offsetY, bg: state.bg, exportSize: state.exportSize, logoPos: state.logoPos, logoSize: state.logoSize };
    Object.assign(state, presetState(p), keep);
    activePreset = p.key;
    endLinkOffer();
    syncControls();
    markPreset();
    requestRender();
  }

  /**
   * Buttons „Vorlage übernehmen“ im Ideen-Abschnitt der Seite.
   * "@anlass" = der erste gerade passende Anlass, sonst der erste Anlass überhaupt.
   */
  function bindPresetButtons() {
    document.querySelectorAll("[data-apply-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.getAttribute("data-apply-preset");
        var p;
        if (key === "@anlass") {
          var g = presetGroups();
          p = g.current[0] || g.occasions[0];
        } else p = PBG.presetByKey(key);
        if (!p) return;
        applyPreset(p);
        els.stage.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function markPreset() {
    document.querySelectorAll(".preset").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.key === activePreset));
    });
  }

  // ---------- Eigene Vorlagen: nur im lokalen Speicher dieses Browsers, nie mit Foto ----------
  var OWN_KEY = "rl-own-templates";
  var OWN_MAX = 50;
  var OWN_FILE_MAX = 1024 * 1024;   // Import-Dateien höchstens 1 MB
  var OWN_FORMAT = "ringlabel-vorlage";
  var NAME_MAX = 40;
  /** Erlaubte Bereiche (wie die Regler im Editor) – gilt für gespeicherte und importierte Vorlagen. */
  var RANGES = { size: [35, 95], sizeTop: [35, 95], spacing: [-5, 50], textPos: [-90, 90], ringWidth: [8, 32], ringLength: [180, 350],
    ringRotation: [-90, 90], fade: [0, 70], opacity: [40, 100], logoSize: [40, 100] };
  var CHOICES = { iconPos: ["start", "end", "both"], logoPos: ["start", "end", "replace"], shape: ["arc", "ring", "badge"] };
  var LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/]+={0,2}$/;

  var ownTemplates = [];
  var ownLogoImages = {};   // id → dekodiertes Logo (für Vorschaubilder und Anwenden)

  /** Prüft einen einzelnen Design-Wert. Gibt den bereinigten Wert oder undefined zurück. */
  function validValue(k, v) {
    if (RANGES[k]) return typeof v === "number" && isFinite(v) && v >= RANGES[k][0] && v <= RANGES[k][1] ? v : undefined;
    if (CHOICES[k]) return CHOICES[k].indexOf(v) >= 0 ? v : undefined;
    if (COLOR_KEYS.indexOf(k) >= 0) return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined;
    if (k === "bold" || k === "uppercase" || k === "gradient") return typeof v === "boolean" ? v : undefined;
    if (k === "text") return typeof v === "string" && v.length <= 60 ? v : undefined;
    if (k === "textTop") return typeof v === "string" && v.length <= 40 ? v : undefined;
    if (k === "font") return typeof v === "string" && PBG.fontById(v).id === v ? v : undefined;
    if (k === "icon") return v === "" || (typeof v === "string" && PBG.ICONS.some(function (ic) { return ic.id === v; })) ? v : undefined;
    return undefined;
  }

  /**
   * Prüft eine Vorlage streng: nur bekannte Schlüssel, Werte im erlaubten Bereich, Logo nur als PNG/JPEG/WebP-Data-URL.
   * Gibt { template, dropped[] } zurück oder null, wenn gar kein gültiges Design enthalten ist.
   */
  function validateTemplate(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    var dropped = [];
    Object.keys(raw).forEach(function (k) {
      if (["format", "version", "id", "name", "design", "logo", "created", "banner"].indexOf(k) < 0) dropped.push(k);
    });
    var d = raw.design;
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    var design = {};
    Object.keys(d).forEach(function (k) {
      if (PBG.DESIGN_KEYS.indexOf(k) < 0) { dropped.push(k); return; }
      var v = validValue(k, d[k]);
      if (v === undefined) dropped.push(k); else design[k] = v;
    });
    if (!Object.keys(design).length) return null;
    // Banner-Einstellungen sind optional (ältere Vorlagen haben keine)
    var b = PBG.validateBanner(raw.banner);
    dropped = dropped.concat(b.dropped);
    var logoUrl = null;
    if (raw.logo != null && raw.logo !== "") {
      if (typeof raw.logo === "string" && raw.logo.length <= OWN_FILE_MAX * 1.4 && LOGO_DATA_URL.test(raw.logo)) logoUrl = raw.logo;
      else dropped.push("logo");
    }
    var name = typeof raw.name === "string" ? raw.name.trim().slice(0, NAME_MAX) : "";
    return {
      template: {
        id: typeof raw.id === "string" && /^[a-z0-9-]{1,40}$/.test(raw.id) ? raw.id : newId(),
        name: name || t("own.unnamed"),
        design: design,
        logo: logoUrl,
        banner: b.banner,
        created: typeof raw.created === "number" && isFinite(raw.created) ? raw.created : Date.now()
      },
      dropped: dropped
    };
  }

  function newId() {
    return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadOwnTemplates() {
    var list = [];
    try { list = JSON.parse(PBG.storage.get(OWN_KEY) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    ownTemplates = list.map(function (raw) { var r = validateTemplate(raw); return r && r.template; }).filter(Boolean).slice(0, OWN_MAX);
  }

  /** Speichert die Liste; gibt null oder eine Fehlermeldung zurück. */
  function persistOwnTemplates() {
    var err = PBG.storage.trySet(OWN_KEY, JSON.stringify(ownTemplates));
    return err === "full" ? t("own.errorFull") : err === "blocked" ? t("own.errorBlocked") : null;
  }

  function currentTemplate(name) {
    var design = {};
    PBG.DESIGN_KEYS.forEach(function (k) { design[k] = state[k]; });
    return { id: newId(), name: name, design: design, logo: logo ? logoDataUrl : null, banner: PBG.banner ? PBG.banner.get() : null, created: Date.now() };
  }

  /** Dekodiert das Logo einer Vorlage (Data-URL) zu einem Bild; Ergebnis wird zwischengespeichert. */
  function templateLogo(tpl) {
    if (!tpl.logo) return Promise.resolve(null);
    if (!ownLogoImages[tpl.id]) {
      ownLogoImages[tpl.id] = new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("logo")); };
        img.src = tpl.logo;
      });
    }
    return ownLogoImages[tpl.id];
  }

  function applyOwnTemplate(tpl) {
    var keep = { zoom: state.zoom, offsetX: state.offsetX, offsetY: state.offsetY, bg: state.bg, exportSize: state.exportSize };
    var s0 = {};
    PBG.DESIGN_KEYS.forEach(function (k) { s0[k] = PBG.DEFAULTS[k]; });
    Object.assign(state, s0, tpl.design, keep);
    activePreset = "own:" + tpl.id;
    // Vorlagen ohne Banner-Einstellungen lassen das aktuelle Banner unverändert
    if (tpl.banner && PBG.banner) PBG.banner.set(tpl.banner);
    endLinkOffer();
    templateLogo(tpl).then(function (img) {
      if (img) setLogoCanvas(toLogoCanvas(img, false)); else clearLogo();
    }).catch(clearLogo).then(function () {
      syncControls();
      markPreset();
      requestRender();
    });
  }

  function ownMsg(msg, isError) { setStatus(els.ownStatus, msg, isError); }

  function slug(name) {
    return (name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).slice(0, 40);
  }

  function exportOwnTemplate(tpl) {
    var data = { format: OWN_FORMAT, version: 1, name: tpl.name, design: tpl.design, logo: tpl.logo || null };
    if (tpl.banner) data.banner = tpl.banner;
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    var s = slug(tpl.name);
    a.download = t("own.filename") + (s ? "-" + s : "") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    ownMsg(t("own.exported", { name: tpl.name }));
  }

  function importOwnTemplate(file) {
    if (!file) return;
    if (file.size > OWN_FILE_MAX) { ownMsg(t("own.errorFileSize"), true); return; }
    if (file.type && !/json/.test(file.type) && !/\.json$/i.test(file.name || "")) { ownMsg(t("own.errorFileType"), true); return; }
    if (ownTemplates.length >= OWN_MAX) { ownMsg(t("own.limit", { max: OWN_MAX }), true); return; }
    var reader = new FileReader();
    reader.onerror = function () { ownMsg(t("own.errorFile"), true); };
    reader.onload = function () {
      var raw;
      try { raw = JSON.parse(String(reader.result)); } catch (e) { ownMsg(t("own.errorFile"), true); return; }
      var r = validateTemplate(raw);
      if (!r || raw.format !== OWN_FORMAT) { ownMsg(t("own.errorFile"), true); return; }
      var tpl = r.template;
      tpl.id = newId();
      var check = templateLogo(tpl).then(function () { return true; }, function () {
        // Data-URL sieht gültig aus, lässt sich aber nicht als Bild öffnen
        delete ownLogoImages[tpl.id];
        tpl.logo = null;
        r.dropped.push("logo");
        return true;
      });
      check.then(function () {
        ownTemplates.unshift(tpl);
        var err = persistOwnTemplates();
        if (err) { ownTemplates.shift(); ownMsg(err, true); return; }
        renderOwnList();
        applyOwnTemplate(tpl);
        var msg = t("own.imported", { name: tpl.name });
        if (r.dropped.length) msg += " " + t("own.importDropped", { fields: r.dropped.join(", ") });
        ownMsg(msg, r.dropped.length > 0);
      });
    };
    reader.readAsText(file);
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
    var cancel = smallButton(t("own.renameCancel"), "", function () { renderOwnList(); });
    form.appendChild(input); form.appendChild(ok); form.appendChild(cancel);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = input.value.trim().slice(0, NAME_MAX);
      if (!name) { ownMsg(t("own.nameMissing"), true); input.focus(); return; }
      var old = tpl.name;
      tpl.name = name;
      var err = persistOwnTemplates();
      if (err) { tpl.name = old; ownMsg(err, true); return; }
      renderOwnList();
      ownMsg(t("own.renamed", { name: name }));
    });
    li.querySelector(".own-actions").replaceWith(form);
    input.focus();
    input.select();
  }

  function renderOwnList() {
    var list = els.ownList;
    list.innerHTML = "";
    els.ownEmpty.hidden = ownTemplates.length > 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var size = Math.round(56 * dpr);
    ownTemplates.forEach(function (tpl) {
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
      c.width = c.height = size;
      var label = document.createElement("span");
      label.textContent = tpl.name;
      btn.appendChild(c);
      btn.appendChild(label);
      btn.addEventListener("click", function () { applyOwnTemplate(tpl); });
      var s = Object.assign({ zoom: 1, offsetX: 0, offsetY: 0 }, PBG.DEFAULTS, tpl.design);
      Promise.all([ensureFont(s), templateLogo(tpl).catch(function () { return null; })]).then(function (r) {
        PBG.render(c.getContext("2d"), s, null, size, { logo: r[1] || null });
      });
      var actions = document.createElement("div");
      actions.className = "own-actions";
      actions.appendChild(smallButton(t("own.rename"), "", function () { startRename(li, tpl); }));
      var linkBtn = smallButton(t("link.copyOwn"), "", function () {
        openLinkDialog(Object.assign(defaultDesign(), tpl.design), !!tpl.logo);
      });
      linkBtn.setAttribute("aria-label", t("link.copyOwnLabel", { name: tpl.name }));
      actions.appendChild(linkBtn);
      actions.appendChild(smallButton(t("own.export"), "", function () { exportOwnTemplate(tpl); }));
      actions.appendChild(smallButton(t("own.delete"), "danger", function () {
        if (!window.confirm(t("own.confirmDelete", { name: tpl.name }))) return;
        var idx = ownTemplates.indexOf(tpl);
        ownTemplates.splice(idx, 1);
        var err = persistOwnTemplates();
        if (err) { ownTemplates.splice(idx, 0, tpl); ownMsg(err, true); return; }
        delete ownLogoImages[tpl.id];
        if (activePreset === "own:" + tpl.id) activePreset = null;
        renderOwnList();
        ownMsg(t("own.deleted", { name: tpl.name }));
      }));
      li.appendChild(btn);
      li.appendChild(actions);
      list.appendChild(li);
    });
    markPreset();
  }

  /** Speichert das aktuelle Design als eigene Vorlage; report(msg, isError) zeigt das Ergebnis. Gibt true bei Erfolg zurück. */
  function saveOwnTemplate(name, report) {
    if (ownTemplates.length >= OWN_MAX) { report(t("own.limit", { max: OWN_MAX }), true); return false; }
    var tpl = currentTemplate(name);
    ownTemplates.unshift(tpl);
    var err = persistOwnTemplates();
    if (err) { ownTemplates.shift(); report(err, true); return false; }
    activePreset = "own:" + tpl.id;
    renderOwnList();
    report(t("own.saved", { name: name }), false);
    return true;
  }

  function bindOwnTemplates() {
    loadOwnTemplates();
    renderOwnList();
    els.ownSaveForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = els.ownName.value.trim().slice(0, NAME_MAX);
      if (!name) { ownMsg(t("own.nameMissing"), true); els.ownName.focus(); return; }
      if (saveOwnTemplate(name, ownMsg)) els.ownName.value = "";
    });
    els.ownImport.addEventListener("change", function () {
      importOwnTemplate(els.ownImport.files && els.ownImport.files[0]);
      els.ownImport.value = "";
    });
  }

  // ---------- Design als Link (#d=…): nur Design-Einstellungen, nie Foto oder Logo ----------
  /*
   * Format: https://…/#d=<base64url(JSON)>, JSON = { "v": 1, <PBG.DESIGN_KEYS>… } ohne Leerzeichen.
   * „v“ ist die Formatversion: Wird das Format später geändert, bekommt es eine neue Nummer, und ältere Links
   * werden weiter anhand ihrer Nummer gelesen. Das Fragment (#…) schickt der Browser nie an den Server.
   */
  var LINK_VERSION = 1;
  var LINK_MAX = 2000;   // Zeichen nach „d=“; ein gültiges Design braucht höchstens etwa 1000
  /** Beschriftungen für die Meldung, welche Angaben aus einem Link verworfen wurden. */
  var FIELD_LABELS = { text: "text.label", font: "text.font", size: "text.size", bold: "text.bold", uppercase: "text.uppercase",
    spacing: "text.spacing", textPos: "text.position", textColor: "text.color", ringColor: "ring.color", ringColor2: "ring.color2",
    gradient: "ring.gradient", ringWidth: "ring.width", ringLength: "ring.length", ringRotation: "ring.rotation", fade: "ring.fade",
    opacity: "ring.opacity", icon: "icon.label", iconPos: "icon.pos", logoPos: "logo.pos", logoSize: "logo.size",
    shape: "shape.label", textTop: "text.top", sizeTop: "text.sizeTop" };
  var linkFromUrl = false;   // aktuelles Design stammt aus einem Link (für „Als eigene Vorlage speichern“)

  function defaultDesign() {
    var d = {};
    PBG.DESIGN_KEYS.forEach(function (k) { d[k] = PBG.DEFAULTS[k]; });
    return d;
  }

  function base64urlEncode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  /** Wirft bei ungültigen Zeichen, kaputtem Base64 oder ungültigem UTF-8. */
  function base64urlDecode(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("chars");
    var b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  /** Link zur aktuellen Seite (Sprache bleibt erhalten) mit dem Design im Fragment. */
  function designLink(design) {
    var data = { v: LINK_VERSION };
    PBG.DESIGN_KEYS.forEach(function (k) { if (design[k] !== undefined) data[k] = design[k]; });
    return location.origin + location.pathname + "#d=" + base64urlEncode(JSON.stringify(data));
  }

  /**
   * Liest ein Design aus dem Fragment. Gibt null zurück, wenn es kein Design-Link ist, sonst
   * { error: i18n-Schlüssel } oder { design, dropped: [Schlüssel], unknown: Anzahl unbekannter Angaben }.
   * Geprüft wird wie beim Datei-Import (validValue): nur bekannte Schlüssel, Werte im erlaubten Bereich.
   */
  function parseDesignLink(hash) {
    var m = /^#(?:.*&)?d=([^&]*)/.exec(hash || "");
    if (!m) return null;
    var raw = m[1];
    if (raw.length > LINK_MAX) return { error: "link.errorTooLong" };
    var data;
    try { data = JSON.parse(base64urlDecode(raw)); } catch (e) { return { error: "link.errorInvalid" }; }
    if (!data || typeof data !== "object" || Array.isArray(data)) return { error: "link.errorInvalid" };
    if (data.v !== LINK_VERSION) return { error: typeof data.v === "number" ? "link.errorVersion" : "link.errorInvalid" };
    var design = {}, dropped = [], unknown = 0;
    Object.keys(data).forEach(function (k) {
      if (k === "v") return;
      if (PBG.DESIGN_KEYS.indexOf(k) < 0) { unknown++; return; }
      var v = validValue(k, data[k]);
      if (v === undefined) dropped.push(k); else design[k] = v;
    });
    if (!Object.keys(design).length) return { error: "link.errorInvalid" };
    return { design: design, dropped: dropped, unknown: unknown };
  }

  /** Übernimmt ein Design; Foto-Ausschnitt, Export-Einstellungen und ein vorhandenes Logo bleiben erhalten. */
  function applyDesign(design) {
    var keep = { zoom: state.zoom, offsetX: state.offsetX, offsetY: state.offsetY, bg: state.bg, exportSize: state.exportSize };
    Object.assign(state, defaultDesign(), design, keep);
    activePreset = null;
    syncControls();
    markPreset();
    requestRender();
  }

  /** Andere Vorlage gewählt: „Als eigene Vorlage speichern“ bezieht sich nicht mehr auf das Design aus dem Link. */
  function endLinkOffer() {
    linkFromUrl = false;
    els.linkNoticeSave.hidden = true;
  }

  function showLinkNotice(msg, isError, offerSave) {
    els.linkNoticeText.textContent = msg;
    els.linkNotice.classList.toggle("error", !!isError);
    els.linkNoticeSave.hidden = !offerSave;
    els.linkNotice.hidden = false;
  }

  /** Lädt ein Design aus #d=… und entfernt das Fragment sofort aus der Adresse. Gibt true zurück, wenn ein Design geladen wurde. */
  function loadLinkFromHash() {
    var r = parseDesignLink(location.hash);
    if (!r) return false;
    // Fragment entfernen (auch bei Fehlern), damit es nicht versehentlich mit der Adresse weitergeteilt wird
    try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) { /* alte Browser */ }
    if (r.error) {
      linkFromUrl = false;
      showLinkNotice(t(r.error, { app: cfg.appName }), true, false);
      return false;
    }
    applyDesign(r.design);
    linkFromUrl = true;
    var fields = r.dropped.map(function (k) { return t(FIELD_LABELS[k]); });
    if (r.unknown) fields.push(t("link.unknown", { count: r.unknown }));
    var msg = t("link.loaded") + (fields.length ? " " + t("link.partial", { fields: fields.join(", ") }) : "");
    showLinkNotice(msg, fields.length > 0, true);
    return true;
  }

  function openLinkDialog(design, hasLogo) {
    els.linkUrl.value = designLink(design);
    els.linkLogoNote.hidden = !hasLogo;
    setStatus(els.linkStatus, "");
    showDialog(els.linkDialog);
    copyLink();
  }

  function copyLink() {
    var url = els.linkUrl.value;
    var ok = function () { setStatus(els.linkStatus, t("link.copied")); els.linkUrl.select(); };
    var fallback = function () {
      // execCommand im Dialog selbst, weil der Rest der Seite bei offenem Dialog nicht bedienbar ist
      els.linkUrl.focus();
      els.linkUrl.select();
      var done = false;
      try { done = document.execCommand("copy"); } catch (e) { done = false; }
      if (done) ok(); else setStatus(els.linkStatus, t("link.copyFailed"), true);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fallback);
    else fallback();
  }

  function bindLinks() {
    els.linkDesign.addEventListener("click", function () {
      var d = {};
      PBG.DESIGN_KEYS.forEach(function (k) { d[k] = state[k]; });
      openLinkDialog(d, !!logo);
    });
    els.linkCopy.addEventListener("click", copyLink);
    els.linkUrl.addEventListener("focus", function () { els.linkUrl.select(); });
    els.linkDialog.addEventListener("click", function (e) {
      if (e.target === els.linkDialog) closeDialog(els.linkDialog);
    });
    els.linkNoticeClose.addEventListener("click", function () { els.linkNotice.hidden = true; });
    els.linkNoticeSave.addEventListener("click", function () {
      if (!linkFromUrl) return;
      if (saveOwnTemplate(t("link.defaultName"), function (msg, isError) { showLinkNotice(msg, isError, false); })) linkFromUrl = false;
    });
    // Link in einem schon offenen Tab eingefügt: Nur das Fragment ändert sich, die Seite lädt nicht neu
    window.addEventListener("hashchange", function () {
      if (loadLinkFromHash() || !els.linkNotice.hidden) els.linkNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  // ---------- Foto laden ----------
  function isHeic(file) {
    return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || "");
  }

  function decodeImage(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        if (img.naturalWidth && img.naturalHeight) resolve(img); else reject(new Error("empty"));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  var heicLib = null;
  function loadHeicLib() {
    if (window.heic2any) return Promise.resolve(window.heic2any);
    if (!heicLib) {
      heicLib = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = PBG.url("/vendor/heic2any.min.js"); // lokal ausgeliefert, nur bei Bedarf geladen
        s.onload = function () { resolve(window.heic2any); };
        s.onerror = function () { heicLib = null; reject(new Error("heic lib")); };
        document.head.appendChild(s);
      });
    }
    return heicLib;
  }

  function toPhotoCanvas(img) {
    // Ausrichtung (EXIF) wenden aktuelle Browser beim Zeichnen automatisch an
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    var ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function loadFile(file) {
    if (!file) return;
    var heic = isHeic(file);
    if (!heic && file.type && !/^image\//.test(file.type)) {
      setStatus(els.uploadStatus, t("upload.errorType"), true);
      return;
    }
    setStatus(els.uploadStatus, t("upload.loading"));

    decodeImage(file)
      .catch(function (err) {
        // Safari kann HEIC selbst öffnen; andere Browser brauchen die Umwandlung
        if (!heic) throw err;
        setStatus(els.uploadStatus, t("upload.heicLoading"));
        return loadHeicLib()
          .then(function (heic2any) { return heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 }); })
          .then(function (out) { return decodeImage(Array.isArray(out) ? out[0] : out); });
      })
      .then(function (img) {
        photo = toPhotoCanvas(img);
        photoName = file.name || "";
        state.zoom = 1; state.offsetX = 0; state.offsetY = 0;
        els.zoom.value = 1; updateOutput("zoom");
        els.removePhoto.hidden = false;
        setStatus(els.uploadStatus, t("upload.loaded", { name: photoName }));
        requestRender();
      })
      .catch(function () {
        setStatus(els.uploadStatus, t("upload.error"), true);
      });
  }

  function bindUpload() {
    els.fileInput.addEventListener("change", function () {
      loadFile(els.fileInput.files && els.fileInput.files[0]);
    });

    [els.dropzone, els.stage].forEach(function (zone) {
      var depth = 0;
      zone.addEventListener("dragenter", function (e) { e.preventDefault(); depth++; zone.classList.add("drag-over"); });
      zone.addEventListener("dragover", function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
      zone.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; zone.classList.remove("drag-over"); } });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        depth = 0;
        zone.classList.remove("drag-over");
        var f = e.dataTransfer.files && e.dataTransfer.files[0];
        loadFile(f);
      });
    });
    // Verhindert, dass der Browser ein danebengeworfenes Bild öffnet
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("drop", function (e) { e.preventDefault(); });

    // Einfügen aus der Zwischenablage
    window.addEventListener("paste", function (e) {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      var items = (e.clipboardData && e.clipboardData.files) || [];
      if (items.length) loadFile(items[0]);
    });
  }

  // ---------- Logo: nur im Browser, auf höchstens 512 px verkleinert ----------
  function isSvg(file) {
    return file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
  }

  function isLogoFile(file) {
    return /^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || /\.(png|jpe?g|webp|svg)$/i.test(file.name || "");
  }

  /** Zeichnet das Logo auf einen Canvas mit höchstens MAX_LOGO_SIDE px. SVGs werden auf diese Größe gerastert. */
  function toLogoCanvas(img, svg) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) { w = h = MAX_LOGO_SIDE; } // SVG ohne eigene Größe
    var scale = MAX_LOGO_SIDE / Math.max(w, h);
    if (!svg) scale = Math.min(1, scale);   // Pixelbilder nie vergrößern
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    var ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /** Setzt das Logo aus einem Canvas; die Data-URL dient zugleich als Prüfung, dass der Canvas exportierbar ist. */
  function setLogoCanvas(c) {
    var url = c.toDataURL("image/png"); // wirft bei „verunreinigtem“ Canvas – dann wäre auch der Export kaputt
    logo = c;
    logoDataUrl = url;
    updateLogoUI();
    requestRender();
  }

  function clearLogo() {
    logo = null;
    logoDataUrl = "";
    els.logoInput.value = "";
    updateLogoUI();
    requestRender();
  }

  function loadLogoFile(file) {
    if (!file) return;
    if (!isLogoFile(file)) { setStatus(els.logoStatus, t("logo.errorType"), true); return; }
    if (file.size > MAX_LOGO_FILE_MB * 1024 * 1024) { setStatus(els.logoStatus, t("logo.errorSize", { max: MAX_LOGO_FILE_MB }), true); return; }
    setStatus(els.logoStatus, t("logo.loading"));
    var svg = isSvg(file);
    // SVG ausdrücklich als image/svg+xml laden, sonst zeigen manche Browser es nicht an
    var blob = svg && file.type !== "image/svg+xml" ? new Blob([file], { type: "image/svg+xml" }) : file;
    decodeImage(blob).then(function (img) {
      setLogoCanvas(toLogoCanvas(img, svg));
      setStatus(els.logoStatus, t("logo.loaded", { name: file.name || "" }));
    }).catch(function () {
      setStatus(els.logoStatus, t("logo.error"), true);
    });
  }

  /** Bedienelemente an den Logo-Zustand anpassen; bei „Statt Text“ wird das Textfeld deaktiviert und gekennzeichnet. */
  function updateLogoUI() {
    var has = !!logo;
    els.logoRemove.hidden = !has;
    els.logoSettings.hidden = !has;
    var replaced = has && state.logoPos === "replace";
    els.text.disabled = replaced;
    els.textReplaced.hidden = !replaced;
    els.text.closest(".field").classList.toggle("is-replaced", replaced);
  }

  function bindLogo() {
    els.logoInput.addEventListener("change", function () {
      loadLogoFile(els.logoInput.files && els.logoInput.files[0]);
    });
    els.logoRemove.addEventListener("click", function () {
      clearLogo();
      setStatus(els.logoStatus, t("logo.removed"));
    });
    document.querySelectorAll('input[name="logoPos"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        state.logoPos = r.value;
        updateLogoUI();
        changed();
      });
    });
  }

  // ---------- Zuschneiden: Ziehen, Zoomen, Tastatur ----------
  function clampOffsets() {
    if (!photo) { state.offsetX = 0; state.offsetY = 0; return; }
    var m = Math.min(photo.width, photo.height);
    var maxX = Math.max(0, (photo.width / m * state.zoom - 1) / 2);
    var maxY = Math.max(0, (photo.height / m * state.zoom - 1) / 2);
    state.offsetX = clamp(state.offsetX, -maxX, maxX);
    state.offsetY = clamp(state.offsetY, -maxY, maxY);
  }

  function setZoom(z, anchor) {
    var old = state.zoom;
    z = clamp(z, 1, MAX_ZOOM);
    if (anchor) {
      // Um den Zeiger herum zoomen
      var f = z / old;
      state.offsetX = anchor.x - (anchor.x - state.offsetX) * f;
      state.offsetY = anchor.y - (anchor.y - state.offsetY) * f;
    } else {
      state.offsetX *= z / old;
      state.offsetY *= z / old;
    }
    state.zoom = z;
    clampOffsets();
    els.zoom.value = z;
    updateOutput("zoom");
    requestRender();
  }

  function bindCrop() {
    var c = els.preview;
    var pointers = new Map();
    var pinchStart = null;

    function rel(e) {
      var r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    }

    c.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      c.classList.add("dragging");
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinchStart = { dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), zoom: state.zoom };
      }
    });

    c.addEventListener("pointermove", function (e) {
      if (!pointers.has(e.pointerId)) return;
      var prev = pointers.get(e.pointerId);
      var cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);
      var w = c.getBoundingClientRect().width;
      if (pointers.size === 1) {
        state.offsetX += (cur.x - prev.x) / w;
        state.offsetY += (cur.y - prev.y) / w;
        clampOffsets();
        requestRender();
      } else if (pointers.size === 2 && pinchStart) {
        var p = Array.from(pointers.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        setZoom(pinchStart.zoom * d / pinchStart.dist);
      }
    });

    function end(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (!pointers.size) c.classList.remove("dragging");
    }
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);

    c.addEventListener("wheel", function (e) {
      if (!photo) return;
      e.preventDefault();
      var a = rel(e);
      setZoom(state.zoom * Math.exp(-e.deltaY * 0.0015), { x: a.x, y: a.y });
    }, { passive: false });

    c.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 0.05 : 0.01;
      var handled = true;
      switch (e.key) {
        case "ArrowLeft": state.offsetX -= step; break;
        case "ArrowRight": state.offsetX += step; break;
        case "ArrowUp": state.offsetY -= step; break;
        case "ArrowDown": state.offsetY += step; break;
        case "+": case "=": setZoom(state.zoom * 1.08); return e.preventDefault();
        case "-": case "_": setZoom(state.zoom / 1.08); return e.preventDefault();
        case "0": setZoom(1); state.offsetX = 0; state.offsetY = 0; break;
        default: handled = false;
      }
      if (handled) {
        e.preventDefault();
        clampOffsets();
        requestRender();
      }
    });
  }

  // ---------- Export ----------
  function exportSize() {
    return state.exportSize;
  }

  function exportCanvas() {
    var size = exportSize();
    var c = document.createElement("canvas");
    c.width = c.height = size;
    PBG.render(c.getContext("2d"), renderState(), photo, size, renderOpts({ background: state.bg }));
    return c;
  }

  function dataUrlToBlob(url) {
    var parts = url.split(",");
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: "image/png" });
  }

  function canvasToBlob(c) {
    return new Promise(function (resolve) {
      if (c.toBlob) c.toBlob(function (b) { resolve(b || dataUrlToBlob(c.toDataURL("image/png"))); }, "image/png");
      else resolve(dataUrlToBlob(c.toDataURL("image/png")));
    });
  }

  function bindExport() {
    els.download.addEventListener("click", function () {
      els.download.disabled = true;
      ensureFont(state).then(function () {
        return canvasToBlob(exportCanvas());
      }).then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = t("export.filename");
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        setStatus(els.exportStatus, t("export.done"));
        setTimeout(maybeShowShareDialog, 600);
      }).finally(function () {
        els.download.disabled = false;
      });
    });

    // Bild teilen nur anbieten, wo Dateien geteilt werden können (vor allem Mobilgeräte)
    var canShareFiles = false;
    try {
      canShareFiles = !!(navigator.share && navigator.canShare &&
        navigator.canShare({ files: [new File([new Blob()], "test.png", { type: "image/png" })] }));
    } catch (e) { canShareFiles = false; }
    els.share.hidden = !(canShareFiles && isTouch());

    els.share.addEventListener("click", function () {
      // Synchron erzeugen, damit die Nutzergeste für navigator.share erhalten bleibt
      var blob = dataUrlToBlob(exportCanvas().toDataURL("image/png"));
      var file = new File([blob], t("export.filename"), { type: "image/png" });
      navigator.share({ files: [file] }).catch(function (err) {
        if (err && err.name === "AbortError") return;
        setStatus(els.exportStatus, t("export.shareError"), true);
      });
    });
  }

  function isTouch() {
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }

  // ---------- Teilen-Dialog (virale Verbreitung): „Link kopieren“ und Teilen-Funktion des Geräts ----------
  /** Geteilt wird immer nur die Startseite – nie Foto, Logo oder Einstellungen. */
  function appShareUrl() {
    return PBG.absUrl("/");
  }

  function maybeShowShareDialog() {
    if (!els.shareDialog) return;
    if (PBG.storage.get("pbg-share-dismissed") === "1") return;
    setStatus(els.shareStatus, "");
    showDialog(els.shareDialog);
  }

  function bindShareDialog() {
    if (!els.shareDialog) return;
    var text = function () { return t("share.text", { app: cfg.appName }); };
    els.shareDialog.addEventListener("click", function (e) {
      // Klick auf den Hintergrund schließt den Dialog
      if (e.target === els.shareDialog) closeDialog(els.shareDialog);
    });

    $("share-copy").addEventListener("click", function () {
      var url = appShareUrl();
      var done = function () { setStatus(els.shareStatus, t("share.copied")); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
      } else { fallbackCopy(url); done(); }
    });

    var nativeBtn = $("share-native");
    nativeBtn.hidden = !(navigator.share && isTouch());
    nativeBtn.addEventListener("click", function () {
      navigator.share({ title: cfg.appName, text: text(), url: appShareUrl() }).catch(function () { /* abgebrochen */ });
    });

    els.shareDontShow.addEventListener("change", function () {
      if (els.shareDontShow.checked) PBG.storage.set("pbg-share-dismissed", "1");
      else PBG.storage.remove("pbg-share-dismissed");
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignorieren */ }
    ta.remove();
  }

  // ---------- Start ----------
  function initialPreset() {
    var params = new URLSearchParams(location.search);
    var key = params.get("vorlage") || body.dataset.preset || "jobsuche";
    return PBG.presetByKey(key) || PBG.PRESETS[0];
  }

  /** Schnittstelle für das Profil-Banner (banner.js): aktuelles Design und Logo, nur lesend. */
  PBG.editor = {
    state: function () { return state; },
    logo: function () { return logo; },
    ensureFont: function (s) { return ensureFont(s); }
  };

  function init() {
    PBG.applyI18n();

    buildFontOptions();
    buildIconOptions();
    buildEmojiRow();
    bindControls();
    bindUpload();
    bindLogo();
    bindCrop();
    bindExport();
    bindShareDialog();
    buildPresets();
    bindOwnTemplates();
    bindPresetButtons();
    bindLinks();
    // Design-Link (#d=…) hat Vorrang vor ?vorlage=…; ist er ungültig, gilt die normale Startvorlage
    if (!loadLinkFromHash()) applyPreset(initialPreset());

    // Neu zeichnen, wenn sich Größe oder Pixeldichte ändern
    if (window.ResizeObserver) new ResizeObserver(requestRender).observe(els.preview);
    else window.addEventListener("resize", requestRender);
    if (window.matchMedia) {
      var mq = function () {
        var m = window.matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
        var onChange = function () { requestRender(); renderPresetThumbs(); renderOwnList(); mq(); };
        if (m.addEventListener) m.addEventListener("change", onChange, { once: true });
      };
      mq();
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
    requestRender();
  }

  init();
})();
