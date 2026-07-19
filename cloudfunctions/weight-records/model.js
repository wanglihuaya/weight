/**
 * 将体重值统一保留 1 位小数。
 *
 * @param {number|string} value 原始体重值
 * @returns {number}
 */
function roundWeight(value) {
  return Math.round(Number(value) * 10) / 10
}

/**
 * 将数据库记录转换为可返回给小程序端的安全结构。
 * openid、创建时间等内部字段不会暴露给客户端。
 *
 * @param {object} record 数据库原始记录
 * @returns {object}
 */
function normalizeRecord(record) {
  return {
    _id: record._id,
    weight: roundWeight(record.weight),
    recordDate: record.recordDate,
    recordedAt: record.recordedAt,
    mode: record.mode || 'now',
    note: record.note || '',
    photoFileIds: Array.isArray(record.photoFileIds) ? record.photoFileIds : [],
  }
}

/**
 * 将日期输入规范化为 YYYY-MM-DD。
 * 对已经是日期键的字符串执行严格校验，避免无效日期进入数据库。
 *
 * @param {Date|number|string} value 日期输入
 * @returns {string}
 */
function resolveRecordDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`)
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value) {
      return value
    }
    throw new Error('INVALID_RECORD_DATE')
  }

  const date = new Date(value || Date.now())
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_RECORD_DATE')
  }

  return date.toISOString().slice(0, 10)
}

/**
 * 按 UTC 日历天偏移日期键，避免本地时区导致跨日误差。
 *
 * @param {string} dateKey YYYY-MM-DD 日期键
 * @param {number} days 偏移天数，可为负数
 * @returns {string}
 */
function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * 同一天存在多次称重时，仅保留 recordedAt 最新的一条。
 * 返回结果按记录时间升序排列，便于计算趋势变化。
 *
 * @param {object[]} records 体重记录
 * @returns {object[]}
 */
function latestDailyRecords(records) {
  const latestByDay = new Map()

  for (const record of records) {
    const current = latestByDay.get(record.recordDate)
    if (!current || String(record.recordedAt) >= String(current.recordedAt)) {
      latestByDay.set(record.recordDate, record)
    }
  }

  return [...latestByDay.values()].sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)))
}

/**
 * 基于指定参考日期计算体重统计摘要。
 * 周窗口为最近 7 天，近期高低值窗口为最近 30 天，月统计从当月 1 日开始。
 *
 * @param {object[]} records 体重记录
 * @param {Date|number|string} referenceDate 统计参考日期
 * @returns {object}
 */
function buildSummary(records, referenceDate) {
  const safeReferenceDate = resolveRecordDate(referenceDate)
  const dailyRecords = latestDailyRecords(records)
  const dateSet = new Set(dailyRecords.map(record => record.recordDate))
  let streakDays = 0

  while (dateSet.has(shiftDateKey(safeReferenceDate, -streakDays))) {
    streakDays += 1
  }

  const weeklyStart = shiftDateKey(safeReferenceDate, -6)
  const monthlyStart = `${safeReferenceDate.slice(0, 7)}-01`
  const recentStart = shiftDateKey(safeReferenceDate, -29)
  const weeklyRecords = dailyRecords.filter(record => (
    record.recordDate >= weeklyStart && record.recordDate <= safeReferenceDate
  ))
  const monthlyRecords = dailyRecords.filter(record => (
    record.recordDate >= monthlyStart && record.recordDate <= safeReferenceDate
  ))
  const recentRecords = dailyRecords.filter(record => (
    record.recordDate >= recentStart && record.recordDate <= safeReferenceDate
  ))
  const monthlyRecordedDays = monthlyRecords.length

  return {
    streakDays,
    weeklyDelta: weeklyRecords.length > 1
      ? roundWeight(weeklyRecords.at(-1).weight - weeklyRecords[0].weight)
      : 0,
    monthlyAverage: monthlyRecordedDays > 0
      ? roundWeight(monthlyRecords.reduce((sum, record) => sum + Number(record.weight), 0) / monthlyRecordedDays)
      : 0,
    monthlyDelta: monthlyRecordedDays > 1
      ? roundWeight(monthlyRecords.at(-1).weight - monthlyRecords[0].weight)
      : 0,
    monthlyRecordedDays,
    monthlyCompletionRate: monthlyRecordedDays > 0
      ? Math.round((monthlyRecordedDays / Number(safeReferenceDate.slice(8, 10))) * 100)
      : 0,
    recentLow: recentRecords.length > 0
      ? roundWeight(Math.min(...recentRecords.map(record => Number(record.weight))))
      : 0,
    recentHigh: recentRecords.length > 0
      ? roundWeight(Math.max(...recentRecords.map(record => Number(record.weight))))
      : 0,
    totalRecordedDays: dailyRecords.length,
    latestRecordedAt: dailyRecords.at(-1)?.recordedAt,
  }
}

module.exports = {
  buildSummary,
  normalizeRecord,
  resolveRecordDate,
  roundWeight,
}
