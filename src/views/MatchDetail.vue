<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getScheduleFallback, getDqMatchDetail, getDqMatchOverview, getDqMatchLineup } from '../services'
import { getTeamById } from '../data/teams'
import { formatDate, getStageName } from '../utils/helpers'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const match = ref(null)
const dqDetail = ref(null)
const dqOverview = ref(null)
const dqLineup = ref(null)
const loading = ref(true)
const activeTab = ref('info')
const matchId = route.params.id

let refreshTimer = null

const getTeamInfo = (teamCode, fallbackName) => {
  const team = getTeamById(teamCode)
  return team || { name: fallbackName || teamCode, flag: '', logo: '' }
}

// 比赛状态
const matchStatus = computed(() => {
  if (dqDetail.value) return dqDetail.value.status
  return 'scheduled'
})

const statusText = computed(() => {
  const map = {
    scheduled: '未开始',
    live: '进行中',
    halftime: '中场休息',
    finished: '已结束',
    extra_time: '加时赛',
    penalties: '点球大战',
    postponed: '推迟',
    cancelled: '取消'
  }
  return map[matchStatus.value] || '未开始'
})

const statusClass = computed(() => {
  if (['live', 'halftime', 'extra_time', 'penalties'].includes(matchStatus.value)) return 'status-live'
  if (matchStatus.value === 'finished') return 'status-finished'
  return 'status-scheduled'
})

// 比分
const homeScore = computed(() => dqDetail.value?.homeScore ?? match.value?.home_score ?? '-')
const awayScore = computed(() => dqDetail.value?.awayScore ?? match.value?.away_score ?? '-')

// 球队Logo：优先用懂球帝的，其次用本地数据
const homeLogo = computed(() => dqDetail.value?.homeTeam?.logo || getTeamInfo(match.value?.home_team, match.value?.home_name).logo)
const awayLogo = computed(() => dqDetail.value?.awayTeam?.logo || getTeamInfo(match.value?.away_team, match.value?.away_name).logo)

// 球队排名
const homeRank = computed(() => dqDetail.value?.homeTeam?.rank || '')
const awayRank = computed(() => dqDetail.value?.awayTeam?.rank || '')

// 比赛事件
const matchEvents = computed(() => dqOverview.value?.events || [])

// 比赛统计
const matchStats = computed(() => dqOverview.value?.statistics || [])

// 阵容信息
const lineupInfo = computed(() => dqLineup.value || null)

// 半场比分
const halfScore = computed(() => {
  if (dqDetail.value?.homeHalfScore !== null && dqDetail.value?.awayHalfScore !== null) {
    return `${dqDetail.value.homeHalfScore} - ${dqDetail.value.awayHalfScore}`
  }
  return ''
})

// 加载懂球帝数据
const loadDqData = async (dqMatchId) => {
  try {
    const [detail, overview, lineup] = await Promise.allSettled([
      getDqMatchDetail(dqMatchId),
      getDqMatchOverview(dqMatchId),
      getDqMatchLineup(dqMatchId)
    ])
    if (detail.status === 'fulfilled' && detail.value) dqDetail.value = detail.value
    if (overview.status === 'fulfilled' && overview.value) dqOverview.value = overview.value
    if (lineup.status === 'fulfilled' && lineup.value) dqLineup.value = lineup.value
  } catch (e) {
    console.error('懂球帝数据加载失败:', e)
  }
}

// 启动定时刷新
const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (!match.value?.dq_match_id) return

  const status = dqDetail.value?.status
  if (['live', 'halftime', 'extra_time', 'penalties'].includes(status)) {
    // 比赛中：30秒刷新
    refreshTimer = setInterval(() => loadDqData(match.value.dq_match_id), 30000)
  } else if (status === 'scheduled') {
    // 未开始：2分钟刷新（等阵容发布、状态变化）
    refreshTimer = setInterval(async () => {
      await loadDqData(match.value.dq_match_id)
      // 状态变了（比如开赛了），切换刷新频率
      if (dqDetail.value && !['scheduled'].includes(dqDetail.value.status)) {
        startAutoRefresh()
      }
    }, 120000)
  }
  // 已结束：不刷新
}

onMounted(async () => {
  loading.value = true
  try {
    const matches = await getScheduleFallback()
    match.value = matches.find(m => m.id === matchId)

    if (match.value?.dq_match_id) {
      await loadDqData(match.value.dq_match_id)
      startAutoRefresh()
    }
  } catch (error) {
    console.error('比赛详情加载失败:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// 事件类型图标
const eventIcon = (type) => {
  const icons = {
    goal: '⚽', own_goal: '⚽', penalty: '⚽', penalty_miss: '❌',
    yellow_card: '🟨', red_card: '🟥', second_yellow_card: '🟨🟥',
    substitution: '🔄', var: '📺', injury: '🤕'
  }
  return icons[type] || '📌'
}

// 统计数据百分比
const statPercent = (home, away) => {
  const h = parseFloat(home) || 0
  const a = parseFloat(away) || 0
  const total = h + a
  if (total === 0) return { home: 50, away: 50 }
  return { home: Math.round(h / total * 100), away: Math.round(a / total * 100) }
}
</script>

<template>
  <div class="page-container">
    <header class="detail-header">
      <button class="back-btn" @click="router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h1 class="header-title">比赛详情</h1>
    </header>

    <LoadingState v-if="loading" />

    <template v-else-if="match">
      <!-- 比赛主区域 -->
      <section class="match-main">
        <div class="match-stage-badge">
          {{ match.stage === 'group' ? `${match.group}组` : getStageName(match.stage) }}
        </div>

        <div class="match-teams">
          <div class="team-block">
            <div class="team-logo-wrap">
              <img v-if="homeLogo" :src="homeLogo" alt="" class="team-logo-img" />
              <span v-else class="team-flag-emoji">{{ getTeamInfo(match.home_team, match.home_name).flag }}</span>
            </div>
            <div class="team-name">{{ getTeamInfo(match.home_team, match.home_name).name }}</div>
            <div class="team-rank" v-if="homeRank">{{ homeRank }}</div>
          </div>

          <div class="score-block">
            <div class="score-display">
              <span class="score">{{ homeScore }}</span>
              <span class="score-sep">:</span>
              <span class="score">{{ awayScore }}</span>
            </div>
            <div class="match-status" :class="statusClass">
              <span v-if="dqDetail?.minute" class="live-minute">{{ dqDetail.minute }}'</span>
              {{ statusText }}
            </div>
            <div class="half-score" v-if="halfScore">半场 {{ halfScore }}</div>
          </div>

          <div class="team-block">
            <div class="team-logo-wrap">
              <img v-if="awayLogo" :src="awayLogo" alt="" class="team-logo-img" />
              <span v-else class="team-flag-emoji">{{ getTeamInfo(match.away_team, match.away_name).flag }}</span>
            </div>
            <div class="team-name">{{ getTeamInfo(match.away_team, match.away_name).name }}</div>
            <div class="team-rank" v-if="awayRank">{{ awayRank }}</div>
          </div>
        </div>

        <div class="match-meta">
          <div class="meta-item" v-if="match.date">
            <span class="meta-icon">📅</span>
            <span>{{ formatDate(match.date) }}</span>
          </div>
          <div class="meta-item" v-if="match.time">
            <span class="meta-icon">⏰</span>
            <span>{{ match.time }}</span>
          </div>
          <div class="meta-item" v-if="match.venue_name">
            <span class="meta-icon">🏟️</span>
            <span>{{ match.venue_name }}</span>
          </div>
          <div class="meta-item" v-if="match.venue_city">
            <span class="meta-icon">📍</span>
            <span>{{ match.venue_city }}</span>
          </div>
        </div>
      </section>

      <!-- Tab 切换 -->
      <div class="tab-bar" v-if="dqDetail">
        <button
          v-for="tab in [
            { key: 'info', label: '赛况' },
            { key: 'stats', label: '统计' },
            { key: 'lineup', label: '阵容' }
          ]"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>

      <!-- 赛况/事件 -->
      <section class="tab-content" v-if="activeTab === 'info' && dqDetail">
        <div class="card" v-if="matchEvents.length > 0">
          <div class="card-title">比赛事件</div>
          <div class="event-list">
            <div
              v-for="(evt, i) in matchEvents"
              :key="i"
              class="event-item"
              :class="{ 'event-home': evt.position === 'home', 'event-away': evt.position === 'away' }"
            >
              <span class="event-minute">{{ evt.time || evt.minute }}'</span>
              <span class="event-icon">{{ eventIcon(evt.type) }}</span>
              <span class="event-text">{{ evt.player || evt.content }}</span>
            </div>
          </div>
        </div>
        <div class="card" v-if="lineupInfo">
          <div class="card-title">比赛信息</div>
          <div class="info-grid">
            <div class="info-row" v-if="lineupInfo.weather">
              <span class="info-label">天气</span>
              <span class="info-value">{{ lineupInfo.weather }}</span>
            </div>
            <div class="info-row" v-if="lineupInfo.temperature">
              <span class="info-label">温度</span>
              <span class="info-value">{{ lineupInfo.temperature }}</span>
            </div>
            <div class="info-row" v-if="lineupInfo.field">
              <span class="info-label">场地</span>
              <span class="info-value">{{ lineupInfo.field }}</span>
            </div>
            <div class="info-row" v-if="lineupInfo.referee">
              <span class="info-label">裁判</span>
              <span class="info-value">{{ lineupInfo.referee }}</span>
            </div>
          </div>
        </div>
        <div class="empty-hint" v-if="!matchEvents.length && !lineupInfo">暂无赛况数据</div>
      </section>

      <!-- 统计 -->
      <section class="tab-content" v-if="activeTab === 'stats' && dqDetail">
        <div class="card" v-if="matchStats.length > 0">
          <div class="stat-list">
            <div v-for="(stat, i) in matchStats" :key="i" class="stat-row">
              <span class="stat-home">{{ stat.home || stat.team_A || '0' }}</span>
              <div class="stat-bar-wrap">
                <span class="stat-name">{{ stat.type || stat.name }}</span>
                <div class="stat-bar">
                  <div class="stat-bar-fill home" :style="{ width: statPercent(stat.home || stat.team_A, stat.away || stat.team_B).home + '%' }"></div>
                  <div class="stat-bar-fill away" :style="{ width: statPercent(stat.home || stat.team_A, stat.away || stat.team_B).away + '%' }"></div>
                </div>
              </div>
              <span class="stat-away">{{ stat.away || stat.team_B || '0' }}</span>
            </div>
          </div>
        </div>
        <div class="empty-hint" v-else>暂无统计数据</div>
      </section>

      <!-- 阵容 -->
      <section class="tab-content" v-if="activeTab === 'lineup' && dqDetail">
        <template v-if="lineupInfo">
          <div class="card" v-if="lineupInfo.home?.lineups || lineupInfo.homeForecast?.lineups">
            <div class="card-title lineup-title">
              <img :src="homeLogo" class="lineup-team-logo" v-if="homeLogo" />
              {{ getTeamInfo(match.home_team, match.home_name).name }}
              <span class="formation" v-if="lineupInfo.home?.formation || lineupInfo.homeForecast?.formation">
                {{ lineupInfo.home?.formation || lineupInfo.homeForecast?.formation }}
              </span>
            </div>
            <div class="lineup-list" v-if="lineupInfo.home?.lineups">
              <div v-for="p in lineupInfo.home.lineups" :key="p.player_id" class="lineup-player">
                <span class="player-number">{{ p.shirt_number }}</span>
                <span class="player-name">{{ p.player_name }}</span>
              </div>
            </div>
            <div class="lineup-placeholder" v-else>阵容尚未公布</div>
          </div>
          <div class="card" v-if="lineupInfo.away?.lineups || lineupInfo.awayForecast?.lineups">
            <div class="card-title lineup-title">
              <img :src="awayLogo" class="lineup-team-logo" v-if="awayLogo" />
              {{ getTeamInfo(match.away_team, match.away_name).name }}
              <span class="formation" v-if="lineupInfo.away?.formation || lineupInfo.awayForecast?.formation">
                {{ lineupInfo.away?.formation || lineupInfo.awayForecast?.formation }}
              </span>
            </div>
            <div class="lineup-list" v-if="lineupInfo.away?.lineups">
              <div v-for="p in lineupInfo.away.lineups" :key="p.player_id" class="lineup-player">
                <span class="player-number">{{ p.shirt_number }}</span>
                <span class="player-name">{{ p.player_name }}</span>
              </div>
            </div>
            <div class="lineup-placeholder" v-else>阵容尚未公布</div>
          </div>
        </template>
        <div class="empty-hint" v-else>暂无阵容数据</div>
      </section>
    </template>

    <EmptyState
      v-else
      message="未找到该比赛信息"
      icon="⚽"
      actionText="返回赛程"
      actionTo="/"
    />
  </div>
</template>

<style scoped>
/* Header */
.detail-header {
  display: flex;
  align-items: center;
  padding: var(--wc-space-md) var(--wc-space-lg);
  background: var(--wc-dark);
  color: white;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: var(--wc-space-xs);
  margin-right: var(--wc-space-md);
  display: flex;
  align-items: center;
}

.header-title {
  font-size: var(--wc-font-size-lg);
  font-weight: var(--wc-font-weight-semibold);
  margin: 0;
}

/* Match Main */
.match-main {
  background: linear-gradient(135deg, var(--wc-dark), var(--wc-darker));
  color: white;
  padding: var(--wc-space-xl) var(--wc-space-lg) var(--wc-space-2xl);
  text-align: center;
}

.match-stage-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  padding: var(--wc-space-xs) var(--wc-space-md);
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-sm);
  margin-bottom: var(--wc-space-xl);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wc-space-xl);
  margin-bottom: var(--wc-space-xl);
}

.team-block {
  flex: 1;
  text-align: center;
}

.team-logo-wrap {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--wc-space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-logo-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
}

.team-flag-emoji {
  font-size: 42px;
}

.team-name {
  font-size: var(--wc-font-size-lg);
  font-weight: var(--wc-font-weight-semibold);
}

.team-rank {
  font-size: var(--wc-font-size-xs);
  opacity: 0.6;
  margin-top: 2px;
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.score {
  font-size: var(--wc-font-size-5xl);
  font-weight: var(--wc-font-weight-black);
  line-height: 1;
}

.score-sep {
  font-size: var(--wc-font-size-3xl);
  opacity: 0.5;
}

.match-status {
  margin-top: var(--wc-space-sm);
  padding: 2px 10px;
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-xs);
  white-space: nowrap;
}

.match-status.status-scheduled {
  background: rgba(255, 255, 255, 0.2);
}

.match-status.status-live {
  background: var(--wc-primary);
  animation: pulse 2s infinite;
}

.match-status.status-finished {
  background: var(--wc-accent);
}

.live-minute {
  font-weight: var(--wc-font-weight-bold);
  margin-right: 4px;
}

.half-score {
  font-size: var(--wc-font-size-xs);
  opacity: 0.6;
  margin-top: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.match-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--wc-space-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
  font-size: var(--wc-font-size-md);
  opacity: 0.9;
}

.meta-icon {
  font-size: var(--wc-font-size-base);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: var(--wc-surface);
  border-bottom: 1px solid var(--wc-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-btn {
  flex: 1;
  padding: var(--wc-space-md) 0;
  border: none;
  background: none;
  font-size: var(--wc-font-size-base);
  color: var(--wc-text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn.active {
  color: var(--wc-primary);
  font-weight: var(--wc-font-weight-semibold);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  background: var(--wc-primary);
  border-radius: 2px;
}

/* Tab Content */
.tab-content {
  padding: var(--wc-space-md) var(--wc-space-lg);
}

/* Card */
.card {
  background: var(--wc-surface);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-lg);
  margin-bottom: var(--wc-space-md);
}

.card-title {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  margin-bottom: var(--wc-space-md);
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

/* Events */
.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-xs) 0;
  font-size: var(--wc-font-size-sm);
}

.event-minute {
  min-width: 32px;
  color: var(--wc-text-secondary);
  font-variant-numeric: tabular-nums;
}

.event-icon {
  font-size: var(--wc-font-size-base);
}

.event-text {
  flex: 1;
}

.event-home {
  flex-direction: row;
}

.event-away {
  flex-direction: row-reverse;
  text-align: right;
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--wc-space-xs) 0;
  font-size: var(--wc-font-size-sm);
  border-bottom: 1px solid var(--wc-border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--wc-text-secondary);
}

.info-value {
  color: var(--wc-text-primary);
  font-weight: var(--wc-font-weight-medium);
}

/* Stats */
.stat-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: var(--wc-space-md);
}

.stat-home, .stat-away {
  min-width: 36px;
  text-align: center;
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.stat-bar-wrap {
  flex: 1;
}

.stat-name {
  display: block;
  text-align: center;
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  margin-bottom: 4px;
}

.stat-bar {
  height: 6px;
  background: var(--wc-gray-100);
  border-radius: 3px;
  display: flex;
  overflow: hidden;
}

.stat-bar-fill.home {
  background: var(--wc-primary);
  border-radius: 3px 0 0 3px;
}

.stat-bar-fill.away {
  background: var(--wc-accent);
  border-radius: 0 3px 3px 0;
  margin-left: auto;
}

/* Lineup */
.lineup-title {
  font-size: var(--wc-font-size-base);
}

.lineup-team-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.formation {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  background: var(--wc-gray-100);
  padding: 1px 6px;
  border-radius: var(--wc-radius-sm);
  margin-left: auto;
}

.lineup-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-xs);
}

.lineup-player {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-xs) 0;
  font-size: var(--wc-font-size-sm);
}

.player-number {
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wc-gray-100);
  border-radius: var(--wc-radius-sm);
  font-size: var(--wc-font-size-xs);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-secondary);
}

.player-name {
  color: var(--wc-text-primary);
}

.lineup-placeholder {
  text-align: center;
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-sm);
  padding: var(--wc-space-lg) 0;
}

.empty-hint {
  text-align: center;
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-sm);
  padding: var(--wc-space-2xl) 0;
}
</style>
