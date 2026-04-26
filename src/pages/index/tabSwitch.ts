export interface TabSwitchContext {
  scaleTo: (value: number) => void
  moveTo: (value: number) => void
  scheduleReset: (onReset: () => void) => void
}

interface TabSwitchContextOptions {
  scaleTo?: (value: number) => void
  moveTo?: (value: number) => void
  scheduleReset?: (onReset: () => void) => void
}

const noop = () => {}

export function createTabSwitchContext(options: TabSwitchContextOptions): TabSwitchContext {
  return {
    scaleTo: options.scaleTo ?? noop,
    moveTo: options.moveTo ?? noop,
    scheduleReset: options.scheduleReset ?? ((onReset) => onReset()),
  }
}

export function runTabSwitchAnimation(context: TabSwitchContext, index: number) {
  context.scaleTo(1.5)
  context.moveTo(index * 100)
  context.scheduleReset(() => {
    context.scaleTo(1)
  })
}
