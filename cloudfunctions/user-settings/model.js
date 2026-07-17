// 新用户和缺失字段统一使用此默认配置，冻结对象可避免运行时被意外修改。
const DEFAULT_SETTINGS = Object.freeze({
  baselineWeight: 67,
  targetWeight: 66.5,
  heightCm: 172,
  unit: 'kg',
  indicator: 'classic',
  weekStart: 'monday',
  weightReminderEnabled: false,
  weightReminderTime: '08:00',
  milestoneReminderEnabled: true,
})

/**
 * 校验数值字段范围，并统一保留 1 位小数。
 *
 * @param {unknown} value 原始值
 * @param {string} key 字段名，用于生成错误码
 * @param {number} min 最小允许值
 * @param {number} max 最大允许值
 * @returns {number}
 */
function normalizeNumber(value, key, min, max) {
  const numberValue = Math.round(Number(value) * 10) / 10
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`INVALID_${key.toUpperCase()}`)
  }
  return numberValue
}

/**
 * 校验枚举字段是否位于允许列表中。
 *
 * @param {unknown} value 原始值
 * @param {string} key 字段名，用于生成错误码
 * @param {unknown[]} allowed 允许值列表
 * @returns {unknown}
 */
function normalizeEnum(value, key, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(`INVALID_${key.toUpperCase()}`)
  }
  return value
}

/**
 * 严格校验布尔设置，避免 truthy/falsy 隐式转换污染数据。
 *
 * @param {unknown} value 原始值
 * @param {string} key 字段名，用于生成错误码
 * @returns {boolean}
 */
function normalizeBoolean(value, key) {
  if (typeof value !== 'boolean') {
    throw new Error(`INVALID_${key.toUpperCase()}`)
  }
  return value
}

/**
 * 校验 24 小时制 HH:mm 提醒时间。
 *
 * @param {unknown} value 原始时间
 * @returns {string}
 */
function normalizeTime(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('INVALID_WEIGHTREMINDERTIME')
  }
  return value
}

/**
 * 从客户端输入中提取并校验允许更新的设置字段。
 * 空补丁会被拒绝，未知字段不会进入数据库。
 *
 * @param {object} input 设置补丁
 * @returns {object}
 */
function normalizePatch(input) {
  const patch = {}

  if ('baselineWeight' in input) {
    patch.baselineWeight = normalizeNumber(input.baselineWeight, 'baselineWeight', 20, 300)
  }
  if ('targetWeight' in input) {
    patch.targetWeight = normalizeNumber(input.targetWeight, 'targetWeight', 20, 300)
  }
  if ('heightCm' in input) {
    patch.heightCm = normalizeNumber(input.heightCm, 'heightCm', 100, 250)
  }
  if ('unit' in input) {
    patch.unit = normalizeEnum(input.unit, 'unit', ['kg', 'lb'])
  }
  if ('indicator' in input) {
    patch.indicator = normalizeEnum(input.indicator, 'indicator', ['classic', 'compact'])
  }
  if ('weekStart' in input) {
    patch.weekStart = normalizeEnum(input.weekStart, 'weekStart', ['monday', 'sunday'])
  }
  if ('weightReminderEnabled' in input) {
    patch.weightReminderEnabled = normalizeBoolean(input.weightReminderEnabled, 'weightReminderEnabled')
  }
  if ('weightReminderTime' in input) {
    patch.weightReminderTime = normalizeTime(input.weightReminderTime)
  }
  if ('milestoneReminderEnabled' in input) {
    patch.milestoneReminderEnabled = normalizeBoolean(input.milestoneReminderEnabled, 'milestoneReminderEnabled')
  }

  if (Object.keys(patch).length === 0) {
    throw new Error('EMPTY_SETTINGS_PATCH')
  }

  return patch
}

/**
 * 将数据库记录与默认配置合并为完整的客户端设置。
 * 只返回 DEFAULT_SETTINGS 中声明的公开字段。
 *
 * @param {object|undefined} record 数据库设置记录
 * @returns {object}
 */
function toSettings(record) {
  const source = record || {}
  return {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      Object.keys(DEFAULT_SETTINGS)
        .filter(key => source[key] !== undefined)
        .map(key => [key, source[key]]),
    ),
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  normalizePatch,
  toSettings,
}
