import { LEGAL, legalUrl } from '../../legal/config';
import { LEGAL_DOCS, legalDoc } from '../../legal/documents';
import { renderLegalHtml } from '../../legal/html';

describe('Play Store legal documents', () => {
  it('publishes stable policy URLs', () => {
    expect(legalUrl('privacy')).toBe('https://improve-your-life-ten.vercel.app/privacy-policy');
    expect(legalUrl('terms')).toBe('https://improve-your-life-ten.vercel.app/terms');
    expect(legalUrl('deleteAccount')).toBe('https://improve-your-life-ten.vercel.app/delete-account');
  });

  it('requires adult users and a real support email', () => {
    expect(LEGAL.minimumAge).toBe(18);
    expect(LEGAL.supportEmail).toContain('@');
    expect(LEGAL_DOCS.privacy.sections.some((s) => s.body.join(' ').includes('18'))).toBe(true);
  });

  it('states that food photos are not stored', () => {
    const text = LEGAL_DOCS.privacy.sections.flatMap((s) => s.body).join(' ');
    expect(text.toLowerCase()).toContain('does not permanently store food photographs');
  });

  it('explains real account deletion', () => {
    const text = LEGAL_DOCS.delete.sections.flatMap((s) => s.body).join(' ');
    expect(text.toLowerCase()).toContain('delete');
    expect(text.toLowerCase()).toContain('firebase');
  });

  it('renders crawlable HTML for every document', () => {
    for (const id of ['privacy', 'terms', 'support', 'delete', 'health'] as const) {
      const doc = legalDoc(id);
      expect(doc).toBeTruthy();
      const html = renderLegalHtml(doc!);
      expect(html).toContain(doc!.title);
      expect(html).toContain(LEGAL.supportEmail);
    }
  });
});
