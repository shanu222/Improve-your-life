import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, requireUser, userError, readJson } from './_lib/http';
import { buildDailyReport, buildWeeklyReport } from '../src/domain/reports';
import type { LogEntry, UserProfile } from '../src/domain/types';

function kindOf(req: VercelRequest): 'weekly' | 'daily' {
  const query = String(req.query.kind ?? '');
  const url = String(req.url ?? '');
  if (query === 'weekly' || url.includes('weekly')) return 'weekly';
  return 'daily';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;

  if (kindOf(req) === 'weekly') {
    const body = readJson<{
      weekStart?: string;
      days?: { date: string; entries: LogEntry[] }[];
      profile?: UserProfile;
    }>(req);
    if (!body.profile || !body.days || !body.weekStart) return userError(res, 400, 'Something went wrong. Please try again.');
    return json(res, 200, buildWeeklyReport(body.weekStart, body.days, body.profile));
  }

  const body = readJson<{ date?: string; entries?: LogEntry[]; profile?: UserProfile }>(req);
  if (!body.profile || !body.entries) return userError(res, 400, 'Something went wrong. Please try again.');
  return json(res, 200, buildDailyReport(body.date || new Date().toISOString().slice(0, 10), body.entries, body.profile));
}
