<script setup>
import { computed } from 'vue'
import { getTeamById } from '../data/teams'
import { getStageName } from '../utils/helpers'
import { useFavorites } from '../composables/useFavorites'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  match: { type: Object, required: true },
  showStage: { type: Boolean, default: true },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const { isFav, toggle } = useFavorites()

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

const favorited = computed(() => isFav(props.match.num))

const onFavClick = (e) => {
  e.stopPropagation()
  toggle(props.match.num)
}
</script>

<template>
  <div
    class="match-card"
    :class="{ 'is-live': isLive, 'is-finished': isFinished, compact }"
    @click="emit('click', match.id)"
  >
    <!-- 顶部信息栏 -->
    <div class="card-header">
      <div class="header-left">
        <span v-if="showStage" class="stage-tag">{{ stageText }}</span>
        <span class="match-time">{{ match.time }}</span>
      </div>
      <button class="fav-btn" :class="{ active: favorited }" @click="onFavClick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="favorited" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" stroke="currentColor"/>
          <path v-else d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    </div>

    <!-- 对阵主体 -->
    <div class="match-body">
      <div class="team-side home">
        <div class="team-logo-wrap">
          <img v-if="homeTeam.logo" :src="homeTeam.logo" :alt="homeTeam.name" loading="lazy" class="team-logo" />
          <span v-else class="team-flag-text">{{ homeTeam.flag }}</span>
        </div>
        <span class="team-name">{{ homeTeam.name }}</span>
      </div>

      <div class="score-section">
        <div class="score-display">
          <span class="score-num" :class="{ 'is-live': isLive }">{{ match.home_score ?? '-' }}</span>
          <span class="score-sep">:</span>
          <span class="score-num" :class="{ 'is-live': isLive }">{{ match.away_score ?? '-' }}</span>
        </div>
        <StatusBadge :status="match.status" />
      </div>

      <div class="team-side away">
        <div class="team-logo-wrap">
          <img v-if="awayTeam.logo" :src="awayTeam.logo" :alt="awayTeam.name" loading="lazy" class="team-logo" />
          <span v-else class="team-flag-text">{{ awayTeam.flag }}</span>
        </div>
        <span class="team-name">{{ awayTeam.name }}</span>
      </div>
    </div>

    <!-- 底部场馆 -->
    <div v-if="match.venue_name && !compact" class="card-footer">
      <svg class="venue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 21V7l9-4 9 4v14"/>
        <path d="M9 21V12h6v9"/>
      </svg>
      <span class="venue-name">{{ match.venue_name }}</span>
    </div>

    <!-- 直播光效 -->
    <div v-if="isLive" class="live-glow"></div>
  </div>
</template>

<style scoped>
.match-card {
  background: var(--wc-surface);
  border-radius: var(--wc-radius-xl);
  padding: var(--wc-space-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--wc-border);
  animation: cardEnter 0.4s ease both;
}

.match-card:active {
  transform: scale(0.97);
  background: var(--wc-surface-active);
  border-color: var(--wc-border-glow);
}

.match-card.is-live {
  border-color: rgba(255, 71, 87, 0.3);
  box-shadow: 0 0 24px rgba(255, 71, 87, 0.1), inset 0 0 0 1px rgba(255, 71, 87, 0.1);
}

.match-card.is-finished {
  opacity: 0.85;
}

/* 顶部信息栏 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--wc-space-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.stage-tag {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-primary);
  font-weight: var(--wc-font-weight-bold);
  background: var(--wc-primary-subtle);
  padding: 3px 8px;
  border-radius: var(--wc-radius-full);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.match-time {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-muted);
  font-weight: var(--wc-font-weight-medium);
}

.fav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--wc-text-muted);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
  border-radius: var(--wc-radius-full);
}

.fav-btn svg {
  width: 18px;
  height: 18px;
}

.fav-btn:active {
  transform: scale(1.3);
}

.fav-btn.active {
  color: var(--wc-warning);
}

/* 对阵主体 */
.match-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wc-space-md);
}

.team-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wc-space-sm);
  min-width: 0;
}

.team-side.away {
  order: 3;
}

.team-logo-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--wc-radius-lg);
  padding: 4px;
}

.team-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.team-flag-text {
  font-size: 28px;
}

.team-name {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
}

/* 比分区域 */
.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wc-space-sm);
  min-width: 88px;
  order: 2;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  padding: var(--wc-space-sm) var(--wc-space-lg);
  border-radius: var(--wc-radius-lg);
}

.score-num {
  font-size: var(--wc-font-size-4xl);
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-text-primary);
  min-width: 28px;
  text-align: center;
  line-height: 1;
  letter-spacing: -1px;
}

.score-num.is-live {
  color: var(--wc-primary);
  text-shadow: 0 0 12px var(--wc-primary-glow);
}

.score-sep {
  font-size: var(--wc-font-size-xl);
  color: var(--wc-text-muted);
  font-weight: var(--wc-font-weight-bold);
}

/* 底部场馆 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: var(--wc-space-lg);
  padding-top: var(--wc-space-md);
  border-top: 1px solid var(--wc-border-light);
}

.venue-icon {
  width: 14px;
  height: 14px;
  color: var(--wc-text-muted);
  flex-shrink: 0;
}

.venue-name {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

/* 直播光效 */
.live-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 71, 87, 0.06), transparent 50%);
  pointer-events: none;
  animation: glowPulse 3s ease-in-out infinite;
}

/* 紧凑模式 */
.compact {
  padding: var(--wc-space-md);
}

.compact .card-header {
  margin-bottom: var(--wc-space-sm);
}

.compact .team-logo-wrap {
  width: 36px;
  height: 36px;
}

.compact .team-logo {
  width: 28px;
  height: 28px;
}

.compact .team-name {
  font-size: var(--wc-font-size-sm);
}

.compact .score-num {
  font-size: var(--wc-font-size-3xl);
}

.compact .score-display {
  padding: var(--wc-space-xs) var(--wc-space-md);
}
</style>
