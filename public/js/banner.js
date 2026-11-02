/*
 * Profil-Banner im Design des aktuellen Rahmens (Abschnitt #banner unter dem Editor).
 * Übernimmt Farben (inkl. Verlauf), Schrift, Textfarbe und Logo aus dem Rahmen-Editor (PBG.editor, app.js).
 * Hintergrundbilder werden – wie Fotos – nur im Browser verarbeitet und nie gespeichert oder übertragen.
 * Gespeichert werden (in eigenen Vorlagen und Dateien) nur PBG.BANNER_DEFAULTS-Schlüssel, siehe presets.js.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  if (!$("banner") || !PBG.editor) return;
  var t = PBG.t;

  var MAX_IMAGE_SIDE = 4000;   // größere Hintergrundbilder werden beim Laden verkleinert
  var MAX_ZOOM = 4;
  var MIN_TITLE_SCALE = 0.5;

  // ---------- Zustand ----------
  var settings = Object.assign({}, PBG.BANNER_DEFAULTS);
  var image = null;            // Hintergrundbild als Canvas (nur im Arbeitsspeicher)
  var imageMode = false;       // Hintergrund „Eigenes Bild“ (wird nicht gespeichert)
  var view = { zoom: 1, offsetX: 0, offsetY: 0 };

  var els = {
    canvas: $("banner-preview"), stage: $("banner-stage"),
    title: $("banner-title"), subtitle: $("banner-subtitle"),
    imageInput: $("banner-image-input"), imageRemove: $("banner-image-remove"), imageStatus: $("banner-image-status"),
    imageSettings: $("banner-image-settings"), zoom: $("banner-zoom"), zoomOut: $("banner-zoom-out"),
    download: $("banner-download"), downloadLabel: $("banner-download-label"), status: $("banner-status"), warning: $("banner-warning")
  };

  // ---------- Hilfsfunktionen ----------
  function format() { return PBG.BANNER_FORMATS[settings.format] || PBG.BANNER_FORMATS["4x1"]; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

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

  /**
   * Textfarbe des Rahmens, solange sie sich auf dem ganzen Banner-Hintergrund gut abhebt (Kontrast ≥ 3:1 zu beiden
   * Verlaufsfarben); sonst Weiß oder fast Schwarz – je nachdem, was besser lesbar ist. auto = true bei Anpassung.
   */
  function textColor(s) {
    var bgs = [s.ringColor].concat(s.gradient ? [s.ringColor2] : []);
    var worst = function (c) { return Math.min.apply(null, bgs.map(function (b) { return contrast(c, b); })); };
    if (worst(s.textColor) >= 3) return { color: s.textColor, auto: false };
    var light = "#ffffff", dark = "#111827";
    return { color: worst(light) >= worst(dark) ? light : dark, auto: true };
  }

  function weight(s, bold) {
    var f = PBG.fontById(s.font);
    return bold && s.bold && f.weights.indexOf(700) >= 0 ? 700 : 400;
  }

  function font(s, px, bold) {
    return weight(s, bold) + " " + px.toFixed(2) + 'px "' + s.font + '", system-ui, sans-serif';
  }

  /** Bricht Text in höchstens maxLines Zeilen der Breite maxW um; gibt null zurück, wenn er nicht passt. */
  function wrap(ctx, text, maxW, maxLines) {
    var words = text.split(/\s+/).filter(Boolean), lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
      if (ctx.measureText(line).width > maxW) return null;
    }
    if (line) lines.push(line);
    return lines.length <= maxLines ? lines : null;
  }

  // ---------- Zeichnen ----------
  /** Hintergrund: Farbe bzw. Verlauf des Rings, optional dezentes Muster oder eigenes Bild mit Farbschleier. */
  function drawBackground(ctx, s, W, H, u, bg, img) {
    var c1 = s.ringColor, c2 = s.gradient ? s.ringColor2 : s.ringColor;
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (bg === "image" && img) {
      var base = Math.max(W / img.width, H / img.height) * view.zoom;
      var dw = img.width * base, dh = img.height * base;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, W / 2 - dw / 2 + view.offsetX * W, H / 2 - dh / 2 + view.offsetY * H, dw, dh);
      // Schleier in Rahmenfarbe auf der Textseite, damit Text lesbar bleibt
      // links/rechts: kräftig auf der Textseite, zur anderen Seite auslaufend; mittig: gleichmäßig
      var side = settings.align === "right" ? [W, 0] : settings.align === "center" ? null : [0, W];
      var veil = side ? ctx.createLinearGradient(side[0], 0, side[1], 0) : ctx.createLinearGradient(0, 0, 0, H);
      if (side) {
        veil.addColorStop(0, PBG.color.rgba(c1, 0.88));
        veil.addColorStop(0.6, PBG.color.rgba(c2, 0.72));
        veil.addColorStop(1, PBG.color.rgba(c2, 0.2));
      } else {
        veil.addColorStop(0, PBG.color.rgba(c1, 0.62));
        veil.addColorStop(1, PBG.color.rgba(c2, 0.62));
      }
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (bg !== "dots" && bg !== "lines" && bg !== "waves") return;

    var dark = (luminance(c1) + luminance(c2)) / 2 < 0.45;
    var ink = dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
    var step = u * 0.09;
    ctx.save();
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    if (bg === "dots") {
      // versetztes Punkteraster
      var r = step * 0.13;
      for (var row = 0, y = step / 2; y < H + step; row++, y += step * 0.866) {
        for (var x = (row % 2 ? step / 2 : 0); x < W + step; x += step) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (bg === "lines") {
      // diagonale Linien
      ctx.lineWidth = step * 0.16;
      for (var d = -H; d < W + H; d += step * 1.1) {
        ctx.beginPath(); ctx.moveTo(d, H); ctx.lineTo(d + H, 0); ctx.stroke();
      }
    } else {
      // sanfte Wellen
      ctx.lineWidth = step * 0.1;
      var amp = step * 0.22, len = step * 2.6;
      for (var wy = step * 0.4; wy < H + step; wy += step * 0.8) {
        ctx.beginPath();
        for (var wx = 0; wx <= W + 4; wx += 4) {
          var yy = wy + Math.sin(wx / len * Math.PI * 2) * amp;
          if (wx === 0) ctx.moveTo(wx, yy); else ctx.lineTo(wx, yy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Markierung des Bereichs, den das Profilbild verdecken kann (nur in der Vorschau, nie im Download). */
  function drawSafeArea(ctx, W, H, safe) {
    var x = 0, y = safe.y * H, w = safe.w * W, h = H - y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = Math.max(1, H * 0.004);
    for (var d = -h; d < w + h; d += H * 0.05) { ctx.beginPath(); ctx.moveTo(d, H); ctx.lineTo(d + h, y); ctx.stroke(); }
    ctx.restore();
    ctx.save();
    ctx.setLineDash([H * 0.025, H * 0.018]);
    ctx.lineWidth = Math.max(1.5, H * 0.006);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.strokeRect(x + ctx.lineWidth / 2, y, w - ctx.lineWidth, h - ctx.lineWidth / 2);
    ctx.setLineDash([]);
    // Beschriftung
    var fs = Math.max(10, Math.min(H * 0.045, w * 0.075));
    ctx.font = "700 " + fs + "px system-ui, sans-serif";
    var lines = wrap(ctx, t("banner.safeLabel"), w * 0.86, 3) || [t("banner.safeLabel")];
    var lh = fs * 1.25, ty = y + h / 2 - (lines.length - 1) * lh / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach(function (line, i) {
      var tw = ctx.measureText(line).width;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(w / 2 - tw / 2 - fs * 0.35, ty + i * lh - lh / 2, tw + fs * 0.7, lh);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, w / 2, ty + i * lh);
    });
    ctx.restore();
  }

  /**
   * Zeichnet das Banner in voller Größe (W × H) oder verkleinert. Gibt { scale } der Überschrift zurück.
   * opts.overlay: Markierung des sicheren Bereichs zeichnen (Vorschau).
   */
  function render(ctx, W, H, opts) {
    var s = PBG.editor.state();
    var logo = PBG.editor.logo();
    var fmt = format();
    var u = Math.min(H, W * 0.25) * (fmt.textScale || 1);   // Grundmaß für Schrift und Abstände
    var pad = Math.max(W * 0.04, u * 0.1);
    var bg = imageMode && image ? "image" : settings.bg;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, s, W, H, u, bg, image);

    var title = (settings.title || s.text || "").replace(/\s+/g, " ").trim();
    var sub = (settings.subtitle || "").replace(/\s+/g, " ").trim();
    var align = settings.align;
    var safe = fmt.safe;

    // Verfügbare Breite; bei „links“ weichen Text und Logo dem Bereich des Profilbilds aus, bei „rechts“ reichen
    // lange Zeilen nicht hinein (bei „mittig“ bleibt die volle Breite – der Bereich ist in der Vorschau markiert)
    var left = pad, right = W - pad;
    if (align === "left" || align === "right") left = Math.max(left, safe.w * W + pad * 0.6);
    var avail = right - left;

    // Logo
    var hasLogo = !!logo && (logo.width || logo.naturalWidth);
    var logoH = u * 0.3, logoW = 0;
    if (hasLogo) {
      var lw = logo.naturalWidth || logo.width, lh = logo.naturalHeight || logo.height;
      logoW = Math.min(logoH * lw / lh, avail * 0.35);
      logoH = logoW * lh / lw;
    }
    var gap = u * 0.07;
    var colW = align === "center" || !hasLogo ? avail : avail - logoW - gap;

    // Überschrift: eine Zeile, bei Bedarf verkleinert
    var titlePx = u * 0.2, scale = 1;
    ctx.font = font(s, titlePx, true);
    var tw = title ? ctx.measureText(title).width : 0;
    if (tw > colW) { scale = Math.max(colW / tw, MIN_TITLE_SCALE); titlePx *= scale; ctx.font = font(s, titlePx, true); tw = ctx.measureText(title).width; }

    // Unterzeile: bis zu zwei Zeilen, bei Bedarf kleiner
    var subPx = u * 0.095, lines = [];
    if (sub) {
      for (var k = 0; k < 8; k++) {
        ctx.font = font(s, subPx, false);
        lines = wrap(ctx, sub, colW, 2);
        if (lines) break;
        subPx *= 0.92;
      }
      if (!lines) {   // passt auch klein nicht: zweite Zeile kürzen
        ctx.font = font(s, subPx, false);
        lines = wrap(ctx, sub, colW, 99) || [sub];
        var second = lines.slice(1).join(" ");
        while (second && ctx.measureText(second + "…").width > colW) second = second.slice(0, -1);
        lines = [lines[0], second + "…"];
      }
    }
    var titleH = title ? titlePx * 1.15 : 0;
    var subGap = title && lines.length ? u * 0.05 : 0;
    var textH = titleH + subGap + lines.length * subPx * 1.3;
    var textW = Math.max(tw, lines.reduce(function (m, l) { ctx.font = font(s, subPx, false); return Math.max(m, ctx.measureText(l).width); }, 0));

    // Block anordnen
    var blockH = align === "center" && hasLogo ? logoH + (textH ? gap + textH : 0) : Math.max(textH, hasLogo ? logoH : 0);
    var top = (H - blockH) / 2;
    var textX, textAlign, textTop, logoX, logoY;
    if (align === "center") {
      textAlign = "center"; textX = W / 2;
      logoX = W / 2 - logoW / 2; logoY = top;
      textTop = top + (hasLogo ? logoH + gap : 0);
    } else if (align === "right") {
      textAlign = "right";
      logoX = right - logoW; logoY = top + (blockH - logoH) / 2;
      textX = hasLogo ? logoX - gap : right;
      textTop = top + (blockH - textH) / 2;
    } else {
      textAlign = "left";
      logoX = left; logoY = top + (blockH - logoH) / 2;
      textX = hasLogo ? left + logoW + gap : left;
      textTop = top + (blockH - textH) / 2;
    }

    if (hasLogo) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    }
    var tc = textColor(s);
    ctx.fillStyle = tc.color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";
    if (title) {
      ctx.font = font(s, titlePx, true);
      ctx.fillText(title, textX, textTop + titleH / 2);
    }
    if (lines.length) {
      ctx.font = font(s, subPx, false);
      ctx.globalAlpha = 0.88;
      lines.forEach(function (l, i) { ctx.fillText(l, textX, textTop + titleH + subGap + (i + 0.5) * subPx * 1.3); });
      ctx.globalAlpha = 1;
    }
    if (opts && opts.overlay) drawSafeArea(ctx, W, H, safe);
    ctx.restore();
    return { scale: scale, textW: textW, left: left, autoColor: tc.auto && !!(title || lines.length) };
  }

  // ---------- Vorschau ----------
  var pending = false;
  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      var fmt = format();
      var c = els.canvas;
      c.style.aspectRatio = fmt.w + " / " + fmt.h;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = Math.max(16, Math.round((c.clientWidth || 600) * dpr));
      var h = Math.round(w * fmt.h / fmt.w);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      var info = render(c.getContext("2d"), w, h, { overlay: true });
      var msgs = [];
      if (info.scale < 0.995) msgs.push(t("banner.shrunk", { percent: Math.round(info.scale * 100) }));
      if (info.autoColor) msgs.push(t("banner.autoColor"));
      els.warning.hidden = !msgs.length;
      els.warning.textContent = msgs.join(" ");
      c.setAttribute("aria-label", t("banner.canvasLabel", { w: fmt.w, h: fmt.h }));
    });
  }

  /** Schriften des Banners laden (Überschrift ggf. fett, Unterzeile normal), danach neu zeichnen. */
  function ensureFonts() {
    var s = PBG.editor.state();
    var list = [Object.assign({}, s), Object.assign({}, s, { bold: false })];
    return Promise.all(list.map(function (x) { return PBG.editor.ensureFont(x); }));
  }

  // ---------- Formular ----------
  function syncControls() {
    els.title.value = settings.title;
    els.subtitle.value = settings.subtitle;
    document.querySelectorAll('input[name="bannerFormat"]').forEach(function (r) { r.checked = r.value === settings.format; });
    document.querySelectorAll('input[name="bannerAlign"]').forEach(function (r) { r.checked = r.value === settings.align; });
    var bgValue = imageMode ? "image" : settings.bg;
    document.querySelectorAll('input[name="bannerBg"]').forEach(function (r) { r.checked = r.value === bgValue; });
    els.imageSettings.hidden = !imageMode;
    els.imageRemove.hidden = !image;
    els.zoom.value = view.zoom;
    els.zoomOut.textContent = Math.round(view.zoom * 100) + " %";
    var fmt = format();
    els.downloadLabel.textContent = t("banner.download", { w: fmt.w, h: fmt.h });
  }

  function bindControls() {
    els.title.addEventListener("input", function () { settings.title = els.title.value; requestRender(); });
    els.subtitle.addEventListener("input", function () { settings.subtitle = els.subtitle.value; requestRender(); });
    [["bannerFormat", "format"], ["bannerAlign", "align"]].forEach(function (pair) {
      document.querySelectorAll('input[name="' + pair[0] + '"]').forEach(function (r) {
        r.addEventListener("change", function () {
          if (!r.checked) return;
          settings[pair[1]] = r.value;
          if (pair[1] === "format") clampView();
          syncControls();
          requestRender();
        });
      });
    });
    document.querySelectorAll('input[name="bannerBg"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        imageMode = r.value === "image";
        if (!imageMode) settings.bg = r.value;
        syncControls();
        if (imageMode && !image) els.imageInput.click();
        requestRender();
      });
    });
    els.zoom.addEventListener("input", function () { setZoom(parseFloat(els.zoom.value)); });
    els.imageInput.addEventListener("change", function () { loadImage(els.imageInput.files && els.imageInput.files[0]); });
    els.imageRemove.addEventListener("click", function () {
      image = null; imageMode = false; els.imageInput.value = "";
      view = { zoom: 1, offsetX: 0, offsetY: 0 };
      setStatus(els.imageStatus, t("banner.imageRemoved"));
      syncControls();
      requestRender();
    });
    els.download.addEventListener("click", download);
  }

  function setStatus(el, msg, isError) {
    el.textContent = msg || "";
    el.classList.toggle("error", !!isError);
  }

  // ---------- Hintergrundbild: nur im Browser ----------
  function loadImage(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || "")) {
      setStatus(els.imageStatus, t("banner.imageErrorType"), true);
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) { setStatus(els.imageStatus, t("banner.imageError"), true); return; }
      var sc = Math.min(1, MAX_IMAGE_SIDE / Math.max(w, h));
      var c = document.createElement("canvas");
      c.width = Math.round(w * sc); c.height = Math.round(h * sc);
      var x = c.getContext("2d");
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 0, c.width, c.height);
      image = c;
      imageMode = true;
      view = { zoom: 1, offsetX: 0, offsetY: 0 };
      setStatus(els.imageStatus, t("banner.imageLoaded", { name: file.name || "" }));
      syncControls();
      requestRender();
    };
    img.onerror = function () { URL.revokeObjectURL(url); setStatus(els.imageStatus, t("banner.imageError"), true); };
    img.src = url;
  }

  /** Verschiebung so begrenzen, dass das Bild das Banner immer ganz bedeckt. */
  function clampView() {
    if (!image) { view.offsetX = view.offsetY = 0; return; }
    var fmt = format();
    var base = Math.max(fmt.w / image.width, fmt.h / image.height) * view.zoom;
    var maxX = Math.max(0, (image.width * base / fmt.w - 1) / 2);
    var maxY = Math.max(0, (image.height * base / fmt.h - 1) / 2);
    view.offsetX = clamp(view.offsetX, -maxX, maxX);
    view.offsetY = clamp(view.offsetY, -maxY, maxY);
  }

  function setZoom(z) {
    var old = view.zoom;
    view.zoom = clamp(z, 1, MAX_ZOOM);
    view.offsetX *= view.zoom / old;
    view.offsetY *= view.zoom / old;
    clampView();
    els.zoom.value = view.zoom;
    els.zoomOut.textContent = Math.round(view.zoom * 100) + " %";
    requestRender();
  }

  function bindPan() {
    var c = els.canvas, last = null;
    var active = function () { return imageMode && image; };
    c.addEventListener("pointerdown", function (e) {
      if (!active()) return;
      c.setPointerCapture(e.pointerId);
      last = { x: e.clientX, y: e.clientY };
      c.classList.add("dragging");
    });
    c.addEventListener("pointermove", function (e) {
      if (!last) return;
      var r = c.getBoundingClientRect();
      view.offsetX += (e.clientX - last.x) / r.width;
      view.offsetY += (e.clientY - last.y) / r.height;
      last = { x: e.clientX, y: e.clientY };
      clampView();
      requestRender();
    });
    var end = function () { last = null; c.classList.remove("dragging"); };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("wheel", function (e) {
      if (!active()) return;
      e.preventDefault();
      setZoom(view.zoom * Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });
    c.addEventListener("keydown", function (e) {
      if (!active()) return;
      var step = e.shiftKey ? 0.05 : 0.01, handled = true;
      if (e.key === "ArrowLeft") view.offsetX -= step;
      else if (e.key === "ArrowRight") view.offsetX += step;
      else if (e.key === "ArrowUp") view.offsetY -= step;
      else if (e.key === "ArrowDown") view.offsetY += step;
      else if (e.key === "+" || e.key === "=") { setZoom(view.zoom * 1.08); handled = false; e.preventDefault(); }
      else if (e.key === "-" || e.key === "_") { setZoom(view.zoom / 1.08); handled = false; e.preventDefault(); }
      else handled = false;
      if (handled) { e.preventDefault(); clampView(); requestRender(); }
    });
  }

  // ---------- Download in voller Größe (ohne Markierung) ----------
  function download() {
    els.download.disabled = true;
    ensureFonts().then(function () {
      var fmt = format();
      var c = document.createElement("canvas");
      c.width = fmt.w; c.height = fmt.h;
      render(c.getContext("2d"), fmt.w, fmt.h, { overlay: false });
      return new Promise(function (resolve) { c.toBlob(resolve, "image/png"); });
    }).then(function (blob) {
      var fmt = format();
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = t("banner.filename") + "-" + fmt.w + "x" + fmt.h + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      setStatus(els.status, t("banner.done"));
    }).catch(function () {
      setStatus(els.status, t("banner.error"), true);
    }).then(function () { els.download.disabled = false; });
  }

  // ---------- Schnittstelle für eigene Vorlagen (app.js) ----------
  PBG.banner = {
    /** Banner-Einstellungen zum Speichern (ohne Hintergrundbild). */
    get: function () {
      var out = {};
      Object.keys(PBG.BANNER_DEFAULTS).forEach(function (k) { out[k] = settings[k]; });
      return out;
    },
    /** Übernimmt geprüfte Einstellungen aus einer Vorlage; ein eigenes Hintergrundbild bleibt erhalten. */
    set: function (b) {
      var v = PBG.validateBanner(b).banner || {};
      settings = Object.assign({}, PBG.BANNER_DEFAULTS, v);
      clampView();
      syncControls();
      requestRender();
    },
    render: render
  };

  // ---------- Start ----------
  bindControls();
  bindPan();
  syncControls();
  document.addEventListener("pbg:design", function () { ensureFonts().then(requestRender); requestRender(); });
  if (window.ResizeObserver) new ResizeObserver(requestRender).observe(els.canvas);
  else window.addEventListener("resize", requestRender);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
  ensureFonts().then(requestRender);
  requestRender();
})();
