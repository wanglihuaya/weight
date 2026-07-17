import { ensureSilentLogin } from './auth'
import { callCloudFunction } from './cloud'

export type WeightUnit = 'kg' | 'lb'
export type WeightIndicator = 'classic' | 'compact'
export type WeekStart = 'monday' | 'sunday'

export interface UserSettings {
  baselineWeight: number
  targetWeight: number
  heightCm: number
  unit: WeightUnit
  indicator: WeightIndicator
  weekStart: WeekStart
  weightReminderEnabled: boolean
  weightReminderTime: string
  milestoneReminderEnabled: boolean
}

export type UserSettingsPatch = Partial<UserSettings>

export const DEFAULT_USER_SETTINGS: UserSettings = {
  baselineWeight: 67,
  targetWeight: 66.5,
  heightCm: 172,
  unit: 'kg',
  indicator: 'classic',
  weekStart: 'monday',
  weightReminderEnabled: false,
  weightReminderTime: '08:00',
  milestoneReminderEnabled: true,
}

function normalizeSettings(settings?: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
  }
}

export async function getUserSettings() {
  await ensureSilentLogin()
  const result = await callCloudFunction<{ settings?: Partial<UserSettings> }>('user-settings', {
    action: 'get',
  })

  return normalizeSettings(result.settings)
}

export async function saveUserSettings(settings: UserSettingsPatch) {
  await ensureSilentLogin()
  const result = await callCloudFunction<{ settings?: Partial<UserSettings> }>('user-settings', {
    action: 'update',
    settings,
  })

  return normalizeSettings(result.settings)
}
