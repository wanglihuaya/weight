/* eslint-disable */
// biome-ignore lint: disable
// oxlint-disable
// ------
// 由 weapp-vite autoImportComponents 生成
import type { ComponentOptionsMixin, DefineComponent, PublicProps, WeappIntrinsicElementBaseAttributes } from 'wevu'
import type { ComponentProp } from 'weapp-vite/typed-components'

export {}

type WeappComponent<Props = Record<string, any>> = new (...args: any[]) => InstanceType<DefineComponent<{}, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, Props & WeappIntrinsicElementBaseAttributes, {}>>
type __WeappComponentProps<TComponent> = TComponent extends new (...args: any[]) => { $props: infer Props } ? Props : Record<string, any>
type __WeappComponentImport<TModule, Fallback = {}> = 0 extends 1 & TModule ? Fallback : TModule extends { default: infer Component } ? Component extends new (...args: infer Args) => infer Instance ? new (...args: Args) => Omit<Instance, '$props'> & { $props: __WeappComponentProps<Component> & __WeappComponentProps<Fallback> } : Fallback : Fallback

declare module 'wevu' {
  export interface GlobalComponents {
    EmptyState: typeof import("../src/components/EmptyState/index.vue")['default'];
    FilterBar: typeof import("../src/components/FilterBar/index.vue")['default'];
    FormRow: typeof import("../src/components/FormRow/index.vue")['default'];
    FormStep: typeof import("../src/components/FormStep/index.vue")['default'];
    KpiBoard: typeof import("../src/components/KpiBoard/index.vue")['default'];
    QuickActionGrid: typeof import("../src/components/QuickActionGrid/index.vue")['default'];
    ResultCard: typeof import("../src/components/ResultCard/index.vue")['default'];
    SectionTitle: typeof import("../src/components/SectionTitle/index.vue")['default'];
    SvgIcon: typeof import("../src/components/SvgIcon/index.vue")['default'];
    TAvatar: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar/avatar"), WeappComponent<ComponentProp<"t-avatar">>>;
    't-avatar': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar/avatar"), WeappComponent<ComponentProp<"t-avatar">>>;
    TAvatarGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar-group/avatar-group"), WeappComponent<ComponentProp<"t-avatar-group">>>;
    't-avatar-group': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar-group/avatar-group"), WeappComponent<ComponentProp<"t-avatar-group">>>;
    TBadge: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/badge/badge"), WeappComponent<ComponentProp<"t-badge">>>;
    't-badge': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/badge/badge"), WeappComponent<ComponentProp<"t-badge">>>;
    TButton: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/button/button"), WeappComponent<ComponentProp<"t-button">>>;
    't-button': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/button/button"), WeappComponent<ComponentProp<"t-button">>>;
    TCell: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell/cell"), WeappComponent<ComponentProp<"t-cell">>>;
    't-cell': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell/cell"), WeappComponent<ComponentProp<"t-cell">>>;
    TCellGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell-group/cell-group"), WeappComponent<ComponentProp<"t-cell-group">>>;
    't-cell-group': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell-group/cell-group"), WeappComponent<ComponentProp<"t-cell-group">>>;
    TDateTimePicker: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/date-time-picker/date-time-picker"), WeappComponent<ComponentProp<"t-date-time-picker">>>;
    't-date-time-picker': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/date-time-picker/date-time-picker"), WeappComponent<ComponentProp<"t-date-time-picker">>>;
    TDialog: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/dialog/dialog"), WeappComponent<ComponentProp<"t-dialog">>>;
    't-dialog': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/dialog/dialog"), WeappComponent<ComponentProp<"t-dialog">>>;
    TFab: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/fab/fab"), WeappComponent<ComponentProp<"t-fab">>>;
    't-fab': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/fab/fab"), WeappComponent<ComponentProp<"t-fab">>>;
    TIcon: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/icon/icon"), WeappComponent<ComponentProp<"t-icon">>>;
    't-icon': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/icon/icon"), WeappComponent<ComponentProp<"t-icon">>>;
    TInput: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/input/input"), WeappComponent<ComponentProp<"t-input">>>;
    't-input': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/input/input"), WeappComponent<ComponentProp<"t-input">>>;
    TNoticeBar: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/notice-bar/notice-bar"), WeappComponent<ComponentProp<"t-notice-bar">>>;
    't-notice-bar': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/notice-bar/notice-bar"), WeappComponent<ComponentProp<"t-notice-bar">>>;
    TProgress: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/progress/progress"), WeappComponent<ComponentProp<"t-progress">>>;
    't-progress': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/progress/progress"), WeappComponent<ComponentProp<"t-progress">>>;
    TQrcode: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/qrcode/qrcode"), WeappComponent<ComponentProp<"t-qrcode">>>;
    't-qrcode': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/qrcode/qrcode"), WeappComponent<ComponentProp<"t-qrcode">>>;
    TRadio: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio/radio"), WeappComponent<ComponentProp<"t-radio">>>;
    't-radio': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio/radio"), WeappComponent<ComponentProp<"t-radio">>>;
    TRadioGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio-group/radio-group"), WeappComponent<ComponentProp<"t-radio-group">>>;
    't-radio-group': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio-group/radio-group"), WeappComponent<ComponentProp<"t-radio-group">>>;
    TRate: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/rate/rate"), WeappComponent<ComponentProp<"t-rate">>>;
    't-rate': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/rate/rate"), WeappComponent<ComponentProp<"t-rate">>>;
    TSlider: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/slider/slider"), WeappComponent<ComponentProp<"t-slider">>>;
    't-slider': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/slider/slider"), WeappComponent<ComponentProp<"t-slider">>>;
    TStepItem: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/step-item/step-item"), WeappComponent<ComponentProp<"t-step-item">>>;
    't-step-item': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/step-item/step-item"), WeappComponent<ComponentProp<"t-step-item">>>;
    TSteps: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/steps/steps"), WeappComponent<ComponentProp<"t-steps">>>;
    't-steps': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/steps/steps"), WeappComponent<ComponentProp<"t-steps">>>;
    TSwiper: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/swiper/swiper"), WeappComponent<ComponentProp<"t-swiper">>>;
    't-swiper': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/swiper/swiper"), WeappComponent<ComponentProp<"t-swiper">>>;
    TSwitch: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/switch/switch"), WeappComponent<ComponentProp<"t-switch">>>;
    't-switch': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/switch/switch"), WeappComponent<ComponentProp<"t-switch">>>;
    TTabPanel: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tab-panel/tab-panel"), WeappComponent<ComponentProp<"t-tab-panel">>>;
    't-tab-panel': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tab-panel/tab-panel"), WeappComponent<ComponentProp<"t-tab-panel">>>;
    TTabs: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tabs/tabs"), WeappComponent<ComponentProp<"t-tabs">>>;
    't-tabs': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tabs/tabs"), WeappComponent<ComponentProp<"t-tabs">>>;
    TTag: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tag/tag"), WeappComponent<ComponentProp<"t-tag">>>;
    't-tag': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tag/tag"), WeappComponent<ComponentProp<"t-tag">>>;
    TTextarea: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/textarea/textarea"), WeappComponent<ComponentProp<"t-textarea">>>;
    't-textarea': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/textarea/textarea"), WeappComponent<ComponentProp<"t-textarea">>>;
    TToast: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/toast/toast"), WeappComponent<ComponentProp<"t-toast">>>;
    't-toast': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/toast/toast"), WeappComponent<ComponentProp<"t-toast">>>;
    TUpload: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/upload/upload"), WeappComponent<ComponentProp<"t-upload">>>;
    't-upload': __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/upload/upload"), WeappComponent<ComponentProp<"t-upload">>>;
    TrendCard: typeof import("../src/components/TrendCard/index.vue")['default'];
    WeightDashboard: typeof import("../src/components/WeightDashboard/index.vue")['default'];
    WeightEntryRuler: typeof import("../src/components/WeightDashboard/WeightEntryRuler.vue")['default'];
    WeightRuler: typeof import("../src/components/WeightRuler/index.vue")['default'];
    WeightTrendChart: typeof import("../src/components/WeightDashboard/WeightTrendChart.vue")['default'];
  }
}

// 用于 TSX 支持
declare global {
  const EmptyState: typeof import("../src/components/EmptyState/index.vue")['default']
  const FilterBar: typeof import("../src/components/FilterBar/index.vue")['default']
  const FormRow: typeof import("../src/components/FormRow/index.vue")['default']
  const FormStep: typeof import("../src/components/FormStep/index.vue")['default']
  const KpiBoard: typeof import("../src/components/KpiBoard/index.vue")['default']
  const QuickActionGrid: typeof import("../src/components/QuickActionGrid/index.vue")['default']
  const ResultCard: typeof import("../src/components/ResultCard/index.vue")['default']
  const SectionTitle: typeof import("../src/components/SectionTitle/index.vue")['default']
  const SvgIcon: typeof import("../src/components/SvgIcon/index.vue")['default']
  const TAvatar: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar/avatar"), WeappComponent<ComponentProp<"t-avatar">>>
  const TAvatarGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/avatar-group/avatar-group"), WeappComponent<ComponentProp<"t-avatar-group">>>
  const TBadge: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/badge/badge"), WeappComponent<ComponentProp<"t-badge">>>
  const TButton: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/button/button"), WeappComponent<ComponentProp<"t-button">>>
  const TCell: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell/cell"), WeappComponent<ComponentProp<"t-cell">>>
  const TCellGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/cell-group/cell-group"), WeappComponent<ComponentProp<"t-cell-group">>>
  const TDateTimePicker: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/date-time-picker/date-time-picker"), WeappComponent<ComponentProp<"t-date-time-picker">>>
  const TDialog: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/dialog/dialog"), WeappComponent<ComponentProp<"t-dialog">>>
  const TFab: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/fab/fab"), WeappComponent<ComponentProp<"t-fab">>>
  const TIcon: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/icon/icon"), WeappComponent<ComponentProp<"t-icon">>>
  const TInput: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/input/input"), WeappComponent<ComponentProp<"t-input">>>
  const TNoticeBar: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/notice-bar/notice-bar"), WeappComponent<ComponentProp<"t-notice-bar">>>
  const TProgress: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/progress/progress"), WeappComponent<ComponentProp<"t-progress">>>
  const TQrcode: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/qrcode/qrcode"), WeappComponent<ComponentProp<"t-qrcode">>>
  const TRadio: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio/radio"), WeappComponent<ComponentProp<"t-radio">>>
  const TRadioGroup: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/radio-group/radio-group"), WeappComponent<ComponentProp<"t-radio-group">>>
  const TRate: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/rate/rate"), WeappComponent<ComponentProp<"t-rate">>>
  const TSlider: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/slider/slider"), WeappComponent<ComponentProp<"t-slider">>>
  const TStepItem: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/step-item/step-item"), WeappComponent<ComponentProp<"t-step-item">>>
  const TSteps: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/steps/steps"), WeappComponent<ComponentProp<"t-steps">>>
  const TSwiper: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/swiper/swiper"), WeappComponent<ComponentProp<"t-swiper">>>
  const TSwitch: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/switch/switch"), WeappComponent<ComponentProp<"t-switch">>>
  const TTabPanel: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tab-panel/tab-panel"), WeappComponent<ComponentProp<"t-tab-panel">>>
  const TTabs: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tabs/tabs"), WeappComponent<ComponentProp<"t-tabs">>>
  const TTag: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/tag/tag"), WeappComponent<ComponentProp<"t-tag">>>
  const TTextarea: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/textarea/textarea"), WeappComponent<ComponentProp<"t-textarea">>>
  const TToast: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/toast/toast"), WeappComponent<ComponentProp<"t-toast">>>
  const TUpload: __WeappComponentImport<typeof import("tdesign-miniprogram/miniprogram_dist/upload/upload"), WeappComponent<ComponentProp<"t-upload">>>
  const TrendCard: typeof import("../src/components/TrendCard/index.vue")['default']
  const WeightDashboard: typeof import("../src/components/WeightDashboard/index.vue")['default']
  const WeightEntryRuler: typeof import("../src/components/WeightDashboard/WeightEntryRuler.vue")['default']
  const WeightRuler: typeof import("../src/components/WeightRuler/index.vue")['default']
  const WeightTrendChart: typeof import("../src/components/WeightDashboard/WeightTrendChart.vue")['default']
}
