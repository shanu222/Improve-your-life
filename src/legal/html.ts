import { LEGAL } from './config';
import { type LegalDocument } from './documents';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderLegalHtml(doc: LegalDocument): string {
  const sections = doc.sections
    .map((section) => {
      const paras = section.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paras}</section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.title)} · ${LEGAL.appName}</title>
  <meta name="description" content="${escapeHtml(doc.summary)}" />
  <style>
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #F3EEE6; color: #1A1613; }
    main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
    a { color: #C2410C; }
    nav { display: flex; flex-wrap: wrap; gap: 12px 18px; margin-bottom: 24px; font-family: system-ui, sans-serif; }
    h1 { font-size: 2rem; line-height: 1.2; }
    h2 { font-size: 1.25rem; margin-top: 2rem; }
    p { line-height: 1.55; }
    .muted { color: #5c564f; }
  </style>
</head>
<body>
  <main>
    <nav>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/support">Support</a>
      <a href="/delete-account">Delete account</a>
    </nav>
    <h1>${escapeHtml(doc.title)}</h1>
    <p class="muted">Last updated ${LEGAL.effectiveDate}</p>
    <p>${escapeHtml(doc.summary)}</p>
    ${sections}
    <p class="muted">Contact ${escapeHtml(LEGAL.supportEmail)}</p>
  </main>
</body>
</html>`;
}
