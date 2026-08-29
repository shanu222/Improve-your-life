import { FOOD_VISION_SYSTEM, emptyVisionResult, type FoodVisionResult } from '../../src/domain/foodVision';

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 45_000);
const MAX_RETRIES = Math.max(1, Number(process.env.AI_MAX_RETRIES || 3));
const ORDER = (process.env.AI_PROVIDER_ORDER || 'openai,gemini,openrouter')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function logAi(message: string) {
  if (process.env.AI_LOGGING === 'true' || process.env.AI_LOG_LEVEL === 'info') {
    console.info(`[dailyme-ai] ${message}`);
  }
}

async function withTimeout(input: RequestInfo, init: RequestInit, ms = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

async function openaiChat(system: string, user: string, image?: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('openai-missing');
  const models = [process.env.OPENAI_MODEL || 'gpt-4.1', process.env.OPENAI_FALLBACK_MODEL || 'gpt-4.1-mini'];
  let last = 'openai-failed';
  for (const model of models) {
    const content: unknown[] = [{ type: 'text', text: user }];
    if (image) {
      content.push({
        type: 'image_url',
        image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` },
      });
    }
    const response = await withTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: image ? content : user },
        ],
      }),
    });
    if (!response.ok) {
      last = `openai-${response.status}`;
      continue;
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
  }
  throw new Error(last);
}

async function geminiChat(system: string, user: string, image?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('gemini-missing');
  const models = [process.env.GEMINI_MODEL || 'gemini-2.5-flash', process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash'];
  const raw = image?.includes(',') ? image.split(',').pop()! : image;
  let last = 'gemini-failed';
  for (const model of models) {
    const parts: unknown[] = [{ text: `${system}\n\n${user}` }];
    if (raw) parts.push({ inline_data: { mime_type: 'image/jpeg', data: raw } });
    const response = await withTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      },
    );
    if (!response.ok) {
      last = `gemini-${response.status}`;
      continue;
    }
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  }
  throw new Error(last);
}

async function openrouterChat(system: string, user: string, image?: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('openrouter-missing');
  const models = (process.env.OPENROUTER_MODELS || 'google/gemma-4-31b-it:free').split(',').map((s) => s.trim());
  let last = 'openrouter-failed';
  for (const model of models) {
    const userContent: unknown = image
      ? [
          { type: 'text', text: user },
          { type: 'image_url', image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` } },
        ]
      : user;
    const response = await withTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.EXPO_PUBLIC_API_BASE || 'https://improve-your-life-ten.vercel.app',
        'X-Title': 'DailyMe',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      }),
    });
    if (!response.ok) {
      last = `openrouter-${response.status}`;
      continue;
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
  }
  throw new Error(last);
}

export async function completeJson(system: string, user: string, image?: string): Promise<Record<string, unknown>> {
  const runners: Record<string, () => Promise<string>> = {
    openai: () => openaiChat(system, user, image),
    gemini: () => geminiChat(system, user, image),
    openrouter: () => openrouterChat(system, user, image),
  };
  const errors: string[] = [];
  for (const name of ORDER) {
    const run = runners[name];
    if (!run) continue;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        logAi(`${name} attempt ${attempt}`);
        return parseJsonObject(await run());
      } catch (error) {
        const label = error instanceof Error ? error.message : 'failed';
        errors.push(`${name}:${label}`);
        if (process.env.AI_FALLBACK_ENABLED === 'false') break;
      }
    }
  }
  throw new Error(errors.join(',') || 'ai-unavailable');
}

export function toVisionResult(parsed: Record<string, unknown>): FoodVisionResult {
  return {
    foodItems: Array.isArray(parsed.foodItems) ? (parsed.foodItems as FoodVisionResult['foodItems']) : [],
    estimatedCalories: Number(parsed.estimatedCalories) || 0,
    protein: Number(parsed.protein) || 0,
    carbs: Number(parsed.carbs) || 0,
    fat: Number(parsed.fat) || 0,
    fiber: Number(parsed.fiber) || 0,
    mealType: parsed.mealType as FoodVisionResult['mealType'],
    confidence: parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium',
    notes: String(parsed.notes || 'These are estimates based on the photo and portion size.'),
    isEstimate: true,
  };
}

export { FOOD_VISION_SYSTEM, emptyVisionResult };
