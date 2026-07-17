<script setup lang="ts">
defineComponentJson({
  virtualHost: true,
  styleIsolation: 'apply-shared',
})

interface TrendPoint {
  x: number
  y: number
}

const weekdays = [
  { key: 'mon', label: '一', tone: 'coral', position: 34 },
  { key: 'tue', label: '二', tone: 'blue', position: 51 },
  { key: 'wed', label: '三', tone: 'blue', position: 69 },
  { key: 'thu', label: '四', tone: 'coral', position: 57 },
  { key: 'fri', label: '五', tone: 'blue', position: 76, active: true },
  { key: 'sat', label: '六', tone: 'muted', position: 0 },
  { key: 'sun', label: '日', tone: 'muted', position: 0 },
]

const weekRecords = [
  { key: 'sat', day: '六', value: '87.6', tone: 'blue' },
  { key: 'sun', day: '日', value: '87.2', tone: 'blue' },
  { key: 'mon', day: '一', value: '88.0', tone: 'coral' },
  { key: 'tue', day: '二', value: '87.6', tone: 'blue' },
  { key: 'wed', day: '三', value: '87.0', tone: 'blue' },
  { key: 'thu', day: '四', value: '87.4', tone: 'coral' },
  { key: 'fri', day: '五', value: '87.2', tone: 'blue', active: true },
]

const trendPoints: TrendPoint[] = [
  { x: 0, y: 28 },
  { x: 18, y: 40 },
  { x: 36, y: 34 },
  { x: 54, y: 55 },
  { x: 74, y: 50 },
  { x: 94, y: 74 },
  { x: 114, y: 62 },
  { x: 134, y: 78 },
  { x: 154, y: 72 },
  { x: 174, y: 108 },
  { x: 194, y: 88 },
  { x: 214, y: 119 },
  { x: 234, y: 112 },
  { x: 254, y: 132 },
]

const trendSegments = trendPoints.slice(0, -1).map((point, index) => {
  const next = trendPoints[index + 1]
  const deltaX = next.x - point.x
  const deltaY = next.y - point.y
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

  return {
    key: `segment-${index}`,
    style: `left:${point.x}rpx;top:${point.y}rpx;width:${length}rpx;transform:rotate(${angle}deg);`,
  }
})

function showWidgetTip(name: string) {
  wx.showToast({
    title: `${name}小组件`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="widget-panel">
    <view class="widget-intro">
      <text class="widget-intro__copy">
        MyWeight² 包含一组精心设计的小组件，帮助你每日追踪自己的体重。
      </text>
    </view>

    <view class="compact-widgets">
      <view
        class="compact-card compact-card--week"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('一周体重')"
      >
        <view class="compact-week__header">
          <text>体重</text>
          <text class="compact-week__value">87.2<text class="compact-week__unit"> 千克</text></text>
        </view>
        <view class="compact-week__bars">
          <view v-for="day in weekdays" :key="day.key" class="compact-week__day">
            <view class="compact-week__rail">
              <view
                v-if="day.position"
                class="compact-week__dot"
                :class="`compact-week__dot--${day.tone}`"
                :style="`top:${day.position}%;`"
              />
            </view>
            <text :class="day.active ? 'compact-week__label--active' : ''">{{ day.label }}</text>
          </view>
        </view>
      </view>

      <view
        class="compact-card compact-card--ring"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('当前体重')"
      >
        <view class="compact-ring">
          <view class="compact-ring__gap" />
          <view class="compact-ring__center">
            <text class="compact-ring__value">87.2</text>
            <text class="compact-ring__unit">千克</text>
          </view>
        </view>
      </view>

      <view
        class="compact-card compact-card--change"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('体重变化')"
      >
        <text class="compact-change__arrow">↓</text>
        <text class="compact-change__value">3.2<text class="compact-change__unit">千克</text></text>
        <text class="compact-change__days">21 天</text>
      </view>
    </view>

    <view class="widget-grid">
      <view
        class="widget-card gauge-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('今日体重')"
      >
        <text class="widget-eyebrow">今天</text>
        <view class="gauge-widget__weight">87.2<text class="gauge-widget__unit"> 千克</text></view>
        <view class="weight-gauge">
          <view class="weight-gauge__track" />
          <view class="weight-gauge__ticks">
            <view v-for="item in 5" :key="item" class="weight-gauge__tick" />
          </view>
          <view class="weight-gauge__marker" />
          <text class="weight-gauge__min">87</text>
          <text class="weight-gauge__max">88</text>
        </view>
        <view class="gauge-widget__change">
          <view class="change-badge">↓</view>
          <text>3.2 千克</text>
        </view>
        <text class="gauge-widget__days">21 天</text>
      </view>

      <view
        class="widget-card week-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('周记录')"
      >
        <view class="week-widget__header">
          <text class="widget-eyebrow">体重</text>
          <text class="week-widget__date">7月17日</text>
        </view>
        <view class="week-widget__weight">87.2<text class="week-widget__unit"> 千克</text></view>
        <view class="week-widget__bars">
          <view v-for="day in weekdays" :key="day.key" class="week-widget__day">
            <view class="week-widget__rail">
              <view
                v-if="day.position"
                class="week-widget__dot"
                :class="`week-widget__dot--${day.tone}`"
                :style="`top:${day.position}%;`"
              />
            </view>
            <text :class="day.active ? 'week-widget__day-label--active' : ''">{{ day.label }}</text>
          </view>
        </view>
      </view>

      <view
        class="widget-card calendar-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('日历记录')"
      >
        <view class="calendar-widget__date">
          <text class="calendar-widget__month">7月</text>
          <text class="calendar-widget__day">17</text>
        </view>
        <view class="calendar-widget__records">
          <view
            v-for="record in weekRecords"
            :key="record.key"
            class="calendar-record"
            :class="record.active ? 'calendar-record--active' : ''"
          >
            <text class="calendar-record__day">{{ record.day }}</text>
            <view class="calendar-record__dot" :class="`calendar-record__dot--${record.tone}`" />
            <text class="calendar-record__value">{{ record.value }}</text>
          </view>
        </view>
      </view>

      <view
        class="widget-card trend-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('趋势')"
      >
        <view class="trend-widget__header">
          <text>体重</text>
          <text class="trend-widget__value">82.6<text class="trend-widget__unit"> 千克</text></text>
        </view>
        <view class="trend-chart">
          <view class="trend-chart__grid trend-chart__grid--v1" />
          <view class="trend-chart__grid trend-chart__grid--v2" />
          <view class="trend-chart__grid trend-chart__grid--h1" />
          <view class="trend-chart__grid trend-chart__grid--h2" />
          <view
            v-for="segment in trendSegments"
            :key="segment.key"
            class="trend-chart__segment"
            :style="segment.style"
          />
        </view>
        <view class="trend-widget__dates">
          <text>3月25日</text>
          <text>4月8日</text>
        </view>
      </view>

      <view
        class="widget-card reward-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('目标成就')"
      >
        <view class="reward-widget__top">
          <text class="reward-widget__emoji">🎒</text>
          <view class="reward-widget__change">
            <view class="change-badge">↓</view>
            <text>3.2 千克</text>
          </view>
        </view>
        <view class="reward-widget__bottom">
          <text class="reward-widget__title">下一程更轻盈</text>
          <text class="reward-widget__copy">坚持 21 天，距离目标又近一步</text>
        </view>
      </view>

      <view
        class="widget-card bmi-widget"
        hover-class="widget-card--pressed"
        @tap="showWidgetTip('BMI')"
      >
        <text class="widget-eyebrow">BMI</text>
        <text class="bmi-widget__value">26.1</text>
        <view class="bmi-scale">
          <view class="bmi-scale__segment bmi-scale__segment--cyan" />
          <view class="bmi-scale__segment bmi-scale__segment--green" />
          <view class="bmi-scale__segment bmi-scale__segment--yellow" />
          <view class="bmi-scale__segment bmi-scale__segment--orange" />
          <view class="bmi-scale__marker" />
        </view>
        <view class="bmi-widget__footer">
          <text>超重</text>
          <text class="bmi-widget__hint">建议关注近期趋势</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.widget-panel {
  padding-top: 24rpx;
  padding-bottom: 20rpx;
}

.widget-intro {
  display: flex;
  justify-content: center;
  padding: 8rpx 40rpx 38rpx;
}

.widget-intro__copy {
  color: #17181d;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.55;
  text-align: center;
}

.compact-widgets {
  display: flex;
  align-items: stretch;
  margin-bottom: 44rpx;
}

.compact-card {
  position: relative;
  height: 142rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.85);
  background: linear-gradient(145deg, #8f9298 0%, #74777e 100%);
  box-shadow: 0 16rpx 34rpx rgba(20, 29, 43, 0.15);
  transition: opacity 120ms ease, transform 120ms ease;
}

.compact-card--week {
  width: 48%;
  padding: 12rpx 14rpx 10rpx;
  border-radius: 24rpx;
}

.compact-card--ring,
.compact-card--change {
  display: flex;
  width: calc(26% - 12rpx);
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  border-radius: 999rpx;
}

.compact-card--change {
  flex-direction: column;
}

.compact-week__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.62);
  font-size: 17rpx;
}

.compact-week__value {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.compact-week__unit {
  font-size: 14rpx;
}

.compact-week__bars {
  display: flex;
  height: 93rpx;
  justify-content: space-between;
  margin-top: 4rpx;
}

.compact-week__day {
  display: flex;
  width: 24rpx;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16rpx;
}

.compact-week__rail {
  position: relative;
  width: 15rpx;
  height: 62rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.24);
}

.compact-week__dot {
  position: absolute;
  left: 1rpx;
  width: 13rpx;
  height: 13rpx;
  border-radius: 999rpx;
  background: #fff;
  box-shadow: 0 1rpx 5rpx rgba(0, 0, 0, 0.18);
  transform: translateY(-50%);
}

.compact-week__label--active {
  display: flex;
  width: 24rpx;
  height: 24rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #fff;
  color: #666970;
}

.compact-ring {
  position: relative;
  display: flex;
  width: 112rpx;
  height: 112rpx;
  align-items: center;
  justify-content: center;
  border: 10rpx solid rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
}

.compact-ring__gap {
  position: absolute;
  left: -16rpx;
  bottom: 4rpx;
  width: 38rpx;
  height: 28rpx;
  background: #81848a;
  transform: rotate(42deg);
}

.compact-ring__center {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
}

.compact-ring__value {
  font-size: 36rpx;
  line-height: 1;
}

.compact-ring__unit {
  margin-top: 7rpx;
  font-size: 20rpx;
}

.compact-change__arrow {
  color: #fff;
  font-size: 34rpx;
  line-height: 0.8;
}

.compact-change__value {
  margin-top: 8rpx;
  color: #fff;
  font-size: 28rpx;
}

.compact-change__unit {
  font-size: 17rpx;
}

.compact-change__days {
  margin-top: 2rpx;
  color: rgba(255, 255, 255, 0.86);
  font-size: 20rpx;
}

.widget-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.widget-card {
  position: relative;
  width: calc(50% - 12rpx);
  height: 338rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 44rpx;
  background: #fff;
  box-shadow: 0 20rpx 46rpx rgba(27, 35, 48, 0.09);
  transition: opacity 120ms ease, transform 120ms ease;
}

.widget-card--pressed {
  opacity: 0.82;
  transform: scale(0.98);
}

.widget-eyebrow {
  color: #9a9ca4;
  font-size: 25rpx;
  font-weight: 500;
}

.gauge-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 28rpx 24rpx;
}

.gauge-widget__weight {
  margin-top: 8rpx;
  color: #090a0d;
  font-size: 47rpx;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -2rpx;
}

.gauge-widget__unit,
.week-widget__unit,
.trend-widget__unit {
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0;
}

.weight-gauge {
  position: relative;
  width: 258rpx;
  height: 96rpx;
  margin-top: 26rpx;
}

.weight-gauge__track {
  position: absolute;
  left: 9rpx;
  top: 4rpx;
  width: 240rpx;
  height: 84rpx;
  border: 17rpx solid #e6e7e9;
  border-bottom: 0;
  border-radius: 240rpx 240rpx 0 0;
}

.weight-gauge__ticks {
  position: absolute;
  left: 0;
  top: 9rpx;
  display: flex;
  width: 258rpx;
  justify-content: space-around;
}

.weight-gauge__tick {
  width: 11rpx;
  height: 11rpx;
  border-radius: 999rpx;
  background: #c9cace;
}

.weight-gauge__marker {
  position: absolute;
  left: 72rpx;
  top: 2rpx;
  width: 27rpx;
  height: 27rpx;
  border: 6rpx solid #fff;
  border-radius: 999rpx;
  background: #090a0d;
  box-shadow: 0 3rpx 8rpx rgba(0, 0, 0, 0.15);
}

.weight-gauge__min,
.weight-gauge__max {
  position: absolute;
  bottom: -8rpx;
  color: #c3c4c8;
  font-size: 19rpx;
}

.weight-gauge__min {
  left: 0;
}

.weight-gauge__max {
  right: 0;
}

.gauge-widget__change {
  display: flex;
  align-items: center;
  margin-top: 7rpx;
  color: #111217;
  font-size: 26rpx;
  font-weight: 600;
}

.change-badge {
  display: flex;
  width: 31rpx;
  height: 31rpx;
  align-items: center;
  justify-content: center;
  margin-right: 8rpx;
  border-radius: 999rpx;
  background: #249df2;
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.gauge-widget__days {
  margin-top: 5rpx;
  color: #9698a0;
  font-size: 22rpx;
}

.week-widget {
  padding: 32rpx 28rpx 20rpx;
}

.week-widget__header,
.trend-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.week-widget__date {
  padding: 5rpx 18rpx;
  border-radius: 999rpx;
  background: #f1f2f5;
  box-shadow: 0 3rpx 8rpx rgba(19, 24, 34, 0.08);
  color: #858791;
  font-size: 23rpx;
}

.week-widget__weight {
  margin-top: 4rpx;
  color: #090a0d;
  font-size: 46rpx;
  letter-spacing: -2rpx;
}

.week-widget__bars {
  display: flex;
  height: 160rpx;
  justify-content: space-between;
  margin-top: 26rpx;
}

.week-widget__day {
  display: flex;
  width: 29rpx;
  flex-direction: column;
  align-items: center;
  color: #101116;
  font-size: 21rpx;
  font-weight: 500;
}

.week-widget__rail {
  position: relative;
  width: 28rpx;
  height: 111rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ebecef;
}

.week-widget__dot {
  position: absolute;
  left: 3rpx;
  width: 22rpx;
  height: 22rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  box-shadow: 0 3rpx 8rpx rgba(20, 28, 40, 0.08);
  transform: translateY(-50%);
}

.week-widget__dot--coral,
.calendar-record__dot--coral {
  background: #f45d53;
}

.week-widget__dot--blue,
.calendar-record__dot--blue {
  background: #209eef;
}

.week-widget__day-label--active {
  display: flex;
  width: 29rpx;
  height: 29rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: #090a0d;
  color: #fff;
}

.calendar-widget {
  display: flex;
}

.calendar-widget__date {
  display: flex;
  width: 37%;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 34rpx;
  background: #fafafa;
}

.calendar-widget__month {
  font-size: 25rpx;
  font-weight: 700;
}

.calendar-widget__day {
  margin-top: 4rpx;
  color: #050608;
  font-size: 55rpx;
  line-height: 1;
}

.calendar-widget__records {
  display: flex;
  width: 63%;
  flex-direction: column;
  justify-content: center;
  padding: 24rpx 16rpx 18rpx;
}

.calendar-record {
  display: flex;
  height: 39rpx;
  align-items: center;
  padding: 0 8rpx;
  border-radius: 999rpx;
  color: #16171b;
  font-size: 22rpx;
}

.calendar-record--active {
  background: #f0f1f3;
  box-shadow: 0 2rpx 7rpx rgba(18, 25, 36, 0.08);
}

.calendar-record__day {
  width: 28rpx;
  font-weight: 600;
}

.calendar-record__dot {
  width: 15rpx;
  height: 15rpx;
  margin: 0 12rpx 0 2rpx;
  border-radius: 999rpx;
}

.calendar-record__value {
  font-variant-numeric: tabular-nums;
}

.trend-widget {
  padding: 31rpx 28rpx 20rpx;
}

.trend-widget__header {
  color: #694ff0;
  font-size: 24rpx;
}

.trend-widget__value {
  color: #0c0d10;
  font-size: 25rpx;
  font-weight: 600;
}

.trend-chart {
  position: relative;
  width: 260rpx;
  height: 152rpx;
  margin-top: 24rpx;
  border-left: 1rpx solid #e4e5e8;
  border-bottom: 1rpx solid #e4e5e8;
}

.trend-chart__grid {
  position: absolute;
  background: #ececef;
}

.trend-chart__grid--v1,
.trend-chart__grid--v2 {
  top: 0;
  width: 1rpx;
  height: 152rpx;
}

.trend-chart__grid--v1 {
  left: 86rpx;
}

.trend-chart__grid--v2 {
  left: 173rpx;
}

.trend-chart__grid--h1,
.trend-chart__grid--h2 {
  left: 0;
  width: 260rpx;
  height: 1rpx;
}

.trend-chart__grid--h1 {
  top: 51rpx;
}

.trend-chart__grid--h2 {
  top: 102rpx;
}

.trend-chart__segment {
  position: absolute;
  z-index: 1;
  height: 4rpx;
  border-radius: 999rpx;
  background: #725cf3;
  transform-origin: left center;
}

.trend-widget__dates {
  display: flex;
  justify-content: space-between;
  margin-top: 11rpx;
  color: #c0c1c5;
  font-size: 19rpx;
}

.reward-widget {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 30rpx 26rpx 24rpx;
  background: linear-gradient(150deg, #fff 0%, #fff 60%, #fff1e9 100%);
}

.reward-widget__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.reward-widget__emoji {
  font-size: 75rpx;
  line-height: 1;
}

.reward-widget__change {
  display: flex;
  align-items: center;
  color: #111217;
  font-size: 25rpx;
  font-weight: 600;
}

.reward-widget__title {
  color: #121318;
  font-size: 27rpx;
  font-weight: 650;
}

.reward-widget__copy {
  display: block;
  margin-top: 7rpx;
  color: #92949c;
  font-size: 20rpx;
  line-height: 1.45;
}

.bmi-widget {
  padding: 34rpx 30rpx 24rpx;
}

.bmi-widget__value {
  display: block;
  margin-top: 5rpx;
  color: #090a0d;
  font-size: 62rpx;
  line-height: 1.1;
  letter-spacing: -2rpx;
}

.bmi-scale {
  position: relative;
  display: flex;
  height: 22rpx;
  margin-top: 48rpx;
  overflow: visible;
  border-radius: 999rpx;
}

.bmi-scale__segment {
  flex: 1;
  height: 22rpx;
  opacity: 0.72;
}

.bmi-scale__segment--cyan {
  border-radius: 999rpx 0 0 999rpx;
  background: #49cdec;
}

.bmi-scale__segment--green {
  background: #b4dc65;
}

.bmi-scale__segment--yellow {
  background: #f4d85d;
}

.bmi-scale__segment--orange {
  border-radius: 0 999rpx 999rpx 0;
  background: #f4a16f;
}

.bmi-scale__marker {
  position: absolute;
  left: 67%;
  top: -9rpx;
  width: 10rpx;
  height: 40rpx;
  border-radius: 999rpx;
  background: #17181c;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.18);
}

.bmi-widget__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 18rpx;
  color: #32343b;
  font-size: 23rpx;
  font-weight: 600;
}

.bmi-widget__hint {
  width: 130rpx;
  color: #a1a3aa;
  font-size: 18rpx;
  font-weight: 400;
  line-height: 1.35;
  text-align: right;
}
</style>
