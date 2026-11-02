/*
 * Inhalte der Startseite je Sprache: Title, Description, H1, Einleitung, Text-Ideen, FAQ (inkl. strukturierter Daten),
 * OG-Texte und die Texte von Header, Footer und Hinweisen (ui).
 * Texte frei anpassbar – die Seiten werden mit `npm run build` neu erzeugt. {app} wird durch den App-Namen ersetzt.
 *
 * Neue Sprache: Eintrag in `locales` ergänzen (gleiche Schlüssel wie "de"), Editor-Texte in public/js/i18n.js,
 * Vorlagen-Texte in public/js/presets.js. Deutsch liegt unter /, jede weitere Sprache unter /<code>/.
 */

export const locales = {
  de: {
    lang: "de",
    path: "/",
    ogLocale: "de_DE",
    og: "/img/og/home.jpg",
    preset: "jobsuche",
    title: "Profilbild-Rahmen mit eigenem Text und Logo – kostenlos",
    description: "Runder Profilbild-Rahmen mit deinem eigenen Text, Logo, Farben und Schrift. Komplett kostenlos, ohne Anmeldung – dein Foto bleibt im Browser.",
    h1: "Profilbild-Rahmen mit eigenem Text",
    lead: "Gestalte in einer Minute einen runden Rahmen für dein Profilbild – mit deinem eigenen Text, deinem Logo, deinen Farben und deiner Schrift. Komplett kostenlos und ohne Anmeldung.",
    /** Texte im OG-Bild (scripts/render-images.mjs) */
    ogImage: { subtitle: "Eigener Text · Logo · Komplett kostenlos", badge: "Dein Foto bleibt im Browser" },

    /** Text-Ideen: preset = Vorlage, die der Button „Vorlage übernehmen“ in den Editor lädt. */
    ideas: [
      {
        title: "Jobsuche",
        preset: "jobsuche",
        text: "Sag Recruiter:innen auf den ersten Blick, was du suchst. Kurze Texte mit 10–20 Zeichen bleiben auch klein gut lesbar.",
        examples: ["Bereit für Neues", "Suche Junior-Marketing-Job", "Verfügbar ab 1. Juni"]
      },
      {
        title: "Recruiting",
        preset: "recruiting",
        text: "Jedes Profilbild in Kommentaren und Nachrichten wird zur kleinen Stellenanzeige. Schreib konkret, wen ihr sucht.",
        examples: ["Wir suchen dich", "Wir suchen Pflegekräfte", "Jetzt bewerben · Berlin"]
      },
      {
        title: "Selbstständige",
        preset: "freelancer",
        text: "Zeig, was du anbietest und ob du Kapazität hast. Ändert sich deine Auslastung, passt du den Text in Sekunden an.",
        examples: ["Verfügbar für Projekte", "Freelance Designerin", "Steuerberatung für Kreative"]
      },
      {
        title: "Firmen und Teams",
        preset: "team-gesucht",
        text: "Mit eurem Logo und euren Farben sehen alle Profilbilder einheitlich aus. Speichert das Design als eigene Vorlage und gebt die Datei im Team weiter.",
        examples: ["Komm in unser Team", "Logo statt Text", "Wir sind dabei: Messe 2027"]
      }
    ],

    faq: [
      ["Ist {app} wirklich kostenlos?", "Ja, komplett. Alle Vorlagen, Schriften, Farbverläufe, Symbole, das eigene Logo und der Export bis 2048 × 2048 Pixel stehen allen zur Verfügung – ohne Anmeldung, ohne Abo und ohne versteckte Kosten."],
      ["Werden mein Foto oder mein Logo hochgeladen?", "Nein. Foto und Logo verlassen nie deinen Browser. Das Bild wird direkt auf deinem Gerät berechnet – es gibt keinen Upload, keine Speicherung auf einem Server und kein Konto."],
      ["Wie nutze ich das Bild als Profilbild?", "Lade das PNG herunter und lade es in deinem Netzwerk oder Messenger als neues Profilbild hoch. Die meisten Plattformen schneiden das Bild automatisch rund zu – der Rahmen sitzt dann genau am Rand."],
      ["Was schreibe ich auf den Rahmen?", "Bewährt haben sich kurze, konkrete Texte: deine Wunschrolle („Suche UX-Job“), deine Verfügbarkeit („Ab sofort verfügbar“), wen ihr sucht („Wir suchen Pflegekräfte“) oder dein Angebot. Bis zu 60 Zeichen sind möglich; ist der Text zu lang, wird er automatisch verkleinert."],
      ["Kann ich unser Firmenlogo einbinden?", "Ja. Lade dein Logo als PNG, JPG, WebP oder SVG hoch und setze es links oder rechts vom Text oder statt des Texts auf den Ring. Am besten wirkt ein Logo mit transparentem Hintergrund."],
      ["Kann das ganze Team denselben Rahmen nutzen?", "Ja. Speichere das Design als eigene Vorlage und exportiere sie als Datei. Kolleg:innen importieren die Datei, laden ihr eigenes Foto und erhalten denselben Rahmen – inklusive Logo."],
      ["Funktioniert das auch auf dem Handy?", "Ja. Der Editor läuft in jedem aktuellen Browser auf iPhone, Android, Mac und PC. Auf dem Handy kannst du das Bild direkt über „Bild teilen“ weitergeben."],
      ["Gehört {app} zu einem sozialen Netzwerk?", "Nein, {app} ist ein unabhängiges Werkzeug."]
    ],

    /** Strukturierte Daten (WebApplication) */
    app: {
      operatingSystem: "Alle (Webbrowser)",
      browserRequirements: "Benötigt JavaScript und einen aktuellen Browser",
      offer: "Kostenlos",
      features: ["Eigener Text auf dem Profilbild-Ring", "Eigenes Logo auf dem Ring", "Farben, Farbverläufe und Schriftarten frei wählbar", "Eigene Vorlagen speichern und weitergeben", "PNG-Export bis 2048 × 2048 px", "Fotos und Logos bleiben im Browser"]
    },

    ui: {
      quote: ["„", "“"],
      home: "Startseite",
      skip: "Zu den Einstellungen springen",
      language: "Sprache",
      theme: "Farbschema", themeAuto: "System", themeLight: "Hell", themeDark: "Dunkel",
      privacyBadge: "Deine Fotos verlassen nie deinen Browser.",
      privacyText: "Fotos und Logos werden direkt auf deinem Gerät verarbeitet – kein Upload, kein Konto, keine Cookies.",
      trust: ["Komplett kostenlos", "Ohne Anmeldung", "Kein Foto-Upload", "PNG bis 2048 px"],
      ideasHeading: "Ideen für deinen Text",
      applyPreset: "Vorlage übernehmen",
      faqHeading: "Häufige Fragen",
      legalNav: "Rechtliches",
      imprint: "Impressum",
      privacy: "Datenschutz",
      /** Unabhängigkeitshinweis – einzige erlaubte Nennung sozialer Netzwerke (siehe scripts/check-dist.mjs). */
      independence: "{app} ist ein unabhängiges Angebot. Es steht in keiner Verbindung zu LinkedIn, XING oder anderen sozialen Netzwerken und wird von ihnen weder betrieben noch unterstützt. LinkedIn und XING sind Marken ihrer jeweiligen Inhaber."
    }
  },

  en: {
    lang: "en",
    path: "/en/",
    ogLocale: "en_GB",
    og: "/img/og/home-en.jpg",
    preset: "jobsuche",
    title: "Free profile picture frame with your own text and logo",
    description: "Add a round frame to your profile picture with your own text, logo, colours and font. Completely free, no sign-up – your photo never leaves your browser.",
    h1: "Profile picture frame with your own text",
    lead: "Design a round frame for your profile picture in a minute – with your own words, your logo, your colours and your font. Completely free, no sign-up needed.",
    ogImage: { subtitle: "Your text · Your logo · Completely free", badge: "Your photo stays in your browser" },

    ideas: [
      {
        title: "Job search",
        preset: "jobsuche",
        text: "Let recruiters see at a glance what you're after. Short phrases of 10–20 characters stay readable even at thumbnail size.",
        examples: ["Ready for new roles", "Seeking junior marketing role", "Available from 1 June"]
      },
      {
        title: "Recruiting",
        preset: "recruiting",
        text: "Every time your photo shows up in comments and messages, it doubles as a tiny job ad. Be specific about who you need.",
        examples: ["We're looking for you", "Nurses wanted", "Apply now · London"]
      },
      {
        title: "Freelancers",
        preset: "freelancer",
        text: "Show what you offer and whether you have capacity. When your workload changes, update the text in seconds.",
        examples: ["Available for projects", "Freelance designer", "Bookkeeping for creatives"]
      },
      {
        title: "Companies and teams",
        preset: "team-gesucht",
        text: "With your logo and brand colours, everyone's profile picture looks consistent. Save the design as your own template and share the file with your team.",
        examples: ["Join our team", "Logo instead of text", "See you at Expo 2027"]
      }
    ],

    faq: [
      ["Is {app} really free?", "Yes, completely. Every template, font, gradient and symbol, your own logo and exports up to 2048 × 2048 pixels are available to everyone – no sign-up, no subscription, no hidden costs."],
      ["Are my photo or logo uploaded?", "No. Your photo and logo never leave your browser. The image is rendered right on your device – there is no upload, no server storage and no account."],
      ["How do I use the image as my profile picture?", "Download the PNG and upload it as your new profile picture on your network or messaging app. Most platforms crop it to a circle automatically, so the frame sits right at the edge."],
      ["What should I write on the frame?", "Short, specific phrases work best: the role you want (“Seeking UX role”), your availability (“Available now”), who you're looking for (“Nurses wanted”) or what you offer. Up to 60 characters fit; if the text is too long, it shrinks automatically."],
      ["Can I add our company logo?", "Yes. Upload your logo as PNG, JPG, WebP or SVG and place it to the left or right of the text, or instead of the text. A logo with a transparent background looks best."],
      ["Can the whole team use the same frame?", "Yes. Save the design as your own template and export it as a file. Colleagues import the file, add their own photo and get the exact same frame – logo included."],
      ["Does it work on my phone?", "Yes. The editor runs in any up-to-date browser on iPhone, Android, Mac and PC. On your phone you can pass the image on straight away with “Share image”."],
      ["Is {app} part of a social network?", "No, {app} is an independent tool."]
    ],

    app: {
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and an up-to-date browser",
      offer: "Free",
      features: ["Your own text on the profile picture ring", "Your own logo on the ring", "Free choice of colours, gradients and fonts", "Save and share your own templates", "PNG export up to 2048 × 2048 px", "Photos and logos stay in your browser"]
    },

    ui: {
      quote: ["“", "”"],
      home: "Home",
      skip: "Skip to settings",
      language: "Language",
      theme: "Colour scheme", themeAuto: "System", themeLight: "Light", themeDark: "Dark",
      privacyBadge: "Your photos never leave your browser.",
      privacyText: "Photos and logos are processed right on your device – no upload, no account, no cookies.",
      trust: ["Completely free", "No sign-up", "No photo upload", "PNG up to 2048 px"],
      ideasHeading: "Ideas for your text",
      applyPreset: "Use this template",
      faqHeading: "Frequently asked questions",
      legalNav: "Legal",
      imprint: "Legal notice (in German)",
      privacy: "Privacy policy (in German)",
      independence: "{app} is an independent service. It is not affiliated with, operated or endorsed by LinkedIn, XING or any other social network. LinkedIn and XING are trademarks of their respective owners."
    }
  }
};

/** Reihenfolge der Sprachen (Umschalter, hreflang, Sitemap). Die erste ist die Standardsprache (x-default). */
export const languages = Object.keys(locales);

/** Deutsche Startseite – für Skripte, die nur eine Sprache brauchen. */
export const home = locales.de;
