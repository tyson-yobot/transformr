// =============================================================================
// TRANSFORMR -- USDA FoodData Central Service (Module 11)
// Food database search and macro extraction via the USDA FDC API.
// Falls back to DEMO_KEY if no API key is provided (rate-limited but functional).
// =============================================================================

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env['EXPO_PUBLIC_USDA_API_KEY'] ?? 'DEMO_KEY';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface USDAFood {
  fdcId: string;
  description: string;
  brandOwner?: string;
  dataType: string;
}

export interface USDAFoodDetail extends USDAFood {
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: Array<{
    nutrientId: number;
    name: string;
    amount: number;
    unit: string;
  }>;
}

export interface MacroNutrients {
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesKcal: number;
  fiberG: number;
}

// ---------------------------------------------------------------------------
// Internal nutrient ID constants (USDA standard)
// https://fdc.nal.usda.gov/food-details/746778/nutrients
// ---------------------------------------------------------------------------

const NUTRIENT_IDS = {
  energy: [1008, 2047, 2048],      // Energy (kcal), multiple possible IDs
  protein: [1003],
  fat: [1004],
  carbs: [1005],
  fiber: [1079],
} as const;

interface FdcSearchItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
}

interface FdcSearchResponse {
  foods: FdcSearchItem[];
  totalHits?: number;
}

interface FdcNutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  amount?: number;
  value?: number;
}

interface FdcFoodDetail {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

// ---------------------------------------------------------------------------
// searchFoods
// ---------------------------------------------------------------------------

/**
 * Searches the USDA FoodData Central database.
 * @param query - Search string (e.g. "chicken breast")
 * @param limit - Maximum number of results (default 20)
 */
export async function searchFoods(
  query: string,
  limit = 20,
): Promise<USDAFood[]> {
  if (!query.trim()) return [];

  try {
    const url = `${FDC_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=${limit}&api_key=${API_KEY}`;
    const res = await fetch(url);

    if (res.status === 429) {
      console.warn('[USDA] Rate limit reached. Consider adding an API key.');
      return [];
    }
    if (!res.ok) return [];

    const data = (await res.json()) as FdcSearchResponse;

    return (data.foods ?? []).map((f) => ({
      fdcId: String(f.fdcId),
      description: f.description,
      brandOwner: f.brandOwner,
      dataType: f.dataType,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getFoodDetails
// ---------------------------------------------------------------------------

/**
 * Fetches full nutrition details for a food by its FDC ID.
 * Returns null if the food is not found or the request fails.
 */
export async function getFoodDetails(
  fdcId: string,
): Promise<USDAFoodDetail | null> {
  try {
    const url = `${FDC_BASE}/food/${fdcId}?api_key=${API_KEY}`;
    const res = await fetch(url);

    if (res.status === 429) {
      console.warn('[USDA] Rate limit reached. Consider adding an API key.');
      return null;
    }
    if (!res.ok) return null;

    const data = (await res.json()) as FdcFoodDetail;

    const nutrients = (data.foodNutrients ?? []).map((n) => ({
      nutrientId: n.nutrientId,
      name: n.nutrientName ?? '',
      amount: n.amount ?? n.value ?? 0,
      unit: n.unitName ?? 'g',
    }));

    return {
      fdcId: String(data.fdcId),
      description: data.description,
      brandOwner: data.brandOwner,
      dataType: data.dataType,
      servingSize: data.servingSize,
      servingSizeUnit: data.servingSizeUnit,
      foodNutrients: nutrients,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// extractMacros
// ---------------------------------------------------------------------------

/**
 * Extracts protein, carbs, fat, calories, and fiber per 100g from a food detail.
 * Returns zeros for any nutrient that is not present in the data.
 */
export function extractMacros(food: USDAFoodDetail): MacroNutrients {
  function getAmount(ids: readonly number[]): number {
    for (const id of ids) {
      const match = food.foodNutrients.find((n) => n.nutrientId === id);
      if (match && match.amount > 0) return Math.round(match.amount * 10) / 10;
    }
    return 0;
  }

  return {
    caloriesKcal: getAmount(NUTRIENT_IDS.energy),
    proteinG: getAmount(NUTRIENT_IDS.protein),
    fatG: getAmount(NUTRIENT_IDS.fat),
    carbsG: getAmount(NUTRIENT_IDS.carbs),
    fiberG: getAmount(NUTRIENT_IDS.fiber),
  };
}
