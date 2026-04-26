export interface WeightMetricSummary {
  yesterdayWeight: number
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

export interface WeightChartPoint {
  key: string
  xPercent: number
  yPercent: number
  value: number
  dateLabel: string
  highlighted: boolean
}

export interface WeightChartModel {
  rangeLabel: string
  yTicks: number[]
  points: WeightChartPoint[]
  xLabels: string[]
}

export interface WeightRecordItem {
  value: number
  delta: number
  dateText: string
}

export interface WeightDashboardMock {
  summary: WeightMetricSummary
  chart: WeightChartModel
  todayLabel: string
  todayEmptyText: string
  recentTitle: string
  recentRecord: WeightRecordItem
  syncText: string
}

function roundTo(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatWeekday(date: Date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

export function buildWeightDashboardMock(now: Date): WeightDashboardMock {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const seed = now.getMonth() + 1 + now.getDate()
  const startWeight = 67 + (seed % 5) * 0.2
  const currentWeight = roundTo(70.4 + Math.sin(seed / 4) * 0.5)
  const yesterdayWeight = roundTo(currentWeight + 0.2)
  const totalDays = 420 + seed * 3
  const deltaFromStart = roundTo(currentWeight - startWeight)

  const chartDays = [28, 21, 14, 7, 0]
  const xPositions = [8, 28, 48, 68, 82]
  const chartDates = chartDays.map((days) => {
    const date = new Date(today)
    date.setDate(date.getDate() - days)
    return date
  })
  const chartValues = chartDays.map((_, index) => {
    const drift = Math.sin((seed + index * 3) / 3) * 0.4
    return roundTo(currentWeight - 0.3 + drift)
  })
  const minValue = Math.min(...chartValues)
  const maxValue = Math.max(...chartValues)
  const yMin = roundTo(Math.floor((minValue - 0.3) * 10) / 10)
  const yMax = roundTo(Math.ceil((maxValue + 0.3) * 10) / 10)
  const range = Math.max(yMax - yMin, 0.6)

  const points: WeightChartPoint[] = chartValues.map((value, index) => ({
    key: `point-${index}`,
    xPercent: xPositions[index],
    yPercent: roundTo(((yMax - value) / range) * 100, 2),
    value,
    dateLabel: formatDateLabel(chartDates[index]),
    highlighted: index === 3,
  }))

  const currentWeekday = today.getDay()
  const weekCheckIn = new Array(7).fill(false).map((_, index) => index <= currentWeekday && index % 2 === 0)
  if (currentWeekday >= 0) {
    weekCheckIn[currentWeekday] = true
  }

  const bmiValue = roundTo(currentWeight / (1.72 * 1.72), 1)
  const bmiMarkerIndex = Math.min(5, Math.max(0, Math.floor((bmiValue - 17.5) / 2)))

  const lastRecordDate = new Date(today)
  lastRecordDate.setDate(lastRecordDate.getDate() - 1)

  return {
    summary: {
      yesterdayWeight,
      totalDays,
      deltaFromStart,
      recent: {
        min: roundTo(Math.min(...chartValues)),
        max: roundTo(Math.max(...chartValues)),
        current: currentWeight,
      },
      weekCheckIn,
      bmiValue,
      bmiMarkerIndex,
    },
    chart: {
      rangeLabel: '1个月',
      yTicks: [yMax, roundTo((yMax + yMin) / 2), yMin],
      points,
      xLabels: chartDates.slice(0, 4).map((date) => formatDateLabel(date)),
    },
    todayLabel: '今天',
    todayEmptyText: '无',
    recentTitle: '最近7天',
    recentRecord: {
      value: yesterdayWeight,
      delta: roundTo(yesterdayWeight - currentWeight),
      dateText: `${formatDateLabel(lastRecordDate)} ${formatWeekday(lastRecordDate)}`,
    },
    syncText: '数据未同步',
  }
}
