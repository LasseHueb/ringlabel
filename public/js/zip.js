/*
 * Minimaler ZIP-Schreiber ohne Abhängigkeiten (für „Mehrere Fotos“).
 * Methode „stored“ (0, unkomprimiert – PNGs sind bereits komprimiert), CRC32, Dateinamen in UTF-8 mit
 * gesetztem Flag-Bit 11 (Language encoding flag), damit Umlaute unter macOS und Windows richtig ankommen.
 * Die Dateiinhalte bleiben Blobs; zusammengesetzt wird erst am Ende (der Browser muss nicht alles im JS-Speicher halten).
 * Grenzen: höchstens 65 535 Dateien und 4 GB (kein ZIP64) – für bis zu 30 PNGs mehr als genug.
 */
window.PBG = window.PBG || {};

(function () {
  "use strict";

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  /** Datum/Uhrzeit im DOS-Format (lokale Zeit, 2-Sekunden-Auflösung). */
  function dosDateTime(d) {
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
    var date = (Math.max(d.getFullYear() - 1980, 0) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time: time, date: date };
  }

  function Writer() {
    this.parts = [];     // Uint8Array (Kopfdaten) und Blob (Dateiinhalte)
    this.central = [];
    this.offset = 0;
    this.count = 0;
    this.names = {};
  }

  /**
   * Fügt eine Datei hinzu. name: Pfad im ZIP (UTF-8), blob: Inhalt. Liefert ein Promise, weil für die CRC der
   * Inhalt einmal gelesen werden muss; die gelesenen Bytes werden danach nicht weiter gehalten.
   */
  Writer.prototype.add = function (name, blob, date) {
    var self = this;
    if (self.names[name]) return Promise.reject(new Error("Doppelter Dateiname: " + name));
    self.names[name] = true;
    return blob.arrayBuffer().then(function (buf) {
      var data = new Uint8Array(buf);
      var crc = crc32(data);
      var size = data.length;
      data = null;
      if (self.offset + size > 0xfffffff0 || self.count >= 0xffff) throw new Error("ZIP zu groß");
      var nameBytes = new TextEncoder().encode(name);
      var dt = dosDateTime(date || new Date());

      var local = new Uint8Array(30 + nameBytes.length);
      var v = new DataView(local.buffer);
      v.setUint32(0, 0x04034b50, true);      // Local file header
      v.setUint16(4, 20, true);              // benötigte Version 2.0
      v.setUint16(6, 0x0800, true);          // Flag-Bit 11: Dateiname in UTF-8
      v.setUint16(8, 0, true);               // Methode 0 = stored
      v.setUint16(10, dt.time, true);
      v.setUint16(12, dt.date, true);
      v.setUint32(14, crc, true);
      v.setUint32(18, size, true);           // komprimierte Größe
      v.setUint32(22, size, true);           // Originalgröße
      v.setUint16(26, nameBytes.length, true);
      v.setUint16(28, 0, true);              // keine Zusatzfelder
      local.set(nameBytes, 30);

      var cen = new Uint8Array(46 + nameBytes.length);
      var c = new DataView(cen.buffer);
      c.setUint32(0, 0x02014b50, true);      // Central directory header
      c.setUint16(4, 0x0314, true);          // erstellt mit: Version 2.0, Unix (für Dateirechte)
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, dt.time, true);
      c.setUint16(14, dt.date, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, size, true);
      c.setUint32(24, size, true);
      c.setUint16(28, nameBytes.length, true);
      c.setUint16(30, 0, true);              // Zusatzfelder
      c.setUint16(32, 0, true);              // Kommentar
      c.setUint16(34, 0, true);              // Disk
      c.setUint16(36, 0, true);              // interne Attribute
      c.setUint32(38, (0x81a4 << 16) >>> 0, true); // externe Attribute: normale Datei, rw-r--r--
      c.setUint32(42, self.offset, true);    // Position des Local headers
      cen.set(nameBytes, 46);

      self.parts.push(local, blob);
      self.central.push(cen);
      self.offset += local.length + size;
      self.count++;
    });
  };

  /** Schließt das Archiv ab und liefert es als Blob (application/zip). */
  Writer.prototype.finish = function () {
    var cdSize = this.central.reduce(function (n, c) { return n + c.length; }, 0);
    var end = new Uint8Array(22);
    var v = new DataView(end.buffer);
    v.setUint32(0, 0x06054b50, true);        // End of central directory
    v.setUint16(4, 0, true);
    v.setUint16(6, 0, true);
    v.setUint16(8, this.count, true);
    v.setUint16(10, this.count, true);
    v.setUint32(12, cdSize, true);
    v.setUint32(16, this.offset, true);
    v.setUint16(20, 0, true);
    var blob = new Blob(this.parts.concat(this.central, [end]), { type: "application/zip" });
    this.parts = this.central = [];
    return blob;
  };

  PBG.zip = { Writer: Writer, crc32: crc32 };
})();
