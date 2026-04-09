# Phase 05 — Nutrition AI Suite

> **Superpower Module Design Specification**
> Status: Ready for Build | Priority: Phase 5

---

## Overview

A comprehensive AI-powered nutrition engine that transforms manual food logging into natural language parsing, generates recipes from remaining macros and pantry contents, builds weekly meal plans, auto-adjusts daily macros based on training day type, and provides equipment/injury-aware exercise substitutions during workouts.

Five sub-features:

1. **NLP Food Logging** — Natural language to structured nutrition data
2. **AI Recipe Generator** — Generate recipes from remaining macros + pantry
3. **Weekly Meal Plans** — 7-day meal plan generation
4. **Macro Cycling** — Auto-adjust daily macros based on training day type
5. **AI Exercise Substitution** — Equipment/injury-aware exercise alternatives

---

## Architecture

- **5 Edge Functions** handling NLP parsing, recipe generation, meal planning, macro cycling, and exercise substitution
- **3 new database tables**: `ai_meal_plans`, `user_pantry`, `ai_recipes`
- **5 AI service modules** in `services/ai/` wrapping Edge Function invocations
- **3 Zustand stores** for nutrition AI state, meal plans, and exercise substitutions
- **5 hooks** composing stores with UI logic
- **6 components/screens** for food input, recipes, meal plans, macro banners, substitution sheets, and pantry management
- All AI calls use `claude-sonnet-4-20250514`

---

## Database

### Migration: `00030_nutrition_ai.sql`

```sql
-- =============================================================================
-- TRANSFORMR — Phase 5: Nutrition AI Suite
-- Migration: 00030_nutrition_ai.sql
-- Tables: ai_meal_plans, user_pantry, ai_recipes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ai_meal_plans — AI-generated weekly meal plans
-- ---------------------------------------------------------------------------
CREATE TABLE ai_meal_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start  DATE NOT NULL,
  plan        JSONB NOT NULL,
  -- plan shape: {
  --   days: [{
  --     date: string,
  --     meals: [{
  --       name: string,
  --       foods: [{
  --         name: string, quantity: number, unit: string,
  --         calories: number, protein: number, carbs: number, fat: number
  --       }],
  --       totalCalories: number, totalProtein: number,
  --       totalCarbs: number, totalFat: number
  --     }]
  --   }]
  -- }
  preferences JSONB,          -- dietary restrictions, cuisine preferences, budget
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- user_pantry — User's pantry inventory for recipe generation
-- ---------------------------------------------------------------------------
CREATE TABLE user_pantry (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name   TEXT NOT NULL,
  category    TEXT,            -- protein, carb, fat, vegetable, fruit, dairy, spice, other
  quantity    NUMERIC,
  unit        TEXT,
  expires_at  DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ai_recipes — AI-generated recipes saved by the user
-- ---------------------------------------------------------------------------
CREATE TABLE ai_recipes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  ingredients     JSONB NOT NULL,      -- [{ name, quantity, unit }]
  instructions    JSONB NOT NULL,      -- array of step strings
  nutrition       JSONB NOT NULL,      -- { calories, protein, carbs, fat, fiber, sodium }
  prep_time_min   INTEGER,
  cook_time_min   INTEGER,
  servings        INTEGER DEFAULT 1,
  tags            JSONB,               -- ['high-protein', 'low-carb', 'quick', etc.]
  is_favorite     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE ai_meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own meal plans" ON ai_meal_plans FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_pantry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own pantry" ON user_pantry FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ai_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own recipes" ON ai_recipes FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_meal_plans_user_week ON ai_meal_plans(user_id, week_start);
CREATE INDEX idx_pantry_user ON user_pantry(user_id);
CREATE INDEX idx_recipes_user ON ai_recipes(user_id, created_at DESC);
```

---

## TypeScript Types

Add to `types/ai.ts`:

```typescript
// =============================================================================
// Phase 5: Nutrition AI Suite Types
// =============================================================================

/** A single food item parsed from natural language input. */
export interface ParsedFood {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Macro targets used across meal planning and cycling. */
export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** An AI-generated recipe with full nutrition breakdown. */
export interface AiRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  tags: string[];
  isFavorite: boolean;
}

/** A complete 7-day meal plan. */
export interface MealPlan {
  id: string;
  weekStart: string;
  days: MealPlanDay[];
  preferences?: MealPlanPreferences;
  status: 'active' | 'archived';
}

/** A single day within a meal plan. */
export interface MealPlanDay {
  date: string;
  meals: MealPlanMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

/** A single meal within a meal plan day. */
export interface MealPlanMeal {
  name: string;
  foods: ParsedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

/** User preferences for meal plan generation. */
export interface MealPlanPreferences {
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  budget?: 'low' | 'medium' | 'high';
  mealsPerDay?: number;
  cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
}

/** Daily macro targets with optional training-day adjustments. */
export interface DailyMacroTargets {
  date: string;
  trainingType: 'training' | 'rest' | 'deload';
  baseMacros: MacroTargets;
  adjustedMacros: MacroTargets;
}

/** An alternative exercise suggestion. */
export interface ExerciseSubstitution {
  name: string;
  equipmentNeeded: string[];
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
}

/** A pantry item tracked by the user. */
export interface PantryItem {
  id: string;
  itemName: string;
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'spice' | 'other';
  quantity?: number;
  unit?: string;
  expiresAt?: string;
}

/** Request payload for NLP food parsing. */
export interface NLPFoodRequest {
  text: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

/** Response from the NLP food parsing edge function. */
export interface NLPFoodResponse {
  foods: ParsedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

/** Request payload for recipe generation. */
export interface RecipeGeneratorRequest {
  remainingMacros: MacroTargets;
  pantryItems?: string[];
  dietaryRestrictions?: string[];
  cuisinePreference?: string;
  maxPrepTime?: number;
}

/** Request payload for weekly meal plan generation. */
export interface MealPlanGeneratorRequest {
  weekStart: string;
  dailyTargets: MacroTargets;
  preferences: MealPlanPreferences;
}

/** Response from the macro cycling edge function. */
export interface MacroCyclingResponse {
  date: string;
  trainingType: 'training' | 'rest' | 'deload';
  baseMacros: MacroTargets;
  adjustedMacros: MacroTargets;
  explanation: string;
}

/** Request payload for exercise substitution. */
export interface ExerciseSubstitutionRequest {
  exerciseId: string;
  reason: 'equipment' | 'injury' | 'preference';
  availableEquipment?: string[];
  injuredArea?: string;
}

/** Response from the exercise substitution edge function. */
export interface ExerciseSubstitutionResponse {
  originalExercise: string;
  substitutions: ExerciseSubstitution[];
}
```

---

## Edge Function 1: `ai-natural-language-food/index.ts`

Parses natural language food descriptions into structured nutrition data.

- **Accepts:** `{ text: string, mealType?: string }`
- **Auth:** User-scoped Supabase client via forwarded `Authorization` header
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 2048`
- **System prompt:**

```
You are a nutrition data parser. Parse the user's food description into a JSON array
of individual food items. For each food item, provide:
- name: descriptive food name
- quantity: numeric amount
- unit: measurement unit (g, oz, cup, slice, piece, tbsp, etc.)
- calories: estimated calories (use USDA-standard values)
- protein: grams of protein
- carbs: grams of carbohydrates
- fat: grams of fat

Be generous with portion estimation when ambiguous. If quantity is not specified,
assume a standard serving size. Always return valid JSON.

Output format: { "foods": [...], "totalCalories": N, "totalProtein": N, "totalCarbs": N, "totalFat": N }
```

- **Example input:** `"2 eggs, slice of toast with butter, and a coffee with cream"`
- **Example output:**

```json
{
  "foods": [
    { "name": "Large egg", "quantity": 2, "unit": "piece", "calories": 156, "protein": 12.6, "carbs": 1.1, "fat": 10.6 },
    { "name": "White toast", "quantity": 1, "unit": "slice", "calories": 79, "protein": 2.7, "carbs": 14.3, "fat": 1.0 },
    { "name": "Butter", "quantity": 1, "unit": "tbsp", "calories": 102, "protein": 0.1, "carbs": 0, "fat": 11.5 },
    { "name": "Coffee with cream", "quantity": 1, "unit": "cup", "calories": 52, "protein": 0.8, "carbs": 0.9, "fat": 5.3 }
  ],
  "totalCalories": 389,
  "totalProtein": 16.2,
  "totalCarbs": 16.3,
  "totalFat": 28.4
}
```

- **Returns:** `NLPFoodResponse`
- **Fallback:** If Claude is unavailable, return `{ error: "ai_unavailable" }` so the client can prompt the user to use manual food search
- **Error handling:** 401 (auth), 400 (empty text), 500 (unexpected)

---

## Edge Function 2: `ai-recipe-generator/index.ts`

Generates a recipe that fits within remaining daily macros, optionally using pantry items.

- **Accepts:** `{ remainingMacros: MacroTargets, pantryItems?: string[], dietaryRestrictions?: string[], cuisinePreference?: string, maxPrepTime?: number }`
- **Auth:** User-scoped Supabase client via forwarded `Authorization` header
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 4096`
- **System prompt:**

```
You are a recipe generator for a fitness-focused nutrition app. Generate a single recipe
that fits within the user's remaining daily macro targets.

Constraints:
- The recipe's total macros must not exceed the remaining targets
- Use available pantry items when possible (listed below)
- Respect all dietary restrictions
- If a cuisine preference is given, match it
- If a max prep time is given, stay within it

Output JSON with this exact structure:
{
  "title": "Recipe Name",
  "description": "Brief appetizing description",
  "ingredients": [{ "name": "...", "quantity": N, "unit": "..." }],
  "instructions": ["Step 1...", "Step 2...", ...],
  "nutrition": { "calories": N, "protein": N, "carbs": N, "fat": N, "fiber": N, "sodium": N },
  "prep_time_min": N,
  "cook_time_min": N,
  "servings": N,
  "tags": ["high-protein", "quick", ...]
}
```

- **Returns:** Full `AiRecipe` object (minus `id` and `isFavorite`, which are set client-side)
- **Post-processing:** The Edge Function inserts the recipe into `ai_recipes` and returns the full row with `id`
- **Error handling:** 401 (auth), 400 (missing macros), 500 (unexpected)

---

## Edge Function 3: `ai-meal-plan-weekly/index.ts`

Generates a complete 7-day meal plan with 3-5 meals per day hitting macro targets.

- **Accepts:** `{ weekStart: string, dailyTargets: MacroTargets, preferences: MealPlanPreferences }`
- **Auth:** User-scoped Supabase client via forwarded `Authorization` header
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 8192`
- **System prompt:**

```
You are a meal planning AI for a fitness-focused nutrition app. Create a complete 7-day
meal plan starting from the given date.

Rules:
- Each day must hit the calorie and macro targets (within 5% tolerance)
- Include 3-5 meals per day (breakfast, lunch, dinner, and optional snacks)
- Vary meals across days — no identical meals on consecutive days
- Use practical, commonly available ingredients
- Consider the user's dietary preferences and restrictions
- Balance meal prep effort across the week (some quick meals, some cooked)

Output JSON:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "name": "Breakfast",
          "foods": [{ "name": "...", "quantity": N, "unit": "...", "calories": N, "protein": N, "carbs": N, "fat": N }],
          "totalCalories": N, "totalProtein": N, "totalCarbs": N, "totalFat": N
        }
      ]
    }
  ]
}
```

- **Trigger:** Sunday cron job OR manual user request
- **Post-processing:** The Edge Function archives any existing `active` meal plan for the user, then inserts the new plan into `ai_meal_plans`
- **Returns:** Full `MealPlan` object with `id`
- **Error handling:** 401 (auth), 400 (missing targets), 500 (unexpected)

---

## Edge Function 4: `ai-macro-cycling/index.ts`

Auto-adjusts daily macro targets based on tomorrow's training schedule.

- **Accepts:** `{ userId: string }` (cron job, uses service role)
- **Auth:** Service role (cron invocation)
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 2048`
- **Logic:**

```
1. Query tomorrow's workout schedule for the user
2. Determine training type:
   - Has workout scheduled → 'training'
   - No workout scheduled → 'rest'
   - Deload week flagged → 'deload'
3. Fetch user's base macro targets from profile
4. Apply adjustments:
   - Training days: +20% carbs, -10% fat, protein unchanged, recalculate calories
   - Rest days: -15% carbs, +5% fat, protein unchanged, recalculate calories
   - Deload days: maintenance (no adjustment)
5. Return adjusted targets
```

- **System prompt** (for generating the explanation string only):

```
You are a sports nutritionist. Given the user's training schedule for tomorrow and
their base macro targets, explain in 1-2 sentences why their macros have been adjusted
for the day. Be encouraging and specific about the training type.
```

- **Returns:** `MacroCyclingResponse`
- **Post-processing:** Updates the user's daily macro targets (stored in the user's profile or a daily settings row)
- **Error handling:** Logs errors, skips user on failure, continues to next user in batch

---

## Edge Function 5: `ai-exercise-substitution/index.ts`

Returns 3 alternative exercises with similar muscle activation patterns.

- **Accepts:** `{ exerciseId: string, reason: 'equipment' | 'injury' | 'preference', availableEquipment?: string[], injuredArea?: string }`
- **Auth:** User-scoped Supabase client via forwarded `Authorization` header
- **Model:** `claude-sonnet-4-20250514`, `max_tokens: 2048`
- **Logic:**

```
1. Look up the original exercise by ID (name, muscle groups, equipment)
2. Build context-specific prompt based on reason:
   - equipment: "User doesn't have [equipment]. Available: [list]"
   - injury: "User has an injury in [area]. Avoid exercises that stress this area."
   - preference: "User prefers a different exercise targeting the same muscles."
3. Call Claude for 3 alternatives
```

- **System prompt:**

```
You are an exercise science expert. Suggest exactly 3 exercise substitutions for the
given exercise. Each substitution must:
- Target the same primary muscle groups
- Maintain a similar movement pattern (push/pull/hinge/squat/carry)
- If reason is injury, avoid any movement that could aggravate the injured area
- If reason is equipment, only suggest exercises using the available equipment

Output JSON array:
[
  {
    "name": "Exercise Name",
    "equipmentNeeded": ["dumbbell", "bench"],
    "muscleGroups": ["chest", "triceps"],
    "difficulty": "intermediate",
    "explanation": "Brief explanation of why this is a good substitute"
  }
]
```

- **Returns:** `ExerciseSubstitutionResponse`
- **Error handling:** 401 (auth), 400 (missing exerciseId), 404 (exercise not found), 500 (unexpected)

---

## AI Services

### 1. `services/ai/nlpFood.ts`

```typescript
import { supabase } from '../supabase';
import type { NLPFoodRequest, NLPFoodResponse } from '../../types/ai';

/**
 * Parse natural language food description into structured nutrition data.
 * Falls back to manual entry prompt if AI is unavailable.
 */
export async function parseNaturalLanguageFood(
  text: string,
  mealType?: NLPFoodRequest['mealType']
): Promise<NLPFoodResponse> {
  const { data, error } = await supabase.functions.invoke('ai-natural-language-food', {
    body: { text, mealType },
  });
  if (error) throw new Error(error.message);
  return data as NLPFoodResponse;
}
```

### 2. `services/ai/recipeGenerator.ts`

```typescript
import { supabase } from '../supabase';
import type { RecipeGeneratorRequest, AiRecipe } from '../../types/ai';

/** Generate a recipe fitting remaining macros. */
export async function generateRecipe(params: RecipeGeneratorRequest): Promise<AiRecipe> {
  const { data, error } = await supabase.functions.invoke('ai-recipe-generator', {
    body: params,
  });
  if (error) throw new Error(error.message);
  return data as AiRecipe;
}

/** Fetch all saved AI-generated recipes for the current user. */
export async function getRecipes(): Promise<AiRecipe[]> {
  const { data, error } = await supabase
    .from('ai_recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRecipeRow);
}

/** Toggle the favorite status of a recipe. */
export async function toggleFavorite(id: string): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('ai_recipes')
    .select('is_favorite')
    .eq('id', id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from('ai_recipes')
    .update({ is_favorite: !current.is_favorite })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

function mapRecipeRow(row: Record<string, unknown>): AiRecipe {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    ingredients: row.ingredients as AiRecipe['ingredients'],
    instructions: row.instructions as string[],
    nutrition: row.nutrition as AiRecipe['nutrition'],
    prepTimeMin: row.prep_time_min as number,
    cookTimeMin: row.cook_time_min as number,
    servings: row.servings as number,
    tags: (row.tags as string[]) ?? [],
    isFavorite: row.is_favorite as boolean,
  };
}
```

### 3. `services/ai/mealPlan.ts`

```typescript
import { supabase } from '../supabase';
import type { MealPlanGeneratorRequest, MealPlan } from '../../types/ai';

/** Generate a new 7-day meal plan. */
export async function generateMealPlan(params: MealPlanGeneratorRequest): Promise<MealPlan> {
  const { data, error } = await supabase.functions.invoke('ai-meal-plan-weekly', {
    body: params,
  });
  if (error) throw new Error(error.message);
  return data as MealPlan;
}

/** Fetch all meal plans for the current user. */
export async function getMealPlans(): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('ai_meal_plans')
    .select('*')
    .order('week_start', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMealPlanRow);
}

/** Archive a meal plan by setting its status to 'archived'. */
export async function archiveMealPlan(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_meal_plans')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

function mapMealPlanRow(row: Record<string, unknown>): MealPlan {
  const plan = row.plan as Record<string, unknown>;
  return {
    id: row.id as string,
    weekStart: row.week_start as string,
    days: (plan.days as MealPlan['days']) ?? [],
    preferences: row.preferences as MealPlan['preferences'],
    status: row.status as MealPlan['status'],
  };
}
```

### 4. `services/ai/macroCycling.ts`

```typescript
import { supabase } from '../supabase';
import type { MacroCyclingResponse } from '../../types/ai';

/** Fetch today's adjusted macros based on training schedule. */
export async function getAdjustedMacros(): Promise<MacroCyclingResponse> {
  const { data, error } = await supabase.functions.invoke('ai-macro-cycling', {
    body: {},
  });
  if (error) throw new Error(error.message);
  return data as MacroCyclingResponse;
}

/** Manually trigger macro cycling recalculation. */
export async function triggerMacroCycling(): Promise<MacroCyclingResponse> {
  const { data, error } = await supabase.functions.invoke('ai-macro-cycling', {
    body: { manual: true },
  });
  if (error) throw new Error(error.message);
  return data as MacroCyclingResponse;
}
```

### 5. `services/ai/exerciseSubstitution.ts`

```typescript
import { supabase } from '../supabase';
import type {
  ExerciseSubstitutionRequest,
  ExerciseSubstitutionResponse,
} from '../../types/ai';

/** Get 3 exercise substitutions for a given exercise. */
export async function getSubstitutions(
  exerciseId: string,
  reason: ExerciseSubstitutionRequest['reason'],
  options?: {
    availableEquipment?: string[];
    injuredArea?: string;
  }
): Promise<ExerciseSubstitutionResponse> {
  const { data, error } = await supabase.functions.invoke('ai-exercise-substitution', {
    body: {
      exerciseId,
      reason,
      availableEquipment: options?.availableEquipment,
      injuredArea: options?.injuredArea,
    },
  });
  if (error) throw new Error(error.message);
  return data as ExerciseSubstitutionResponse;
}
```

---

## Stores

### `stores/nutritionAiStore.ts`

Combined store for NLP food logging state and pantry management.

Zustand with explicit State/Actions pattern + AsyncStorage persistence (partialize excludes transient state).

#### State

| Field | Type | Persisted |
|-------|------|-----------|
| `parsedFoods` | `ParsedFood[]` | No |
| `isParsing` | `boolean` | No |
| `parseError` | `string \| null` | No |
| `pantryItems` | `PantryItem[]` | Yes |
| `isPantryLoading` | `boolean` | No |
| `pantryError` | `string \| null` | No |
| `lastNLPInput` | `string` | No |

#### Actions

| Action | Description |
|--------|-------------|
| `parseFood(text, mealType?)` | Call NLP edge function, set `parsedFoods` on success |
| `clearParsedFoods()` | Reset parsed results |
| `confirmParsedFoods(mealType)` | Log confirmed foods via existing `nutritionStore.logFood()` |
| `editParsedFood(index, food)` | Update a single parsed food item before confirmation |
| `removeParsedFood(index)` | Remove a single parsed food item |
| `fetchPantry()` | Load pantry items from Supabase |
| `addPantryItem(item)` | Insert a new pantry item |
| `updatePantryItem(id, updates)` | Update an existing pantry item |
| `removePantryItem(id)` | Delete a pantry item |
| `clearError()` | Dismiss error state |
| `reset()` | Full state reset |

### `stores/mealPlanStore.ts`

Meal plan and recipe management store.

#### State

| Field | Type | Persisted |
|-------|------|-----------|
| `activeMealPlan` | `MealPlan \| null` | Yes |
| `mealPlanHistory` | `MealPlan[]` | Yes |
| `recipes` | `AiRecipe[]` | Yes |
| `isGeneratingPlan` | `boolean` | No |
| `isGeneratingRecipe` | `boolean` | No |
| `isLoading` | `boolean` | No |
| `error` | `string \| null` | No |
| `selectedDayIndex` | `number` | No |
| `adjustedMacros` | `MacroCyclingResponse \| null` | Yes |
| `isMacroLoading` | `boolean` | No |

#### Actions

| Action | Description |
|--------|-------------|
| `generateMealPlan(params)` | Call meal plan edge function, set `activeMealPlan` |
| `fetchMealPlans()` | Load all plans from Supabase |
| `archiveMealPlan(id)` | Archive a plan, refresh list |
| `setSelectedDay(index)` | Navigate to a specific day in the plan |
| `generateRecipe(params)` | Call recipe edge function, add to `recipes` |
| `fetchRecipes()` | Load all recipes from Supabase |
| `toggleRecipeFavorite(id)` | Toggle favorite status |
| `fetchAdjustedMacros()` | Load today's cycling-adjusted macros |
| `triggerMacroCycling()` | Manually recalculate macro cycling |
| `clearError()` | Dismiss error state |
| `reset()` | Full state reset |

### `stores/exerciseSubstitutionStore.ts`

Substitution results and history.

#### State

| Field | Type | Persisted |
|-------|------|-----------|
| `substitutions` | `ExerciseSubstitution[]` | No |
| `originalExercise` | `string \| null` | No |
| `isLoading` | `boolean` | No |
| `error` | `string \| null` | No |
| `history` | `{ exerciseId: string; substitutions: ExerciseSubstitution[]; timestamp: string }[]` | Yes |

#### Actions

| Action | Description |
|--------|-------------|
| `fetchSubstitutions(exerciseId, reason, options?)` | Call edge function, set results |
| `selectSubstitution(index)` | Mark a substitution as selected for the workout |
| `clearSubstitutions()` | Reset current results |
| `clearError()` | Dismiss error state |
| `reset()` | Full state reset |

---

## Hooks

### `hooks/useNLPFoodLog.ts`

Composes `nutritionAiStore` with input state management and confirm/edit flow.

- Manages text input state for the NLP input field
- Calls `parseFood()` on submit
- Provides `confirmAll()` to log all parsed foods at once
- Provides `editFood(index)` to modify individual items before confirmation
- Returns: `{ text, setText, parsedFoods, isParsing, parseError, submit, confirmAll, editFood, removeFood, clear }`

### `hooks/useRecipeGenerator.ts`

Composes `mealPlanStore` with remaining macro calculation from `nutritionStore`.

- Calculates remaining macros by subtracting today's logged macros from daily targets
- Calls `generateRecipe()` with remaining macros and optional pantry items
- Returns: `{ remainingMacros, generateRecipe, recipes, isGenerating, fetchRecipes, toggleFavorite }`

### `hooks/useMealPlan.ts`

Composes `mealPlanStore` with day navigation and current plan state.

- Provides swipeable day navigation (prev/next)
- Derives `currentDay` from `selectedDayIndex`
- Returns: `{ activePlan, currentDay, selectedDayIndex, nextDay, prevDay, generatePlan, isGenerating, archivePlan, mealPlanHistory }`

### `hooks/useMacroCycling.ts`

Composes `mealPlanStore` for today's adjusted macros display.

- Fetches adjusted macros on mount
- Derives training type label (Training Day / Rest Day / Deload)
- Returns: `{ adjustedMacros, trainingType, isLoading, refresh }`

### `hooks/useExerciseSubstitution.ts`

Composes `exerciseSubstitutionStore` for in-workout substitution flow.

- Designed for use within the workout active session screen
- Returns: `{ substitutions, originalExercise, isLoading, error, fetchSubstitutions, selectSubstitution, clear }`

---

## Components / Screens

### `NLPFoodInput` (`components/nutrition/NLPFoodInput.tsx`)

Natural language food input with parsed results confirmation.

- **Text input** with mic icon (future voice support placeholder), multiline, placeholder: "Describe what you ate..."
- **Submit button** triggers NLP parsing
- **Loading state:** Skeleton shimmer while parsing
- **Parsed results list:** Renders each `ParsedFood` as an editable row
  - Tap food name to edit inline
  - Swipe to delete individual items
  - Each row shows: name, quantity+unit, calories, P/C/F mini-bars
- **Totals bar** at bottom: total calories, protein, carbs, fat
- **Confirm button:** Logs all foods to nutrition store, shows success haptic
- **Error state:** "AI unavailable" banner with "Log manually" link to existing `add-food` screen
- Uses `useTheme()` for all colors

### `RecipeCard` (`components/nutrition/RecipeCard.tsx`)

Recipe preview card with macro summary.

- **Collapsed state:** Title, prep time badge, macro summary row (cal/P/C/F), favorite heart icon
- **Expanded state (tap):** Full ingredient list, step-by-step instructions, nutrition breakdown, tags as chips
- Favorite toggle with haptic feedback
- `FadeInDown` entrance animation via Reanimated
- Uses `useTheme()` for all colors

### `MealPlanView` (`components/nutrition/MealPlanView.tsx`)

Day-by-day meal plan viewer with swipeable navigation.

- **Day header:** Date + day of week, macro target progress ring
- **Meal cards:** Grouped by meal name (Breakfast, Lunch, Dinner, Snacks)
  - Each meal shows food list with macros
  - Tap meal to expand full food details
- **Swipeable days:** Horizontal swipe or day-dot indicator to navigate between days
- **Day summary footer:** Total calories vs target, macro bars
- **Empty state:** "Generate a meal plan" CTA button
- Uses `useTheme()` for all colors

### `MacroCyclingBanner` (`components/nutrition/MacroCyclingBanner.tsx`)

Inline banner showing today's adjusted macros with training type context.

- **Training Day:** Green accent, dumbbell icon, "+20% carbs for training fuel"
- **Rest Day:** Blue accent, moon icon, "Recovery day macros adjusted"
- **Deload:** Yellow accent, pause icon, "Deload week -- maintenance macros"
- Shows adjusted vs base macro comparison (e.g., "Carbs: 250g -> 300g")
- Dismissible with swipe
- Renders at top of nutrition dashboard screen
- Uses `useTheme()` for all colors

### `ExerciseSubstitutionSheet` (`components/workout/ExerciseSubstitutionSheet.tsx`)

Bottom sheet presenting 3 alternative exercises during an active workout.

- **Trigger:** "Can't do this?" button on exercise detail during workout
- **Header:** Original exercise name + reason selector (Equipment / Injury / Preference)
- **Three cards**, each showing:
  - Exercise name
  - Equipment needed (icon chips)
  - Muscle groups targeted
  - Difficulty badge
  - 1-line explanation
- **Select button** on each card swaps the exercise in the active workout
- **Close** dismisses without changes
- Uses `react-native-gesture-handler` bottom sheet
- Haptic feedback on selection
- Uses `useTheme()` for all colors

### `PantryScreen` (`app/(tabs)/nutrition/pantry.tsx`)

Full-screen pantry management.

- **Category tabs:** All, Protein, Carbs, Fat, Vegetables, Fruit, Dairy, Spices, Other
- **Item list:** Grouped by category, each showing name, quantity, unit, expiry date
  - Expiry date badge turns red when within 3 days
  - Swipe to delete
- **Add button:** Bottom FAB opens inline form (name, category picker, quantity, unit, expiry date)
- **Search bar** at top for filtering items
- **Empty state:** "Add items to your pantry to get smarter recipe suggestions"
- Uses `useTheme()` for all colors

---

## Screen Integration Points

| Existing Screen | New Component | Placement |
|----------------|--------------|-----------|
| `nutrition/index.tsx` | `NLPFoodInput` | Above existing food log, collapsible section |
| `nutrition/index.tsx` | `MacroCyclingBanner` | Top of screen, above macro rings |
| `nutrition/meal-plans.tsx` | `MealPlanView` | Main content area |
| `nutrition/index.tsx` | RecipeCard (recent) | "AI Recipes" horizontal scroll section |
| Workout active session | `ExerciseSubstitutionSheet` | Bottom sheet triggered from exercise detail |
| `nutrition/_layout.tsx` | Pantry tab | New tab in nutrition section |

---

## Data Flow

### NLP Food Logging Flow

```
User types "chicken breast with rice and broccoli"
  -> useNLPFoodLog.submit()
  -> nutritionAiStore.parseFood(text)
  -> supabase.functions.invoke('ai-natural-language-food')
    -> Edge function: auth check
    -> Build prompt with food text
    -> Call Claude (max_tokens: 2048)
    -> Parse JSON response with fallback
  -> Return NLPFoodResponse
  -> Store sets parsedFoods
  -> NLPFoodInput renders editable food list
  -> User reviews, edits if needed
  -> User taps "Confirm"
  -> nutritionAiStore.confirmParsedFoods(mealType)
  -> Each food logged via nutritionStore.logFood()
  -> Clear parsed foods, show success
```

### Recipe Generation Flow

```
User taps "Generate Recipe"
  -> useRecipeGenerator calculates remainingMacros
  -> mealPlanStore.generateRecipe(params)
  -> supabase.functions.invoke('ai-recipe-generator')
    -> Edge function: auth check
    -> Build prompt with macros + pantry + restrictions
    -> Call Claude (max_tokens: 4096)
    -> Parse recipe JSON
    -> Insert into ai_recipes table
  -> Return AiRecipe with id
  -> Store adds to recipes list
  -> RecipeCard renders with expand/collapse
```

### Meal Plan Generation Flow

```
User taps "Generate Meal Plan" (or Sunday cron fires)
  -> useMealPlan.generatePlan(params)
  -> mealPlanStore.generateMealPlan(params)
  -> supabase.functions.invoke('ai-meal-plan-weekly')
    -> Edge function: auth check (or cron service role)
    -> Archive existing active plan
    -> Build prompt with daily targets + preferences
    -> Call Claude (max_tokens: 8192)
    -> Parse 7-day plan JSON
    -> Insert into ai_meal_plans table
  -> Return MealPlan with id
  -> Store sets activeMealPlan
  -> MealPlanView renders day-by-day view
```

### Macro Cycling Flow

```
Daily cron fires (or user manually triggers)
  -> ai-macro-cycling Edge Function
    -> Query tomorrow's workout schedule
    -> Determine training type
    -> Calculate adjusted macros:
        Training: carbs * 1.20, fat * 0.90
        Rest:     carbs * 0.85, fat * 1.05
        Deload:   no change
    -> Generate explanation via Claude (max_tokens: 2048)
    -> Return MacroCyclingResponse
  -> Client fetches on app open
  -> MacroCyclingBanner displays adjusted macros
```

### Exercise Substitution Flow

```
User taps "Can't do this?" during workout
  -> ExerciseSubstitutionSheet opens
  -> User selects reason (equipment/injury/preference)
  -> useExerciseSubstitution.fetchSubstitutions(exerciseId, reason, options)
  -> exerciseSubstitutionStore.fetchSubstitutions()
  -> supabase.functions.invoke('ai-exercise-substitution')
    -> Edge function: auth check
    -> Look up original exercise
    -> Build context-specific prompt
    -> Call Claude (max_tokens: 2048)
    -> Parse 3 substitutions
  -> Return ExerciseSubstitutionResponse
  -> Sheet renders 3 alternative cards
  -> User selects one
  -> Exercise swapped in active workout session
  -> Sheet dismisses
```

---

## Build Sequence

| Step | Task | File(s) |
|------|------|---------|
| 1 | Database migration (3 tables + RLS + indexes) | `supabase/migrations/00030_nutrition_ai.sql` |
| 2 | TypeScript types | Append to `apps/mobile/types/ai.ts` |
| 3 | NLP Food edge function | `supabase/functions/ai-natural-language-food/index.ts` |
| 4 | NLP Food service | `apps/mobile/services/ai/nlpFood.ts` |
| 5 | Nutrition AI store | `apps/mobile/stores/nutritionAiStore.ts` |
| 6 | NLP Food hook | `apps/mobile/hooks/useNLPFoodLog.ts` |
| 7 | NLP Food Input component | `apps/mobile/components/nutrition/NLPFoodInput.tsx` |
| 8 | Integrate NLPFoodInput into nutrition/index.tsx | `apps/mobile/app/(tabs)/nutrition/index.tsx` |
| 9 | Exercise Substitution edge function | `supabase/functions/ai-exercise-substitution/index.ts` |
| 10 | Exercise Substitution service | `apps/mobile/services/ai/exerciseSubstitution.ts` |
| 11 | Exercise Substitution store | `apps/mobile/stores/exerciseSubstitutionStore.ts` |
| 12 | Exercise Substitution hook | `apps/mobile/hooks/useExerciseSubstitution.ts` |
| 13 | Exercise Substitution sheet component | `apps/mobile/components/workout/ExerciseSubstitutionSheet.tsx` |
| 14 | Recipe Generator edge function | `supabase/functions/ai-recipe-generator/index.ts` |
| 15 | Recipe Generator service | `apps/mobile/services/ai/recipeGenerator.ts` |
| 16 | Meal Plan store | `apps/mobile/stores/mealPlanStore.ts` |
| 17 | Recipe Generator hook | `apps/mobile/hooks/useRecipeGenerator.ts` |
| 18 | RecipeCard component | `apps/mobile/components/nutrition/RecipeCard.tsx` |
| 19 | Macro Cycling edge function | `supabase/functions/ai-macro-cycling/index.ts` |
| 20 | Macro Cycling service | `apps/mobile/services/ai/macroCycling.ts` |
| 21 | Macro Cycling hook | `apps/mobile/hooks/useMacroCycling.ts` |
| 22 | MacroCyclingBanner component | `apps/mobile/components/nutrition/MacroCyclingBanner.tsx` |
| 23 | Weekly Meal Plan edge function | `supabase/functions/ai-meal-plan-weekly/index.ts` |
| 24 | Meal Plan service | `apps/mobile/services/ai/mealPlan.ts` |
| 25 | Meal Plan hook | `apps/mobile/hooks/useMealPlan.ts` |
| 26 | MealPlanView component | `apps/mobile/components/nutrition/MealPlanView.tsx` |
| 27 | Integrate MealPlanView into meal-plans screen | `apps/mobile/app/(tabs)/nutrition/meal-plans.tsx` |
| 28 | Pantry screen | `apps/mobile/app/(tabs)/nutrition/pantry.tsx` |
| 29 | Integrate MacroCyclingBanner into nutrition/index.tsx | `apps/mobile/app/(tabs)/nutrition/index.tsx` |
| 30 | Integrate RecipeCard section into nutrition/index.tsx | `apps/mobile/app/(tabs)/nutrition/index.tsx` |
| 31 | Integrate ExerciseSubstitutionSheet into workout session | Workout active session screen |

---

## Critical Details

| Concern | Detail |
|---------|--------|
| NLP fallback | If Claude is unavailable, show "AI unavailable" with link to manual food search -- never block food logging |
| Token budgets | NLP: 2048, Recipe: 4096, Meal Plan: 8192, Macro Cycling: 2048, Substitution: 2048 |
| Meal plan archival | Only one `active` plan per user; generating a new plan auto-archives the previous one |
| Macro cycling timing | Cron runs daily at 8 PM local time to adjust tomorrow's macros |
| Pantry expiry | Items within 3 days of expiry get priority in recipe generation prompts |
| Offline behavior | NLP parsing, recipe generation, and meal plans are online-only; manual food logging always works offline |
| Parsed food editing | Users can edit any parsed food item before confirming -- never auto-log without confirmation |
| Exercise substitution context | The sheet only appears during active workout sessions, not in exercise browsing |
| State persistence | Pantry items, meal plans, recipes, and adjusted macros persist across restarts; parsed foods and substitution results do not |
| Security | All queries run through user-scoped Supabase client with RLS; macro cycling cron uses service role |
| Error degradation | Every AI feature fails silently with a user-friendly message; core nutrition logging is never blocked |

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/00030_nutrition_ai.sql` | DDL + RLS for 3 tables |
| `supabase/functions/ai-natural-language-food/index.ts` | NLP food parsing edge function |
| `supabase/functions/ai-recipe-generator/index.ts` | Recipe generation edge function |
| `supabase/functions/ai-meal-plan-weekly/index.ts` | Weekly meal plan edge function |
| `supabase/functions/ai-macro-cycling/index.ts` | Macro cycling edge function |
| `supabase/functions/ai-exercise-substitution/index.ts` | Exercise substitution edge function |
| `apps/mobile/services/ai/nlpFood.ts` | NLP food service |
| `apps/mobile/services/ai/recipeGenerator.ts` | Recipe generator service |
| `apps/mobile/services/ai/mealPlan.ts` | Meal plan service |
| `apps/mobile/services/ai/macroCycling.ts` | Macro cycling service |
| `apps/mobile/services/ai/exerciseSubstitution.ts` | Exercise substitution service |
| `apps/mobile/stores/nutritionAiStore.ts` | NLP + pantry state management |
| `apps/mobile/stores/mealPlanStore.ts` | Meal plan + recipe + macro cycling state |
| `apps/mobile/stores/exerciseSubstitutionStore.ts` | Substitution state management |
| `apps/mobile/hooks/useNLPFoodLog.ts` | NLP food logging hook |
| `apps/mobile/hooks/useRecipeGenerator.ts` | Recipe generation hook |
| `apps/mobile/hooks/useMealPlan.ts` | Meal plan navigation hook |
| `apps/mobile/hooks/useMacroCycling.ts` | Macro cycling display hook |
| `apps/mobile/hooks/useExerciseSubstitution.ts` | Exercise substitution hook |
| `apps/mobile/components/nutrition/NLPFoodInput.tsx` | NLP input + parsed results UI |
| `apps/mobile/components/nutrition/RecipeCard.tsx` | Recipe preview card |
| `apps/mobile/components/nutrition/MealPlanView.tsx` | Day-by-day meal plan viewer |
| `apps/mobile/components/nutrition/MacroCyclingBanner.tsx` | Adjusted macros banner |
| `apps/mobile/components/workout/ExerciseSubstitutionSheet.tsx` | Substitution bottom sheet |
| `apps/mobile/app/(tabs)/nutrition/pantry.tsx` | Pantry management screen |

## Files to Modify

| File | Change |
|------|--------|
| `apps/mobile/types/ai.ts` | Add 16 new interfaces/types for Phase 5 |
| `apps/mobile/app/(tabs)/nutrition/index.tsx` | Add NLPFoodInput, MacroCyclingBanner, RecipeCard section |
| `apps/mobile/app/(tabs)/nutrition/meal-plans.tsx` | Replace content with MealPlanView |
| `apps/mobile/app/(tabs)/nutrition/_layout.tsx` | Add Pantry tab |
| Workout active session screen | Add "Can't do this?" button + ExerciseSubstitutionSheet |
