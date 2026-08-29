import { FOODS } from './foods';
import type { FoodItem, NutrientSet, NutritionEstimate } from './types';
import { emptyNutrients } from './scoring';

function scale(nutrients: NutrientSet, servings: number): NutrientSet {
  const out = emptyNutrients();
  (Object.keys(out) as (keyof NutrientSet)[]).forEach((key) => {
    out[key] = Math.round(nutrients[key] * servings * 10) / 10;
  });
  out.calories = Math.round(nutrients.calories * servings);
  return out;
}

function add(a: NutrientSet, b: NutrientSet): NutrientSet {
  const out = emptyNutrients();
  (Object.keys(out) as (keyof NutrientSet)[]).forEach((key) => {
    out[key] = Math.round((a[key] + b[key]) * 10) / 10;
  });
  out.calories = Math.round(a.calories + b.calories);
  return out;
}

const UNIT_MULTIPLIERS: Record<string, number> = {
  plate: 1,
  bowl: 1,
  cup: 1,
  glass: 1,
  serving: 1,
  slice: 0.5,
  handful: 1,
  piece: 1,
  pieces: 1,
  can: 1,
  shot: 1,
};

function parseQuantity(raw: string): { qty: number; rest: string } {
  const trimmed = raw.trim().toLowerCase();
  const leading = /^(?:(\d+(?:\.\d+)?)|a|an|one|two|three|four)\s+/.exec(trimmed);
  if (!leading) return { qty: 1, rest: trimmed };
  const token = leading[1] ?? leading[0].trim();
  const words: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4 };
  const qty = words[token] ?? Number(token);
  let rest = trimmed.slice(leading[0].length).trim();
  const unit = /^([a-z]+)\s+/.exec(rest);
  if (unit && UNIT_MULTIPLIERS[unit[1] ?? ''] !== undefined) {
    rest = rest.slice(unit[0].length).trim();
  }
  return { qty: Number.isFinite(qty) && qty > 0 ? qty : 1, rest };
}

function matchFood(phrase: string, catalog: FoodItem[]): FoodItem | undefined {
  const text = phrase.toLowerCase().trim();
  if (!text) return undefined;
  let best: { food: FoodItem; score: number } | undefined;
  for (const food of catalog) {
    const names = [food.name, ...food.aliases].map((s) => s.toLowerCase()).sort((a, b) => b.length - a.length);
    for (const name of names) {
      if (!name) continue;
      let score = 0;
      if (text === name) score = 100 + name.length;
      else if (text.includes(name)) score = 80 + name.length;
      else if (name.includes(text) && text.length >= 3) score = 40 + text.length;
      if (score > 0 && (!best || score > best.score)) best = { food, score };
    }
  }
  return best?.food;
}

export function parseMeal(input: string, catalog: FoodItem[] = FOODS): NutritionEstimate {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  const parts = cleaned
    .split(/\s*,\s*|\s+and\s+|\s*&\s*|\s*\+\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const items: NutritionEstimate['items'] = [];
  const unmatched: string[] = [];
  let total = emptyNutrients();

  for (const part of parts) {
    const { qty, rest } = parseQuantity(part);
    const food = matchFood(rest, catalog);
    if (!food) {
      unmatched.push(part);
      continue;
    }
    const nutrients = scale(food.nutrients, qty);
    items.push({ foodId: food.id, name: food.name, servings: qty, nutrients });
    total = add(total, nutrients);
  }

  return {
    ...total,
    isEstimate: true,
    unmatched,
    items,
  };
}

export function estimatedCaloriesFromProfile(profile: {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel: string;
}): number {
  const weight = profile.weightKg;
  const height = profile.heightCm;
  const age = profile.age;
  if (!weight || !height || !age) return 2000;
  const isMale = profile.gender === 'male';
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activity =
    profile.activityLevel === 'active'
      ? 1.7
      : profile.activityLevel === 'moderate'
        ? 1.55
        : profile.activityLevel === 'light'
          ? 1.375
          : 1.2;
  return Math.round(bmr * activity);
}
