/*
 * Banner-Editor (/banner/ und /en/banner/) – eigenständiges Werkzeug, unabhängig vom Rahmen-Editor.
 * Eigene Standardwerte (PBG.BANNER_DEFAULTS, banner-model.js) für Farbe, Verlauf, Schrift, Textfarbe und Logo;
 * Hintergrund als eigene Farbe (auch Verlauf), Weiß, Hellgrau oder transparent, dazu Muster oder ein eigenes Bild,
 * drei Textzeilen, Logo-Positionen und Banner-Vorlagen. „Farben aus einer Rahmen-Vorlage übernehmen“ kopiert auf
 * Wunsch Farben, Verlauf und Schrift einer Rahmen-Vorlage – sonst übernimmt das Banner nichts vom Rahmen.
 *
 * Datenschutz: Hintergrundbilder und Logos werden nur im Browser verarbeitet. Hintergrundbilder werden nie gespeichert,
 * ein Logo nur in „Meine Vorlagen“ (lokaler Speicher, Schlüssel rl-own-banners) – nie in Banner-Links (#b=…).
 *
 * Übernahme älterer Daten (aus der Zeit, als das Banner auf der Rahmen-Seite lag): Beim ersten Öffnen werden die
 * Banner-Teile alter eigener Vorlagen (rl-own-templates) einmalig als eigene Banner-Vorlagen übernommen (Merker
 * rl-banners-migrated); alte Dateien und alte Links (#d=… mit Banner) werden beim Import bzw. Öffnen umgerechnet.
 * PBG.bannerFromLegacy setzt dabei die damaligen Rahmen-Werte fest ein – das Banner sieht genauso aus wie vorher.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  if (!$("banner-editor")) return;
  var t = PBG.t, U = PBG.util;

  var MAX_IMAGE_SIDE = 4000;   // größere Hintergrundbilder werden beim Laden verkleinert
  var MAX_LOGO_SIDE = 1024;    // Logos werden auf höchstens 1024 px verkleinert
  var STORE_LOGO_SIDE = 512;   // … und für „Meine Vorlagen“ auf 512 px (lokaler Speicher ist knapp)
  var MAX_LOGO_FILE_MB = 10;
  var LOGO_URL_MAX = 1024 * 1024 * 1.4;   // Logo als Data-URL in Vorlagen und Dateien
  var MAX_ZOOM = 4;
  var MIN_TITLE_SCALE = 0.5;
  var MIN_EXTRA_SCALE = 0.5;

  var OWN_KEY = "rl-own-banners";          // eigene Banner-Vorlagen
  var MIGRATED_KEY = "rl-banners-migrated"; // Merker: alte Vorlagen wurden übernommen
  var FRAME_OWN_KEY = "rl-own-templates";   // eigene Rahmen-Vorlagen (nur gelesen)
  var START_TEMPLATE = "b-job-klar";

  /*
   * Banner-Link: https://…/banner/#b=<base64url(JSON)>, JSON = { "v": 1, <nur vom Standard abweichende Werte> }.
   * „v“ ist die Formatversion der Banner-Links (unabhängig von den Rahmen-Links #d=…). Nie Logo oder Hintergrundbild.
   */
  var LINK_VERSION = 1;
  var LINK_MAX = 3000;          // Banner-Links: alle Werte zusammen bleiben deutlich darunter
  var LEGACY_LINK_MAX = 4000;   // ältere Links (#d=…) mit Rahmen und Banner
  /** Beschriftungen für Meldungen über verworfene Angaben. */
  var FIELD_LABELS = {
    format: "banner.format", title: "banner.title", subtitle: "banner.subtitle", align: "banner.align", bg: "banner.bg",
    bgColor: "banner.bgColorLabel", color1: "banner.color1", color2: "banner.color2", gradient: "banner.gradient",
    gradDir: "banner.gradDir", logo: "banner.logoHeading", logoPos: "banner.logoPos", logoSize: "banner.logoSize",
    extra: "banner.extra", extraIcon: "banner.extraIcon", titleSize: "banner.titleSize", subtitleSize: "banner.subtitleSize",
    extraSize: "banner.extraSize", font: "banner.font", bold: "banner.bold", textColor: "banner.textColor"
  };

  // ---------- Zustand ----------
  var settings = Object.assign({}, PBG.BANNER_DEFAULTS);
  var image = null;            // Hintergrundbild als Canvas (nur im Arbeitsspeicher)
  var imageMode = false;       // Hintergrund „Eigenes Bild“ (wird nicht gespeichert)
  var view = { zoom: 1, offsetX: 0, offsetY: 0 };
  var ownLogo = null;          // Logo als Canvas (nur im Browser)
  var activeTemplate = null;   // Schlüssel der Banner-Vorlage oder "own:<id>"
  var own = null;              // PBG.OwnList
  var ownLogoImages = {};      // id → dekodiertes Logo einer eigenen Vorlage
  var linkFromUrl = false;     // aktuelles Banner stammt aus einem Link (für „Als eigene Vorlage speichern“)

  var els = {
    canvas: $("banner-preview"), stage: $("banner-stage"),
    title: $("banner-title"), subtitle: $("banner-subtitle"),
    font: $("banner-font"), bold: $("banner-bold"), ownTextColor: $("banner-own-textcolor"), textColorField: $("banner-textcolor-field"),
    textColorAuto: $("banner-textcolor-auto"),
    textColor: $("banner-textcolor"), textColorHex: $("banner-textcolor-hex"), extra: $("banner-extra"), extraIcon: $("banner-extra-icon"),
    imageInput: $("banner-image-input"), imageRemove: $("banner-image-remove"), imageStatus: $("banner-image-status"),
    imageSettings: $("banner-image-settings"), zoom: $("banner-zoom"), zoomOut: $("banner-zoom-out"),
    customColors: $("banner-custom-colors"), color1: $("banner-color1"), color1Hex: $("banner-color1-hex"),
    color2: $("banner-color2"), color2Hex: $("banner-color2-hex"), gradient: $("banner-gradient"), color2Field: $("banner-color2-field"),
    gradDirField: $("banner-graddir-field"), transparentHint: $("banner-transparent-hint"),
    logoInput: $("banner-logo-input"), logoRemove: $("banner-logo-remove"), logoStatus: $("banner-logo-status"),
    logoUpload: $("banner-logo-upload"), logoSettings: $("banner-logo-settings"), logoPos: $("banner-logo-pos"), logoSize: $("banner-logo-size"),
    titleSize: $("banner-title-size"), subtitleSize: $("banner-subtitle-size"), extraSize: $("banner-extra-size"),
    presets: $("banner-presets"), presetsCurrent: $("banner-presets-current"), currentSection: $("banner-current"),
    download: $("banner-download"), downloadLabel: $("banner-download-label"), status: $("banner-status"), warning: $("banner-warning"),
    ownList: $("own-list"), ownEmpty: $("own-empty"), ownSaveForm: $("own-save-form"), ownName: $("own-name"), ownImport: $("own-import"),
    ownStatus: $("own-status"), link: $("banner-link"),
    fromFrame: $("banner-from-frame"), frameDialog: $("frame-colors-dialog"), frameOwnWrap: $("frame-colors-own-wrap"),
    frameOwn: $("frame-colors-own"), frameBuiltin: $("frame-colors-builtin")
  };

  // ---------- Hilfsfunktionen ----------
  function fmtOf(b) { return PBG.BANNER_FORMATS[b.format] || PBG.BANNER_FORMATS["4x1"]; }
  function format() { return fmtOf(settings); }
  var clamp = U.clamp, luminance = U.luminance, contrast = U.contrast;
  var DARK_TEXT = "#111827";

  /** Hintergrundfarben des Banners: [Farbe 1, Farbe 2]; null bei „Transparent“. */
  function bgColors(b) {
    if (b.bgColor === "transparent") return null;
    if (PBG.BANNER_SOLID[b.bgColor]) return [PBG.BANNER_SOLID[b.bgColor], PBG.BANNER_SOLID[b.bgColor]];
    return [b.color1, b.gradient ? b.color2 : b.color1];
  }

  /**
   * Textfarbe: die eigene, falls gewählt (mit Hinweis bei geringem Kontrast). Sonst automatisch Weiß oder fast Schwarz –
   * je nachdem, was sich auf allen Hintergrundfarben besser abhebt. Bei „Transparent“ ohne eigene Farbe: fast Schwarz,
   * mit Hinweis, weil die Plattform die Fläche schwarz füllen könnte.
   */
  function textColor(b) {
    var cols = bgColors(b);
    if (b.textColor) {
      var low = cols ? Math.min.apply(null, cols.map(function (x) { return contrast(b.textColor, x); })) < 3
        : contrast(b.textColor, "#ffffff") < 3 || contrast(b.textColor, "#000000") < 3;
      return { color: b.textColor, lowContrast: !!cols && low, warnTransparent: !cols && low };
    }
    if (!cols) return { color: DARK_TEXT, warnTransparent: true };
    var bgs = cols[0] === cols[1] ? [cols[0]] : cols;
    var worst = function (c) { return Math.min.apply(null, bgs.map(function (x) { return contrast(c, x); })); };
    return { color: worst("#ffffff") >= worst(DARK_TEXT) ? "#ffffff" : DARK_TEXT };
  }

  /** Schrift und Schriftstärke der Überschrift. */
  function styleOf(b) { return { font: b.font, bold: b.bold === "bold" }; }

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

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---------- Zeichnen ----------
  /** Hintergrund: Farbe/Verlauf, optional dezentes Muster oder eigenes Bild mit Farbschleier. */
  function drawBackground(ctx, b, W, H, u, bg, img, tc) {
    var cols = bgColors(b);
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
   * (Vorschaubilder der Vorlagen, ohne Hintergrundbild) mit opts.logo als Logo.
   */
  function render(ctx, W, H, opts) {
    opts = opts || {};
    var b = opts.settings || settings;
    var s = styleOf(b);
    var logo = b.logo === "none" ? null : opts.settings ? opts.logo || null : ownLogo;
    var fmt = fmtOf(b);
    var u = Math.min(H, W * 0.25) * (fmt.textScale || 1);   // Grundmaß für Schrift und Abstände
    var pad = Math.max(W * 0.04, u * 0.1);
    var img = opts.settings ? null : image;
    var bg = !opts.settings && imageMode && image ? "image" : b.bg;
    var tc = textColor(b);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, b, W, H, u, bg, img, tc);

    var title = (b.title || "").replace(/\s+/g, " ").trim();
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
      textW: m.textW, left: left, warnTransparent: !!tc.warnTransparent && hasText,
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
      if (info.warnTransparent) msgs.push(t("banner.transparentContrast"));
      if (info.lowContrast) msgs.push(t("banner.lowContrast"));
      els.warning.hidden = !msgs.length;
      els.warning.textContent = msgs.join(" ");
      els.stage.classList.toggle("is-transparent", settings.bgColor === "transparent");
      c.setAttribute("aria-label", t("banner.canvasLabel", { w: fmt.w, h: fmt.h }));
    });
    scheduleThumbs();
  }

  // ---------- Schriften (selbst gehostet, fonts.css) ----------
  var fontPromises = {};
  function loadFont(id, bold) {
    var f = PBG.fontById(id);
    var w = bold && f.weights.indexOf(700) >= 0 ? "700" : "400";
    var key = id + "|" + w;
    if (!fontPromises[key]) {
      fontPromises[key] = document.fonts && document.fonts.load
        ? document.fonts.load(w + ' 40px "' + id + '"', "ABCÄÖÜ abc").catch(function () {})
        : Promise.resolve();
    }
    return fontPromises[key];
  }

  /** Schriften eines Banners laden (Überschrift ggf. fett, übrige Zeilen normal). */
  function ensureFonts(b) {
    b = b || settings;
    return Promise.all([loadFont(b.font, b.bold === "bold"), loadFont(b.font, false)]);
  }

  // ---------- Banner-Vorlagen ----------
  /** Einstellungen einer Banner-Vorlage; Format, Schrift, Schriftstärke und Logo-Art bleiben, die Textfarbe wird automatisch. */
  function templateSettings(bp) {
    return Object.assign({}, PBG.BANNER_DEFAULTS, bp.values, {
      format: settings.format, logo: settings.logo, font: settings.font, bold: settings.bold,
      title: PBG.presetText(bp, "title"), subtitle: PBG.presetText(bp, "subtitle"), extra: PBG.presetText(bp, "extra")
    });
  }

  function markTemplates() {
    // Banner-Vorlagen: data-key = Schlüssel; eigene Vorlagen (own.js): data-key = "own:<id>"
    document.querySelectorAll(".banner-preset, .own-preset").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.key === activeTemplate));
    });
  }

  /** Andere Vorlage gewählt: „Als eigene Vorlage speichern“ bezieht sich nicht mehr auf das Banner aus dem Link. */
  function endLinkOffer() {
    linkFromUrl = false;
    PBG.Links.endSave();
  }

  function applyTemplate(bp, quiet) {
    settings = templateSettings(bp);
    imageMode = false;     // ein Hintergrundbild bleibt geladen und lässt sich wieder wählen
    activeTemplate = bp.key;
    endLinkOffer();
    markTemplates();
    ensureFonts().then(requestRender);
    clampView();
    syncControls();
    requestRender();
    if (!quiet) U.setStatus(els.status, t("banner.templateApplied", { name: PBG.loc(bp.name) }));
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
    var today = PBG.today();
    els.presets.innerHTML = "";
    els.presetsCurrent.innerHTML = "";
    var current = PBG.BANNER_PRESETS.filter(function (bp) { return PBG.isBannerOccasionNow(bp, today); });
    current.forEach(function (bp) { els.presetsCurrent.appendChild(templateButton(bp)); });
    els.currentSection.hidden = !current.length;
    PBG.BANNER_GROUPS.forEach(function (g) {
      var list = PBG.BANNER_PRESETS.filter(function (bp) { return bp.group === g && current.indexOf(bp) < 0; });
      if (!list.length) return;
      var h = document.createElement("h3");
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
        var b = templateSettings(PBG.bannerPresetByKey(btn.dataset.key));
        var fmt = fmtOf(b);
        var c = btn.querySelector("canvas");
        var w = Math.round(150 * dpr), h = Math.round(w * fmt.h / fmt.w);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        c.style.aspectRatio = fmt.w + " / " + fmt.h;
        btn.classList.toggle("is-transparent", b.bgColor === "transparent");
        render(c.getContext("2d"), w, h, { settings: b, logo: ownLogo });
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

  function setRange(el, v) {
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
    els.textColorAuto.hidden = !!settings.textColor;
    var tcv = settings.textColor || textColor(settings).color;
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
    setRange(els.logoSize, settings.logoSize);
    setRange(els.titleSize, settings.titleSize);
    setRange(els.subtitleSize, settings.subtitleSize);
    setRange(els.extraSize, settings.extraSize);
    els.imageSettings.hidden = !imageMode;
    els.imageRemove.hidden = !image;
    els.zoom.value = view.zoom;
    els.zoomOut.textContent = Math.round(view.zoom * 100) + " %";
    var fmt = format();
    els.downloadLabel.textContent = t("banner.download", { w: fmt.w, h: fmt.h });
  }

  /** Jede Änderung von Hand beendet die Markierung der gewählten Vorlage. */
  function changed() {
    activeTemplate = null;
    markTemplates();
    requestRender();
  }

  function buildFontOptions() {
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
      settings.textColor = els.ownTextColor.checked ? textColor(Object.assign({}, settings, { textColor: "" })).color : "";
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
        var v = U.normalizeHex(hex.value);
        if (v) { settings[pair[0]] = v; picker.value = v; hex.removeAttribute("aria-invalid"); changed(); }
        else hex.setAttribute("aria-invalid", "true");
      });
      hex.addEventListener("blur", function () { hex.value = (settings[pair[0]] || picker.value).toUpperCase(); hex.removeAttribute("aria-invalid"); });
    });
    els.gradient.addEventListener("change", function () { settings.gradient = els.gradient.checked; syncControls(); changed(); });
    els.logoPos.addEventListener("change", function () { settings.logoPos = els.logoPos.value; changed(); });
    ["logoSize", "titleSize", "subtitleSize", "extraSize"].forEach(function (k) {
      els[k].addEventListener("input", function () {
        settings[k] = parseFloat(els[k].value);
        setRange(els[k], settings[k]);
        changed();
      });
    });
    els.logoInput.addEventListener("change", function () { loadLogo(els.logoInput.files && els.logoInput.files[0]); });
    els.logoRemove.addEventListener("click", function () {
      ownLogo = null; els.logoInput.value = "";
      U.setStatus(els.logoStatus, t("banner.logoRemoved"));
      syncControls();
      changed();
    });
    els.zoom.addEventListener("input", function () { setZoom(parseFloat(els.zoom.value)); });
    els.imageInput.addEventListener("change", function () { loadImage(els.imageInput.files && els.imageInput.files[0]); });
    els.imageRemove.addEventListener("click", function () {
      image = null; imageMode = false; els.imageInput.value = "";
      view = { zoom: 1, offsetX: 0, offsetY: 0 };
      U.setStatus(els.imageStatus, t("banner.imageRemoved"));
      syncControls();
      requestRender();
    });
    els.download.addEventListener("click", download);
  }

  // ---------- Eigene Banner-Vorlagen (own.js): nur lokal, nie mit Hintergrundbild ----------
  /** Aktuelle Banner-Einstellungen (ohne Hintergrundbild und Logo-Bild). */
  function currentBanner() {
    var out = {};
    Object.keys(PBG.BANNER_DEFAULTS).forEach(function (k) { out[k] = settings[k]; });
    return out;
  }

  /** Logo als PNG-Data-URL (höchstens 512 px) für „Meine Vorlagen“; null ohne Logo. */
  function logoDataUrl() {
    if (!ownLogo) return null;
    var c = U.toCanvas(ownLogo, STORE_LOGO_SIDE, false);
    var url = c.toDataURL("image/png");
    c.width = 0;
    return url;
  }

  /**
   * Prüft eine eigene Banner-Vorlage streng: nur bekannte Schlüssel, Banner-Werte im erlaubten Bereich, Logo nur als
   * PNG/JPEG/WebP-Data-URL. Gibt { template, dropped[] } zurück oder null, wenn kein gültiges Banner enthalten ist.
   */
  function validateTemplate(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    var dropped = [];
    Object.keys(raw).forEach(function (k) {
      if (["format", "type", "version", "id", "name", "banner", "logo", "created"].indexOf(k) < 0) dropped.push(k);
    });
    var v = PBG.validateBanner(raw.banner);
    if (!v.banner) return null;
    v.dropped.forEach(function (k) { dropped.push(fieldLabel(k)); });
    var logoUrl = null;
    if (raw.logo != null && raw.logo !== "") {
      if (U.validLogoDataUrl(raw.logo, LOGO_URL_MAX)) logoUrl = raw.logo;
      else dropped.push(t("banner.logoHeading"));
    }
    var name = typeof raw.name === "string" ? raw.name.trim().slice(0, own ? own.NAME_MAX : 40) : "";
    return {
      template: {
        id: typeof raw.id === "string" && /^[a-z0-9-]{1,40}$/.test(raw.id) ? raw.id : U.newId(),
        name: name || t("own.unnamed"),
        banner: Object.assign({}, PBG.BANNER_DEFAULTS, v.banner),
        logo: logoUrl,
        created: typeof raw.created === "number" && isFinite(raw.created) ? raw.created : Date.now()
      },
      dropped: dropped
    };
  }

  /** „banner.title“ oder „title“ → lesbare Bezeichnung. */
  function fieldLabel(k) {
    var key = String(k).replace(/^banner\./, "");
    return FIELD_LABELS[key] ? t(FIELD_LABELS[key]) : key;
  }

  /** Banner-Teil einer älteren kombinierten Vorlage (Rahmen + Banner) als eigene Banner-Vorlage; null ohne Banner. */
  function legacyTemplate(raw) {
    if (!raw || typeof raw !== "object" || !raw.banner || typeof raw.banner !== "object" || Array.isArray(raw.banner)) return null;
    var logo = function (v) { return U.validLogoDataUrl(v, LOGO_URL_MAX) ? v : null; };
    var conv = PBG.bannerFromLegacy(raw.banner, raw.design, logo(raw.logo), logo(raw.bannerLogo));
    var r = validateTemplate({ id: U.newId(), name: raw.name, banner: conv.banner, logo: conv.logo, created: raw.created });
    if (!r) return null;
    conv.dropped.forEach(function (k) { r.dropped.push(fieldLabel(k)); });
    return r;
  }

  function templateLogo(tpl) {
    if (!tpl.logo) return Promise.resolve(null);
    if (!ownLogoImages[tpl.id]) ownLogoImages[tpl.id] = U.loadDataUrl(tpl.logo);
    return ownLogoImages[tpl.id];
  }

  function applyOwnTemplate(tpl) {
    settings = Object.assign({}, PBG.BANNER_DEFAULTS, tpl.banner);
    imageMode = false;
    activeTemplate = "own:" + tpl.id;
    endLinkOffer();
    templateLogo(tpl).then(function (img) {
      ownLogo = img ? U.toCanvas(img, MAX_LOGO_SIDE, false) : null;
    }, function () { ownLogo = null; }).then(function () {
      clampView();
      syncControls();
      markTemplates();
      ensureFonts().then(requestRender);
      requestRender();
      U.setStatus(els.status, t("banner.templateApplied", { name: tpl.name }));
    });
  }

  function bindOwnTemplates() {
    var toFrame = { href: U.toolUrl("frame"), label: t("nav.toFrame") };
    own = PBG.OwnList({
      key: OWN_KEY, type: "banner", version: 2,
      els: { list: els.ownList, empty: els.ownEmpty, form: els.ownSaveForm, name: els.ownName, importInput: els.ownImport, status: els.ownStatus },
      validate: validateTemplate,
      current: function (name) {
        var tpl = { id: U.newId(), name: name, banner: currentBanner(), logo: logoDataUrl(), created: Date.now() };
        activeTemplate = "own:" + tpl.id;
        return tpl;
      },
      apply: applyOwnTemplate,
      thumb: function (c, tpl, size) {
        var b = tpl.banner, fmt = fmtOf(b);
        c.width = size * 2;
        c.height = Math.round(c.width * fmt.h / fmt.w);
        c.style.aspectRatio = fmt.w + " / " + fmt.h;
        c.classList.toggle("is-transparent", b.bgColor === "transparent");
        Promise.all([ensureFonts(b), templateLogo(tpl).catch(function () { return null; })]).then(function (r) {
          render(c.getContext("2d"), c.width, c.height, { settings: b, logo: r[1] });
        });
      },
      link: function (tpl) { PBG.Links.openDialog(bannerLink(tpl.banner), !!tpl.logo); },
      exportData: function (tpl) { return { banner: tpl.banner, logo: tpl.logo || null }; },
      /**
       * Nur Banner-Dateien. Ältere Dateien ohne Typ (Rahmen und Banner zusammen): den Banner-Teil umrechnen und
       * importieren, Hinweis auf die Rahmen-Seite. Rahmen-Dateien: Hinweis mit Link zur Rahmen-Seite.
       */
      prepareImport: function (raw) {
        if (raw.type === "frame") return { error: t("own.wrongTypeFrame"), goto: toFrame };
        if (raw.type === "banner") return { raw: raw };
        if (raw.type != null) return { error: t("own.errorFile") };
        if (!raw.banner || typeof raw.banner !== "object" || Array.isArray(raw.banner)) return { error: t("own.noBanner"), goto: toFrame };
        var r = legacyTemplate(raw);
        if (!r) return { error: t("own.errorFile") };
        return { raw: r.template, note: t("own.alsoFrame"), noteGoto: toFrame };
      },
      checkLogos: function (tpl, dropped) {
        return templateLogo(tpl).then(function () {}, function () {
          delete ownLogoImages[tpl.id];
          tpl.logo = null;
          dropped.push(t("banner.logoHeading"));
        });
      },
      onDelete: function (tpl) {
        delete ownLogoImages[tpl.id];
        if (activeTemplate === "own:" + tpl.id) activeTemplate = null;
      },
      onChange: markTemplates
    });
    own.bind();
  }

  /**
   * Einmalige Übernahme: Der Banner-Teil jeder älteren eigenen Vorlage (rl-own-templates) wird eine eigene
   * Banner-Vorlage mit gleichem Namen. Nichts wird gelöscht; schon übernommene Vorlagen (gleicher Name und gleiches
   * Datum) werden nicht doppelt angelegt. Der Merker wird erst gesetzt, wenn alles gespeichert ist.
   */
  function migrateLegacy() {
    if (PBG.storage.get(MIGRATED_KEY)) return;
    var list;
    try { list = JSON.parse(PBG.storage.get(FRAME_OWN_KEY) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    var added = 0, err = null;
    // von hinten, damit die Reihenfolge (neueste oben) erhalten bleibt
    for (var i = list.length - 1; i >= 0; i--) {
      var r = legacyTemplate(list[i]);
      if (!r) continue;
      var tpl = r.template;
      var exists = own.list().some(function (x) { return x.name === tpl.name && x.created === tpl.created; });
      if (exists) continue;
      err = own.add(tpl);
      if (err) break;
      added++;
    }
    if (!err) PBG.storage.set(MIGRATED_KEY, "1");
    if (added) own.render();
    if (err) own.msg(t("banner.migrateError") + " " + err, true);
    else if (added) own.msg(t("banner.migrated", { count: added }));
  }

  // ---------- Banner als Link (#b=…, links.js): nur Einstellungen, nie Logo oder Hintergrundbild ----------
  function bannerLink(b) {
    return PBG.Links.url("b", Object.assign({ v: LINK_VERSION }, PBG.bannerDiff(b) || {}));
  }

  /**
   * Liest ein Banner aus dem Fragment: #b=… (Banner-Link) oder – aus der Zeit, als das Banner auf der Rahmen-Seite lag –
   * #d=… mit Banner (wird mit dem Rahmen des Links umgerechnet). Gibt null zurück, wenn kein Link vorliegt, sonst
   * { error, goto? } oder { banner, dropped[], unknown }.
   */
  function parseLink(hash) {
    var r = PBG.Links.read("b", LINK_MAX, hash);
    if (r) {
      if (r.error) return r;
      var data = r.data;
      if (data.v !== LINK_VERSION) return { error: typeof data.v === "number" ? "link.errorVersion" : "link.errorInvalid" };
      var out = {}, dropped = [], unknown = 0, keys = 0;
      Object.keys(data).forEach(function (k) {
        if (k === "v") return;
        keys++;
        if (!Object.prototype.hasOwnProperty.call(PBG.BANNER_DEFAULTS, k)) { unknown++; return; }
        var v = PBG.validBannerValue(k, data[k]);
        if (v === undefined) dropped.push(fieldLabel(k)); else out[k] = v;
      });
      if (keys && !Object.keys(out).length) return { error: "link.errorInvalid" };
      return { banner: Object.assign({}, PBG.BANNER_DEFAULTS, out), dropped: dropped, unknown: unknown };
    }
    var d = PBG.Links.read("d", LEGACY_LINK_MAX, hash);
    if (!d) return null;
    if (d.error) return d;
    if (d.data.v !== 1) return { error: typeof d.data.v === "number" ? "link.errorVersion" : "link.errorInvalid" };
    var old = d.data.banner;
    if (!old || typeof old !== "object" || Array.isArray(old)) {
      // reiner Rahmen-Link: auf der Rahmen-Seite öffnen
      return { error: "link.onlyFrame", goto: { href: U.toolUrl("frame") + "#d=" + d.raw, label: t("link.openFrame") } };
    }
    var conv = PBG.bannerFromLegacy(old, d.data, null, null);
    var v = PBG.validateBanner(conv.banner);
    return {
      banner: Object.assign({}, PBG.BANNER_DEFAULTS, v.banner || {}),
      dropped: conv.dropped.concat(v.dropped).map(fieldLabel), unknown: 0
    };
  }

  function saveFromLink() {
    if (!linkFromUrl) return;
    var tpl = own.save(t("link.defaultBannerName"), function (msg, isError) { PBG.Links.notice(msg, isError); });
    if (tpl) { linkFromUrl = false; markTemplates(); }
  }

  /** Lädt ein Banner aus dem Fragment und entfernt es sofort aus der Adresse. Gibt true zurück, wenn ein Banner geladen wurde. */
  function loadLinkFromHash() {
    var r = parseLink(location.hash);
    if (!r) return false;
    PBG.Links.strip();
    if (r.error) {
      linkFromUrl = false;
      PBG.Links.notice(t(r.error, { app: (PBG.config || {}).appName }), true, { goto: r.goto });
      return false;
    }
    settings = r.banner;
    imageMode = false;
    activeTemplate = null;
    clampView();
    syncControls();
    markTemplates();
    ensureFonts().then(requestRender);
    requestRender();
    linkFromUrl = true;
    var fields = r.dropped.slice();
    if (r.unknown) fields.push(t("link.unknown", { count: r.unknown }));
    PBG.Links.notice(t("link.bannerLoaded") + (fields.length ? " " + t("link.partial", { fields: fields.join(", ") }) : ""), fields.length > 0, { save: saveFromLink });
    return true;
  }

  function bindLinks() {
    PBG.Links.bind();
    els.link.addEventListener("click", function () { PBG.Links.openDialog(bannerLink(currentBanner()), !!ownLogo && settings.logo === "own"); });
    // Link in einem schon offenen Tab eingefügt: Nur das Fragment ändert sich, die Seite lädt nicht neu
    window.addEventListener("hashchange", function () {
      var n = PBG.Links.noticeElement();
      if (loadLinkFromHash() || !n.hidden) n.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  // ---------- Farben aus einer Rahmen-Vorlage: nur Farben, Verlauf und Schrift ----------
  /** Rahmen-Vorlagen dieses Geräts (nur gelesen, streng geprüft). */
  function ownFrameTemplates() {
    var list;
    try { list = JSON.parse(PBG.storage.get(FRAME_OWN_KEY) || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) {
      return x && typeof x === "object" && x.design && typeof x.design === "object" && !Array.isArray(x.design);
    }).slice(0, 50).map(function (x) {
      var name = typeof x.name === "string" && x.name.trim() ? x.name.trim().slice(0, 40) : t("own.unnamed");
      return { name: name, style: PBG.frameStyleOf(x.design) };
    });
  }

  function frameColorButton(name, f) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frame-color";
    var sw = document.createElement("span");
    sw.className = "frame-color-swatch";
    sw.setAttribute("aria-hidden", "true");
    sw.style.background = f.gradient ? "linear-gradient(135deg, " + f.ringColor + ", " + f.ringColor2 + ")" : f.ringColor;
    sw.style.color = f.textColor;
    sw.style.fontFamily = '"' + f.font + '", system-ui, sans-serif';
    sw.textContent = "Aa";
    var label = document.createElement("span");
    label.textContent = name;
    btn.appendChild(sw);
    btn.appendChild(label);
    btn.setAttribute("aria-label", t("banner.fromFrameApply", { name: name }));
    btn.addEventListener("click", function () { applyFrameColors(name, f); });
    return btn;
  }

  function openFrameColors() {
    var mine = ownFrameTemplates();
    els.frameOwn.innerHTML = "";
    mine.forEach(function (x) { els.frameOwn.appendChild(frameColorButton(x.name, x.style)); });
    els.frameOwnWrap.hidden = !mine.length;
    if (!els.frameBuiltin.childNodes.length) {
      PBG.PRESETS.forEach(function (p) {
        var f = PBG.frameStyleOf(Object.assign({}, PBG.DEFAULTS, p.values));
        els.frameBuiltin.appendChild(frameColorButton(PBG.loc(p.name), f));
      });
    }
    U.showDialog(els.frameDialog);
  }

  function applyFrameColors(name, f) {
    settings.bgColor = "custom";
    settings.color1 = f.ringColor;
    settings.color2 = f.ringColor2;
    settings.gradient = f.gradient;
    settings.font = f.font;
    settings.textColor = f.textColor;
    U.closeDialog(els.frameDialog);
    syncControls();
    ensureFonts().then(requestRender);
    changed();
    U.setStatus(els.status, t("banner.fromFrameApplied", { name: name }));
  }

  function bindFrameColors() {
    els.fromFrame.addEventListener("click", openFrameColors);
    els.frameDialog.addEventListener("click", function (e) { if (e.target === els.frameDialog) U.closeDialog(els.frameDialog); });
  }

  // ---------- Hintergrundbild: nur im Browser ----------
  function loadImage(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name || "")) {
      U.setStatus(els.imageStatus, t("banner.imageErrorType"), true);
      return;
    }
    U.decodeImage(file).then(function (img) {
      image = U.toCanvas(img, MAX_IMAGE_SIDE, false);
      imageMode = true;
      view = { zoom: 1, offsetX: 0, offsetY: 0 };
      U.setStatus(els.imageStatus, t("banner.imageLoaded", { name: file.name || "" }));
      syncControls();
      requestRender();
    }, function () { U.setStatus(els.imageStatus, t("banner.imageError"), true); });
  }

  // ---------- Logo: nur im Browser, höchstens 1024 px ----------
  function loadLogo(file) {
    if (!file) return;
    U.loadLogoFile(file, MAX_LOGO_SIDE, MAX_LOGO_FILE_MB).then(function (c) {
      ownLogo = c;
      settings.logo = "own";
      U.setStatus(els.logoStatus, t("logo.loaded", { name: file.name || "" }));
      syncControls();
      changed();
    }, function (e) {
      U.setStatus(els.logoStatus, e.message === "type" ? t("logo.errorType") : e.message === "size" ? t("logo.errorSize", { max: MAX_LOGO_FILE_MB }) : t("logo.error"), true);
    });
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
      return new Promise(function (resolve, reject) { c.toBlob(function (b) { if (b) resolve(b); else reject(new Error("blob")); }, "image/png"); });
    }).then(function (blob) {
      var fmt = format();
      U.download(blob, t("banner.filename") + "-" + fmt.w + "x" + fmt.h + ".png");
      U.setStatus(els.status, t("banner.done"));
    }).catch(function () {
      U.setStatus(els.status, t("banner.error"), true);
    }).then(function () { els.download.disabled = false; });
  }

  /** Für Tests und Vorschaubilder (scripts/render-images.mjs): Zeichnen mit beliebigen Einstellungen. */
  PBG.bannerEditor = {
    render: render,
    settings: function () { return currentBanner(); },
    ensureFonts: ensureFonts
  };

  // ---------- Start ----------
  buildFontOptions();
  buildIconOptions();
  bindControls();
  bindPan();
  bindLinks();
  bindFrameColors();
  bindOwnTemplates();
  migrateLegacy();
  buildTemplates();
  if (!loadLinkFromHash()) applyTemplate(PBG.bannerPresetByKey(START_TEMPLATE), true);
  if (window.ResizeObserver) new ResizeObserver(requestRender).observe(els.canvas);
  else window.addEventListener("resize", requestRender);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
  ensureFonts().then(requestRender);
  requestRender();
})();
