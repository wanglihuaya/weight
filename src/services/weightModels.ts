export type WeightEntryModeKey = 'now' | 'photo' | 'note'

export interface CloudWeightRecord {
  _id: string
  weight: number
  recordDate: string
  recordedAt: string
  mode: WeightEntryModeKey
  note?: string
}

export interface WeightDashboardSummary {
  startLabel: string
  startWeight: number
  totalDays: number
  deltaFromStart: number
  recent: {
    min: number
    max: number
    current: number
  }
  weekCheckIn: boolean[]
  bmiValue: number
  bmiMarkerIndex: number
}

export interface WeightDashboardChartPoint {
  key: string
  xPercent: number
  yPercent: number
  value: number
  dateLabel: string
  highlighted: boolean
}

export interface WeightDashboardView {
  hasRecords: boolean
  summary: WeightDashboardSummary
  stats: WeightDashboardStats
  chart: {
    rangeLabel: string
    yTicks: number[]
    points: WeightDashboardChartPoint[]
    xLabels: string[]
  }
  todayLabel: string
  todayRecord: WeightTimelineRecord | null
  todayEmptyText: string
  recentTitle: string
  recentRecords: WeightTimelineRecord[]
  syncText: string
}

export interface WeightDashboardStats {
  streakDays: number
  weeklyDelta: number
  monthlyAverage: number
  monthlyDelta: number
  monthlyRecordedDays: number
  monthlyCompletionRate: number
  recentLow: number
  recentHigh: number
  totalRecordedDays: number
}

export interface WeightTimelineRecord {
  value: number
  delta: number
  dateText: string
  note?: string
}

export interface MonthDayCell {
  key: string
  label: string
  isRecorded: boolean
  isToday: boolean
  isPlaceholder: boolean
}

export interface WeekGroup {
  key: string
  label: string
  summaryText: string
  recordCount: number
  averageWeightLabel: string
  latestWeightLabel: string
  deltaLabel: string
  rangeLabel: string
  hasRecords: boolean
}

export interface MonthlyRecordsView {
  monthLabel: string
  weekdayLabels: string[]
  days: MonthDayCell[]
  monthAverageLabel: string
  weightChangeLabel: string
  unitLabel: string
  stats: MonthlyRecordsStats
  weekGroups: WeekGroup[]
}

export interface MonthlyRecordsStats {
  recordedDays: number
  completionRate: number
  lowestWeightLabel: string
  highestWeightLabel: string
}

export interface CloudWeightSummary extends WeightDashboardStats {
  latestRecordedAt?: string
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const BMI_SEGMENT_COLORS_COUNT = 6

function roundTo(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function normalizeInputDate(input: Date | number | string) {
  if (typeof input === 'number' || typeof input === 'string') {
    return new Date(input)
  }

  return input
}

function startOfDay(date: Date | number | string) {
  const safeDate = normalizeInputDate(date)
  return new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate())
}

function startOfMonth(date: Date | number | string) {
  const safeDate = normalizeInputDate(date)
  return new Date(safeDate.getFullYear(), safeDate.getMonth(), 1)
}

function mondayIndex(day: number) {
  return day === 0 ? 6 : day - 1
}

function formatMonthDay(value: string) {
  const date = parseDateKey(value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatWeekday(value: string) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[parseDateKey(value).getDay()]
}

function diffDaysInclusive(startKey: string, endDate: Date | number | string) {
  const start = startOfDay(parseDateKey(startKey)).getTime()
  const end = startOfDay(endDate).getTime()
  return Math.max(1, Math.floor((end - start) / 86400000) + 1)
}

function modeLabel(mode: WeightEntryModeKey, note?: string) {
  if (note?.trim()) {
    return note.trim()
  }

  if (mode === 'photo') {
    return '照片记录'
  }

  if (mode === 'note') {
    return '笔记记录'
  }

  return '现在记录'
}

function sortByRecordedAtAsc(records: CloudWeightRecord[]) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.recordedAt).getTime()
    const rightTime = new Date(right.recordedAt).getTime()
    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return left.recordDate.localeCompare(right.recordDate)
  })
}

function buildWeightTicks(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [roundTo(max + 0.5), roundTo(max), roundTo(Math.max(0, min - 0.5))]
  }

  const padding = Math.max(0.2, (max - min) * 0.3)
  const yMax = roundTo(max + padding)
  const yMin = roundTo(Math.max(0, min - padding))
  return [yMax, roundTo((yMax + yMin) / 2), yMin]
}

function buildChartPoints(records: CloudWeightRecord[]) {
  if (records.length === 0) {
    return {
      yTicks: [0, 0, 0],
      points: [] as WeightDashboardChartPoint[],
      xLabels: [] as string[],
    }
  }

  const values = records.map(record => record.weight)
  const [yMax, , yMin] = buildWeightTicks(values)
  const range = Math.max(0.6, yMax - yMin)
  const positions = records.length === 1
    ? [50]
    : records.map((_, index) => roundTo(8 + (74 / Math.max(records.length - 1, 1)) * index, 2))

  const points = records.map((record, index) => ({
    key: record._id,
    xPercent: positions[index] ?? 50,
    yPercent: roundTo(((yMax - record.weight) / range) * 100, 2),
    value: record.weight,
    dateLabel: formatMonthDay(record.recordDate),
    highlighted: index === records.length - 1,
  }))

  return {
    yTicks: [yMax, roundTo((yMax + yMin) / 2), yMin],
    points,
    xLabels: points.slice(0, 4).map(point => point.dateLabel),
  }
}

function summarizeRecord(record: CloudWeightRecord, previous?: CloudWeightRecord): WeightTimelineRecord {
  const delta = previous ? roundTo(record.weight - previous.weight) : 0
  return {
    value: record.weight,
    delta,
    dateText: `${formatMonthDay(record.recordDate)} ${formatWeekday(record.recordDate)}`,
    note: modeLabel(record.mode, record.note),
  }
}

function getTodayKey(referenceDate: Date | number | string) {
  return serializeRecordDate(referenceDate)
}

function getCurrentWeekKeys(referenceDate: Date | number | string) {
  const today = startOfDay(referenceDate)
  const mondayOffset = mondayIndex(today.getDay())
  const monday = new Date(today)
  monday.setDate(today.getDate() - mondayOffset)

  return new Array(7).fill(null).map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return serializeRecordDate(date)
  })
}

function getLastNDaysStartKey(referenceDate: Date | number | string, days: number) {
  const safeDate = normalizeInputDate(referenceDate)
  const date = new Date(safeDate)
  date.setDate(safeDate.getDate() - (days - 1))
  return serializeRecordDate(date)
}

function getCurrentMonthBounds(referenceDate: Date | number | string) {
  const monthStart = startOfMonth(referenceDate)
  const monthStartKey = serializeRecordDate(monthStart)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  return {
    monthStart,
    monthStartKey,
    monthEndKey: serializeRecordDate(monthEnd),
  }
}

function formatSyncText(referenceDate: Date | number | string) {
  const safeDate = normalizeInputDate(referenceDate)
  const hours = safeDate.getHours().toString().padStart(2, '0')
  const minutes = safeDate.getMinutes().toString().padStart(2, '0')
  return `已于 ${hours}:${minutes} 同步`
}

function normalizeWeight(value: number) {
  return roundTo(Number(value) || 0, 1)
}

function formatWeightLabel(value: number) {
  return normalizeWeight(value).toFixed(1)
}

function formatSignedWeightLabel(value: number) {
  const normalized = normalizeWeight(value)
  if (normalized > 0) {
    return `+${normalized.toFixed(1)}`
  }
  if (normalized < 0) {
    return normalized.toFixed(1)
  }
  return '0.0'
}

function resolveMonthlyCompletionDenominator(referenceDate: Date | number | string) {
  const safeDate = normalizeInputDate(referenceDate)
  const monthEnd = new Date(safeDate.getFullYear(), safeDate.getMonth() + 1, 0).getDate()
  return Math.min(safeDate.getDate(), monthEnd)
}

function resolveDisplayedMonthCompletionDenominator(displayMonth: Date | number | string, referenceDate: Date | number | string) {
  const safeDisplayMonth = normalizeInputDate(displayMonth)
  const safeReferenceDate = normalizeInputDate(referenceDate)
  const totalDays = new Date(safeDisplayMonth.getFullYear(), safeDisplayMonth.getMonth() + 1, 0).getDate()
  if (
    safeDisplayMonth.getFullYear() === safeReferenceDate.getFullYear()
    && safeDisplayMonth.getMonth() === safeReferenceDate.getMonth()
  ) {
    return Math.min(safeReferenceDate.getDate(), totalDays)
  }

  return totalDays
}

function buildDashboardStats(records: CloudWeightRecord[], referenceDate: Date | number | string): WeightDashboardStats {
  if (records.length === 0) {
    return {
      streakDays: 0,
      weeklyDelta: 0,
      monthlyAverage: 0,
      monthlyDelta: 0,
      monthlyRecordedDays: 0,
      monthlyCompletionRate: 0,
      recentLow: 0,
      recentHigh: 0,
      totalRecordedDays: 0,
    }
  }

  const recordSet = new Set(records.map(record => record.recordDate))
  const today = startOfDay(referenceDate)
  let streakDays = 0

  for (let offset = 0; offset < records.length; offset += 1) {
    const cursor = new Date(today)
    cursor.setDate(today.getDate() - offset)
    const dateKey = serializeRecordDate(cursor)
    if (!recordSet.has(dateKey)) {
      break
    }
    streakDays += 1
  }

  const last7StartKey = getLastNDaysStartKey(referenceDate, 7)
  const weeklyRecords = records.filter(record => record.recordDate >= last7StartKey)
  const weeklyDelta = weeklyRecords.length > 1
    ? roundTo(weeklyRecords.at(-1)!.weight - weeklyRecords[0].weight)
    : 0

  const { monthStartKey } = getCurrentMonthBounds(referenceDate)
  const monthlyRecords = records.filter(record => record.recordDate >= monthStartKey)
  const monthlyAverage = monthlyRecords.length > 0
    ? roundTo(monthlyRecords.reduce((sum, record) => sum + record.weight, 0) / monthlyRecords.length)
    : 0
  const monthlyDelta = monthlyRecords.length > 1
    ? roundTo(monthlyRecords.at(-1)!.weight - monthlyRecords[0].weight)
    : 0
  const monthlyRecordedDays = monthlyRecords.length
  const monthlyCompletionRate = monthlyRecordedDays > 0
    ? Math.round((monthlyRecordedDays / resolveMonthlyCompletionDenominator(referenceDate)) * 100)
    : 0

  const last30StartKey = getLastNDaysStartKey(referenceDate, 30)
  const recent30Records = records.filter(record => record.recordDate >= last30StartKey)
  const recentLow = recent30Records.length > 0 ? normalizeWeight(Math.min(...recent30Records.map(record => record.weight))) : 0
  const recentHigh = recent30Records.length > 0 ? normalizeWeight(Math.max(...recent30Records.map(record => record.weight))) : 0

  return {
    streakDays,
    weeklyDelta,
    monthlyAverage,
    monthlyDelta,
    monthlyRecordedDays,
    monthlyCompletionRate,
    recentLow,
    recentHigh,
    totalRecordedDays: records.length,
  }
}

export function serializeRecordDate(date: Date | number | string) {
  const safeDate = normalizeInputDate(date)
  const year = safeDate.getFullYear()
  const month = String(safeDate.getMonth() + 1).padStart(2, '0')
  const day = String(safeDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupLatestDailyRecords(records: CloudWeightRecord[]) {
  const latestByDay = new Map<string, CloudWeightRecord>()

  for (const record of records) {
    const current = latestByDay.get(record.recordDate)
    if (!current) {
      latestByDay.set(record.recordDate, record)
      continue
    }

    const currentTime = new Date(current.recordedAt).getTime()
    const nextTime = new Date(record.recordedAt).getTime()
    if (nextTime >= currentTime) {
      latestByDay.set(record.recordDate, record)
    }
  }

  return sortByRecordedAtAsc([...latestByDay.values()])
}

export function buildWeightDashboardView(
  records: CloudWeightRecord[],
  referenceDate: Date | number | string = new Date(),
  cloudSummary?: CloudWeightSummary | null,
): WeightDashboardView {
  const safeReferenceDate = normalizeInputDate(referenceDate)
  const latestDailyRecords = groupLatestDailyRecords(records)
  const sortedAsc = sortByRecordedAtAsc(latestDailyRecords)
  const sortedDesc = [...sortedAsc].reverse()
  const fallbackStats = buildDashboardStats(sortedAsc, referenceDate)
  const stats = cloudSummary ?? fallbackStats

  if (sortedAsc.length === 0) {
    return {
      hasRecords: false,
      summary: {
        startLabel: '开始记录',
        startWeight: 0,
        totalDays: 0,
        deltaFromStart: 0,
        recent: {
          min: 0,
          max: 0,
          current: 70,
        },
        weekCheckIn: new Array(7).fill(false),
        bmiValue: 0,
        bmiMarkerIndex: 0,
      },
      stats,
      chart: {
        rangeLabel: '1个月',
        yTicks: [0, 0, 0],
        points: [],
        xLabels: [],
      },
      todayLabel: '今天',
      todayRecord: null,
      todayEmptyText: '无',
      recentTitle: '最近7天',
      recentRecords: [],
      syncText: formatSyncText(referenceDate),
    }
  }

  const firstRecord = sortedAsc[0]
  const currentRecord = sortedAsc.at(-1)!
  const todayKey = getTodayKey(referenceDate)
  const currentWeekKeys = getCurrentWeekKeys(referenceDate)
  const chartStartDate = new Date(safeReferenceDate)
  chartStartDate.setDate(safeReferenceDate.getDate() - 27)
  const chartStartKey = serializeRecordDate(chartStartDate)
  const chartEndDate = new Date(safeReferenceDate)
  chartEndDate.setDate(safeReferenceDate.getDate() - 1)
  const chartEndKey = serializeRecordDate(chartEndDate)
  const chartSource = sortedAsc.filter(record => record.recordDate >= chartStartKey && record.recordDate <= chartEndKey).slice(-5)
  const chart = buildChartPoints(chartSource)
  const recentRecords = sortedDesc.slice(0, 7).map((record, index) => summarizeRecord(record, sortedDesc[index + 1]))
  const currentWeight = normalizeWeight(currentRecord.weight)
  const startWeight = normalizeWeight(firstRecord.weight)
  const recentWeights = sortedAsc
    .filter(record => record.recordDate >= chartStartKey)
    .map(record => normalizeWeight(record.weight))
  const recentMin = recentWeights.length > 0 ? Math.min(...recentWeights) : currentWeight
  const recentMax = recentWeights.length > 0 ? Math.max(...recentWeights) : currentWeight
  const bmiValue = roundTo(currentWeight / (1.72 * 1.72), 1)
  const bmiMarkerIndex = Math.min(
    BMI_SEGMENT_COLORS_COUNT - 1,
    Math.max(0, Math.floor((bmiValue - 17.5) / 2)),
  )

  return {
    hasRecords: true,
    summary: {
      startLabel: formatMonthDay(firstRecord.recordDate),
      startWeight,
      totalDays: diffDaysInclusive(firstRecord.recordDate, referenceDate),
      deltaFromStart: roundTo(currentWeight - startWeight),
      recent: {
        min: normalizeWeight(recentMin),
        max: normalizeWeight(recentMax),
        current: currentWeight,
      },
      weekCheckIn: currentWeekKeys.map(dateKey => sortedAsc.some(record => record.recordDate === dateKey)),
      bmiValue,
      bmiMarkerIndex,
    },
    stats,
    chart: {
      rangeLabel: '1个月',
      yTicks: chart.yTicks,
      points: chart.points,
      xLabels: chart.xLabels,
    },
    todayLabel: '今天',
    todayRecord: currentRecord.recordDate === todayKey ? summarizeRecord(currentRecord, sortedDesc[1]) : null,
    todayEmptyText: '无',
    recentTitle: '最近7天',
    recentRecords,
    syncText: formatSyncText(referenceDate),
  }
}

export function buildMonthlyRecordsView(
  records: CloudWeightRecord[],
  displayMonth: Date | number | string,
  referenceDate: Date | number | string = new Date(),
): MonthlyRecordsView {
  const monthStart = startOfMonth(displayMonth)
  const today = startOfDay(referenceDate)
  const totalDays = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const leadingPlaceholders = mondayIndex(monthStart.getDay())
  const latestDailyRecords = groupLatestDailyRecords(records)
  const monthPrefix = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-`
  const monthlyRecords = latestDailyRecords.filter(record => record.recordDate.startsWith(monthPrefix))
  const recordSet = new Set(monthlyRecords.map(record => record.recordDate))
  const days: MonthDayCell[] = []

  for (let index = 0; index < leadingPlaceholders; index += 1) {
    days.push({
      key: `placeholder-leading-${index}`,
      label: '',
      isRecorded: false,
      isToday: false,
      isPlaceholder: true,
    })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dayDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
    const dateKey = serializeRecordDate(dayDate)
    days.push({
      key: dateKey,
      label: `${day}`,
      isRecorded: recordSet.has(dateKey),
      isToday: dateKey === serializeRecordDate(today),
      isPlaceholder: false,
    })
  }

  while (days.length % 7 !== 0) {
    const index = days.length
    days.push({
      key: `placeholder-trailing-${index}`,
      label: '',
      isRecorded: false,
      isToday: false,
      isPlaceholder: true,
    })
  }

  const weekGroups = days
    .reduce<MonthDayCell[][]>((groups, day, index) => {
      const groupIndex = Math.floor(index / 7)
      groups[groupIndex] ||= []
      groups[groupIndex].push(day)
      return groups
    }, [])
    .map((group, index) => {
      const visibleDays = group.filter(day => !day.isPlaceholder).map(day => Number(day.label))
      if (visibleDays.length === 0) {
        return null
      }

      const startDay = visibleDays[0]
      const endDay = visibleDays[visibleDays.length - 1]
      const weeklyRecords = monthlyRecords.filter((record) => {
        const day = parseDateKey(record.recordDate).getDate()
        return day >= startDay && day <= endDay
      })
      const average = weeklyRecords.length > 0
        ? `${formatWeightLabel(weeklyRecords.reduce((sum, record) => sum + record.weight, 0) / weeklyRecords.length)}千克`
        : ''
      const latestWeightLabel = weeklyRecords.length > 0
        ? formatWeightLabel(weeklyRecords.at(-1)!.weight)
        : '--'
      const deltaLabel = weeklyRecords.length > 1
        ? formatSignedWeightLabel(weeklyRecords.at(-1)!.weight - weeklyRecords[0].weight)
        : weeklyRecords.length === 1
          ? '0.0'
          : '--'
      const rangeLabel = weeklyRecords.length > 0
        ? `${formatWeightLabel(Math.min(...weeklyRecords.map(record => record.weight)))} - ${formatWeightLabel(Math.max(...weeklyRecords.map(record => record.weight)))}`
        : '--'

      return {
        key: `week-${index + 1}`,
        label: `${monthStart.getMonth() + 1}月${startDay}日至${endDay}日`,
        summaryText: weeklyRecords.length > 0 ? `${weeklyRecords.length}次记录 · 均重${average}` : '无',
        recordCount: weeklyRecords.length,
        averageWeightLabel: weeklyRecords.length > 0 ? formatWeightLabel(weeklyRecords.reduce((sum, record) => sum + record.weight, 0) / weeklyRecords.length) : '--',
        latestWeightLabel,
        deltaLabel,
        rangeLabel,
        hasRecords: weeklyRecords.length > 0,
      }
    })
    .filter((group): group is WeekGroup => group !== null)

  const monthAverageLabel = monthlyRecords.length > 0
    ? formatWeightLabel(monthlyRecords.reduce((sum, record) => sum + record.weight, 0) / monthlyRecords.length)
    : '--'
  const weightChangeLabel = monthlyRecords.length > 0
    ? formatWeightLabel(monthlyRecords.at(-1)!.weight - monthlyRecords[0].weight)
    : '--'
  const completionBase = resolveDisplayedMonthCompletionDenominator(monthStart, referenceDate)
  const stats: MonthlyRecordsStats = {
    recordedDays: monthlyRecords.length,
    completionRate: monthlyRecords.length > 0 ? Math.round((monthlyRecords.length / completionBase) * 100) : 0,
    lowestWeightLabel: monthlyRecords.length > 0 ? formatWeightLabel(Math.min(...monthlyRecords.map(record => record.weight))) : '--',
    highestWeightLabel: monthlyRecords.length > 0 ? formatWeightLabel(Math.max(...monthlyRecords.map(record => record.weight))) : '--',
  }

  return {
    monthLabel: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
    weekdayLabels: WEEKDAY_LABELS,
    days,
    monthAverageLabel,
    weightChangeLabel,
    unitLabel: '千克',
    stats,
    weekGroups,
  }
}
