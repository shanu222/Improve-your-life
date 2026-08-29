import { FOOD_SUGGESTIONS, MICRONUTRIENT_REFERENCES } from './foods';
import type { LogEntry, NutrientSet, StatusTone } from './types';
import { emptyNutrients, sumNutrition } from './scoring';

export interface NutrientStatus {
  key: string;
  label: string;
  amount: number;
  target: number;
  unit: string;
  tone: StatusTone;
  message: string;
  suggestion: string;
}

export function nutrientTone(amount: number, target: number): StatusTone {
  if (target <= 0) return 'neutral';
  const ratio = amount / target;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.4) return 'almost';
  return 'attention';
}

export function describeNutrient(label: string, amount: number, target: number, foods: string): NutrientStatus {
  const tone = nutrientTone(amount, target);
  const key = label.toLowerCase().replace(/\s+/g, '_');
  if (tone === 'good') {
    return {
      key,
      label,
      amount,
      target,
      unit: '',
      tone,
      message: `Your logged ${label.toLowerCase()} looks on track today.`,
      suggestion: '',
    };
  }
  if (tone === 'almost') {
    return {
      key,
      label,
      amount,
      target,
      unit: '',
      tone,
      message: `Your logged intake of ${label.toLowerCase()} could be a little higher today.`,
      suggestion: `Consider adding ${foods}.`,
    };
  }
  return {
    key,
    label,
    amount,
    target,
    unit: '',
    tone,
    message: `Your logged intake appears low in ${label.toLowerCase()} today.`,
    suggestion: `Consider adding ${foods}. If this pattern continues or you are concerned, consider speaking with a qualified healthcare professional.`,
  };
}

export function buildNutritionDashboard(
  entries: LogEntry[],
  calorieTarget: number,
  proteinTarget?: number,
): {
  totals: NutrientSet;
  calories: { amount: number; target: number; tone: StatusTone };
  macros: NutrientStatus[];
  micros: NutrientStatus[];
  suggestions: { emoji: string; label: string }[];
  hasMeals: boolean;
} {
  const totals = sumNutrition(entries);
  const hasMeals = entries.some((e) => e.type === 'meal' && !e.deletedAt);
  const proteinRef = proteinTarget ?? MICRONUTRIENT_REFERENCES.proteinG.target;

  const micros: NutrientStatus[] = [
    { key: 'ironMg', ...MICRONUTRIENT_REFERENCES.ironMg, amount: totals.ironMg },
    { key: 'calciumMg', ...MICRONUTRIENT_REFERENCES.calciumMg, amount: totals.calciumMg },
    { key: 'vitaminCMg', ...MICRONUTRIENT_REFERENCES.vitaminCMg, amount: totals.vitaminCMg },
    { key: 'vitaminDIu', ...MICRONUTRIENT_REFERENCES.vitaminDIu, amount: totals.vitaminDIu },
  ].map((row) => {
    const described = describeNutrient(row.label, row.amount, row.target, row.foods);
    return { ...described, key: row.key, unit: row.unit, amount: row.amount, target: row.target };
  });

  const calorieRatio = calorieTarget > 0 ? totals.calories / calorieTarget : 0;
  const calorieTone: StatusTone = !hasMeals ? 'neutral' : calorieRatio >= 0.5 ? 'good' : 'almost';

  const lowKeys = micros.filter((m) => m.tone !== 'good').map((m) => m.key);
  const suggestions = FOOD_SUGGESTIONS.filter((s) => {
    if (lowKeys.includes('calciumMg') && s.tags.includes('calcium')) return true;
    if (lowKeys.includes('ironMg') && s.tags.includes('iron')) return true;
    if (lowKeys.includes('vitaminCMg') && s.tags.includes('vitaminC')) return true;
    if (lowKeys.includes('vitaminDIu') && s.tags.includes('vitaminD')) return true;
    if (totals.fiberG < 18 && s.tags.includes('fiber')) return true;
    return false;
  }).slice(0, 3);

  const fallback = suggestions.length > 0 ? suggestions : FOOD_SUGGESTIONS.slice(0, 3);

  return {
    totals,
    calories: { amount: totals.calories, target: calorieTarget, tone: calorieTone },
    macros: [
      {
        key: 'protein',
        label: 'Protein',
        amount: totals.proteinG,
        target: proteinRef,
        unit: 'g',
        tone: nutrientTone(totals.proteinG, proteinRef),
        message: '',
        suggestion: '',
      },
      {
        key: 'carbs',
        label: 'Carbohydrates',
        amount: totals.carbsG,
        target: 250,
        unit: 'g',
        tone: 'neutral',
        message: '',
        suggestion: '',
      },
      {
        key: 'fat',
        label: 'Fat',
        amount: totals.fatG,
        target: 70,
        unit: 'g',
        tone: 'neutral',
        message: '',
        suggestion: '',
      },
      {
        key: 'fiber',
        label: 'Fiber',
        amount: totals.fiberG,
        target: MICRONUTRIENT_REFERENCES.fiberG.target,
        unit: 'g',
        tone: nutrientTone(totals.fiberG, MICRONUTRIENT_REFERENCES.fiberG.target),
        message: '',
        suggestion: '',
      },
    ],
    micros,
    suggestions: hasMeals ? fallback : [],
    hasMeals,
  };
}

export function estimateExerciseCalories(kind: string, minutes: number, weightKg = 70): number {
  const met: Record<string, number> = {
    walk: 3.5,
    run: 8,
    gym: 6,
    cycle: 7,
    sports: 6.5,
    stretch: 2.5,
    custom: 4,
  };
  const used = met[kind] ?? 4;
  return Math.round(((used * 3.5 * weightKg) / 200) * minutes);
}

export { emptyNutrients };
