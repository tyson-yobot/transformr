import { OPEN_FOOD_FACTS_API } from '@utils/constants';

interface BarcodeProduct {
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  imageUrl: string | null;
  barcode: string;
  openFoodFactsId: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_quantity?: number;
    serving_size?: string;
    nutriments?: {
      'energy-kcal_serving'?: number;
      'energy-kcal_100g'?: number;
      proteins_serving?: number;
      proteins_100g?: number;
      carbohydrates_serving?: number;
      carbohydrates_100g?: number;
      fat_serving?: number;
      fat_100g?: number;
      fiber_serving?: number;
      fiber_100g?: number;
      sugars_serving?: number;
      sugars_100g?: number;
      sodium_serving?: number;
      sodium_100g?: number;
    };
    image_url?: string;
    code?: string;
    _id?: string;
  };
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/product/${barcode}.json`);
    const data = await response.json() as OpenFoodFactsResponse;

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    const n = p.nutriments;

    // Prefer per-serving values, fall back to per-100g
    const servingSize = p.serving_quantity ?? 100;
    const unit = p.serving_size?.includes('g') ? 'g' : p.serving_size?.includes('ml') ? 'ml' : 'g';

    return {
      name: p.product_name ?? 'Unknown Product',
      brand: p.brands ?? null,
      servingSize,
      servingUnit: unit,
      calories: Math.round(n?.['energy-kcal_serving'] ?? n?.['energy-kcal_100g'] ?? 0),
      protein: Math.round((n?.proteins_serving ?? n?.proteins_100g ?? 0) * 10) / 10,
      carbs: Math.round((n?.carbohydrates_serving ?? n?.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((n?.fat_serving ?? n?.fat_100g ?? 0) * 10) / 10,
      fiber: n?.fiber_serving ?? n?.fiber_100g ?? null,
      sugar: n?.sugars_serving ?? n?.sugars_100g ?? null,
      sodium: n?.sodium_serving ?? n?.sodium_100g ?? null,
      imageUrl: p.image_url ?? null,
      barcode,
      openFoodFactsId: p._id ?? barcode,
    };
  } catch {
    return null;
  }
}
