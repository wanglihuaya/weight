/* eslint-disable */
// @ts-nocheck
// biome-ignore lint: disable
// oxlint-disable
// ------
// 由 weapp-vite 自动生成，请勿编辑。
declare module 'weapp-vite/typed-components' {
  export interface ComponentProps {
    EmptyState: {
      readonly actionText?: string;
      readonly description?: string;
      readonly title?: string;
    };
    FilterBar: {
      readonly active?: string;
      readonly filters?: any;
      readonly query?: string;
    };
    FormRow: {
      readonly align?: string;
      readonly description?: string;
      readonly label?: string;
    };
    FormStep: {
      readonly active?: boolean;
      readonly step?: number;
      readonly subtitle?: string;
      readonly title?: string;
    };
    KpiBoard: {
      readonly columns?: number;
      readonly items?: any;
      readonly subtitle?: string;
      readonly title?: string;
    };
    QuickActionGrid: {
      readonly items?: any;
      readonly subtitle?: string;
      readonly title?: string;
    };
    ResultCard: {
      readonly items?: any;
      readonly title?: string;
    };
    SectionTitle: {
      readonly subtitle?: string;
      readonly title?: string;
    };
    SvgIcon: {
      readonly color?: string;
      readonly content?: string;
      readonly mode?: string;
      readonly size?: string;
      readonly src?: string;
    };
    't-avatar': {
      readonly alt?: string;
      readonly badgeProps?: BadgeProps;
      readonly bordered?: boolean;
      readonly hideOnLoadFailed?: boolean;
      readonly icon?: string | object;
      readonly image?: string;
      readonly imageProps?: ImageProps;
      readonly shape?: ShapeEnum;
      readonly size?: string;
    };
    't-avatar-group': {
      readonly cascading?: CascadingValue;
      readonly collapseAvatar?: string;
      readonly max?: number;
      readonly shape?: ShapeEnum;
      readonly size?: string;
    };
    't-badge': {
      readonly color?: string;
      readonly content?: string;
      readonly count?: string | number;
      readonly dot?: boolean;
      readonly maxCount?: number;
      readonly offset?: Array<string | number>;
      readonly shape?: 'circle' | 'square' | 'bubble' | 'ribbon' | 'ribbon-right' | 'ribbon-left' | 'triangle-right' | 'triangle-left';
      readonly showZero?: boolean;
      readonly size?: 'medium' | 'large';
    };
    't-button': {
      readonly activityType?: number;
      readonly appParameter?: string;
      readonly block?: boolean;
      readonly content?: string;
      readonly customDataset?: null;
      readonly disabled?: boolean;
      readonly entrancePath?: string;
      readonly ghost?: boolean;
      readonly hoverClass?: string;
      readonly hoverStartTime?: number;
      readonly hoverStayTime?: number;
      readonly hoverStopPropagation?: boolean;
      readonly icon?: string | object;
      readonly lang?: 'en' | 'zh_CN' | 'zh_TW';
      readonly loading?: boolean;
      readonly loadingProps?: LoadingProps;
      readonly needShowEntrance?: boolean;
      readonly openType?: 'contact' | 'liveActivity' | 'share' | 'getPhoneNumber' | 'getRealtimePhoneNumber' | 'getUserInfo' | 'launchApp' | 'openSetting' | 'feedback' | 'chooseAvatar' | 'agreePrivacyAuthorization' | 'phoneOneClickLogin';
      readonly phoneNumberNoQuotaToast?: boolean;
      readonly sendMessageImg?: string;
      readonly sendMessagePath?: string;
      readonly sendMessageTitle?: string;
      readonly sessionFrom?: string;
      readonly shape?: 'rectangle' | 'square' | 'round' | 'circle';
      readonly showMessageCard?: boolean;
      readonly size?: 'extra-small' | 'small' | 'medium' | 'large';
      readonly theme?: 'default' | 'primary' | 'danger' | 'light';
      readonly tId?: string;
      readonly type?: 'submit' | 'reset';
      readonly variant?: 'base' | 'outline' | 'dashed' | 'text';
    };
    't-cell': {
      readonly align?: 'top' | 'middle' | 'bottom';
      readonly arrow?: boolean | object;
      readonly bordered?: boolean;
      readonly description?: string;
      readonly hover?: boolean;
      readonly image?: string;
      readonly jumpType?: 'switchTab' | 'reLaunch' | 'redirectTo' | 'navigateTo';
      readonly leftIcon?: string | object;
      readonly note?: string;
      readonly required?: boolean;
      readonly rightIcon?: string | object;
      readonly title?: string;
      readonly url?: string;
    };
    't-cell-group': {
      readonly bordered?: boolean;
      readonly theme?: 'default' | 'card';
      readonly title?: string;
    };
    't-dialog': {
      readonly actions?: Array<ButtonProps>;
      readonly buttonLayout?: 'horizontal' | 'vertical';
      readonly cancelBtn?: string | ButtonProps | null;
      readonly closeBtn?: boolean | ButtonProps | null;
      readonly closeOnOverlayClick?: boolean;
      readonly confirmBtn?: string | ButtonProps | null;
      readonly content?: string;
      readonly overlayProps?: OverlayProps;
      readonly preventScrollThrough?: boolean;
      readonly showOverlay?: boolean;
      readonly title?: string;
      readonly usingCustomNavbar?: boolean;
      readonly visible?: boolean;
      readonly zIndex?: number;
    };
    't-fab': {
      readonly buttonProps?: ButtonProps;
      readonly draggable?: boolean | FabDirectionEnum;
      readonly icon?: string | object;
      readonly style?: string;
      readonly text?: string;
      readonly usingCustomNavbar?: boolean;
      readonly yBounds?: Array<string | number>;
    };
    't-icon': {
      readonly color?: string;
      readonly name?: string;
      readonly prefix?: string;
      readonly size?: string | number;
    };
    't-input': {
      readonly adjustPosition?: boolean;
      readonly align?: 'left' | 'center' | 'right';
      readonly allowInputOverMax?: boolean;
      readonly alwaysEmbed?: boolean;
      readonly autoFocus?: boolean;
      readonly borderless?: boolean;
      readonly clearable?: boolean | object;
      readonly clearTrigger?: 'always' | 'focus';
      readonly confirmHold?: boolean;
      readonly confirmType?: 'send' | 'search' | 'next' | 'go' | 'done';
      readonly cursor?: number;
      readonly cursorColor?: string;
      readonly cursorSpacing?: number;
      readonly disabled?: boolean;
      readonly focus?: boolean;
      readonly format?: InputFormatType;
      readonly holdKeyboard?: boolean;
      readonly label?: string;
      readonly layout?: 'vertical' | 'horizontal';
      readonly maxcharacter?: number;
      readonly maxlength?: number;
      readonly placeholder?: string;
      readonly placeholderClass?: string;
      readonly placeholderStyle?: string;
      readonly prefixIcon?: string | object;
      readonly readonly?: boolean;
      readonly safePasswordCertPath?: string;
      readonly safePasswordCustomHash?: string;
      readonly safePasswordLength?: number;
      readonly safePasswordNonce?: string;
      readonly safePasswordSalt?: string;
      readonly safePasswordTimeStamp?: number;
      readonly selectionEnd?: number;
      readonly selectionStart?: number;
      readonly status?: 'default' | 'success' | 'warning' | 'error';
      readonly suffix?: string;
      readonly suffixIcon?: string | object;
      readonly tips?: string;
      readonly type?: 'text' | 'number' | 'idcard' | 'digit' | 'safe-password' | 'password' | 'nickname';
      readonly value?: InputValue;
    };
    't-notice-bar': {
      readonly content?: string | string[];
      readonly defaultVisible?: boolean;
      readonly direction?: 'horizontal' | 'vertical';
      readonly interval?: number;
      readonly marquee?: boolean | NoticeBarMarquee;
      readonly operation?: string;
      readonly prefixIcon?: string | boolean | object;
      readonly suffixIcon?: string | object;
      readonly theme?: 'info' | 'success' | 'warning' | 'error';
      readonly visible?: boolean;
    };
    't-popup': {
      readonly closeBtn?: boolean;
      readonly closeOnOverlayClick?: boolean;
      readonly content?: string;
      readonly defaultVisible?: boolean;
      readonly duration?: number;
      readonly overlayProps?: OverlayProps;
      readonly placement?: 'top' | 'left' | 'right' | 'bottom' | 'center';
      readonly preventScrollThrough?: boolean;
      readonly showOverlay?: boolean;
      readonly usingCustomNavbar?: boolean;
      readonly visible?: boolean;
      readonly zIndex?: number;
    };
    't-progress': {
      readonly color?: string | Array<string> | Record<string, string>;
      readonly label?: string | boolean;
      readonly percentage?: number;
      readonly size?: string | number;
      readonly status?: ProgressStatus;
      readonly strokeWidth?: string | number;
      readonly theme?: ProgressTheme;
      readonly trackColor?: string;
    };
    't-qrcode': {
      readonly bgColor?: string;
      readonly borderless?: boolean;
      readonly color?: string;
      readonly icon?: string;
      readonly iconSize?: number | { width: number; height: number; };
      readonly level?: 'L' | 'M' | 'Q' | 'H';
      readonly size?: number;
      readonly status?: QRStatus;
      readonly value?: string;
    };
    't-radio': {
      readonly allowUncheck?: boolean;
      readonly block?: boolean;
      readonly checked?: boolean;
      readonly content?: string;
      readonly contentDisabled?: boolean;
      readonly defaultChecked?: boolean;
      readonly disabled?: boolean;
      readonly icon?: 'circle' | 'line' | 'dot' | Array<string>;
      readonly label?: string;
      readonly maxContentRow?: number;
      readonly maxLabelRow?: number;
      readonly name?: string;
      readonly placement?: 'left' | 'right';
      readonly readonly?: boolean;
      readonly value?: T;
    };
    't-radio-group': {
      readonly allowUncheck?: boolean;
      readonly borderless?: boolean;
      readonly defaultValue?: T;
      readonly disabled?: boolean;
      readonly icon?: 'circle' | 'line' | 'dot' | Array<string>;
      readonly keys?: KeysType;
      readonly name?: string;
      readonly options?: Array<RadioOption>;
      readonly placement?: 'left' | 'right';
      readonly readonly?: boolean;
      readonly value?: T;
    };
    't-rate': {
      readonly allowHalf?: boolean;
      readonly color?: string | Array<string>;
      readonly count?: number;
      readonly defaultValue?: number;
      readonly disabled?: boolean;
      readonly gap?: string | number;
      readonly icon?: string | string[];
      readonly iconPrefix?: string;
      readonly placement?: 'top' | 'bottom' | '';
      readonly showText?: boolean;
      readonly size?: string;
      readonly texts?: Array<string>;
      readonly value?: number;
      readonly variant?: 'outline' | 'filled';
    };
    't-slider': {
      readonly defaultValue?: SliderValue;
      readonly disabled?: boolean;
      readonly label?: string | boolean;
      readonly marks?: Record<number, string> | Array<number>;
      readonly max?: number;
      readonly min?: number;
      readonly range?: boolean;
      readonly showExtremeValue?: boolean;
      readonly step?: number;
      readonly theme?: 'default' | 'capsule';
      readonly value?: SliderValue;
      readonly vertical?: boolean;
    };
    't-step-item': {
      readonly content?: string;
      readonly extra?: string;
      readonly icon?: string;
      readonly status?: StepStatus;
      readonly title?: string;
    };
    't-steps': {
      readonly current?: string | number;
      readonly currentStatus?: 'default' | 'process' | 'finish' | 'error';
      readonly defaultCurrent?: string | number;
      readonly layout?: 'horizontal' | 'vertical';
      readonly readonly?: boolean;
      readonly sequence?: 'positive' | 'reverse';
      readonly theme?: 'default' | 'dot';
    };
    't-swiper': {
      readonly autoplay?: boolean;
      readonly current?: number;
      readonly direction?: 'horizontal' | 'vertical';
      readonly displayMultipleItems?: number;
      readonly duration?: number;
      readonly easingFunction?: 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic';
      readonly height?: string | number;
      readonly imageProps?: object;
      readonly interval?: number;
      readonly list?: string[] | SwiperList[];
      readonly loop?: boolean;
      readonly navigation?: SwiperNavProps | boolean;
      readonly nextMargin?: string | number;
      readonly paginationPosition?: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';
      readonly previousMargin?: string | number;
      readonly snapToEdge?: boolean;
    };
    't-switch': {
      readonly customValue?: Array<SwitchValue>;
      readonly defaultValue?: SwitchValue;
      readonly disabled?: boolean;
      readonly icon?: string[];
      readonly label?: string[];
      readonly loading?: boolean;
      readonly size?: 'small' | 'medium' | 'large';
      readonly value?: SwitchValue;
    };
    't-tab-panel': {
      readonly badgeProps?: object;
      readonly disabled?: boolean;
      readonly icon?: string | object;
      readonly label?: string;
      readonly lazy?: boolean;
      readonly panel?: string;
      readonly value?: TabValue;
    };
    't-tabs': {
      readonly animation?: TabAnimation;
      readonly bottomLineMode?: 'fixed' | 'auto' | 'full';
      readonly defaultValue?: TabValue;
      readonly showBottomLine?: boolean;
      readonly spaceEvenly?: boolean;
      readonly split?: boolean;
      readonly sticky?: boolean;
      readonly stickyProps?: StickyProps;
      readonly swipeable?: boolean;
      readonly theme?: 'line' | 'tag' | 'card';
      readonly value?: TabValue;
    };
    't-tag': {
      readonly closable?: boolean | object;
      readonly disabled?: boolean;
      readonly icon?: string | object;
      readonly maxWidth?: string | number;
      readonly shape?: 'square' | 'round' | 'mark';
      readonly size?: 'small' | 'medium' | 'large' | 'extra-large';
      readonly theme?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
      readonly variant?: 'dark' | 'light' | 'outline' | 'light-outline';
    };
    't-textarea': {
      readonly adjustPosition?: boolean;
      readonly allowInputOverMax?: boolean;
      readonly autofocus?: boolean;
      readonly autosize?: boolean | { maxHeight?: number; minHeight?: number; };
      readonly bordered?: boolean;
      readonly confirmHold?: boolean;
      readonly confirmType?: 'return' | 'send' | 'search' | 'next' | 'go' | 'done';
      readonly cursor?: number;
      readonly cursorColor?: string;
      readonly cursorSpacing?: number;
      readonly defaultValue?: TextareaValue;
      readonly disabled?: boolean;
      readonly disableDefaultPadding?: boolean;
      readonly fixed?: boolean;
      readonly focus?: boolean;
      readonly holdKeyboard?: boolean;
      readonly indicator?: boolean;
      readonly label?: string;
      readonly maxcharacter?: number;
      readonly maxlength?: number;
      readonly placeholder?: string;
      readonly placeholderClass?: string;
      readonly placeholderStyle?: string;
      readonly readonly?: boolean;
      readonly selectionEnd?: number;
      readonly selectionStart?: number;
      readonly showConfirmBar?: boolean;
      readonly value?: TextareaValue;
    };
    't-toast': {
      readonly direction?: 'row' | 'column';
      readonly duration?: number;
      readonly icon?: string | object;
      readonly message?: string;
      readonly overlayProps?: OverlayProps;
      readonly placement?: 'top' | 'middle' | 'bottom';
      readonly preventScrollThrough?: boolean;
      readonly showOverlay?: boolean;
      readonly theme?: 'loading' | 'success' | 'warning' | 'error';
      readonly usingCustomNavbar?: boolean;
    };
    't-upload': {
      readonly addBtn?: boolean;
      readonly addContent?: string;
      readonly allowUploadDuplicateFile?: boolean;
      readonly config?: UploadMpConfig;
      readonly defaultFiles?: Array<UploadFile>;
      readonly disabled?: boolean;
      readonly draggable?: boolean | { vibrate?: boolean; collisionVibrate?: boolean; };
      readonly files?: Array<UploadFile>;
      readonly gridConfig?: { column?: number; width?: number; height?: number; };
      readonly gutter?: number;
      readonly imageProps?: ImageProps;
      readonly max?: number;
      readonly mediaType?: Array<MediaType>;
      readonly preview?: boolean;
      readonly removeBtn?: boolean;
      readonly requestMethod?: null;
      readonly sizeLimit?: number | SizeLimitObj;
      readonly source?: 'media' | 'messageFile';
      readonly transition?: Transition;
    };
    TrendCard: {
      readonly delta?: number;
      readonly progress?: number;
      readonly title?: string;
      readonly unit?: string;
      readonly value?: number;
    };
    WeightDashboard: Record<string, any>;
    WeightEntryRuler: {
      readonly max?: number;
      readonly min?: number;
      readonly modelValue?: number;
      readonly step?: number;
    };
    WeightRuler: {
      readonly max?: number;
      readonly min?: number;
      readonly modelValue?: number;
      readonly step?: number;
    };
  }
  export type ComponentPropName = keyof ComponentProps;
  export type ComponentProp<Name extends string> = Name extends ComponentPropName ? ComponentProps[Name] : Record<string, any>;
  export const componentProps: ComponentProps;
}
