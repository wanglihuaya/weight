export interface SettingsSnapshot {
  membershipTitle: string
  membershipBadge: string
  baselineWeight: number
  targetWeight: number
  bmiLabel: string
  unitLabel: string
  indicatorLabel: string
  weekStartLabel: string
  weightReminderLabel: string
  milestoneReminderLabel: string
}

export interface SettingsPreferences {
  baselineWeight: number
  targetWeight: number
  heightCm: number
  unit: 'kg' | 'lb'
  indicator: 'classic' | 'compact'
  weekStart: 'monday' | 'sunday'
  weightReminderEnabled: boolean
  weightReminderTime: string
  milestoneReminderEnabled: boolean
}

export interface SettingsItem {
  key: string
  label: string
  value?: string
  iconKey:
    | 'baseline'
    | 'goal'
    | 'bmi'
    | 'unit'
    | 'indicator'
    | 'week-start'
    | 'reminder'
    | 'milestone'
}

export interface SettingsSection {
  title: string
  items: SettingsItem[]
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
}

export interface MonthlyDataView {
  monthLabel: string
  weekdayLabels: string[]
  days: MonthDayCell[]
  monthAverageLabel: string
  weightChangeLabel: string
  unitLabel: string
  weekGroups: WeekGroup[]
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function formatWeight(value: number, unitLabel: string) {
  return `${value.toFixed(1)}${unitLabel}`
}

function getMonthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function mondayIndex(day: number) {
  return day === 0 ? 6 : day - 1
}

export function buildSettingsSnapshot(
  _now = new Date(),
  preferences: SettingsPreferences = {
    baselineWeight: 67,
    targetWeight: 66.5,
    heightCm: 172,
    unit: 'kg',
    indicator: 'classic',
    weekStart: 'monday',
    weightReminderEnabled: false,
    weightReminderTime: '08:00',
    milestoneReminderEnabled: true,
  },
): SettingsSnapshot {
  const isPound = preferences.unit === 'lb'
  const weightFactor = isPound ? 2.2046226218 : 1

  return {
    membershipTitle: 'MyWeight² 会员',
    membershipBadge: '高级版',
    baselineWeight: preferences.baselineWeight * weightFactor,
    targetWeight: preferences.targetWeight * weightFactor,
    bmiLabel: `${preferences.heightCm.toFixed(1)}厘米`,
    unitLabel: isPound ? '磅' : '千克',
    indicatorLabel: preferences.indicator === 'classic' ? '经典' : '紧凑',
    weekStartLabel: preferences.weekStart === 'monday' ? '周一' : '周日',
    weightReminderLabel: preferences.weightReminderEnabled ? preferences.weightReminderTime : '关闭',
    milestoneReminderLabel: preferences.milestoneReminderEnabled ? '开启' : '关闭',
  }
}

export function buildSettingsSections(snapshot: SettingsSnapshot): SettingsSection[] {
  return [
    {
      title: '个人数据',
      items: [
        { key: 'baseline', label: '基准体重', value: formatWeight(snapshot.baselineWeight, snapshot.unitLabel), iconKey: 'baseline' },
        { key: 'goal', label: '体重目标', value: formatWeight(snapshot.targetWeight, snapshot.unitLabel), iconKey: 'goal' },
        { key: 'bmi', label: 'BMI设置', value: snapshot.bmiLabel, iconKey: 'bmi' },
      ],
    },
    {
      title: '显示设置',
      items: [
        { key: 'unit', label: '体重单位', value: snapshot.unitLabel, iconKey: 'unit' },
        { key: 'indicator', label: '指示器', value: snapshot.indicatorLabel, iconKey: 'indicator' },
        { key: 'week-start', label: '周起始日', value: snapshot.weekStartLabel, iconKey: 'week-start' },
      ],
    },
    {
      title: '通知',
      items: [
        { key: 'reminder', label: '称重提醒', value: snapshot.weightReminderLabel, iconKey: 'reminder' },
        { key: 'milestone', label: '成就通知', value: snapshot.milestoneReminderLabel, iconKey: 'milestone' },
      ],
    },
  ]
}

export function buildMonthlyDataView(displayMonth: Date, referenceDate = new Date()): MonthlyDataView {
  const monthStart = startOfMonth(displayMonth)
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const totalDays = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const leadingPlaceholders = mondayIndex(monthStart.getDay())
  const monthRelation = getMonthKey(monthStart) - getMonthKey(today)
  const recordedUntil = monthRelation > 0 ? 0 : monthRelation === 0 ? today.getDate() : totalDays

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
    const isToday = monthRelation === 0 && day === today.getDate()
    days.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}-${day}`,
      label: `${day}`,
      isRecorded: day <= recordedUntil,
      isToday,
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
      const visibleDays = group.filter((item) => !item.isPlaceholder).map((item) => Number(item.label))
      if (visibleDays.length === 0) {
        return null
      }

      const startDay = visibleDays[0]
      const endDay = visibleDays[visibleDays.length - 1]
      return {
        key: `week-${index + 1}`,
        label: `${monthStart.getMonth() + 1}月${startDay}日至${endDay}日`,
        summaryText: '无',
      }
    })
    .filter((group): group is WeekGroup => group !== null)

  return {
    monthLabel: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
    weekdayLabels: WEEKDAY_LABELS,
    days,
    monthAverageLabel: recordedUntil > 0 ? '67.0' : '--',
    weightChangeLabel: recordedUntil > 0 ? '0.0' : '--',
    unitLabel: '千克',
    weekGroups,
  }
}
