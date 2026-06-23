export type DrinkType = 'matcha' | 'bubble_tea' | 'coffee' | 'juice' | 'other'

export const DRINK_LABELS: Record<DrinkType, string> = {
  matcha: 'Matcha',
  bubble_tea: 'Bubble Tea',
  coffee: 'Coffee',
  juice: 'Juice',
  other: 'Other',
}

export const DRINK_EMOJIS: Record<DrinkType, string> = {
  matcha: '🍵',
  bubble_tea: '🧋',
  coffee: '☕',
  juice: '🧃',
  other: '🥤',
}

export interface Drink {
  id: string
  user_id: string
  type: DrinkType
  sugar_grams: number
  price: number
  image_url?: string
  shop_name?: string        // V2
  sugar_percentage?: number // V2
  is_public: boolean        // V2
  consumed_at: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  created_at: string
}

export interface MonthlyStats {
  total_sugar: number
  total_spent: number
  drink_count: number
}

export interface WeeklyData {
  day: string
  sugar_grams: number
}
