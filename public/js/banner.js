/*
 * Profil-Banner (Abschnitt #banner unter dem Editor).
 * Standard: Farben, Schrift, Textfarbe und Logo kommen aus dem Rahmen (PBG.editor, app.js). Optional eigene
 * Hintergrundfarbe (auch Verlauf, Weiß, Hellgrau, transparent), eigenes Logo, Zusatzzeile mit Symbol, eigene
 * Schriftgrößen und Banner-Vorlagen (PBG.BANNER_PRESETS).
 * Hintergrundbilder und Logos werden nur im Browser verarbeitet; Hintergrundbilder werden nie gespeichert, ein eigenes
 * Banner-Logo nur in „Meine Vorlagen“ (lokal) – nie in Design-Links.
 * Abwärtskompatibel: Mit den Standardwerten (PBG.BANNER_DEFAULTS) entsteht dasselbe Banner wie in früheren Versionen.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  if (!$("banner") || !PBG.editor) return;
  var t = PBG.t;

  var MAX_IMAGE_SIDE = 4000;   // größere Hintergrundbilder werden beim Laden verkleinert
  var MAX_LOGO_SIDE = 1024;    // eigene Banner-Logos werden auf höchstens 1024 px verkleinert
  var STORE_LOGO_SIDE = 512;   // … und für „Meine Vorlagen“ auf 512 px (lokaler Speicher ist knapp)
  var MAX_LOGO_FILE_MB = 10;
  var MAX_ZOOM = 4;
  var MIN_TITLE_SCALE = 0.5;
  var MIN_EXTRA_SCALE = 0.5;

  // ---------- Zustand ----------
  var settings = Object.assign({}, PBG.BANNER_DEFAULTS);
  var image = null;            // Hintergrundbild als Canvas (nur im Arbeitsspeicher)
  var imageMode = false;       // Hintergrund „Eigenes Bild“ (wird nicht gespeichert)
  var view = { zoom: 1, offsetX: 0, offsetY: 0 };
  var ownLogo = null;          // eigenes Banner-Logo als Canvas (nur im Browser)
  var activeTemplate = null;

  var els = {
    canvas: $("banner-preview"), stage: $("banner-stage"),
    title: $("banner-title"), subtitle: $("banner-subtitle"),
    font: $("banner-font"), bold: $("banner-bold"), ownTextColor: $("banner-own-textcolor"), textColorField: $("banner-textcolor-field"),
    textColor: $("banner-textcolor"), textColorHex: $("banner-textcolor-hex"), extra: $("banner-extra"), extraIcon: $("banner-extra-icon"),
    imageInput: $("banner-image-input"), imageRemove: $("banner-image-remove"), imageStatus: $("banner-image-status"),
    imageSettings: $("banner-image-settings"), zoom: $("banner-zoom"), zoomOut: $("banner-zoom-out"),
    customColors: $("banner-custom-colors"), color1: $("banner-color1"), color1Hex: $("banner-color1-hex"),
    color2: $("banner-color2"), color2Hex: $("banner-color2-hex"), gradient: $("banner-gradient"), color2Field: $("banner-color2-field"),
    gradDirField: $("banner-graddir-field"), transparentHint: $("banner-transparent-hint"),
    logoInput: $("banner-logo-input"), logoRemove: $("banner-logo-remove"), logoStatus: $("banner-logo-status"),
    logoUpload: $("banner-logo-upload"), logoSettings: $("banner-logo-settings"), logoPos: $("banner-logo-pos"), logoSize: $("banner-logo-size"), logoSizeOut: $("banner-logo-size-out"),
    titleSize: $("banner-title-size"), subtitleSize: $("banner-subtitle-size"), extraSize: $("banner-extra-size"),
    frameColors: $("banner-frame-colors"), presets: $("banner-presets"), presetsCurrent: $("banner-presets-current"), currentSection: $("banner-current"),
    download: $("banner-download"), downloadLabel: $("banner-download-label"), status: $("banner-status"), warning: $("banner-warning")
  };

  // ---------- Hilfsfunktionen ----------
  function fmtOf(b) { return PBG.BANNER_FORMATS[b.format] || PBG.BANNER_FORMATS["4x1"]; }
  function format() { return fmtOf(settings); }
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

  function normalizeHex(v) {
    v = String(v || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(v)) v = v.replace(/(.)/g, "$1$1");
    return /^[0-9a-f]{6}$/i.test(v) ? "#" + v.toLowerCase() : null;
  }

  /** Hintergrundfarben des Banners: [Farbe 1, Farbe 2]; null bei „Transparent“. */
  function bgColors(s, b) {
    if (b.bgColor === "transparent") return null;
    if (b.bgColor === "custom") return [b.color1, b.gradient ? b.color2 : b.color1];
    if (PBG.BANNER_SOLID[b.bgColor]) return [PBG.BANNER_SOLID[b.bgColor], PBG.BANNER_SOLID[b.bgColor]];
    return [s.ringColor, s.gradient ? s.ringColor2 : s.ringColor];
  }

  /**
   * Textfarbe: die des Rahmens, solange sie sich auf dem Hintergrund gut abhebt (Kontrast ≥ 3:1 zu allen Hintergrund-
   * farben); sonst Weiß oder fast Schwarz. Bei „Transparent“ bleibt die Rahmenfarbe; warnTransparent meldet, wenn sie
   * auf weißem oder schwarzem Untergrund schlecht lesbar wäre.
   */
  function textColor(s, b) {
    var cols = bgColors(s, b);
    if (b.textColor) {
      // eigene Textfarbe: wird verwendet wie gewählt; Hinweis bei geringem Kontrast
      var low = cols ? Math.min.apply(null, cols.map(function (x) { return contrast(b.textColor, x); })) < 3
        : contrast(b.textColor, "#ffffff") < 3 || contrast(b.textColor, "#000000") < 3;
      return { color: b.textColor, auto: false, lowContrast: !!cols && low, warnTransparent: !cols && low };
    }
    if (!cols) {
      return { color: s.textColor, auto: false, warnTransparent: contrast(s.textColor, "#ffffff") < 3 || contrast(s.textColor, "#000000") < 3 };
    }
    var bgs = cols[0] === cols[1] ? [cols[0]] : cols;
    var worst = function (c) { return Math.min.apply(null, bgs.map(function (x) { return contrast(c, x); })); };
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

  function logoSource(b) {
    if (b.logo === "none") return null;
    if (b.logo === "own") return ownLogo;
    return PBG.editor.logo();
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---------- Zeichnen ----------
  /** Hintergrund: Farbe/Verlauf (Rahmen oder eigene Wahl), optional dezentes Muster oder eigenes Bild mit Farbschleier. */
  function drawBackground(ctx, s, b, W, H, u, bg, img, tc) {
    var cols = bgColors(s, b);
    var c1, c2;
    if (cols) {
      c1 = cols[0]; c2 = cols[1];
      var g;
      if (b.bgColor === "custom" && b.gradient && b.gradDir === "h") g = ctx.createLinearGradient(0, 0, W, 0);
      else if (b.bgColor === "custom" && b.gradient && b.gradDir === "v") g = ctx.createLinearGradient(0, 0, 0, H);
      else g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else {
      // transparent: Schleier über einem Bild in einer Farbe, die zur Textfarbe kontrastiert
      c1 = c2 = luminance(tc.color) > 0.5 ? "#000000" : "#ffffff";
    }

    if (bg === "image" && img) {
      var base = Math.max(W / img.width, H / img.height) * view.zoom;
      var dw = img.width * base, dh = img.height * base;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, W / 2 - dw / 2 + view.offsetX * W, H / 2 - dh / 2 + view.offsetY * H, dw, dh);
      // Schleier in der Hintergrundfarbe auf der Textseite, damit Text lesbar bleibt
      // links/rechts: kräftig auf der Textseite, zur anderen Seite auslaufend; mittig: gleichmäßig
      var side = b.align === "right" ? [W, 0] : b.align === "center" ? null : [0, W];
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

    // Musterfarbe passt sich dezent an den Hintergrund an (transparent: neutrales Grau)
    var ink;
    if (!cols) ink = "rgba(128,128,128,0.2)";
    else {
      var dark = (luminance(c1) + luminance(c2)) / 2 < 0.45;
      ink = dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
    }
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

  function drawIcon(ctx, icon, x, cy, size, color) {
    var path = PBG.iconPath && PBG.iconPath(icon);
    if (!path) return;
    ctx.save();
    ctx.translate(x, cy - size / 2);
    ctx.scale(size / 24, size / 24);
    if (icon.stroke) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(path);
    } else {
      ctx.fillStyle = color;
      ctx.fill(path, icon.evenodd ? "evenodd" : "nonzero");
    }
    ctx.restore();
  }

  /**
   * Misst den Textblock (Überschrift, Unterzeile, Zusatzzeile) für die Spaltenbreite colW.
   * Mit den Standardwerten (Größen 100 %, keine Zusatzzeile) rechnet das genau wie frühere Versionen.
   */
  function measureText(ctx, s, b, u, colW, title, sub, extra) {
    // Überschrift: eine Zeile, bei Bedarf verkleinert
    var titlePx = u * 0.2 * (b.titleSize / 100), scale = 1;
    ctx.font = font(s, titlePx, true);
    var tw = title ? ctx.measureText(title).width : 0;
    if (tw > colW) { scale = Math.max(colW / tw, MIN_TITLE_SCALE); titlePx *= scale; ctx.font = font(s, titlePx, true); tw = ctx.measureText(title).width; }

    // Unterzeile: bis zu zwei Zeilen, bei Bedarf kleiner
    var subPx0 = u * 0.095 * (b.subtitleSize / 100), subPx = subPx0, lines = [], cut = false;
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
        cut = true;
      }
    }

    // Zusatzzeile: eine Zeile mit optionalem Symbol, bei Bedarf verkleinert und notfalls gekürzt
    var icon = b.extraIcon && PBG.iconById ? PBG.iconById(b.extraIcon) : null;
    var extraPx = u * 0.072 * (b.extraSize / 100), extraScale = 1, extraText = extra, extraW = 0, extraCut = false;
    if (extra) {
      var unit = function (px, txt) { ctx.font = font(s, px, false); return (icon ? px * 1.3 : 0) + ctx.measureText(txt).width; };
      extraW = unit(extraPx, extraText);
      if (extraW > colW) {
        extraScale = Math.max(colW / extraW, MIN_EXTRA_SCALE);
        extraPx *= extraScale;
        extraW = unit(extraPx, extraText);
        while (extraW > colW && extraText.length > 1) { extraText = extraText.slice(0, -1); extraCut = true; extraW = unit(extraPx, extraText.replace(/\s+$/, "") + "…"); }
        if (extraCut) extraText = extraText.replace(/\s+$/, "") + "…";
      }
    }

    var titleH = title ? titlePx * 1.15 : 0;
    var subGap = title && lines.length ? u * 0.05 : 0;
    var textH = titleH + subGap + lines.length * subPx * 1.3;
    var extraGap = extra && textH ? u * 0.05 : 0;
    if (extra) textH += extraGap + extraPx * 1.3;
    var textW = Math.max(tw, lines.reduce(function (m, l) { ctx.font = font(s, subPx, false); return Math.max(m, ctx.measureText(l).width); }, 0), extraW);
    return {
      title: title, titlePx: titlePx, titleH: titleH, scale: scale, lines: lines, subPx: subPx, subGap: subGap,
      subScale: subPx / subPx0, subCut: cut, extra: extraText, extraPx: extraPx, extraGap: extraGap, extraScale: extraScale,
      extraCut: extraCut, icon: icon, textH: textH, textW: textW
    };
  }

  /** Zeichnet den Textblock ab textTop; anchor ist die Bezugskante gemäß textAlign (links, Mitte, rechts). */
  function drawText(ctx, s, m, anchor, textAlign, textTop, color) {
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";
    if (m.title) {
      ctx.font = font(s, m.titlePx, true);
      ctx.fillText(m.title, anchor, textTop + m.titleH / 2);
    }
    if (m.lines.length) {
      ctx.font = font(s, m.subPx, false);
      ctx.globalAlpha = 0.88;
      m.lines.forEach(function (l, i) { ctx.fillText(l, anchor, textTop + m.titleH + m.subGap + (i + 0.5) * m.subPx * 1.3); });
      ctx.globalAlpha = 1;
    }
    if (m.extra) {
      var cy = textTop + m.titleH + m.subGap + m.lines.length * m.subPx * 1.3 + m.extraGap + m.extraPx * 1.3 / 2;
      ctx.font = font(s, m.extraPx, false);
      var iconW = m.icon ? m.extraPx * 0.95 : 0, iconGap = m.icon ? m.extraPx * 0.35 : 0;
      var txtW = ctx.measureText(m.extra).width, unitW = iconW + iconGap + txtW;
      var x0 = textAlign === "left" ? anchor : textAlign === "right" ? anchor - unitW : anchor - unitW / 2;
      ctx.globalAlpha = 0.82;
      if (m.icon) drawIcon(ctx, m.icon, x0, cy, iconW, color);
      ctx.textAlign = "left";
      ctx.fillText(m.extra, x0 + iconW + iconGap, cy);
      ctx.textAlign = textAlign;
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Zeichnet das Banner in voller Größe (W × H) oder verkleinert.
   * opts.overlay: Markierung des sicheren Bereichs zeichnen (Vorschau); opts.settings: andere Einstellungen
   * (Vorschaubilder der Banner-Vorlagen, ohne Hintergrundbild).
   */
  /** Stil für das Banner: Schrift und Schriftstärke des Rahmens, sofern im Banner nichts Eigenes gewählt ist. */
  function bannerStyle(b) {
    var s = PBG.editor.state();
    if (!b.font && b.bold === "frame") return s;
    return Object.assign({}, s, { font: b.font || s.font, bold: b.bold === "frame" ? s.bold : b.bold === "bold" });
  }

  function render(ctx, W, H, opts) {
    opts = opts || {};
    var b = opts.settings || settings;
    var s = bannerStyle(b);
    var logo = logoSource(b);
    var fmt = fmtOf(b);
    var u = Math.min(H, W * 0.25) * (fmt.textScale || 1);   // Grundmaß für Schrift und Abstände
    var pad = Math.max(W * 0.04, u * 0.1);
    var img = opts.settings ? null : image;
    var bg = !opts.settings && imageMode && image ? "image" : b.bg;
    var tc = textColor(s, b);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, s, b, W, H, u, bg, img, tc);

    var title = (b.title || s.text || "").replace(/\s+/g, " ").trim();
    var sub = (b.subtitle || "").replace(/\s+/g, " ").trim();
    var extra = (b.extra || "").replace(/\s+/g, " ").trim();
    var align = b.align;
    var safe = fmt.safe;
    var safeRect = { x: 0, y: safe.y * H, w: safe.w * W, h: H - safe.y * H };
    var safeRight = safe.w * W + pad * 0.6;

    // Verfügbare Breite; bei „links“ weichen Text und Logo dem Bereich des Profilbilds aus, bei „rechts“ reichen
    // lange Zeilen nicht hinein (bei „mittig“ bleibt die volle Breite – der Bereich ist in der Vorschau markiert)
    var left = pad, right = W - pad;
    if (align === "left" || align === "right") left = Math.max(left, safeRight);
    var avail = right - left;

    // Logo
    var hasLogo = !!logo && !!(logo.width || logo.naturalWidth);
    var sizeF = b.logoSize / 100;
    var logoH = u * 0.3 * sizeF, logoW = 0, lw = 1, lh = 1;
    if (hasLogo) {
      lw = logo.naturalWidth || logo.width; lh = logo.naturalHeight || logo.height;
      logoW = Math.min(logoH * lw / lh, avail * Math.min(0.35 * Math.max(1, sizeF), 0.6));
      logoH = logoW * lh / lw;
    }
    var gap = u * 0.07;
    // „auto“ = bisheriges Verhalten (unverändert für ältere Banner). Ist eine Position gewählt, aber kein Logo da,
    // wird nur der Text gesetzt („none“) – mit Ausweichen vor dem Bereich fürs Profilbild auch bei „mittig“.
    var pos = b.logoPos === "auto" ? "auto" : hasLogo ? b.logoPos : "none";
    var m, textAnchor, textAlign, textTop, logoX = 0, logoY = 0;

    /** Logo über dem Text: Höhe so begrenzen, dass Logo und Text ins Banner passen (greift nur bei Platzmangel). */
    var fitAbove = function (textH) {
      var room = H - pad * 0.8 - (textH ? gap + textH : 0);
      if (logoH > room) { logoH = Math.max(room, u * 0.12); logoW = logoH * lw / lh; }
    };

    if (pos === "auto") {
      // Bisheriges Verhalten: Logo links (Ausrichtung links), rechts (rechts) bzw. über dem Text (mittig)
      var colW = align === "center" || !hasLogo ? avail : avail - logoW - gap;
      m = measureText(ctx, s, b, u, colW, title, sub, extra);
      // nur bei vergrößertem Logo begrenzen – mit 100 % bleibt das Ergebnis exakt wie in früheren Versionen
      if (align === "center" && hasLogo && b.logoSize > 100) fitAbove(m.textH);
      var blockH = align === "center" && hasLogo ? logoH + (m.textH ? gap + m.textH : 0) : Math.max(m.textH, hasLogo ? logoH : 0);
      var top = (H - blockH) / 2;
      if (align === "center") {
        textAlign = "center"; textAnchor = W / 2;
        logoX = W / 2 - logoW / 2; logoY = top;
        textTop = top + (hasLogo ? logoH + gap : 0);
      } else if (align === "right") {
        textAlign = "right";
        logoX = right - logoW; logoY = top + (blockH - logoH) / 2;
        textAnchor = hasLogo ? logoX - gap : right;
        textTop = top + (blockH - m.textH) / 2;
      } else {
        textAlign = "left";
        logoX = left; logoY = top + (blockH - logoH) / 2;
        textAnchor = hasLogo ? left + logoW + gap : left;
        textTop = top + (blockH - m.textH) / 2;
      }
    } else {
      textAlign = align;
      var layoutBlock = function (regionLeft) {
        var regionW = right - regionLeft;
        var corner = pos === "tl" || pos === "tr" || pos === "br";
        var mm, bw, bh, x0, top0, r = {};
        var placeX = function (w) { return align === "left" ? regionLeft : align === "right" ? right - w : regionLeft + (regionW - w) / 2; };
        if (pos === "start" || pos === "end") {
          mm = measureText(ctx, s, b, u, regionW - logoW - gap, title, sub, extra);
          bw = logoW + gap + mm.textW; bh = Math.max(mm.textH, logoH);
          x0 = placeX(bw); top0 = (H - bh) / 2;
          var colX = pos === "start" ? x0 + logoW + gap : x0;
          r.logo = { x: pos === "start" ? x0 : x0 + mm.textW + gap, y: top0 + (bh - logoH) / 2, w: logoW, h: logoH };
          r.text = { x: colX, y: top0 + (bh - mm.textH) / 2, w: mm.textW, h: mm.textH };
        } else if (pos === "above") {
          mm = measureText(ctx, s, b, u, regionW, title, sub, extra);
          fitAbove(mm.textH);
          bw = Math.max(logoW, mm.textW); bh = logoH + (mm.textH ? gap + mm.textH : 0);
          x0 = placeX(bw); top0 = (H - bh) / 2;
          var lx = align === "left" ? x0 : align === "right" ? x0 + bw - logoW : x0 + (bw - logoW) / 2;
          var tx = align === "left" ? x0 : align === "right" ? x0 + bw - mm.textW : x0 + (bw - mm.textW) / 2;
          r.logo = { x: lx, y: top0, w: logoW, h: logoH };
          r.text = { x: tx, y: top0 + logoH + gap, w: mm.textW, h: mm.textH };
        } else if (pos === "none") {
          mm = measureText(ctx, s, b, u, regionW, title, sub, extra);
          r.logo = { x: 0, y: 0, w: 0, h: 0 };
          r.text = { x: placeX(mm.textW), y: (H - mm.textH) / 2, w: mm.textW, h: mm.textH };
        } else if (corner) {
          // Logo in einer Ecke; oben links bleibt es oberhalb des Bereichs fürs Profilbild
          var mg = pad * 0.6, cw = logoW, ch = logoH;
          if (pos === "tl" && mg + ch > safeRect.y - gap * 0.3) { ch = Math.max(safeRect.y - gap * 0.3 - mg, u * 0.08); cw = ch * lw / lh; }
          r.logo = { x: pos === "tl" ? mg : W - mg - cw, y: pos === "br" ? H - mg - ch : mg, w: cw, h: ch };
          mm = measureText(ctx, s, b, u, regionW, title, sub, extra);
          var tx0 = placeX(mm.textW);
          r.text = { x: tx0, y: (H - mm.textH) / 2, w: mm.textW, h: mm.textH };
          if (rectsOverlap(r.text, { x: r.logo.x - gap / 2, y: r.logo.y - gap / 2, w: r.logo.w + gap, h: r.logo.h + gap })) {
            // zuerst vertikal ausweichen, sonst die Textspalte schmaler machen
            var ny = pos === "br" ? r.logo.y - gap / 2 - mm.textH : r.logo.y + r.logo.h + gap / 2;
            if (ny >= mg * 0.5 && ny + mm.textH <= H - mg * 0.5) r.text.y = ny;
            else {
              var lim = pos === "tl" ? { l: r.logo.x + r.logo.w + gap, r: right } : { l: regionLeft, r: r.logo.x - gap };
              var w2 = Math.max(lim.r - lim.l, u);
              mm = measureText(ctx, s, b, u, w2, title, sub, extra);
              var x2 = align === "left" ? lim.l : align === "right" ? lim.r - mm.textW : lim.l + (lim.r - lim.l - mm.textW) / 2;
              r.text = { x: x2, y: (H - mm.textH) / 2, w: mm.textW, h: mm.textH };
            }
          }
        }
        r.m = mm;
        return r;
      };
      var L = layoutBlock(left);
      // Logo (und Text) weichen dem Bereich fürs Profilbild aus – auch bei „mittig“
      if (align === "center" && ((L.logo.w && rectsOverlap(L.logo, safeRect)) || rectsOverlap(L.text, safeRect))) L = layoutBlock(Math.max(left, safeRight));
      m = L.m;
      logoX = L.logo.x; logoY = L.logo.y; logoW = L.logo.w; logoH = L.logo.h;
      textTop = L.text.y;
      textAnchor = align === "left" ? L.text.x : align === "right" ? L.text.x + L.text.w : L.text.x + L.text.w / 2;
    }

    if (hasLogo) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    }
    drawText(ctx, s, m, textAnchor, textAlign, textTop, tc.color);
    if (opts.overlay) drawSafeArea(ctx, W, H, safe);
    ctx.restore();
    var hasText = !!(m.title || m.lines.length || m.extra);
    return {
      scale: m.scale, subScale: m.subScale, subCut: m.subCut, extraScale: m.extraScale, extraCut: m.extraCut,
      textW: m.textW, left: left, autoColor: tc.auto && hasText, warnTransparent: !!tc.warnTransparent && hasText,
      lowContrast: !!tc.lowContrast && hasText,
      logo: hasLogo ? { x: logoX, y: logoY, w: logoW, h: logoH } : null, safe: safeRect
    };
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
      if (info.subCut) msgs.push(t("banner.subtitleCut"));
      else if (info.subScale < 0.995) msgs.push(t("banner.subtitleShrunk", { percent: Math.round(info.subScale * 100) }));
      if (info.extraCut) msgs.push(t("banner.extraCut"));
      else if (info.extraScale < 0.995) msgs.push(t("banner.extraShrunk", { percent: Math.round(info.extraScale * 100) }));
      if (info.autoColor) msgs.push(t("banner.autoColor"));
      if (info.warnTransparent) msgs.push(t("banner.transparentContrast"));
      if (info.lowContrast) msgs.push(t("banner.lowContrast"));
      els.warning.hidden = !msgs.length;
      els.warning.textContent = msgs.join(" ");
      els.stage.classList.toggle("is-transparent", settings.bgColor === "transparent");
      c.setAttribute("aria-label", t("banner.canvasLabel", { w: fmt.w, h: fmt.h }));
    });
    scheduleThumbs();
  }

  /** Schriften des Banners laden (Überschrift ggf. fett, Unterzeile normal), danach neu zeichnen. */
  function ensureFonts() {
    var s = bannerStyle(settings);
    var list = [Object.assign({}, s), Object.assign({}, s, { bold: false }), Object.assign({}, s, { bold: true })];
    return Promise.all(list.map(function (x) { return PBG.editor.ensureFont(x); }));
  }

  // ---------- Banner-Vorlagen ----------
  /** Einstellungen einer Banner-Vorlage; Format, Logo-Art, Schrift und Textfarbe bleiben, auf Wunsch Farben vom Rahmen. */
  function templateSettings(bp) {
    var b = Object.assign({}, PBG.BANNER_DEFAULTS, bp.values, {
      format: settings.format, logo: settings.logo, font: settings.font, bold: settings.bold, textColor: settings.textColor,
      title: PBG.presetText(bp, "title"), subtitle: PBG.presetText(bp, "subtitle"), extra: PBG.presetText(bp, "extra")
    });
    if (els.frameColors && els.frameColors.checked) b.bgColor = "frame";
    return b;
  }

  function markTemplates() {
    document.querySelectorAll(".banner-preset").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.key === activeTemplate));
    });
  }

  function applyTemplate(bp) {
    settings = templateSettings(bp);
    imageMode = false;     // ein Hintergrundbild bleibt geladen und lässt sich wieder wählen
    activeTemplate = bp.key;
    markTemplates();
    ensureFonts().then(requestRender);
    clampView();
    syncControls();
    requestRender();
    setStatus(els.status, t("banner.templateApplied", { name: PBG.loc(bp.name) }));
  }

  function templateButton(bp) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "banner-preset";
    btn.dataset.key = bp.key;
    btn.setAttribute("aria-pressed", "false");
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.textContent = PBG.loc(bp.name);
    btn.appendChild(c);
    btn.appendChild(label);
    btn.addEventListener("click", function () { applyTemplate(bp); });
    return btn;
  }

  function buildTemplates() {
    if (!els.presets) return;
    var today = PBG.today();
    els.presets.innerHTML = "";
    els.presetsCurrent.innerHTML = "";
    var current = PBG.BANNER_PRESETS.filter(function (bp) { return PBG.isBannerOccasionNow(bp, today); });
    current.forEach(function (bp) { els.presetsCurrent.appendChild(templateButton(bp)); });
    els.currentSection.hidden = !current.length;
    PBG.BANNER_GROUPS.forEach(function (g) {
      var list = PBG.BANNER_PRESETS.filter(function (bp) { return bp.group === g && current.indexOf(bp) < 0; });
      if (!list.length) return;
      var h = document.createElement("h4");
      h.className = "preset-group";
      h.textContent = t("banner.group." + g);
      var grid = document.createElement("div");
      grid.className = "banner-presets";
      list.forEach(function (bp) { grid.appendChild(templateButton(bp)); });
      els.presets.appendChild(h);
      els.presets.appendChild(grid);
    });
    scheduleThumbs();
  }

  var thumbTimer = 0;
  function scheduleThumbs() {
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(drawThumbs, 150);
  }

  function drawThumbs() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var btns = Array.prototype.slice.call(document.querySelectorAll(".banner-preset"));
    var i = 0;
    var step = function () {
      var start = performance.now();
      while (i < btns.length && performance.now() - start < 10) {
        var btn = btns[i++];
        var bp = PBG.bannerPresetByKey(btn.dataset.key);
        var b = templateSettings(bp);
        var fmt = fmtOf(b);
        var c = btn.querySelector("canvas");
        var w = Math.round(150 * dpr), h = Math.round(w * fmt.h / fmt.w);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        c.style.aspectRatio = fmt.w + " / " + fmt.h;
        btn.classList.toggle("is-transparent", b.bgColor === "transparent");
        render(c.getContext("2d"), w, h, { settings: b });
        btn.setAttribute("aria-pressed", String(btn.dataset.key === activeTemplate));
      }
      if (i < btns.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Formular ----------
  function setRadio(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) { r.checked = r.value === value; });
  }

  function setRange(el, out, v) {
    el.value = v;
    var text = Math.round(v) + " %";
    var o = $(el.id + "-out");
    if (o) o.textContent = text;
    el.setAttribute("aria-valuetext", text);
  }

  function syncControls() {
    els.font.value = settings.font;
    els.bold.value = settings.bold;
    els.ownTextColor.checked = !!settings.textColor;
    els.textColorField.hidden = !settings.textColor;
    var tcv = settings.textColor || PBG.editor.state().textColor;
    els.textColor.value = tcv; els.textColorHex.value = tcv.toUpperCase();
    els.title.value = settings.title;
    els.subtitle.value = settings.subtitle;
    els.extra.value = settings.extra;
    els.extraIcon.value = settings.extraIcon;
    setRadio("bannerFormat", settings.format);
    setRadio("bannerAlign", settings.align);
    setRadio("bannerBg", imageMode ? "image" : settings.bg);
    setRadio("bannerBgColor", settings.bgColor);
    setRadio("bannerGradDir", settings.gradDir);
    setRadio("bannerLogo", settings.logo);
    els.customColors.hidden = settings.bgColor !== "custom";
    els.color1.value = settings.color1; els.color1Hex.value = settings.color1.toUpperCase();
    els.color2.value = settings.color2; els.color2Hex.value = settings.color2.toUpperCase();
    els.gradient.checked = settings.gradient;
    els.color2Field.hidden = !settings.gradient;
    els.gradDirField.hidden = !settings.gradient;
    els.transparentHint.hidden = settings.bgColor !== "transparent";
    els.logoUpload.hidden = settings.logo !== "own";
    els.logoRemove.hidden = !ownLogo;
    els.logoSettings.hidden = settings.logo === "none";
    els.logoPos.value = settings.logoPos;
    setRange(els.logoSize, null, settings.logoSize);
    setRange(els.titleSize, null, settings.titleSize);
    setRange(els.subtitleSize, null, settings.subtitleSize);
    setRange(els.extraSize, null, settings.extraSize);
    els.imageSettings.hidden = !imageMode;
    els.imageRemove.hidden = !image;
    els.zoom.value = view.zoom;
    els.zoomOut.textContent = Math.round(view.zoom * 100) + " %";
    var fmt = format();
    els.downloadLabel.textContent = t("banner.download", { w: fmt.w, h: fmt.h });
  }

  /** Jede Änderung von Hand beendet die Markierung der gewählten Banner-Vorlage. */
  function changed() {
    activeTemplate = null;
    markTemplates();
    requestRender();
  }

  function buildFontOptions() {
    var o = document.createElement("option");
    o.value = "";
    o.textContent = t("banner.fontFrame");
    els.font.appendChild(o);
    PBG.FONTS.forEach(function (f) {
      var x = document.createElement("option");
      x.value = f.id;
      x.textContent = PBG.loc(f.label);
      els.font.appendChild(x);
    });
  }

  function buildIconOptions() {
    var none = document.createElement("option");
    none.value = "";
    none.textContent = t("banner.extraIconNone");
    els.extraIcon.appendChild(none);
    PBG.ICONS.forEach(function (ic) {
      var o = document.createElement("option");
      o.value = ic.id;
      o.textContent = PBG.loc(ic.label);
      els.extraIcon.appendChild(o);
    });
  }

  function bindControls() {
    [["title", "title"], ["subtitle", "subtitle"], ["extra", "extra"]].forEach(function (p) {
      els[p[0]].addEventListener("input", function () { settings[p[1]] = els[p[0]].value; changed(); });
    });
    els.extraIcon.addEventListener("change", function () { settings.extraIcon = els.extraIcon.value; changed(); });
    els.font.addEventListener("change", function () { settings.font = els.font.value; ensureFonts().then(requestRender); changed(); });
    els.bold.addEventListener("change", function () { settings.bold = els.bold.value; ensureFonts().then(requestRender); changed(); });
    els.ownTextColor.addEventListener("change", function () {
      settings.textColor = els.ownTextColor.checked ? textColor(PBG.editor.state(), Object.assign({}, settings, { textColor: "" })).color : "";
      syncControls();
      changed();
    });
    [["bannerFormat", "format"], ["bannerAlign", "align"], ["bannerBgColor", "bgColor"], ["bannerGradDir", "gradDir"], ["bannerLogo", "logo"]].forEach(function (pair) {
      document.querySelectorAll('input[name="' + pair[0] + '"]').forEach(function (r) {
        r.addEventListener("change", function () {
          if (!r.checked) return;
          settings[pair[1]] = r.value;
          if (pair[1] === "format") clampView();
          syncControls();
          if (pair[1] === "logo" && r.value === "own" && !ownLogo) els.logoInput.click();
          if (pair[1] === "format") scheduleThumbs();
          changed();
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
        changed();
      });
    });
    [["color1", "color1Hex"], ["color2", "color2Hex"], ["textColor", "textColorHex"]].forEach(function (pair) {
      var picker = els[pair[0]], hex = els[pair[1]];
      picker.addEventListener("input", function () {
        settings[pair[0]] = picker.value.toLowerCase();
        hex.value = settings[pair[0]].toUpperCase();
        hex.removeAttribute("aria-invalid");
        changed();
      });
      hex.addEventListener("input", function () {
        var v = normalizeHex(hex.value);
        if (v) { settings[pair[0]] = v; picker.value = v; hex.removeAttribute("aria-invalid"); changed(); }
        else hex.setAttribute("aria-invalid", "true");
      });
      hex.addEventListener("blur", function () { hex.value = settings[pair[0]].toUpperCase(); hex.removeAttribute("aria-invalid"); });
    });
    els.gradient.addEventListener("change", function () { settings.gradient = els.gradient.checked; syncControls(); changed(); });
    els.logoPos.addEventListener("change", function () { settings.logoPos = els.logoPos.value; changed(); });
    [["logoSize", "logoSize"], ["titleSize", "titleSize"], ["subtitleSize", "subtitleSize"], ["extraSize", "extraSize"]].forEach(function (pair) {
      els[pair[0]].addEventListener("input", function () {
        settings[pair[1]] = parseFloat(els[pair[0]].value);
        setRange(els[pair[0]], null, settings[pair[1]]);
        changed();
      });
    });
    els.logoInput.addEventListener("change", function () { loadLogo(els.logoInput.files && els.logoInput.files[0]); });
    els.logoRemove.addEventListener("click", function () {
      ownLogo = null; els.logoInput.value = "";
      setStatus(els.logoStatus, t("banner.logoRemoved"));
      syncControls();
      changed();
    });
    els.frameColors.addEventListener("change", scheduleThumbs);
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

  // ---------- Eigenes Banner-Logo: nur im Browser, höchstens 1024 px ----------
  function isLogoFile(file) {
    return /^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || /\.(png|jpe?g|webp|svg)$/i.test(file.name || "");
  }

  /** Zeichnet ein Bild auf einen Canvas mit höchstens maxSide px; SVGs werden auf diese Größe gerastert. */
  function toCanvas(img, maxSide, svg) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) { w = h = maxSide; }
    var sc = maxSide / Math.max(w, h);
    if (!svg) sc = Math.min(1, sc);
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * sc));
    c.height = Math.max(1, Math.round(h * sc));
    var x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function loadLogo(file) {
    if (!file) return;
    if (!isLogoFile(file)) { setStatus(els.logoStatus, t("logo.errorType"), true); return; }
    if (file.size > MAX_LOGO_FILE_MB * 1024 * 1024) { setStatus(els.logoStatus, t("logo.errorSize", { max: MAX_LOGO_FILE_MB }), true); return; }
    var svg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
    var blob = svg && file.type !== "image/svg+xml" ? new Blob([file], { type: "image/svg+xml" }) : file;
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      try {
        var c = toCanvas(img, MAX_LOGO_SIDE, svg);
        c.toDataURL("image/png");   // wirft bei nicht exportierbarem Canvas
        ownLogo = c;
        settings.logo = "own";
        setStatus(els.logoStatus, t("logo.loaded", { name: file.name || "" }));
        syncControls();
        changed();
      } catch (e) { setStatus(els.logoStatus, t("logo.error"), true); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); setStatus(els.logoStatus, t("logo.error"), true); };
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

  // ---------- Download in voller Größe (ohne Markierung; bei „Transparent“ mit transparentem Hintergrund) ----------
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

  // ---------- Schnittstelle für eigene Vorlagen und Design-Links (app.js) ----------
  PBG.banner = {
    /** Banner-Einstellungen zum Speichern (ohne Hintergrundbild und ohne Logo-Bild). */
    get: function () {
      var out = {};
      Object.keys(PBG.BANNER_DEFAULTS).forEach(function (k) { out[k] = settings[k]; });
      return out;
    },
    /** Übernimmt geprüfte Einstellungen; fehlende Schlüssel = Standard. Ein Hintergrundbild bleibt erhalten. */
    set: function (b) {
      var v = PBG.validateBanner(b).banner || {};
      settings = Object.assign({}, PBG.BANNER_DEFAULTS, v);
      activeTemplate = null;
      clampView();
      syncControls();
      requestRender();
    },
    hasOwnLogo: function () { return !!ownLogo; },
    /**
     * Vor dem Wechsel des Rahmens (Rahmen-Vorlage, eigene Vorlage ohne Banner, Link ohne Banner): Hat das Banner einen
     * eigenen Hintergrund, übernimmt es Schrift, Schriftstärke, Textfarbe und Überschrift fest – so bleibt es unverändert.
     * Bei „Wie der Rahmen“ folgt das Banner weiter dem Rahmen.
     */
    detachFromFrame: function () {
      if (settings.bgColor === "frame") return false;
      var s = PBG.editor.state();
      var before = JSON.stringify(settings);
      if (!settings.textColor) settings.textColor = textColor(bannerStyle(settings), settings).color;
      if (!settings.font) settings.font = s.font;
      if (settings.bold === "frame") settings.bold = s.bold ? "bold" : "regular";
      if (!settings.title) settings.title = String(s.text || "").replace(/\s+/g, " ").trim().slice(0, PBG.BANNER_MAX.title);
      if (JSON.stringify(settings) === before) return false;
      syncControls();
      setStatus(els.status, t("banner.detached"));
      return true;
    },
    /** Eigenes Banner-Logo als PNG-Data-URL (höchstens 512 px) für „Meine Vorlagen“; null ohne eigenes Logo. */
    logoDataUrl: function () {
      if (!ownLogo) return null;
      var c = toCanvas(ownLogo, STORE_LOGO_SIDE, false);
      var url = c.toDataURL("image/png");
      c.width = 0;
      return url;
    },
    /** Setzt das eigene Banner-Logo aus einer Data-URL (aus einer eigenen Vorlage). */
    setLogoDataUrl: function (url) {
      return new Promise(function (resolve) {
        if (!url) { resolve(false); return; }
        var img = new Image();
        img.onload = function () { ownLogo = toCanvas(img, MAX_LOGO_SIDE, false); syncControls(); requestRender(); resolve(true); };
        img.onerror = function () { resolve(false); };
        img.src = url;
      });
    },
    render: render
  };

  // ---------- Start ----------
  // Banner-Einstellungen aus einem Design-Link, der beim Öffnen der Seite gelesen wurde (app.js lädt vor banner.js)
  if (PBG.pendingBanner) {
    settings = Object.assign({}, PBG.BANNER_DEFAULTS, PBG.validateBanner(PBG.pendingBanner).banner || {});
    delete PBG.pendingBanner;
  }
  buildFontOptions();
  buildIconOptions();
  bindControls();
  bindPan();
  syncControls();
  buildTemplates();
  document.addEventListener("pbg:design", function () { ensureFonts().then(requestRender); requestRender(); });
  if (window.ResizeObserver) new ResizeObserver(requestRender).observe(els.canvas);
  else window.addEventListener("resize", requestRender);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
  ensureFonts().then(requestRender);
  requestRender();
})();
