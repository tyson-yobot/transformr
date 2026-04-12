// =============================================================================
// TRANSFORMR -- USDA FoodData Central Service (Module 11)
// Searches the USDA FoodData Central API for food nutrition data.
// Free API, no Supabase Edge Function needed — called directly.
// =============================================================================

const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY ?? 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface USDAFoodResult {
  fdcId: number;
  description: string;
  brandOwner: string | null;
  dataType: string;
  servingSize: number | null;
  servingSizeUnit: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface USDASearchResponse {
  foods: {
    fdcId: number;
    description: string;
    brandOwner?: string;
    dataType: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients: {
      nutrientId: number;
      nutrientName: string;
      value: number;
      unitName: string;
    }[];
  }[];
  totalHits: number;
}

function extractNutrient(
  nutrients: { nutrientId: number; value: number }[],
  id: number,
): number {
  const match = nutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : 0;
}

// USDA nutrient IDs
const NUTRIENT_IDS = {
  CALORIES: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093,
};

export async function searchFoods(
  query: string,
  pageSize: number = 15,
): Promise<USDAFoodResult[]> {
  const url = `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Survey (FNDDS),Branded`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data: USDASearchResponse = await response.json();

  return data.foods.map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner ?? null,
    dataType: food.dataType,
    servingSize: food.servingSize ?? null,
    servingSizeUnit: food.servingSizeUnit ?? null,
    calories: extractNutrient(food.foodNutrients, NUTRIENT_IDS.CALORIES),
    protein: extractNutrient(food.foodNutrients, NUTRIENT_IDS.PROTEIN),
    carbs: extractNutrient(food.foodNutrients, NUTRIENT_IDS.CARBS),
    fat: extractNutrient(food.foodNutrients, NUTRIENT_IDS.FAT),
    fiber: extractNutrient(food.foodNutrients, NUTRIENT_IDS.FIBER),
    sugar: extractNutrient(food.foodNutrients, NUTRIENT_IDS.SUGAR),
    sodium: extractNutrient(food.foodNutrients, NUTRIENT_IDS.SODIUM),
  }));
}

export async function getFoodDetails(
  fdcId: number,
): Promise<USDAFoodResult | null> {
  const url = `${BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const food = await response.json();

  const nutrients = (
    food.foodNutrients as {
      nutrient: { id: number };
      amount: number;
    }[]
  ).map((n) => ({
    nutrientId: n.nutrient.id,
    value: n.amount ?? 0,
  }));

  return {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner ?? null,
    dataType: food.dataType,
    servingSize: food.servingSize ?? null,
    servingSizeUnit: food.servingSizeUnit ?? null,
    calories: extractNutrient(nutrients, NUTRIENT_IDS.CALORIES),
    protein: extractNutrient(nutrients, NUTRIENT_IDS.PROTEIN),
    carbs: extractNutrient(nutrients, NUTRIENT_IDS.CARBS),
    fat: extractNutrient(nutrients, NUTRIENT_IDS.FAT),
    fiber: extractNutrient(nutrients, NUTRIENT_IDS.FIBER),
    sugar: extractNutrient(nutrients, NUTRIENT_IDS.SUGAR),
    sodium: extractNutrient(nutrients, NUTRIENT_IDS.SODIUM),
  };
}
