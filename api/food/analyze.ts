import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FOOD_VISION_SYSTEM, emptyVisionResult, toVisionResult, completeJson } from '../_lib/ai';
import { json, rateLimit, requireUser, userError, readJson } from '../_lib/http';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return userError(res, 405, 'Something went wrong. Please try again.');
  const ip = String(req.headers['x-forwarded-for'] ?? 'ip');
  if (!rateLimit(`food:${ip}`, 20, 60_000)) return userError(res, 429, 'Please wait a moment and try again.');

  const uid = await requireUser(req, res);
  if (!uid) return;

  const body = readJson<{ imageBase64?: string; hint?: string }>(req);
  const image = body.imageBase64;
  if (!image || image.length < 40) return userError(res, 400, 'We could not read that photo. Try another one.');
  if (image.length > 5_500_000) return userError(res, 400, 'Please choose a smaller photo.');

  try {
    const parsed = await completeJson(FOOD_VISION_SYSTEM, `Estimate this meal. User hint: ${body.hint ?? 'none'}`, image);
    return json(res, 200, toVisionResult(parsed));
  } catch {
    return json(res, 200, emptyVisionResult('We could not analyze this photo right now. Type the meal instead. The photo was not stored.'));
  }
}
