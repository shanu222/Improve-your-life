import type { FoodItem, NutrientSet } from './types';

const n = (
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number,
  extras: Partial<Pick<NutrientSet, 'ironMg' | 'calciumMg' | 'vitaminCMg' | 'vitaminDIu' | 'potassiumMg' | 'magnesiumMg'>> = {},
): NutrientSet => ({
  calories,
  proteinG,
  carbsG,
  fatG,
  fiberG,
  ironMg: extras.ironMg ?? 0,
  calciumMg: extras.calciumMg ?? 0,
  vitaminCMg: extras.vitaminCMg ?? 0,
  vitaminDIu: extras.vitaminDIu ?? 0,
  potassiumMg: extras.potassiumMg ?? 0,
  magnesiumMg: extras.magnesiumMg ?? 0,
});

export const FOODS: FoodItem[] = [
  { id: 'roti', name: 'Roti', aliases: ['chapati', 'phulka'], servingLabel: '1 roti', region: 'pk', tags: ['grain'], nutrients: n(120, 3.1, 18, 3.2, 2.2, { ironMg: 1.1, magnesiumMg: 26 }) },
  { id: 'paratha', name: 'Paratha', aliases: ['paratha'], servingLabel: '1 paratha', region: 'pk', tags: ['grain'], nutrients: n(260, 4.5, 32, 12, 2.4, { ironMg: 1.4 }) },
  { id: 'aloo_paratha', name: 'Aloo paratha', aliases: ['aloo paratha', 'potato paratha'], servingLabel: '1 aloo paratha', region: 'pk', tags: ['grain'], nutrients: n(320, 6, 42, 14, 3.2, { ironMg: 1.6, potassiumMg: 280 }) },
  { id: 'rajma', name: 'Rajma', aliases: ['rajma masala', 'kidney beans'], servingLabel: '1 bowl', region: 'pk', tags: ['protein', 'vegetable'], nutrients: n(230, 13, 34, 5, 9, { ironMg: 3.8, potassiumMg: 520 }) },
  { id: 'naan', name: 'Naan', aliases: ['nan'], servingLabel: '1 naan', region: 'pk', tags: ['grain'], nutrients: n(260, 7.5, 45, 5, 1.8, { ironMg: 2.2, calciumMg: 80 }) },
  { id: 'rice', name: 'Rice', aliases: ['chawal', 'basmati', 'steamed rice'], servingLabel: '1 cup cooked', region: 'pk', tags: ['grain'], nutrients: n(205, 4.3, 45, 0.4, 0.6, { magnesiumMg: 19 }) },
  { id: 'biryani', name: 'Biryani', aliases: ['chicken biryani', 'beef biryani'], servingLabel: '1 plate', region: 'pk', tags: ['meal', 'protein'], nutrients: n(520, 24, 62, 18, 3.2, { ironMg: 2.8 }) },
  { id: 'pulao', name: 'Pulao', aliases: ['pilau', 'yakhni pulao'], servingLabel: '1 plate', region: 'pk', tags: ['grain'], nutrients: n(380, 12, 55, 11, 2.1, { ironMg: 1.8 }) },
  { id: 'daal', name: 'Daal', aliases: ['dal', 'daal mash', 'masoor', 'lentils'], servingLabel: '1 bowl', region: 'pk', tags: ['protein', 'vegetable'], nutrients: n(180, 12, 28, 2.5, 8, { ironMg: 3.3, magnesiumMg: 48, potassiumMg: 480 }) },
  { id: 'chana', name: 'Chana', aliases: ['chana masala', 'chickpeas', 'chole'], servingLabel: '1 bowl', region: 'pk', tags: ['protein', 'vegetable'], nutrients: n(220, 12, 32, 6, 9, { ironMg: 3.4, calciumMg: 80, magnesiumMg: 62 }) },
  { id: 'chicken', name: 'Chicken', aliases: ['chicken karahi', 'chicken curry', 'murgh'], servingLabel: '1 serving', region: 'pk', tags: ['protein'], nutrients: n(240, 28, 4, 12, 0.4, { ironMg: 1.2 }) },
  { id: 'beef', name: 'Beef', aliases: ['beef curry', 'gosht'], servingLabel: '1 serving', region: 'pk', tags: ['protein'], nutrients: n(280, 26, 3, 18, 0, { ironMg: 2.6 }) },
  { id: 'mutton', name: 'Mutton', aliases: ['lamb', 'mutton curry'], servingLabel: '1 serving', region: 'pk', tags: ['protein'], nutrients: n(290, 25, 2, 20, 0, { ironMg: 2.1 }) },
  { id: 'keema', name: 'Keema', aliases: ['mince', 'qeeema'], servingLabel: '1 serving', region: 'pk', tags: ['protein'], nutrients: n(270, 22, 5, 18, 1, { ironMg: 2.4 }) },
  { id: 'kebab', name: 'Seekh kebab', aliases: ['kebab', 'kabab', 'seekh'], servingLabel: '2 pieces', region: 'pk', tags: ['protein'], nutrients: n(220, 18, 4, 14, 0.4, { ironMg: 1.8 }) },
  { id: 'nihari', name: 'Nihari', aliases: ['nehari'], servingLabel: '1 bowl', region: 'pk', tags: ['protein'], nutrients: n(340, 24, 10, 22, 1.2, { ironMg: 3.1 }) },
  { id: 'haleem', name: 'Haleem', aliases: ['haleem'], servingLabel: '1 bowl', region: 'pk', tags: ['protein', 'grain'], nutrients: n(320, 20, 28, 12, 6, { ironMg: 3.6, calciumMg: 60 }) },
  { id: 'sabzi', name: 'Sabzi', aliases: ['mixed sabzi', 'vegetable curry', 'tarkari'], servingLabel: '1 serving', region: 'pk', tags: ['vegetable'], nutrients: n(110, 3, 14, 5, 4.5, { vitaminCMg: 28, ironMg: 1.4, potassiumMg: 320 }) },
  { id: 'aloo', name: 'Aloo', aliases: ['potato', 'aloo curry'], servingLabel: '1 serving', region: 'pk', tags: ['vegetable'], nutrients: n(150, 2.5, 26, 4, 2.4, { potassiumMg: 420, vitaminCMg: 12 }) },
  { id: 'palak', name: 'Palak', aliases: ['saag', 'spinach'], servingLabel: '1 serving', region: 'pk', tags: ['vegetable'], nutrients: n(90, 5, 8, 4, 4, { ironMg: 3.6, calciumMg: 140, vitaminCMg: 18, vitaminDIu: 0, potassiumMg: 480 }) },
  { id: 'bhindi', name: 'Bhindi', aliases: ['okra', 'lady finger'], servingLabel: '1 serving', region: 'pk', tags: ['vegetable'], nutrients: n(80, 2.2, 10, 3.5, 3.2, { vitaminCMg: 16, magnesiumMg: 36 }) },
  { id: 'dahi', name: 'Dahi', aliases: ['yogurt', 'yoghurt', 'curd'], servingLabel: '1 bowl', region: 'pk', tags: ['dairy', 'calcium'], nutrients: n(110, 6, 8, 5, 0, { calciumMg: 220, vitaminDIu: 40 }) },
  { id: 'lassi', name: 'Lassi', aliases: ['mango lassi', 'salt lassi'], servingLabel: '1 glass', region: 'pk', tags: ['dairy', 'calcium'], nutrients: n(180, 6, 24, 5, 0, { calciumMg: 250 }) },
  { id: 'milk', name: 'Milk', aliases: ['doodh'], servingLabel: '1 glass (250ml)', region: 'pk', tags: ['dairy', 'calcium'], nutrients: n(150, 8, 12, 8, 0, { calciumMg: 300, vitaminDIu: 100 }) },
  { id: 'eggs', name: 'Eggs', aliases: ['egg', 'anda', 'omelette', 'omelet'], servingLabel: '2 eggs', region: 'pk', tags: ['protein'], nutrients: n(155, 13, 1.1, 11, 0, { ironMg: 1.8, vitaminDIu: 80, calciumMg: 50 }) },
  { id: 'tea', name: 'Chai', aliases: ['tea', 'doodh patti', 'chai'], servingLabel: '1 cup', region: 'pk', tags: ['drink'], caffeineMg: 40, nutrients: n(70, 2, 8, 3, 0, { calciumMg: 70 }) },
  { id: 'fruit', name: 'Fruit', aliases: ['fruit chaat', 'mixed fruit'], servingLabel: '1 serving', region: 'pk', tags: ['fruit'], nutrients: n(90, 1, 22, 0.3, 3, { vitaminCMg: 35, potassiumMg: 250 }) },
  { id: 'mango', name: 'Mango', aliases: ['aam'], servingLabel: '1 mango', region: 'pk', tags: ['fruit'], nutrients: n(200, 2.8, 50, 1.3, 5, { vitaminCMg: 122, potassiumMg: 564 }) },
  { id: 'dates', name: 'Dates', aliases: ['khajoor'], servingLabel: '3 dates', region: 'pk', tags: ['fruit'], nutrients: n(90, 0.7, 24, 0.1, 2.5, { potassiumMg: 200, magnesiumMg: 20 }) },
  { id: 'samosa', name: 'Samosa', aliases: ['samosay'], servingLabel: '1 piece', region: 'pk', tags: ['snack'], nutrients: n(250, 5, 28, 13, 2) },
  { id: 'pakora', name: 'Pakora', aliases: ['pakoda', 'bhajia'], servingLabel: '4 pieces', region: 'pk', tags: ['snack'], nutrients: n(220, 6, 20, 12, 3, { ironMg: 1.2 }) },
  { id: 'raita', name: 'Raita', aliases: ['raita'], servingLabel: '1 bowl', region: 'pk', tags: ['dairy'], nutrients: n(80, 4, 8, 3.5, 0.8, { calciumMg: 140 }) },
  { id: 'kheer', name: 'Kheer', aliases: ['rice pudding'], servingLabel: '1 bowl', region: 'pk', tags: ['dessert'], nutrients: n(220, 6, 32, 7, 0.3, { calciumMg: 180 }) },
  { id: 'apple', name: 'Apple', aliases: ['apples'], servingLabel: '1 apple', region: 'global', tags: ['fruit'], nutrients: n(95, 0.5, 25, 0.3, 4.4, { vitaminCMg: 8, potassiumMg: 195 }) },
  { id: 'banana', name: 'Banana', aliases: ['bananas'], servingLabel: '1 banana', region: 'global', tags: ['fruit'], nutrients: n(105, 1.3, 27, 0.4, 3.1, { potassiumMg: 422, vitaminCMg: 10, magnesiumMg: 32 }) },
  { id: 'orange', name: 'Orange', aliases: ['oranges'], servingLabel: '1 orange', region: 'global', tags: ['fruit'], nutrients: n(62, 1.2, 15, 0.2, 3.1, { vitaminCMg: 70, calciumMg: 52 }) },
  { id: 'almonds', name: 'Almonds', aliases: ['badam', 'nuts'], servingLabel: '1 handful (28g)', region: 'global', tags: ['nuts'], nutrients: n(164, 6, 6, 14, 3.5, { calciumMg: 76, magnesiumMg: 76, ironMg: 1 }) },
  { id: 'walnuts', name: 'Walnuts', aliases: ['akhrot'], servingLabel: '1 handful', region: 'global', tags: ['nuts'], nutrients: n(185, 4.3, 4, 18, 1.9, { magnesiumMg: 45 }) },
  { id: 'peanuts', name: 'Peanuts', aliases: ['moongphali'], servingLabel: '1 handful', region: 'global', tags: ['nuts'], nutrients: n(160, 7, 5, 14, 2.4, { magnesiumMg: 50 }) },
  { id: 'yogurt', name: 'Yogurt', aliases: ['greek yogurt'], servingLabel: '1 cup', region: 'global', tags: ['dairy', 'calcium'], nutrients: n(130, 11, 9, 4, 0, { calciumMg: 300, vitaminDIu: 40 }) },
  { id: 'cheese', name: 'Cheese', aliases: ['cheddar'], servingLabel: '1 slice', region: 'global', tags: ['dairy', 'calcium'], nutrients: n(110, 7, 1, 9, 0, { calciumMg: 200 }) },
  { id: 'bread', name: 'Bread', aliases: ['toast', 'slice'], servingLabel: '2 slices', region: 'global', tags: ['grain'], nutrients: n(160, 6, 30, 2, 2.4, { ironMg: 1.8 }) },
  { id: 'oatmeal', name: 'Oatmeal', aliases: ['oats', 'porridge'], servingLabel: '1 bowl', region: 'global', tags: ['grain'], nutrients: n(160, 6, 28, 3, 4, { ironMg: 1.7, magnesiumMg: 58 }) },
  { id: 'salad', name: 'Salad', aliases: ['green salad'], servingLabel: '1 bowl', region: 'global', tags: ['vegetable'], nutrients: n(70, 3, 10, 2, 3.5, { vitaminCMg: 22, ironMg: 1.1 }) },
  { id: 'broccoli', name: 'Broccoli', aliases: ['broccoli'], servingLabel: '1 cup', region: 'global', tags: ['vegetable'], nutrients: n(55, 3.7, 11, 0.6, 5, { vitaminCMg: 81, calciumMg: 43 }) },
  { id: 'spinach', name: 'Spinach', aliases: ['leafy greens', 'leafy vegetables'], servingLabel: '1 cup cooked', region: 'global', tags: ['vegetable'], nutrients: n(41, 5.3, 7, 0.5, 4.3, { ironMg: 6.4, calciumMg: 245, vitaminCMg: 18, potassiumMg: 839 }) },
  { id: 'tomato', name: 'Tomato', aliases: ['tamatar'], servingLabel: '1 tomato', region: 'global', tags: ['vegetable'], nutrients: n(22, 1.1, 4.8, 0.2, 1.5, { vitaminCMg: 17, potassiumMg: 292 }) },
  { id: 'cucumber', name: 'Cucumber', aliases: ['kheera'], servingLabel: '1 cucumber', region: 'global', tags: ['vegetable'], nutrients: n(30, 1.3, 7, 0.2, 1, { vitaminCMg: 8, potassiumMg: 270 }) },
  { id: 'carrot', name: 'Carrot', aliases: ['gajar'], servingLabel: '1 carrot', region: 'global', tags: ['vegetable'], nutrients: n(25, 0.6, 6, 0.1, 1.7, { vitaminCMg: 4, potassiumMg: 195 }) },
  { id: 'chicken_breast', name: 'Chicken breast', aliases: ['grilled chicken'], servingLabel: '1 serving (120g)', region: 'global', tags: ['protein'], nutrients: n(198, 37, 0, 4.3, 0, { ironMg: 0.9 }) },
  { id: 'salmon', name: 'Salmon', aliases: ['fish'], servingLabel: '1 fillet', region: 'global', tags: ['protein'], nutrients: n(280, 30, 0, 18, 0, { vitaminDIu: 450, potassiumMg: 500 }) },
  { id: 'tuna', name: 'Tuna', aliases: ['tuna salad'], servingLabel: '1 can drained', region: 'global', tags: ['protein'], nutrients: n(180, 32, 0, 5, 0, { vitaminDIu: 50 }) },
  { id: 'pasta', name: 'Pasta', aliases: ['spaghetti', 'noodles'], servingLabel: '1 plate', region: 'global', tags: ['grain'], nutrients: n(350, 12, 67, 2.5, 3.2, { ironMg: 2.5 }) },
  { id: 'pizza', name: 'Pizza', aliases: ['pizza slice'], servingLabel: '2 slices', region: 'global', tags: ['meal'], nutrients: n(530, 22, 60, 22, 3.2, { calciumMg: 280 }) },
  { id: 'burger', name: 'Burger', aliases: ['cheeseburger'], servingLabel: '1 burger', region: 'global', tags: ['meal'], nutrients: n(540, 25, 45, 28, 2) },
  { id: 'fries', name: 'Fries', aliases: ['french fries', 'chips'], servingLabel: '1 medium', region: 'global', tags: ['junk'], nutrients: n(365, 4, 48, 17, 4) },
  { id: 'soda', name: 'Soda', aliases: ['coke', 'cola', 'pepsi', 'soft drink'], servingLabel: '1 can', region: 'global', tags: ['sugary'], caffeineMg: 35, nutrients: n(140, 0, 39, 0, 0) },
  { id: 'juice', name: 'Juice', aliases: ['orange juice', 'fruit juice'], servingLabel: '1 glass', region: 'global', tags: ['drink'], nutrients: n(110, 1.7, 26, 0.3, 0.5, { vitaminCMg: 60 }) },
  { id: 'coffee', name: 'Coffee', aliases: ['latte', 'americano', 'cappuccino'], servingLabel: '1 cup', region: 'global', tags: ['drink'], caffeineMg: 95, nutrients: n(5, 0.3, 0, 0, 0) },
  { id: 'espresso', name: 'Espresso', aliases: ['espresso shot'], servingLabel: '1 shot', region: 'global', tags: ['drink'], caffeineMg: 63, nutrients: n(3, 0.1, 0, 0, 0) },
  { id: 'green_tea', name: 'Green tea', aliases: ['green tea'], servingLabel: '1 cup', region: 'global', tags: ['drink'], caffeineMg: 28, nutrients: n(2, 0, 0, 0, 0) },
  { id: 'energy', name: 'Energy drink', aliases: ['red bull', 'monster'], servingLabel: '1 can', region: 'global', tags: ['drink'], caffeineMg: 80, nutrients: n(110, 0, 28, 0, 0) },
  { id: 'avocado', name: 'Avocado', aliases: ['avocado'], servingLabel: '1/2 avocado', region: 'global', tags: ['fruit'], nutrients: n(160, 2, 9, 15, 7, { potassiumMg: 485, magnesiumMg: 29 }) },
  { id: 'hummus', name: 'Hummus', aliases: ['hummus'], servingLabel: '4 tbsp', region: 'global', tags: ['protein'], nutrients: n(140, 6, 12, 8, 4, { ironMg: 1.5 }) },
  { id: 'dark_chocolate', name: 'Dark chocolate', aliases: ['chocolate'], servingLabel: '30g', region: 'global', tags: ['dessert'], nutrients: n(170, 2, 13, 12, 3, { ironMg: 3.3, magnesiumMg: 64 }) },
  { id: 'ice_cream', name: 'Ice cream', aliases: ['icecream'], servingLabel: '1 scoop', region: 'global', tags: ['dessert'], nutrients: n(180, 3, 22, 9, 0.5, { calciumMg: 90 }) },
  { id: 'protein_shake', name: 'Protein shake', aliases: ['whey', 'protein drink'], servingLabel: '1 shake', region: 'global', tags: ['protein'], nutrients: n(150, 25, 8, 2, 1, { calciumMg: 200 }) },
  { id: 'fish_pak', name: 'Fish curry', aliases: ['machli', 'fish'], servingLabel: '1 serving', region: 'pk', tags: ['protein'], nutrients: n(240, 26, 6, 12, 0.6, { vitaminDIu: 180 }) },
];

export function searchFoods(query: string, limit = 8): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return FOODS.slice(0, limit);
  const scored = FOODS.map((food) => {
    const names = [food.name, ...food.aliases].map((s) => s.toLowerCase());
    let score = 0;
    for (const name of names) {
      if (name === q) score = Math.max(score, 100);
      else if (name.startsWith(q)) score = Math.max(score, 80);
      else if (name.includes(q)) score = Math.max(score, 50);
    }
    return { food, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.food);
}

export const MICRONUTRIENT_REFERENCES = {
  ironMg: { label: 'Iron', target: 18, unit: 'mg', foods: 'daal, palak, chana, dates' },
  calciumMg: { label: 'Calcium', target: 1000, unit: 'mg', foods: 'milk, dahi, lassi, yogurt' },
  vitaminCMg: { label: 'Vitamin C', target: 90, unit: 'mg', foods: 'oranges, mango, broccoli, sabzi' },
  vitaminDIu: { label: 'Vitamin D', target: 600, unit: 'IU', foods: 'eggs, salmon, fortified milk' },
  fiberG: { label: 'Fiber', target: 28, unit: 'g', foods: 'daal, fruit, vegetables, roti' },
  proteinG: { label: 'Protein', target: 50, unit: 'g', foods: 'eggs, daal, chicken, dahi' },
};

export const FOOD_SUGGESTIONS = [
  { emoji: '🥛', label: 'Milk / dahi', tags: ['calcium', 'protein'] },
  { emoji: '🥬', label: 'Leafy vegetables', tags: ['iron', 'vitaminC'] },
  { emoji: '🥜', label: 'Nuts / seeds', tags: ['magnesium', 'fat'] },
  { emoji: '🍊', label: 'Citrus fruit', tags: ['vitaminC'] },
  { emoji: '🥚', label: 'Eggs', tags: ['protein', 'vitaminD'] },
  { emoji: '🍲', label: 'Daal or chana', tags: ['iron', 'protein', 'fiber'] },
  { emoji: '🍌', label: 'Banana', tags: ['potassium'] },
];
