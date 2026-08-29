export interface FoodVisionResult {
  foodItems: { name: string; portion?: string }[];
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence: 'low' | 'medium' | 'high';
  notes: string;
  isEstimate: true;
}

export function emptyVisionResult(notes: string): FoodVisionResult {
  return {
    foodItems: [],
    estimatedCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    confidence: 'low',
    notes,
    isEstimate: true,
  };
}

export function stripImageFromPayload<T extends Record<string, unknown>>(payload: T): T {
  const clone = { ...payload };
  delete clone.image;
  delete clone.photo;
  delete clone.base64;
  delete clone.dataUrl;
  return clone;
}

export const FOOD_VISION_SYSTEM = `You estimate meals from a photo for a wellbeing app. Return JSON only.
Foods are often Pakistani: roti, chapati, naan, paratha, aloo paratha, egg, omelette, daal, chana, rajma, chicken karahi, chicken biryani, beef biryani, pulao, nihari, haleem, saag, rice, yogurt, lassi, tea, milk, samosa, pakora, fruit, vegetables.
Never diagnose. Values are estimates. If unsure, lower confidence.
Schema: {"foodItems":[{"name":"","portion":""}],"estimatedCalories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"mealType":"lunch","confidence":"medium","notes":""}`;
