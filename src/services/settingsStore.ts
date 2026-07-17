import { ref } from 'wevu'

import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  saveUserSettings,
  type UserSettings,
  type UserSettingsPatch,
} from './settingsApi'

export const cloudUserSettings = ref<UserSettings>({ ...DEFAULT_USER_SETTINGS })
export const cloudUserSettingsReady = ref(false)
export const cloudUserSettingsLoading = ref(false)
export const cloudUserSettingsSaving = ref(false)
export const cloudUserSettingsError = ref('')

let refreshPromise: Promise<UserSettings> | null = null

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return '同步设置失败'
}

export async function refreshUserSettings(force = false) {
  if (refreshPromise && !force) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    cloudUserSettingsLoading.value = true
    cloudUserSettingsError.value = ''

    try {
      cloudUserSettings.value = await getUserSettings()
      cloudUserSettingsReady.value = true
      return cloudUserSettings.value
    }
    catch (error) {
      cloudUserSettingsError.value = resolveErrorMessage(error)
      throw error
    }
    finally {
      cloudUserSettingsLoading.value = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function updateUserSettings(patch: UserSettingsPatch) {
  if (cloudUserSettingsSaving.value) {
    return cloudUserSettings.value
  }

  cloudUserSettingsSaving.value = true
  cloudUserSettingsError.value = ''

  try {
    cloudUserSettings.value = await saveUserSettings(patch)
    cloudUserSettingsReady.value = true
    return cloudUserSettings.value
  }
  catch (error) {
    cloudUserSettingsError.value = resolveErrorMessage(error)
    throw error
  }
  finally {
    cloudUserSettingsSaving.value = false
  }
}
