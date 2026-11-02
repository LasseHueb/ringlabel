window.PBG = window.PBG || {};

/*
 * Zeichnet das komplette Profilbild (Foto + Ring + Text) auf einen Canvas beliebiger Größe.
 * Alle Größen sind relativ zur Kantenlänge, damit Vorschau, Miniatur und Export
 * pixelgenau gleich aussehen.
 *
 * Formen (state.shape):
 *   "arc"   – Bogen (Standard, bisheriges Verhalten); optional zweiter Text oben auf eigenem kurzen Bogen
 *   "ring"  – geschlossener Ring rund um das Foto, Text unten, optional zweiter Text oben
 *   "badge" – abgerundetes Schild unten mittig über dem Foto, Text gerade; Farbe wie der Ring
 * Der Text oben (state.textTop) ist von außen lesbar, hat eine eigene Größe (state.sizeTop) und nutzt Schrift und Farbe des Haupttexts.
 */
(function () {
  var DEG = Math.PI / 180;
  var MIN_TEXT_SCALE = 0.55; // weiter wird nicht verkleinert – stattdessen Warnung
  var KEEP_SYMBOLS = "©®™";

  /** Zerlegt Text in sichtbare Zeichen (Emoji, Umlaute mit Kombinationszeichen …). */
  function splitGraphemes(str) {
    if (window.Intl && Intl.Segmenter) {
      var seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(str), function (s) { return s.segment; });
    }
    return Array.from(str);
  }

  var EMOJI_RE = null;
  try { EMOJI_RE = new RegExp("[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\u{1F3FB}-\\u{1F3FF}\\uFE0F\\u200D\\u20E3]", "gu"); } catch (e) { /* sehr alte Browser */ }

  function hasEmoji(str) {
    if (!EMOJI_RE) return false;
    EMOJI_RE.lastIndex = 0;
    var m;
    while ((m = EMOJI_RE.exec(str))) if (KEEP_SYMBOLS.indexOf(m[0]) < 0) return true;
    return false;
  }

  function stripEmoji(str) {
    if (!EMOJI_RE) return str;
    return str.replace(EMOJI_RE, function (c) { return KEEP_SYMBOLS.indexOf(c) >= 0 ? c : ""; });
  }

  function prepareText(state, str) {
    var text = (str === undefined ? state.text : str) || "";
    if (state.noEmoji) text = stripEmoji(text);
    text = text.replace(/\s+/g, " ").trim();
    if (state.uppercase) text = text.toLocaleUpperCase(PBG.lang || "de");
    return text;
  }

  function weightFor(state) {
    var f = PBG.fontById ? PBG.fontById(state.font) : null;
    var weights = f ? f.weights : [400, 700];
    return state.bold && weights.indexOf(700) >= 0 ? 700 : 400;
  }

  function fontString(state, px) {
    return weightFor(state) + " " + px.toFixed(2) + 'px "' + state.font + '", system-ui, sans-serif';
  }

  /** Baut die Abfolge aus Zeichen, Symbolen und Logo. logoPos "replace": nur das Logo, mittig auf dem Bogen. */
  function buildItems(state, text, hasLogo) {
    if (hasLogo && state.logoPos === "replace") return [{ type: "logo" }];
    var items = splitGraphemes(text).map(function (c) { return { type: "char", value: c }; });
    var icon = state.icon && PBG.iconById ? PBG.iconById(state.icon) : null;
    if (icon && items.length) {
      if (state.iconPos === "start" || state.iconPos === "both") items.unshift({ type: "gap" }, { type: "icon", icon: icon });
      if (state.iconPos === "end" || state.iconPos === "both") items.push({ type: "gap" }, { type: "icon", icon: icon });
      // Lücke vor/nach dem Symbol an die richtige Seite schieben
      if (items[0].type === "gap") items.splice(0, 2, items[1], items[0]);
    }
    if (hasLogo) {
      if (state.logoPos === "start") items.unshift({ type: "logo" }, { type: "gap" });
      else items.push({ type: "gap" }, { type: "logo" });
    }
    return items;
  }

  /** Seitenverhältnis eines Logos (Breite/Höhe), begrenzt auf sinnvolle Werte. */
  function logoAspect(logo) {
    var iw = logo.naturalWidth || logo.width, ih = logo.naturalHeight || logo.height;
    if (!iw || !ih) return 1;
    return Math.min(Math.max(iw / ih, 0.25), 6);
  }

  /**
   * Misst eine Abfolge aus Zeichen, Symbolen und Logo entlang einer Linie (Bogen oder gerade).
   * Ergebnis: Versatz und Breite je Element, Gesamtlänge (total) und Winkel auf dem Radius r (angle).
   */
  function measureItems(ctx, state, items, fontPx, baseFont, logoH0, aspect, r) {
    ctx.font = fontString(state, fontPx);
    var spacing = fontPx * state.spacing / 100;
    var symbolW = fontPx * 0.95;
    var logoH = logoH0 * fontPx / baseFont;
    var logoW = logoH * aspect;
    var out = [];
    var x = 0, end = 0;
    var run = "", runStart = 0, runIdx = 0;
    items.forEach(function (it) {
      var w, start;
      if (it.type === "char") {
        // Breite über Präfixe messen, damit Kerning erhalten bleibt
        run += it.value;
        var prefix = ctx.measureText(run).width;
        w = ctx.measureText(it.value).width;
        start = runStart + prefix - w + runIdx * spacing;
        runIdx++;
      } else {
        w = it.type === "icon" ? symbolW : it.type === "logo" ? logoW : fontPx * 0.25;
        start = x;
        run = ""; runIdx = 0;
        runStart = start + w + spacing;
      }
      out.push({ item: it, offset: start, width: w, height: it.type === "logo" ? logoH : w });
      end = start + w;
      x = end + spacing;
      if (it.type !== "char") runStart = x;
    });
    return { glyphs: out, total: end, angle: end / r, symbolW: symbolW, logoW: logoW, logoH: logoH };
  }

  /** Misst items mit baseFont; ist der Platz (available, im Maß von key: "angle" oder "total") zu klein, wird verkleinert. */
  function fit(ctx, state, items, baseFont, logoH0, aspect, r, available, key, tolerance) {
    var measure = function (px) { return measureItems(ctx, state, items, px, baseFont, logoH0, aspect, r); };
    var scale = 1;
    var m = measure(baseFont);
    if (items.length && m[key] > available) {
      scale = Math.max(available / m[key], MIN_TEXT_SCALE);
      m = measure(baseFont * scale);
    }
    return { fontPx: baseFont * scale, scale: scale, metrics: m, available: available,
      overflow: items.length > 0 && m[key] > available + tolerance };
  }

  /** Berechnet Ring- und Textgeometrie (wird auch für die Längenwarnung genutzt). */
  function layout(ctx, state, size, logo) {
    var shape = state.shape || "arc";
    var hasLogo = !!logo;
    var R = size / 2;
    var ringW = R * state.ringWidth / 100;
    var rText = R - ringW / 2;
    var arcLen = state.ringLength * DEG;
    var center = Math.PI / 2 + state.ringRotation * DEG; // 90° = unten, positiv = nach links
    var fade = Math.min(state.fade * DEG, arcLen / 2.5);

    var text = prepareText(state);
    var items = buildItems(state, text, hasLogo);
    var baseFont = ringW * state.size / 100;
    // Logohöhe in % der Ringbreite (logoSize), Breite nach Seitenverhältnis; schrumpft mit dem Text
    var logoH0 = ringW * 0.92 * (state.logoSize || 80) / 100;
    var aspect = hasLogo ? logoAspect(logo) : 1;

    if (shape === "badge") return layoutBadge(ctx, state, size, items, baseFont, logoH0, aspect);

    var topText = prepareText(state, state.textTop);
    var topItems = topText ? splitGraphemes(topText).map(function (c) { return { type: "char", value: c }; }) : [];

    // Platz für den Text: beim Bogen der Ring ohne die ausgeblendeten Enden, mit etwas Rand;
    // beim vollen Ring der halbe Umfang (mit Text oben) bzw. fast der ganze Umfang.
    var available = shape === "ring"
      ? (topItems.length ? 170 : 320) * DEG
      : Math.max(arcLen - 2 * fade * 0.85 - 6 * DEG, 10 * DEG);

    var main = fit(ctx, state, items, baseFont, logoH0, aspect, rText, available, "angle", 0.5 * DEG);
    var L = {
      shape: shape, R: R, ringW: ringW, rText: rText, arcLen: arcLen, center: center, fade: fade,
      fontPx: main.fontPx, scale: main.scale, metrics: main.metrics, available: available, overflow: main.overflow,
      top: null
    };

    if (topItems.length) {
      // Text oben: gegenüber der Mitte des Haupttexts, höchstens 150° lang
      var top = fit(ctx, state, topItems, ringW * (state.sizeTop || 60) / 100, logoH0, 1, rText, 150 * DEG, "angle", 0.5 * DEG);
      top.center = center - Math.PI;
      if (shape === "arc") {
        // eigener kurzer Bogen hinter dem Text oben, mit denselben weichen Enden (höchstens 30°)
        var topFade = Math.min(state.fade, 30) * DEG;
        top.arcLen = Math.min(top.metrics.angle + 14 * DEG + 2 * topFade * 0.85, 2 * Math.PI);
        top.fade = Math.min(topFade, top.arcLen / 2.5);
      }
      L.top = top;
    }
    return L;
  }

  /** Badge: abgerundetes Schild unten mittig; Höhe = Ringbreite, Breite nach Inhalt, höchstens so breit wie der Kreis dort. */
  function layoutBadge(ctx, state, size, items, baseFont, logoH0, aspect) {
    var R = size / 2;
    var h = R * state.ringWidth / 100;
    var cy = R + R * 0.58;                     // Mitte des Schilds: 58 % des Radius unter der Bildmitte
    var lower = R * 0.58 + h / 2;              // Abstand der Unterkante von der Bildmitte
    var chord = 2 * Math.sqrt(Math.max(R * R - lower * lower, 0));
    var pad = h * 0.5;
    var maxW = Math.min(chord * 0.94, R * 1.7);
    var available = Math.max(maxW - 2 * pad, h);
    var main = fit(ctx, state, items, baseFont, logoH0, aspect, 1, available, "total", 0.5);
    // Bei Überlänge darf das Schild bis zur Kreisbreite wachsen, damit der (schon verkleinerte) Text darauf bleibt
    var w = Math.min(Math.max(main.metrics.total + 2 * pad, h * 1.6), Math.max(chord, h * 1.6));
    return {
      shape: "badge", R: R, ringW: h, badge: { x: R - w / 2, y: cy - h / 2, w: w, h: h, pad: pad, cy: cy },
      fontPx: main.fontPx, scale: main.scale, metrics: main.metrics, available: available, overflow: main.overflow,
      top: null, empty: !items.length
    };
  }

  function drawPlaceholder(ctx, size) {
    var g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#cfd8e3");
    g.addColorStop(1, "#9aa8b9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.4, size * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.92, size * 0.33, size * 0.3, 0, Math.PI, 0);
    ctx.fill();
  }

  /** Zeichnet das Foto im Kreis mit Zoom und Verschiebung. */
  function drawPhoto(ctx, state, photo, size) {
    if (!photo) { drawPlaceholder(ctx, size); return; }
    var iw = photo.width, ih = photo.height;
    var base = size / Math.min(iw, ih);
    var s = base * state.zoom;
    var dw = iw * s, dh = ih * s;
    var x = size / 2 - dw / 2 + state.offsetX * size;
    var y = size / 2 - dh / 2 + state.offsetY * size;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(photo, x, y, dw, dh);
  }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /** Normiert einen Winkel auf [0, 2π). */
  function norm(a) {
    a = a % (Math.PI * 2);
    return a < 0 ? a + Math.PI * 2 : a;
  }

  /**
   * Zeichnet den Ring. Die weichen Enden werden über einen kegelförmigen Verlauf
   * (Conic Gradient) als Alpha-Maske umgesetzt; ältere Browser fallen auf
   * viele schmale Segmente zurück.
   */
  function drawRing(ctx, state, L, size, reverse) {
    var cx = size / 2, cy = size / 2;
    var a0 = L.center - L.arcLen / 2;
    var a1 = L.center + L.arcLen / 2;
    var rOut = L.R + 1; // leicht überstehend, damit am Rand kein Foto-Saum bleibt
    var rIn = L.R - L.ringW;
    var opacity = state.opacity / 100;
    var frac = L.arcLen / (Math.PI * 2);
    var fadeFrac = L.fade / (Math.PI * 2);

    var layer = document.createElement("canvas");
    layer.width = layer.height = size;
    var lc = layer.getContext("2d");

    lc.beginPath();
    lc.arc(cx, cy, rOut, a0, a1, false);
    lc.arc(cx, cy, rIn, a1, a0, true);
    lc.closePath();

    var hasConic = typeof lc.createConicGradient === "function";

    if (hasConic) {
      // Farbe (einfarbig oder Verlauf entlang des Bogens; Verlauf läuft vom
      // linken Ende über unten zum rechten Ende, also gegen die Zeichenrichtung)
      var fill = lc.createConicGradient(norm(a0), cx, cy);
      if (state.gradient) {
        // reverse: Bogen oben – Farben gespiegelt, damit die Enden zu den Enden des unteren Bogens passen
        var cA = reverse ? state.ringColor : state.ringColor2, cB = reverse ? state.ringColor2 : state.ringColor;
        fill.addColorStop(0, cA);
        fill.addColorStop(frac, cB);
        fill.addColorStop(Math.min(frac + 0.0001, 1), cB);
        fill.addColorStop(1, cA);
      } else {
        fill.addColorStop(0, state.ringColor);
        fill.addColorStop(1, state.ringColor);
      }
      lc.fillStyle = fill;
      lc.fill();

      // Alpha-Maske für weiche Enden
      lc.globalCompositeOperation = "destination-in";
      var mask = lc.createConicGradient(norm(a0), cx, cy);
      if (fadeFrac > 0) {
        mask.addColorStop(0, "rgba(0,0,0,0)");
        // sanfte S-Kurve statt linearem Übergang
        for (var i = 1; i <= 6; i++) {
          var t = i / 6;
          var eased = t * t * (3 - 2 * t);
          mask.addColorStop(fadeFrac * t, "rgba(0,0,0," + (eased * opacity).toFixed(3) + ")");
          mask.addColorStop(frac - fadeFrac * t, "rgba(0,0,0," + (eased * opacity).toFixed(3) + ")");
        }
        mask.addColorStop(frac, "rgba(0,0,0,0)");
      } else {
        mask.addColorStop(0, "rgba(0,0,0," + opacity + ")");
        mask.addColorStop(frac, "rgba(0,0,0," + opacity + ")");
      }
      mask.addColorStop(Math.min(frac + 0.0001, 1), "rgba(0,0,0,0)");
      mask.addColorStop(1, "rgba(0,0,0,0)");
      lc.fillStyle = mask;
      lc.fillRect(0, 0, size, size);
    } else {
      // Fallback ohne Conic Gradient: in Segmenten zeichnen
      var steps = Math.max(60, Math.round(state.ringLength * 1.5));
      var c1 = hexToRgb(state.ringColor), c2 = hexToRgb(state.ringColor2);
      for (var s = 0; s < steps; s++) {
        var ta = s / steps, tb = (s + 1) / steps, tm = (ta + tb) / 2;
        var pos = tm * L.arcLen;
        var alpha = 1;
        if (L.fade > 0) {
          var e = Math.min(pos, L.arcLen - pos) / L.fade;
          if (e < 1) alpha = e * e * (3 - 2 * e);
        }
        var mix = state.gradient ? (reverse ? tm : 1 - tm) : 0;
        var col = [0, 1, 2].map(function (k) { return Math.round(c1[k] + (c2[k] - c1[k]) * mix); });
        var sa = a0 + ta * L.arcLen - 0.002, sb = a0 + tb * L.arcLen + 0.002;
        lc.beginPath();
        lc.arc(cx, cy, rOut, sa, sb, false);
        lc.arc(cx, cy, rIn, sb, sa, true);
        lc.closePath();
        lc.fillStyle = "rgba(" + col.join(",") + "," + (alpha * opacity).toFixed(3) + ")";
        lc.fill();
      }
    }

    ctx.drawImage(layer, 0, 0);
  }

  /** Voller Ring: geschlossen, ohne weiche Enden; Verlauf von unten (Ringfarbe) nach oben (zweite Farbe). */
  function drawFullRing(ctx, state, L, size) {
    var cx = size / 2, cy = size / 2;
    var layer = document.createElement("canvas");
    layer.width = layer.height = size;
    var lc = layer.getContext("2d");
    lc.beginPath();
    lc.arc(cx, cy, L.R + 1, 0, Math.PI * 2, false);
    lc.arc(cx, cy, L.R - L.ringW, Math.PI * 2, 0, true);
    lc.closePath();
    if (state.gradient && typeof lc.createConicGradient === "function") {
      var g = lc.createConicGradient(norm(L.center), cx, cy);
      g.addColorStop(0, state.ringColor);
      g.addColorStop(0.5, state.ringColor2);
      g.addColorStop(1, state.ringColor);
      lc.fillStyle = g;
    } else if (state.gradient) {
      var lg = lc.createLinearGradient(cx + Math.cos(L.center) * L.R, cy + Math.sin(L.center) * L.R, cx - Math.cos(L.center) * L.R, cy - Math.sin(L.center) * L.R);
      lg.addColorStop(0, state.ringColor);
      lg.addColorStop(1, state.ringColor2);
      lc.fillStyle = lg;
    } else {
      lc.fillStyle = state.ringColor;
    }
    lc.fill("evenodd");
    ctx.save();
    ctx.globalAlpha = state.opacity / 100;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  function roundRectPath(c, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /** Badge: Schild in Ringfarbe (Verlauf von links nach rechts), Deckkraft wie beim Ring. */
  function drawBadge(ctx, state, L) {
    if (L.empty) return;
    var b = L.badge;
    ctx.save();
    ctx.globalAlpha = state.opacity / 100;
    if (state.gradient) {
      var g = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      g.addColorStop(0, state.ringColor);
      g.addColorStop(1, state.ringColor2);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = state.ringColor;
    }
    roundRectPath(ctx, b.x, b.y, b.w, b.h, b.h / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIcon(ctx, icon, w, color) {
    var path = PBG.iconPath(icon);
    if (!path) return;
    var s = w / 24;
    ctx.save();
    ctx.scale(s, s);
    ctx.translate(-12, -12);
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

  function drawLogo(ctx, logo, w, h) {
    var iw = logo.naturalWidth || logo.width, ih = logo.naturalHeight || logo.height;
    if (!iw || !ih) return;
    var s = Math.min(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(logo, -dw / 2, -dh / 2, dw, dh);
  }

  function drawGlyph(ctx, state, g, logo, nudge) {
    if (g.item.type === "char") ctx.fillText(g.item.value, 0, nudge);
    else if (g.item.type === "icon") drawIcon(ctx, g.item.icon, g.width * 0.95, state.textColor);
    else if (g.item.type === "logo" && logo) drawLogo(ctx, logo, g.width, g.height);
  }

  /**
   * Setzt Text, Symbole und Logo entlang eines Bogens (aufrecht lesbar).
   * Unten (top = false) läuft die Lesrichtung mit abnehmendem Winkel, oben mit zunehmendem; oben zeigen die
   * Zeichen nach außen, damit der Text nicht auf dem Kopf steht.
   */
  function drawArcText(ctx, state, m, fontPx, rText, textCenter, size, logo, top) {
    if (!m.glyphs.length) return;
    var cx = size / 2, cy = size / 2;
    var startAngle = top ? textCenter - m.angle / 2 : textCenter + m.angle / 2;

    ctx.save();
    ctx.font = fontString(state, fontPx);
    ctx.fillStyle = state.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Großbuchstaben optisch mittig setzen: "middle" sitzt etwas zu tief
    var nudge = state.uppercase ? fontPx * 0.04 : 0;

    m.glyphs.forEach(function (g) {
      if (g.item.type === "gap") return;
      var mid = g.offset + g.width / 2;
      var theta = top ? startAngle + mid / rText : startAngle - mid / rText;
      ctx.save();
      ctx.translate(cx + rText * Math.cos(theta), cy + rText * Math.sin(theta));
      ctx.rotate(top ? theta + Math.PI / 2 : theta - Math.PI / 2);
      drawGlyph(ctx, state, g, logo, nudge);
      ctx.restore();
    });
    ctx.restore();
  }

  /** Text im Badge: gerade, mittig im Schild. */
  function drawBadgeText(ctx, state, L, logo) {
    var m = L.metrics;
    if (!m.glyphs.length) return;
    var b = L.badge;
    var x0 = b.x + (b.w - m.total) / 2;
    ctx.save();
    ctx.font = fontString(state, L.fontPx);
    ctx.fillStyle = state.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var nudge = state.uppercase ? L.fontPx * 0.04 : 0;
    m.glyphs.forEach(function (g) {
      if (g.item.type === "gap") return;
      ctx.save();
      ctx.translate(x0 + g.offset + g.width / 2, b.cy);
      drawGlyph(ctx, state, g, logo, nudge);
      ctx.restore();
    });
    ctx.restore();
  }

  /** Zeichnet Form und Texte entsprechend state.shape. */
  function drawFrame(ctx, state, L, size, logo) {
    if (L.shape === "badge") {
      drawBadge(ctx, state, L);
      drawBadgeText(ctx, state, L, logo);
      return;
    }
    if (L.shape === "ring") drawFullRing(ctx, state, L, size);
    else {
      drawRing(ctx, state, L, size);
      if (L.top) drawRing(ctx, state, { R: L.R, ringW: L.ringW, center: L.top.center, arcLen: L.top.arcLen, fade: L.top.fade }, size, true);
    }
    drawArcText(ctx, state, L.metrics, L.fontPx, L.rText, L.center + state.textPos * DEG, size, logo, false);
    if (L.top) drawArcText(ctx, state, L.top.metrics, L.top.fontPx, L.rText, L.top.center, size, null, true);
  }

  /**
   * Hauptfunktion. Gibt Infos zur Textskalierung zurück (für Warnhinweise).
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} state  Einstellungen inkl. zoom/offsetX/offsetY
   * @param {CanvasImageSource|null} photo
   * @param {number} size   Kantenlänge in Gerätepixeln
   * @param {{background?: string, logo?: CanvasImageSource}} opts
   */
  PBG.render = function (ctx, state, photo, size, opts) {
    opts = opts || {};
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (opts.background && opts.background !== "transparent") {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, size, size);
    }

    // Foto + Ring auf eigener Ebene, dann rund ausschneiden
    var layer = document.createElement("canvas");
    layer.width = layer.height = size;
    var lc = layer.getContext("2d");
    drawPhoto(lc, state, photo, size);
    var L = layout(lc, state, size, opts.logo || null);
    drawFrame(lc, state, L, size, opts.logo);

    lc.globalCompositeOperation = "destination-in";
    lc.beginPath();
    lc.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    lc.fillStyle = "#000";
    lc.fill();

    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    return {
      scale: L.scale, overflow: L.overflow,
      topScale: L.top ? L.top.scale : 1, topOverflow: !!(L.top && L.top.overflow)
    };
  };

  PBG.text = { hasEmoji: hasEmoji, stripEmoji: stripEmoji };
})();
