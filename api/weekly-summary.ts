import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, requireUser, userError, readJson } from '../_lib/http';
import { buildWeeklyReport } from '../../src/domain/reports';
import type { LogEntry, UserProfile } from '../../src/domain/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const uid = await requireUser(req, res);
  if (!uid) return;
  const body = readJson<{
    weekStart?: string;
    days?: { date: string; entries: LogEntry[] }[];
    profile?: UserProfile;
  }>(req);
  if (!body.profile || !body.days || !body.weekStart) return userError(res, 400, 'Something went wrong. Please try again.');
  const report = buildWeeklyReport(body.weekStart, body.days, body.profile);
  return json(res, 200, report);
}
