import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, rateLimit, requireUser, userError, readJson } from '../_lib/http';
import { completeJson } from '../_lib/ai';
import { lifestyleObservations, INFORMATIONAL_FOOTER, nutrientPatternCopy } from '../../src/domain/observations';
import type { LogEntry, UserProfile } from '../../src/domain/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405);
  const ip = String(req.headers['x-forwarded-for'] ?? 'ip');
  if (!rateLimit(`insight:${ip}`, 12, 60_000)) return userError(res, 429, 'Please wait a moment and try again.');
  const uid = await requireUser(req, res);
  if (!uid) return;

  const body = readJson<{
    days?: { date: string; entries: LogEntry[] }[];
    profile?: Pick<UserProfile, 'waterGoalMl' | 'sleepGoalMinutes' | 'wakeTime'>;
    nutrients?: { ironLow?: boolean; calciumLow?: boolean };
  }>(req);

  const days = (body.days ?? []).map((d) => ({
    date: d.date,
    entries: (d.entries ?? []).map((e) => ({
      ...e,
      payload: { ...e.payload, image: undefined, photo: undefined, base64: undefined },
    })),
  }));
  const profile = body.profile ?? { waterGoalMl: 2000, sleepGoalMinutes: 480, wakeTime: '07:00' };
  const observations = lifestyleObservations(days, profile);
  const extras: string[] = [];
  if (body.nutrients?.ironLow) {
    extras.push(nutrientPatternCopy({ name: 'iron', low: true, foods: ['daal, chana, rajma, leafy greens, and lean meats'] }));
  }
  if (body.nutrients?.calciumLow) {
    extras.push(nutrientPatternCopy({ name: 'calcium', low: true, foods: ['yogurt, lassi, milk, and leafy greens'] }));
  }

  let aiNotes: string[] = [];
  try {
    const parsed = await completeJson(
      'You are DailyMe. Return JSON {"observations":["..."]}. Use only the user logs. Never diagnose disease or deficiency. Informational lifestyle wording only.',
      JSON.stringify({ observations, extras, days: days.map((d) => ({ date: d.date, types: d.entries.map((e) => e.type) })) }),
    );
    if (Array.isArray(parsed.observations)) {
      aiNotes = parsed.observations.map((item) => String(item)).filter(Boolean).slice(0, 5);
    }
  } catch {
    aiNotes = [];
  }

  return json(res, 200, {
    observations: [...(aiNotes.length ? aiNotes : observations), ...extras.filter(Boolean)].slice(0, 6),
    footer: INFORMATIONAL_FOOTER,
    source: aiNotes.length ? 'logged-data-ai' : 'logged-data',
  });
}
