import { parseMeal } from '../mealParser';
import { nutrientTone, buildNutritionDashboard } from '../nutrition';
import { defaultProfile } from '../defaults';
import type { LogEntry } from '../types';

describe('meal parser', () => {
  it('estimates a Pakistani breakfast', () => {
    const result = parseMeal('2 eggs, 2 roti and tea');
    expect(result.isEstimate).toBe(true);
    expect(result.items.map((i) => i.name).sort()).toEqual(['Chai', 'Eggs', 'Roti'].sort());
    expect(result.calories).toBeGreaterThan(300);
    expect(result.proteinG).toBeGreaterThan(15);
    expect(result.unmatched).toEqual([]);
  });

  it('estimates biryani', () => {
    const result = parseMeal('Chicken biryani 1 plate');
    expect(result.items.some((i) => i.foodId === 'biryani')).toBe(true);
    expect(result.calories).toBeGreaterThan(400);
  });

  it('keeps unmatched fragments instead of inventing foods', () => {
    const result = parseMeal('xyzzy mystery stew');
    expect(result.unmatched.length).toBeGreaterThan(0);
    expect(result.calories).toBe(0);
  });

  it('handles empty input', () => {
    const result = parseMeal('');
    expect(result.items).toEqual([]);
  });
});

describe('nutrition dashboard language', () => {
  it('never uses deficiency claims', () => {
    const entries: LogEntry[] = [
      {
        id: '1',
        userId: 'u1',
        type: 'meal',
        localDate: '2026-08-29',
        occurredAt: '2026-08-29T08:00:00.000Z',
        createdAt: '2026-08-29T08:00:00.000Z',
        updatedAt: '2026-08-29T08:00:00.000Z',
        payload: {
          kind: 'breakfast',
          text: 'apple',
          estimate: parseMeal('apple'),
        },
      },
    ];
    const dash = buildNutritionDashboard(entries, 2000);
    const blob = JSON.stringify(dash);
    expect(blob).not.toMatch(/deficient|diagnosed|you have /i);
    expect(dash.micros.some((m) => /logged intake appears low/i.test(m.message))).toBe(true);
  });

  it('classifies nutrient tones', () => {
    expect(nutrientTone(20, 20)).toBe('good');
    expect(nutrientTone(10, 20)).toBe('almost');
    expect(nutrientTone(2, 20)).toBe('attention');
  });
});

describe('calorie estimate fallback', () => {
  it('uses 2000 without body stats', () => {
    const profile = defaultProfile('u1');
    expect(profile.calorieEstimate).toBe(2000);
  });
});
