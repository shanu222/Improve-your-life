import type { VercelRequest, VercelResponse } from '@vercel/node';
import { legalDoc } from '../src/legal/documents';
import { renderLegalHtml } from '../src/legal/html';

const ALIAS: Record<string, string> = {
  privacy: 'privacy',
  'privacy-policy': 'privacy',
  terms: 'terms',
  tos: 'terms',
  support: 'support',
  delete: 'delete',
  'delete-account': 'delete',
  health: 'health',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).setHeader('Allow', 'GET, HEAD').end();
    return;
  }
  const raw = String(req.query.doc ?? 'privacy').toLowerCase();
  const doc = legalDoc(ALIAS[raw] ?? raw);
  if (!doc) {
    res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Not found');
    return;
  }
  const html = renderLegalHtml(doc);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }
  res.status(200).send(html);
}
