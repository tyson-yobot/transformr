CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  serving_size NUMERIC NOT NULL,
  serving_unit TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  fiber NUMERIC, sugar NUMERIC, sodium NUMERIC,
  saturated_fat NUMERIC, trans_fat NUMERIC,
  cholesterol NUMERIC, potassium NUMERIC,
  barcode TEXT,
  open_food_facts_id TEXT,
  image_url TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','shake','pre_workout','post_workout')),
  is_shared BOOLEAN DEFAULT false,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  prep_time_minutes INTEGER,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id UUID REFERENCES saved_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  saved_meal_id UUID REFERENCES saved_meals(id),
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','shake','pre_workout','post_workout')),
  quantity NUMERIC NOT NULL DEFAULT 1,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  source TEXT CHECK (source IN ('manual','camera','barcode','voice','saved_meal','menu_scan')) DEFAULT 'manual',
  photo_url TEXT,
  ai_confidence NUMERIC,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_oz NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  times TEXT[],
  category TEXT CHECK (category IN ('protein','creatine','vitamin','mineral','amino_acid','pre_workout','post_workout','sleep','other')),
  is_ai_recommended BOOLEAN DEFAULT false,
  ai_recommendation_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_prep_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id),
  week_start DATE NOT NULL,
  total_prep_time_minutes INTEGER,
  grocery_list JSONB,
  total_estimated_cost NUMERIC,
  meals JSONB,
  prep_instructions JSONB,
  container_plan JSONB,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_prep_plan_id UUID REFERENCES meal_prep_plans(id),
  week_start DATE,
  items JSONB NOT NULL,
  total_estimated_cost NUMERIC,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
