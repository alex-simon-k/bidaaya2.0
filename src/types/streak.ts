export enum VisibilityTier {
  INVISIBLE = 'Invisible',
  VISIBLE = 'Visible',
  RISING_STAR = 'Rising Star',
  TOP_TALENT = 'Top Talent'
}

export interface DailyPick {
  id: string
  role: string
  company: string
  logo: string // URL or placeholder initials
  applied: boolean
}

export interface StreakState {
  currentStreak: number
  maxStreak: number
  visibilityMultiplier: number
  tier: VisibilityTier
  dailyPicks: DailyPick[]
  totalApplications: number
  history: number[] // Array of application counts for the last 28 days
}

