/* Startseite je Sprache (/ und /en/): Überschrift, Einleitung, Datenschutz-Hinweis, Editor, Text-Ideen und FAQ. */
import { esc, fill, editor, page, privacyNote, trustRow, faqSection, faqJsonLd, webAppJsonLd, ui } from "../layout.mjs";
import { locales, languages } from "../content.mjs";

function ideasSection(ctx, ideas, lang) {
  const t = ui(lang);
  const [qo, qc] = t.quote;
  const cards = ideas.map((idea) => `<li class="idea">
        <h3>${esc(idea.title)}</h3>
        <p>${esc(fill(ctx, idea.text))}</p>
        <ul class="idea-examples">${idea.examples.map((x) => `<li>${qo}${esc(x)}${qc}</li>`).join("")}</ul>
        <button type="button" class="btn btn-ghost" data-apply-preset="${esc(idea.preset)}">${esc(t.applyPreset)}</button>
      </li>`).join("\n      ");
  return `<section class="section" aria-labelledby="ideas-h">
    <h2 id="ideas-h">${esc(t.ideasHeading)}</h2>
    <ul class="ideas">
      ${cards}
    </ul>
  </section>`;
}

export default function pages(ctx) {
  // hreflang: alle Sprachen plus x-default → Standardsprache (Deutsch)
  const alternates = [...languages.map((l) => [l, locales[l].path]), ["x-default", locales[languages[0]].path]];
  return languages.map((lang) => {
    const home = locales[lang];
    return {
      path: home.path,
      priority: "1.0",
      alternates,
      html: page(ctx, {
        lang,
        path: home.path,
        titleFull: `${fill(ctx, home.title)} | ${ctx.cfg.appName}`,
        title: fill(ctx, home.title),
        description: fill(ctx, home.description),
        og: home.og,
        editor: true,
        preset: home.preset,
        alternates,
        jsonLd: [webAppJsonLd(ctx, ctx.abs(home.path), lang), faqJsonLd(ctx, home.faq)],
        main: `
  <div class="hero">
    <h1>${esc(fill(ctx, home.h1))}</h1>
    <p class="lead">${esc(fill(ctx, home.lead))}</p>
    ${trustRow(lang)}
  </div>
  ${privacyNote(lang)}
  ${editor(ctx, lang)}
  ${ideasSection(ctx, home.ideas, lang)}
  ${faqSection(ctx, home.faq, ui(lang).faqHeading)}`
      })
    };
  });
}
