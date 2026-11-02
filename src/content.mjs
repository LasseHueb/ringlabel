/*
 * Inhalte der Startseite je Sprache: Title, Description, H1, Einleitung, Text-Ideen, FAQ (inkl. strukturierter Daten),
 * OG-Texte und die Texte von Header, Footer und Hinweisen (ui).
 * Texte frei anpassbar – die Seiten werden mit `npm run build` neu erzeugt. {app} wird durch den App-Namen ersetzt.
 *
 * Neue Sprache: Eintrag in `locales` ergänzen (gleiche Schlüssel wie "de"), Editor-Texte in public/js/i18n.js,
 * Vorlagen-Texte in public/js/presets.js. Deutsch liegt unter /, jede weitere Sprache unter /<code>/.
 */

/** Aktuelles Jahr beim Build (Beispiel „Azubi seit …“ in den Text-Ideen; im Editor setzt der Browser das Jahr selbst ein). */
const year = new Date().getFullYear();

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
      },
      {
        title: "Anlässe",
        preset: "@anlass",
        text: "Von Weihnachten über den Ausbildungsstart bis zur Sommerpause: Passende Vorlagen erscheinen im Editor zur richtigen Zeit oben unter „Gerade passend“.",
        examples: ["Frohe Weihnachten", `Azubi seit ${year}`, "Gerade im Urlaub"]
      }
    ],

    faq: [
      ["Ist {app} wirklich kostenlos?", "Ja, komplett. Alle Vorlagen, Schriften, Farbverläufe, Symbole, das eigene Logo und der Export bis 2048 × 2048 Pixel stehen allen zur Verfügung – ohne Anmeldung, ohne Abo und ohne versteckte Kosten."],
      ["Werden mein Foto oder mein Logo hochgeladen?", "Nein. Foto und Logo verlassen nie deinen Browser. Das Bild wird direkt auf deinem Gerät berechnet – es gibt keinen Upload, keine Speicherung auf einem Server und kein Konto."],
      ["Wie nutze ich das Bild als Profilbild?", "Lade das PNG herunter und lade es in deinem Netzwerk oder Messenger als neues Profilbild hoch. Die meisten Plattformen schneiden das Bild automatisch rund zu – der Rahmen sitzt dann genau am Rand."],
      ["Was schreibe ich auf den Rahmen?", "Bewährt haben sich kurze, konkrete Texte: deine Wunschrolle („Suche UX-Job“), deine Verfügbarkeit („Ab sofort verfügbar“), wen ihr sucht („Wir suchen Pflegekräfte“) oder dein Angebot. Bis zu 60 Zeichen sind möglich; ist der Text zu lang, wird er automatisch verkleinert."],
      ["Kann ich unser Firmenlogo einbinden?", "Ja. Lade dein Logo als PNG, JPG, WebP oder SVG hoch und setze es links oder rechts vom Text oder statt des Texts auf den Ring. Am besten wirkt ein Logo mit transparentem Hintergrund."],
      ["Kann das ganze Team denselben Rahmen nutzen?", "Ja. Speichere das Design als eigene Vorlage und exportiere sie als Datei. Kolleg:innen importieren die Datei, laden ihr eigenes Foto und erhalten denselben Rahmen – inklusive Logo. Oder du erledigst es für alle: Unter <a href=\"#mehrere-fotos\">Mehrere Fotos</a> wendest du das Design auf bis zu 30 Team-Fotos auf einmal an, auf Wunsch mit eigenem Text pro Foto (zum Beispiel dem Namen), und lädst alle Bilder als ZIP herunter. Auch dabei bleiben die Fotos in deinem Browser."],
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


    /** Banner-Seite (/banner/): eigenes Werkzeug mit eigenen Texten, FAQ und OG-Bild. */
    bannerPage: {
      path: "/banner/",
      og: "/img/og/banner.jpg",
      title: "Profil-Banner mit eigenem Text und Logo erstellen – kostenlos",
      description: "Breites Profil-Banner in 4:1, 3:1 oder 16:9 gestalten: eigener Text, Logo, Farben, Muster oder Hintergrundbild. Kostenlos, ohne Anmeldung – alles bleibt im Browser.",
      h1: "Profil-Banner erstellen",
      lead: "Gestalte ein breites Banner für dein Profil – mit Überschrift, Unterzeile, Kontaktzeile, Logo, Farben, Muster oder eigenem Bild. Der Bereich, den dein Profilbild verdecken kann, ist markiert. Komplett kostenlos und ohne Anmeldung.",
      ogImage: { subtitle: "Eigener Text · Logo · 3 Formate · kostenlos", badge: "Logo und Bilder bleiben im Browser" },
      trust: ["Komplett kostenlos", "Ohne Anmeldung", "Kein Upload", "4:1 · 3:1 · 16:9"],
      privacyBadge: "Deine Logos und Bilder verlassen nie deinen Browser.",
      privacyText: "Logos und Hintergrundbilder werden direkt auf deinem Gerät verarbeitet – kein Upload, kein Konto, keine Cookies.",
      faq: [
        ["Ist der Banner-Editor kostenlos?", "Ja, komplett. Alle Formate, Vorlagen, Muster, das eigene Logo und der Download in voller Größe stehen allen zur Verfügung – ohne Anmeldung und ohne versteckte Kosten."],
        ["Welche Formate gibt es?", "Breit 4:1 (1584 × 396 px), breit 3:1 (1500 × 500 px) und 16:9 (1920 × 1080 px). Du kannst das Format jederzeit wechseln; Texte und Einstellungen bleiben erhalten."],
        ["Was bedeutet der schraffierte Bereich unten links?", "Dort kann dein Profilbild das Banner überdecken. Text und Logo weichen ihm aus; die Markierung erscheint nur in der Vorschau und nicht im Download."],
        ["Werden mein Logo und mein Hintergrundbild hochgeladen?", "Nein. Beides wird nur in deinem Browser verarbeitet. Ein Hintergrundbild wird nie gespeichert, ein Logo nur, wenn du selbst eine eigene Vorlage auf diesem Gerät sicherst – und beides kommt nie in einen geteilten Link."],
        ["Passt das Banner zu meinem Profilbild-Rahmen?", "Ja. Mit „Farben aus einer Rahmen-Vorlage übernehmen“ nimmst du Farben, Verlauf und Schrift einer Rahmen-Vorlage oder einer deiner eigenen Rahmen-Vorlagen. Den Rahmen selbst gestaltest du im <a href=\"{base}/\">Rahmen-Editor</a>."],
        ["Kann ich ein transparentes Banner erstellen?", "Ja. Mit der Hintergrundfarbe „Transparent“ entsteht ein PNG mit durchsichtigem Hintergrund. Viele Plattformen füllen transparente Flächen allerdings mit Schwarz oder Weiß – prüfe das Ergebnis vor dem Hochladen."]
      ],
      app: {
        features: ["Profil-Banner in 4:1, 3:1 und 16:9", "Überschrift, Unterzeile und Zusatzzeile mit Symbol", "Eigene Farben, Verläufe, Muster oder Hintergrundbild", "Eigenes Logo mit freier Position", "Banner-Vorlagen und eigene Vorlagen", "Logos und Bilder bleiben im Browser"]
      }
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
      navLabel: "Werkzeuge",
      navFrame: "Profilbild-Rahmen", navFrameShort: "Rahmen",
      navBanner: "Profil-Banner", navBannerShort: "Banner",
      crossToBanner: { text: "Passend dazu:", link: "Profil-Banner erstellen", hint: "Breites Banner in 4:1, 3:1 oder 16:9 – mit Farben und Schrift aus deinen Rahmen-Vorlagen." },
      crossToFrame: { text: "Passend dazu:", link: "Profilbild-Rahmen erstellen", hint: "Runder Rahmen mit eigenem Text und Logo für dein Profilbild." },
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
      },
      {
        title: "Occasions",
        preset: "@anlass",
        text: "From Christmas to starting an apprenticeship to the summer break: matching templates appear in the editor at the right time, at the top under “Right now”.",
        examples: ["Merry Christmas", `Apprentice since ${year}`, "Currently on holiday"]
      }
    ],

    faq: [
      ["Is {app} really free?", "Yes, completely. Every template, font, gradient and symbol, your own logo and exports up to 2048 × 2048 pixels are available to everyone – no sign-up, no subscription, no hidden costs."],
      ["Are my photo or logo uploaded?", "No. Your photo and logo never leave your browser. The image is rendered right on your device – there is no upload, no server storage and no account."],
      ["How do I use the image as my profile picture?", "Download the PNG and upload it as your new profile picture on your network or messaging app. Most platforms crop it to a circle automatically, so the frame sits right at the edge."],
      ["What should I write on the frame?", "Short, specific phrases work best: the role you want (“Seeking UX role”), your availability (“Available now”), who you're looking for (“Nurses wanted”) or what you offer. Up to 60 characters fit; if the text is too long, it shrinks automatically."],
      ["Can I add our company logo?", "Yes. Upload your logo as PNG, JPG, WebP or SVG and place it to the left or right of the text, or instead of the text. A logo with a transparent background looks best."],
      ["Can the whole team use the same frame?", "Yes. Save the design as your own template and export it as a file. Colleagues import the file, add their own photo and get the exact same frame – logo included. Or do it for everyone: under <a href=\"#mehrere-fotos\">Multiple photos</a> you can apply the design to up to 30 team photos at once, with optional text per photo (such as a name), and download all images as a ZIP. The photos stay in your browser here too."],
      ["Does it work on my phone?", "Yes. The editor runs in any up-to-date browser on iPhone, Android, Mac and PC. On your phone you can pass the image on straight away with “Share image”."],
      ["Is {app} part of a social network?", "No, {app} is an independent tool."]
    ],

    app: {
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and an up-to-date browser",
      offer: "Free",
      features: ["Your own text on the profile picture ring", "Your own logo on the ring", "Free choice of colours, gradients and fonts", "Save and share your own templates", "PNG export up to 2048 × 2048 px", "Photos and logos stay in your browser"]
    },


    bannerPage: {
      path: "/en/banner/",
      og: "/img/og/banner-en.jpg",
      title: "Free profile banner maker with your own text and logo",
      description: "Design a wide profile banner in 4:1, 3:1 or 16:9 with your own text, logo, colours, pattern or background image. Free, no sign-up – everything stays in your browser.",
      h1: "Create a profile banner",
      lead: "Design a wide banner for your profile – with a heading, subheading, contact line, logo, colours, a pattern or your own image. The area your profile picture may cover is marked. Completely free, no sign-up needed.",
      ogImage: { subtitle: "Your text · Your logo · 3 formats · free", badge: "Logos and images stay in your browser" },
      trust: ["Completely free", "No sign-up", "No upload", "4:1 · 3:1 · 16:9"],
      privacyBadge: "Your logos and images never leave your browser.",
      privacyText: "Logos and background images are processed right on your device – no upload, no account, no cookies.",
      faq: [
        ["Is the banner maker free?", "Yes, completely. Every format, template and pattern, your own logo and full-size downloads are available to everyone – no sign-up, no hidden costs."],
        ["Which formats are available?", "Wide 4:1 (1584 × 396 px), wide 3:1 (1500 × 500 px) and 16:9 (1920 × 1080 px). You can switch formats at any time; your text and settings are kept."],
        ["What is the hatched area at the bottom left?", "That's where your profile picture may cover the banner. Text and logo move out of its way; the marking only appears in the preview, never in the download."],
        ["Are my logo and background image uploaded?", "No. Both are processed only in your browser. A background image is never stored, a logo only if you save your own template on this device yourself – and neither ever ends up in a shared link."],
        ["Does the banner match my profile picture frame?", "Yes. With “Use colours from a frame template” you take the colours, gradient and font of a frame template or one of your own frame templates. You design the frame itself in the <a href=\"{base}/en/\">frame editor</a>."],
        ["Can I create a transparent banner?", "Yes. With the background colour “Transparent” you get a PNG with a see-through background. Many platforms fill transparent areas with black or white, though – check the result before uploading."]
      ],
      app: {
        features: ["Profile banner in 4:1, 3:1 and 16:9", "Heading, subheading and extra line with symbol", "Own colours, gradients, patterns or background image", "Your own logo, freely positioned", "Banner templates and your own templates", "Logos and images stay in your browser"]
      }
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
      navLabel: "Tools",
      navFrame: "Profile picture frame", navFrameShort: "Frame",
      navBanner: "Profile banner", navBannerShort: "Banner",
      crossToBanner: { text: "To go with it:", link: "Create a profile banner", hint: "Wide banner in 4:1, 3:1 or 16:9 – with colours and fonts from your frame templates." },
      crossToFrame: { text: "To go with it:", link: "Create a profile picture frame", hint: "Round frame with your own text and logo for your profile picture." },
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
