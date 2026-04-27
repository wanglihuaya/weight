export interface WeightEntryMode {
  key: 'now' | 'photo' | 'note'
  label: string
  icon: string
  actionText: string
  tone: string
  fill: string
}

export interface WeightEntrySpringState {
  current: number
  velocity: number
}

export interface WeightEntryReadoutMotion {
  translateX: number
  translateY: number
  scale: number
  shadow: number
  opacity: number
}

export interface WeightEntryBoundState {
  atMin: boolean
  atMax: boolean
}

export interface WeightEntryCanvasLayout {
  topPadding: number
  labelTop: number
  majorTickHeight: number
  halfTickHeight: number
  minorTickHeight: number
  pointerHeight: number
}

const WEIGHT_ENTRY_MODES: WeightEntryMode[] = [
  { key: 'now', label: '现在', icon: '◷', actionText: '记录体重', tone: '#4B9BFF', fill: '#D7E8FF' },
  { key: 'photo', label: '照片', icon: '◉', actionText: '保存照片记录', tone: '#7367FF', fill: '#E1DDFC' },
  { key: 'note', label: '笔记', icon: '☰', actionText: '保存体重笔记', tone: '#F28A3D', fill: '#F8E2D1' },
]

function roundTo(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function clampWeightEntryValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function applyWeightEntryDragDelta(deltaX: number, current: number, min: number, max: number) {
  const atLowerBound = current <= min && deltaX > 0
  const atUpperBound = current >= max && deltaX < 0
  const resistance = atLowerBound || atUpperBound ? 0.45 : 0.78
  return roundTo(deltaX * resistance, 1)
}

export function quantizeWeightEntryValue(value: number, step: number, min: number, max: number) {
  const normalized = Math.round(value / step) * step
  return roundTo(clampWeightEntryValue(normalized, min, max), 1)
}

export function getWeightEntryBoundState(current: number, min: number, max: number, epsilon = 0.05): WeightEntryBoundState {
  return {
    atMin: current <= min + epsilon,
    atMax: current >= max - epsilon,
  }
}

export function projectWeightEntryTarget(current: number, velocity: number, step: number, min: number, max: number) {
  const projected = current + velocity * 0.45
  return quantizeWeightEntryValue(projected, step, min, max)
}

export function stepWeightEntrySpring(
  state: WeightEntrySpringState,
  target: number,
  stiffness = 0.3,
  damping = 0.68,
): WeightEntrySpringState {
  const force = (target - state.current) * stiffness
  const velocity = (state.velocity + force) * damping
  const current = state.current + velocity

  if (Math.abs(target - current) < 0.001 && Math.abs(velocity) < 0.001) {
    return {
      current: target,
      velocity: 0,
    }
  }

  return {
    current,
    velocity,
  }
}

export function buildWeightEntryReadoutMotion(offset: number): WeightEntryReadoutMotion {
  const normalized = Math.min(1, Math.abs(offset) / 0.6)
  if (normalized === 0) {
    return {
      translateX: 0,
      translateY: 0,
      scale: 1,
      shadow: 18,
      opacity: 0.94,
    }
  }
  const direction = offset === 0 ? 0 : offset > 0 ? 1 : -1

  return {
    translateX: roundTo(direction * normalized * 10, 2),
    translateY: roundTo(-normalized * 12, 2),
    scale: roundTo(1 + normalized * 0.045, 3),
    shadow: roundTo(18 + normalized * 18, 2),
    opacity: roundTo(0.94 + normalized * 0.06, 3),
  }
}

export function buildWeightEntryCanvasLayout(height: number): WeightEntryCanvasLayout {
  const safeHeight = Math.max(height, 88)
  const topPadding = Math.max(8, Math.round(safeHeight * 0.06))
  const pointerHeight = Math.max(54, Math.round(safeHeight * 0.58))
  const labelTop = Math.min(safeHeight - 18, Math.round(safeHeight * 0.72))
  const availableTickHeight = Math.max(24, labelTop - topPadding - 10)
  const majorTickHeight = Math.round(availableTickHeight)
  const halfTickHeight = Math.max(18, Math.round(majorTickHeight * 0.64))
  const minorTickHeight = Math.max(12, Math.round(majorTickHeight * 0.4))

  return {
    topPadding,
    labelTop,
    majorTickHeight,
    halfTickHeight,
    minorTickHeight,
    pointerHeight,
  }
}

export function buildWeightEntryModes() {
  return WEIGHT_ENTRY_MODES.map((mode) => ({ ...mode }))
}
