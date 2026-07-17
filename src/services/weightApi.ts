import { ensureSilentLogin } from './auth'
import { callCloudFunction } from './cloud'
import { type CloudWeightRecord, type CloudWeightSummary, type WeightEntryModeKey, serializeRecordDate } from './weightModels'

export interface CreateWeightRecordInput {
  weight: number
  mode: WeightEntryModeKey
  note?: string
  recordedAt?: string
}

function normalizeWeightRecord(record: Partial<CloudWeightRecord>): CloudWeightRecord {
  return {
    _id: String(record._id ?? ''),
    weight: Number(record.weight ?? 0),
    recordDate: String(record.recordDate ?? ''),
    recordedAt: String(record.recordedAt ?? ''),
    mode: (record.mode ?? 'now') as WeightEntryModeKey,
    note: record.note,
  }
}

export async function listWeightRecords(params?: {
  startDate?: string
  endDate?: string
  limit?: number
}) {
  await ensureSilentLogin()
  const result = await callCloudFunction<{ records?: CloudWeightRecord[] }>('weight-records', {
    action: 'list',
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit ?? 400,
  })

  return (result.records ?? []).map(normalizeWeightRecord)
}

export async function getWeightSummary() {
  await ensureSilentLogin()
  const result = await callCloudFunction<{ summary?: CloudWeightSummary }>('weight-records', {
    action: 'summary',
    referenceDate: serializeRecordDate(new Date()),
  })

  return result.summary ?? null
}

export async function createWeightRecord(input: CreateWeightRecordInput) {
  await ensureSilentLogin()
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const result = await callCloudFunction<{ record?: CloudWeightRecord }>('weight-records', {
    action: 'create',
    requestId,
    weight: Number(input.weight.toFixed(1)),
    mode: input.mode,
    note: input.note?.trim() || '',
    recordedAt,
    recordDate: serializeRecordDate(new Date(recordedAt)),
  })

  if (!result.record) {
    throw new Error('创建体重记录失败')
  }

  return normalizeWeightRecord(result.record)
}
