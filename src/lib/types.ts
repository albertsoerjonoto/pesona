// ── Pesona skincare types ──

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';
export type SkinConcern = 'acne' | 'dark_spots' | 'dullness' | 'large_pores' | 'blackheads' | 'redness' | 'rough_texture' | 'aging';
export type SkinGoal = 'glowing' | 'clear' | 'even_tone' | 'hydrated' | 'anti_aging' | 'small_pores';
export type SensitivityLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type BudgetRange = 'under_100k' | '100k_300k' | '300k_500k' | 'over_500k';
export type RoutineType = 'morning' | 'evening';
export type ProductCategory = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'exfoliator' | 'mask' | 'eye_cream' | 'lip_care' | 'spot_treatment' | 'body_lotion' | 'other';
export type PhotoType = 'skin_face_front' | 'skin_face_left' | 'skin_face_right' | 'body_front' | 'body_side';
export type SkinFeeling = 'great' | 'good' | 'okay' | 'bad' | 'terrible';
export type RoutineGeneratedBy = 'ai' | 'manual';

export interface SkinProfile {
  id: string;
  user_id: string;
  skin_type: SkinType | null;
  concerns: SkinConcern[];
  skin_goals: SkinGoal[];
  sensitivity_level: SensitivityLevel;
  hijab_wearer: boolean;
  budget_range: BudgetRange;
  onboarding_photo_url: string | null;
  ai_skin_analysis: Record<string, unknown> | null;
  quiz_completed: boolean;
  quiz_answers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RoutineStep {
  step_number: number;
  category: ProductCategory;
  product_name: string;
  product_brand: string;
  product_id?: string;
  instruction: string;
  duration_seconds?: number;
}

export interface Routine {
  id: string;
  user_id: string;
  type: RoutineType;
  steps: RoutineStep[];
  generated_by: RoutineGeneratedBy;
  active: boolean;
  ai_reasoning: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  routine_id: string | null;
  type: RoutineType;
  date: string;
  completed_steps: number[];
  completed: boolean;
  completion_percentage: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  suitable_skin_types: SkinType[];
  addresses_concerns: SkinConcern[];
  key_ingredients: string[];
  price_idr: number | null;
  shopee_url: string | null;
  tiktok_shop_url: string | null;
  tokopedia_url: string | null;
  image_url: string | null;
  bpom_registered: boolean;
  halal_certified: boolean;
  description: string | null;
  how_to_use: string | null;
  rating_avg: number;
  created_at: string;
}

export interface PhotoProgress {
  id: string;
  user_id: string;
  photo_url: string;
  photo_type: PhotoType;
  ai_analysis: Record<string, unknown> | null;
  notes: string | null;
  taken_at: string;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  morning_routine_done: boolean;
  evening_routine_done: boolean;
  photo_uploaded: boolean;
  skin_feeling: SkinFeeling | null;
  notes: string | null;
  streak_count: number;
  created_at: string;
}

export interface AIMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, unknown>;
  image_url: string | null;
  created_at: string;
}

export interface CoachResponse {
  message: string;
  routine_suggestion?: {
    type: RoutineType;
    steps: RoutineStep[];
  } | null;
  product_recommendations?: {
    name: string;
    brand: string;
    reason: string;
    // Enriched from products table if fuzzy-match succeeded:
    product_id?: string;
    price_idr?: number;
    shopee_url?: string;
    tiktok_shop_url?: string;
    bpom_registered?: boolean;
    halal_certified?: boolean;
    image_url?: string;
  }[] | null;
  daily_tip?: string | null;
}

// LEGACY: Rajin types below — safe to remove when Pesona migration is complete.
// These power the habit tracker, food/drink logging, and friend features from Rajin.
// Pesona does not use them in new code; they exist only for backward compatibility.

export type Frequency = 'daily' | 'weekly';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DrinkType = 'water' | 'coffee' | 'tea' | 'juice' | 'soda' | 'milk' | 'smoothie' | 'other';
export type LogSource = 'manual' | 'chat';
export type Gender = 'male' | 'female';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'rejected' | 'blocked';
export type SharedHabitStatus = 'pending' | 'accepted' | 'rejected';
export type FeedEventType = 'habit_completed' | 'streak_milestone' | 'friend_added' | 'shared_habit_started' | 'shared_streak' | 'shared_streak_milestone' | 'exercise_completed' | 'calorie_goal_met' | 'protein_goal_met' | 'fat_goal_met' | 'carbs_goal_met' | 'water_goal_met';
export type Locale = 'id' | 'en';
export type DesktopLayout = 'compact' | 'expanded';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  calorie_offset_min: number;
  calorie_offset_max: number;
  date_of_birth: string | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  username: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  daily_water_goal_ml: number;
  locale: Locale;
  desktop_layout: DesktopLayout;
  skin_quiz_completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  is_active: boolean;
  is_private: boolean;
  streak_interval_days: number;
  sort_order: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  logged_at: string;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  description: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
  source: LogSource;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  calories_burned: number;
  notes: string | null;
  logged_at: string;
  source: LogSource;
  created_at: string;
}

export interface DrinkLog {
  id: string;
  user_id: string;
  date: string;
  drink_type: DrinkType;
  description: string;
  volume_ml: number;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
  source: LogSource;
  created_at: string;
}

export interface MeasurementLog {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  height_cm: number | null;
  weight_kg: number | null;
  notes: string | null;
  source: LogSource;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FriendActivity {
  activity_type: 'food' | 'exercise' | 'drink' | 'habit';
  friend_id: string;
  friend_display_name: string | null;
  friend_avatar_url: string | null;
  description: string;
  detail: string;
  logged_at: string;
}

export interface HabitWithLog extends Habit {
  completed: boolean;
  log_id?: string;
  logged_at?: string;
}

export interface SharedHabit {
  id: string;
  habit_id: string;
  owner_id: string;
  friend_id: string;
  friend_habit_id: string | null;
  status: SharedHabitStatus;
  created_at: string;
}

export interface SharedStreak {
  id: string;
  shared_habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_both_completed_date: string | null;
  updated_at: string;
}

export interface HabitStreak {
  id: string;
  user_id: string;
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

export interface FeedEvent {
  id: string;
  user_id: string;
  event_type: FeedEventType;
  data: Record<string, unknown>;
  is_private: boolean;
  created_at: string;
}

// Gemini parsing types
export interface ParsedFood {
  description: string;
  meal_type: MealType;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface ParsedExercise {
  exercise_type: string;
  duration_minutes: number;
  calories_burned: number;
  notes: string | null;
}

export interface ParsedDrink {
  description: string;
  drink_type: DrinkType;
  volume_ml: number;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface ParsedMeasurement {
  height_cm: number | null;
  weight_kg: number | null;
  notes: string | null;
}

export interface ParseResult {
  foods: ParsedFood[];
  exercises: ParsedExercise[];
  drinks: ParsedDrink[];
  measurements: ParsedMeasurement[];
}

// Chat edit types
export interface FoodEdit {
  log_id: string;
  original: { description: string; meal_type: MealType; calories: number; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
  updated: Partial<ParsedFood>;
}

export interface ExerciseEdit {
  log_id: string;
  original: { exercise_type: string; duration_minutes: number; calories_burned: number };
  updated: Partial<ParsedExercise>;
}

export interface DrinkEdit {
  log_id: string;
  original: { drink_type: DrinkType; description: string; volume_ml: number; calories: number; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
  updated: Partial<ParsedDrink>;
}

export interface MeasurementEdit {
  log_id: string;
  original: { height_cm: number | null; weight_kg: number | null; notes: string | null };
  updated: Partial<ParsedMeasurement>;
}

export interface ChatContext {
  todayFoodLogs: { index: number; id: string; description: string; meal_type: MealType; calories: number; protein_g: number | null; carbs_g: number | null; fat_g: number | null }[];
  todayExerciseLogs: { index: number; id: string; exercise_type: string; duration_minutes: number; calories_burned: number }[];
  todayDrinkLogs: { index: number; id: string; drink_type: DrinkType; description: string; volume_ml: number; calories: number; protein_g: number | null; carbs_g: number | null; fat_g: number | null }[];
  todayHabitLogs: { index: number; id: string; habit_name: string; emoji: string; completed: boolean; logged_at: string | null }[];
  todayMeasurementLogs: { index: number; id: string; height_cm: number | null; weight_kg: number | null; notes: string | null; logged_at: string }[];
  profile: {
    display_name: string | null;
    gender: string | null;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    calorieTarget: number;
    tdee: number;
    calorieGoalType: string;
    calorieRangeMin: number;
    calorieRangeMax: number;
    proteinTarget: string;
    carbsTarget: string;
    fatTarget: string;
    waterGoalMl: number;
  } | null;
  totalCalories: number;
  totalCaloriesBurned: number;
  totalDrinkCalories: number;
  totalWaterMl: number;
  waterGoalMl: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  date: string;
  role: 'user' | 'assistant';
  content: string;
  image_url: string | null;
  parsed_foods: ParsedFood[] | null;
  parsed_exercises: ParsedExercise[] | null;
  parsed_drinks: ParsedDrink[] | null;
  parsed_measurements: ParsedMeasurement[] | null;
  food_edits: FoodEdit[] | null;
  exercise_edits: ExerciseEdit[] | null;
  drink_edits: DrinkEdit[] | null;
  measurement_edits: MeasurementEdit[] | null;
  saved: boolean;
  created_at: string;
}
