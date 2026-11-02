/*
 * Gemeinsame Hilfsfunktionen für Rahmen- und Banner-Editor (beide Seiten laden diese Datei).
 * Farben und Kontrast, Hex-Codes, Base64url, Dialoge, Statusmeldungen, Datei-Download, Logo laden.
 * Logos und Bilder werden nur im Browser verarbeitet.
 */
window.PBG = window.PBG || {};

(function () {
  "use strict";

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /** Farbe für Canvas und Kontrastberechnung. */
  PBG.color = { hexToRgb: hexToRgb, rgba: rgba };

  var LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/]+={0,2}$/;

  PBG.util = {
    clamp: function (v, min, max) { return Math.min(max, Math.max(min, v)); },

    /** „#abc“, „abc“, „#AABBCC“ → „#aabbcc“; sonst null. */
    normalizeHex: function (v) {
      v = String(v || "").trim().replace(/^#/, "");
      if (/^[0-9a-f]{3}$/i.test(v)) v = v.replace(/(.)/g, "$1$1");
      return /^[0-9a-f]{6}$/i.test(v) ? "#" + v.toLowerCase() : null;
    },

    luminance: function (hex) {
      return hexToRgb(hex).reduce(function (sum, c, i) {
        c /= 255;
        c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return sum + c * [0.2126, 0.7152, 0.0722][i];
      }, 0);
    },

    contrast: function (a, b) {
      var la = PBG.util.luminance(a), lb = PBG.util.luminance(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    },

    isHex: function (v) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v); },

    setStatus: function (el, msg, isError) {
      if (!el) return;
      el.textContent = msg || "";
      el.classList.toggle("error", !!isError);
    },

    showDialog: function (d) {
      if (d.showModal) { if (!d.open) d.showModal(); }
      else d.setAttribute("open", "");
    },

    closeDialog: function (d) {
      if (d.close) d.close(); else d.removeAttribute("open");
    },

    base64urlEncode: function (str) {
      var bytes = new TextEncoder().encode(str);
      var bin = "";
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },

    /** Wirft bei ungültigen Zeichen, kaputtem Base64 oder ungültigem UTF-8. */
    base64urlDecode: function (s) {
      if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("chars");
      var b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    },

    /** Adresse eines Werkzeugs in der aktuellen Sprache: tool = "frame" (Startseite) oder "banner". */
    toolUrl: function (tool) {
      return PBG.url((PBG.lang === "en" ? "/en" : "") + (tool === "banner" ? "/banner/" : "/"));
    },

    newId: function () {
      return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    slug: function (name) {
      return (String(name).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).slice(0, 40);
    },

    /** Lädt einen Blob als Datei herunter. */
    download: function (blob, name) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    },

    /** Logo als PNG/JPEG/WebP-Data-URL in erlaubter Länge? */
    validLogoDataUrl: function (v, maxLen) {
      return typeof v === "string" && v.length <= maxLen && LOGO_DATA_URL.test(v);
    },

    isLogoFile: function (file) {
      return /^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || /\.(png|jpe?g|webp|svg)$/i.test(file.name || "");
    },

    isSvgFile: function (file) {
      return file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
    },

    /** Blob → dekodiertes Bild. */
    decodeImage: function (blob) {
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
    },

    /** Data-URL → dekodiertes Bild. */
    loadDataUrl: function (url) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("logo")); };
        img.src = url;
      });
    },

    /**
     * Zeichnet ein Bild auf einen Canvas mit höchstens maxSide px. SVGs (upscale = true) werden auf diese Größe gerastert,
     * Pixelbilder nie vergrößert.
     */
    toCanvas: function (img, maxSide, upscale) {
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      if (!w || !h) { w = h = maxSide; } // SVG ohne eigene Größe
      var scale = maxSide / Math.max(w, h);
      if (!upscale) scale = Math.min(1, scale);
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * scale));
      c.height = Math.max(1, Math.round(h * scale));
      var ctx = c.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c;
    },

    /**
     * Lädt eine Logo-Datei (PNG, JPG, WebP, SVG) und gibt einen Canvas mit höchstens maxSide px zurück.
     * Fehler: "type" (kein Logo-Format), "size" (zu groß), "decode" (nicht lesbar oder nicht exportierbar).
     */
    loadLogoFile: function (file, maxSide, maxMB) {
      if (!PBG.util.isLogoFile(file)) return Promise.reject(new Error("type"));
      if (file.size > maxMB * 1024 * 1024) return Promise.reject(new Error("size"));
      var svg = PBG.util.isSvgFile(file);
      // SVG ausdrücklich als image/svg+xml laden, sonst zeigen manche Browser es nicht an
      var blob = svg && file.type !== "image/svg+xml" ? new Blob([file], { type: "image/svg+xml" }) : file;
      return PBG.util.decodeImage(blob).then(function (img) {
        var c = PBG.util.toCanvas(img, maxSide, svg);
        c.toDataURL("image/png");   // wirft bei „verunreinigtem“ Canvas – dann wäre auch der Export kaputt
        return c;
      }, function () { throw new Error("decode"); });
    }
  };
})();
