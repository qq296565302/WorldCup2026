<script setup>
import { computed } from 'vue'
import { getTeamById } from '../data/teams'
import { getStageName } from '../utils/helpers'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  match: { type: Object, required: true },
  showStage: { type: Boolean, default: true },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const homeTeam = computed(() =>
  getTeamById(props.match.home_team) || { name: props.match.home_name, flag: '' }
)

const awayTeam = computed(() =>
  getTeamById(props.match.away_team) || { name: props.match.away_name, flag: '' }
)

const stageText = computed(() => {
  if (props.match.stage === 'group') return `${props.match.group}组`
  return getStageName(props.match.stage)
})

const isLive = computed(() => {
  const s = props.match.status
  return ['live', '1H', '2H', 'HT', 'ET', 'P'].includes(s)
})

const isFinished = computed(() => {
  const s = props.match.status
  return ['finished', 'FT'].includes(s)
})
</script>

<template>
  <div
    class="match-card"
    :class="{ 'is-live': isLive, 'is-finished': isFinished, compact }"
    @click="emit('click', match.id)"
  >
    <!-- 顶部：阶段标签 + 时间 -->
    <div class="card-top">
      <span v-if="showStage" class="stage-tag">{{ stageText }}</span>
      <span class="match-time">{{ match.time }}</span>
    </div>

    <!-- 对阵区域 -->
    <div class="card-body">
      <!-- 主队 -->
      <div class="team-col home">
        <div class="team-flag">
          <img v-if="homeTeam.logo" :src="homeTeam.logo" :alt="homeTeam.name" class="flag-img" />
          <span v-else>{{ homeTeam.flag }}</span>
        </div>
        <div class="team-name">{{ homeTeam.name }}</div>
      </div>

      <!-- 比分 -->
      <div class="score-col">
        <div class="score-box">
          <span class="score-num">{{ match.home_score ?? '-' }}</span>
          <span class="score-vs">VS</span>
          <span class="score-num">{{ match.away_score ?? '-' }}</span>
        </div>
        <StatusBadge :status="match.status" />
      </div>

      <!-- 客队 -->
      <div class="team-col away">
        <div class="team-flag">
          <img v-if="awayTeam.logo" :src="awayTeam.logo" :alt="awayTeam.name" class="flag-img" />
          <span v-else>{{ awayTeam.flag }}</span>
        </div>
        <div class="team-name">{{ awayTeam.name }}</div>
      </div>
    </div>

    <!-- 底部：场馆信息 -->
    <div v-if="match.venue_name && !compact" class="card-bottom">
      <span class="venue-icon">🏟️</span>
      <span class="venue-name">{{ match.venue_name }}</span>
    </div>

    <!-- 直播状态动画 -->
    <div v-if="isLive" class="live-indicator">
      <span class="live-dot"></span>
    </div>
  </div>
</template>

<style scoped>
.match-card {
  background: var(--wc-surface);
  border-radius: var(--wc-radius-xl);
  padding: var(--wc-space-md);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--wc-border-light);
}

.match-card:active {
  transform: scale(0.97);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 直播状态 */
.match-card.is-live {
  border-color: var(--wc-primary);
  background: linear-gradient(135deg, #fff5f5, #fff);
}

/* 已结束状态 */
.match-card.is-finished {
  opacity: 0.9;
}

/* 顶部 */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--wc-space-md);
}

.stage-tag {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-primary);
  font-weight: var(--wc-font-weight-semibold);
  background: var(--wc-primary-light);
  padding: 2px var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
}

.match-time {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
  font-weight: var(--wc-font-weight-medium);
}

/* 对阵区域 */
.card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wc-space-sm);
}

.team-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.team-flag {
  width: 32px;
  height: 32px;
  margin-bottom: var(--wc-space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.flag-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.team-name {
  font-size: var(--wc-font-size-md);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 比分 */
.score-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wc-space-xs);
  min-width: 80px;
}

.score-box {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  background: var(--wc-gray-50);
  padding: var(--wc-space-xs) var(--wc-space-md);
  border-radius: var(--wc-radius-lg);
}

.score-num {
  font-size: var(--wc-font-size-3xl);
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-text-primary);
  min-width: 24px;
  text-align: center;
}

.is-live .score-num {
  color: var(--wc-primary);
}

.score-vs {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  font-weight: var(--wc-font-weight-bold);
}

/* 底部场馆 */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wc-space-xs);
  margin-top: var(--wc-space-md);
  padding-top: var(--wc-space-sm);
  border-top: 1px solid var(--wc-border-light);
}

.venue-icon {
  font-size: 12px;
}

.venue-name {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

/* 直播指示器 */
.live-indicator {
  position: absolute;
  top: var(--wc-space-sm);
  right: var(--wc-space-sm);
}

.live-dot {
  display: block;
  width: 8px;
  height: 8px;
  background: var(--wc-primary);
  border-radius: var(--wc-radius-full);
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* 紧凑模式 */
.compact {
  padding: var(--wc-space-sm) var(--wc-space-md);
}

.compact .card-top {
  margin-bottom: var(--wc-space-sm);
}

.compact .team-flag {
  width: 24px;
  height: 24px;
}

.compact .flag-img {
  width: 24px;
  height: 24px;
}

.compact .team-name {
  font-size: var(--wc-font-size-sm);
}

.compact .score-num {
  font-size: var(--wc-font-size-2xl);
}

.compact .score-box {
  padding: var(--wc-space-xs) var(--wc-space-sm);
}
</style>
