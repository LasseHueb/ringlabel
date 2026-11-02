/* Banner-Seite je Sprache (/banner/ und /en/banner/): eigenes Werkzeug mit eigenen Texten, FAQ, OG-Bild. */
import { esc, fill, banner, linkUi, crossLink, page, privacyNote, trustRow, faqSection, faqJsonLd, webAppJsonLd, ui } from "../layout.mjs";
import { locales, languages } from "../content.mjs";

export default function pages(ctx) {
  // hreflang: alle Sprachen plus x-default → Deutsch
  const alternates = [...languages.map((l) => [l, locales[l].bannerPage.path]), ["x-default", locales[languages[0]].bannerPage.path]];
  return languages.map((lang) => {
    const bp = locales[lang].bannerPage;
    return {
      path: bp.path,
      priority: "0.9",
      alternates,
      html: page(ctx, {
        lang,
        path: bp.path,
        titleFull: `${fill(ctx, bp.title)} | ${ctx.cfg.appName}`,
        title: fill(ctx, bp.title),
        description: fill(ctx, bp.description),
        og: bp.og,
        tool: "banner",
        skip: "banner-editor",
        alternates,
        langPaths: Object.fromEntries(languages.map((l) => [l, locales[l].bannerPage.path])),
        jsonLd: [webAppJsonLd(ctx, ctx.abs(bp.path), lang, bp.app), faqJsonLd(ctx, bp.faq)],
        main: `
  <div class="hero">
    <h1>${esc(fill(ctx, bp.h1))}</h1>
    <p class="lead">${esc(fill(ctx, bp.lead))}</p>
    ${trustRow(lang, bp.trust)}
  </div>
  ${privacyNote(lang, { badge: bp.privacyBadge, text: bp.privacyText })}
  ${linkUi(ctx, lang)}
  ${banner(ctx, lang)}
  ${faqSection(ctx, bp.faq, ui(lang).faqHeading)}
  ${crossLink(ctx, lang, "frame")}`
      })
    };
  });
}
