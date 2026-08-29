import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, rateLimit, userError } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return userError(res, 405);
  const ip = String(req.headers['x-forwarded-for'] ?? 'ip');
  if (!rateLimit(`weather:${ip}`, 30, 60_000)) return userError(res, 429, 'Please wait a moment and try again.');

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return userError(res, 400, 'Location is optional. You can enter the weather yourself.');
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) return userError(res, 502, 'We could not load the weather right now.');
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const code = data.current?.weather_code ?? 0;
    return json(res, 200, {
      celsius: data.current?.temperature_2m,
      condition: conditionFromCode(code),
      source: 'open-meteo',
    });
  } catch {
    return userError(res, 502, 'We could not load the weather right now.');
  }
}

function conditionFromCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Mixed';
}
