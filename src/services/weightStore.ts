import { computed, ref } from 'wevu'

import { ensureSilentLogin } from './auth'
import { createWeightRecord, getWeightSummary, type CreateWeightRecordInput, listWeightRecords } from './weightApi'
import { buildMonthlyRecordsView, buildWeightDashboardView, type CloudWeightRecord, type CloudWeightSummary } from './weightModels'

export const cloudWeightRecords = ref<CloudWeightRecord[]>([])
export const cloudWeightSummary = ref<CloudWeightSummary | null>(null)
export const cloudWeightRecordsReady = ref(false)
export const cloudWeightRecordsLoading = ref(false)
export const cloudWeightRecordSaving = ref(false)
export const cloudWeightStoreError = ref('')
export const cloudWeightLastSyncedAt = ref('')

let refreshPromise: Promise<CloudWeightRecord[]> | null = null

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return '同步体重记录失败'
}

export const dashboardView = computed(() => {
  const referenceDate = cloudWeightLastSyncedAt.value
    ? new Date(cloudWeightLastSyncedAt.value)
    : new Date()
  return buildWeightDashboardView(cloudWeightRecords.value, referenceDate, cloudWeightSummary.value)
})

export function getMonthlyRecordsView(displayMonth: Date, referenceDate = new Date()) {
  return buildMonthlyRecordsView(cloudWeightRecords.value, displayMonth, referenceDate)
}

export async function refreshWeightRecords(force = false) {
  if (refreshPromise && !force) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    cloudWeightRecordsLoading.value = true
    cloudWeightStoreError.value = ''

    try {
      await ensureSilentLogin()
      const [records, summary] = await Promise.all([
        listWeightRecords({ limit: 400 }),
        getWeightSummary().catch(() => null),
      ])
      cloudWeightRecords.value = records
      cloudWeightSummary.value = summary
      cloudWeightRecordsReady.value = true
      cloudWeightLastSyncedAt.value = new Date().toISOString()
      return records
    }
    catch (error) {
      cloudWeightStoreError.value = resolveErrorMessage(error)
      throw error
    }
    finally {
      cloudWeightRecordsLoading.value = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function saveWeightRecord(input: CreateWeightRecordInput) {
  cloudWeightRecordSaving.value = true
  cloudWeightStoreError.value = ''

  try {
    const created = await createWeightRecord(input)
    await refreshWeightRecords(true)
    return created
  }
  catch (error) {
    cloudWeightStoreError.value = resolveErrorMessage(error)
    throw error
  }
  finally {
    cloudWeightRecordSaving.value = false
  }
}
