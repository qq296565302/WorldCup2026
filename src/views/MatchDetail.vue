<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getScheduleFallback, getDqMatchDetail, getDqMatchOverview, getDqMatchLineup, getDqMatchOdds, getDqMatchAnalysis } from '../services'
import { getTeamById } from '../data/teams'
import { formatDate, getStageName } from '../utils/helpers'
import { cacheVenue } from '../composables/useVenueCache'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const match = ref(null)
const dqDetail = ref(null)
const dqOverview = ref(null)
const dqLineup = ref(null)
const dqOdds = ref(null)
const dqAnalysis = ref(null)
const loading = ref(true)
const activeTab = ref('info')
const oddsType = ref('europe')
const recentCount = ref(5)
const matchId = route.params.id

let refreshTimer = null

const getTeamInfo = (teamCode, fallbackName) => {
  const team = getTeamById(teamCode)
  return team || { name: fallbackName || teamCode, flag: '', logo: '', id: teamCode }
}

// 解析球队ID（处理IOC→FIFA代码映射）
const resolveTeamId = (teamCode) => {
  const team = getTeamById(teamCode)
  return team?.id || teamCode
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

// 球队Logo
const homeLogo = computed(() => dqDetail.value?.homeTeam?.logo || getTeamInfo(match.value?.home_team, match.value?.home_name).logo)
const awayLogo = computed(() => dqDetail.value?.awayTeam?.logo || getTeamInfo(match.value?.away_team, match.value?.away_name).logo)

// 球队排名
const homeRank = computed(() => {
  const r = dqDetail.value?.homeTeam?.rank
  if (!r) return ''
  const num = r.replace(/[^0-9]/g, '')
  return num ? `世界排名第 ${num} 位` : ''
})
const awayRank = computed(() => {
  const r = dqDetail.value?.awayTeam?.rank
  if (!r) return ''
  const num = r.replace(/[^0-9]/g, '')
  return num ? `世界排名第 ${num} 位` : ''
})

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

// 场馆信息优先用懂球帝数据
const venueField = computed(() => dqLineup.value?.field || '')
// 从懂球帝field提取城市（格式："多伦多体育场·加拿大"）
const venueCity = computed(() => {
  if (venueField.value) {
    const parts = venueField.value.split('·')
    if (parts.length >= 2) return parts[parts.length - 1]
  }
  return match.value?.venue_city || ''
})
// 场馆名（去掉城市部分）
const venueName = computed(() => {
  if (venueField.value) {
    const parts = venueField.value.split('·')
    return parts[0]
  }
  return match.value?.venue_name || ''
})

// 分析数据
const battleHistory = computed(() => dqAnalysis.value?.battle_history?.list || [])
const recentHome = computed(() => (dqAnalysis.value?.recent_record?.team_A || []).slice(0, recentCount.value))
const recentAway = computed(() => (dqAnalysis.value?.recent_record?.team_B || []).slice(0, recentCount.value))
const futureHome = computed(() => dqAnalysis.value?.feature_matches?.team_A || [])
const futureAway = computed(() => dqAnalysis.value?.feature_matches?.team_B || [])

// 加载懂球帝数据
const loadDqData = async (dqMatchId) => {
  try {
    const [detail, overview, lineup, odds, analysis] = await Promise.allSettled([
      getDqMatchDetail(dqMatchId),
      getDqMatchOverview(dqMatchId),
      getDqMatchLineup(dqMatchId),
      getDqMatchOdds(dqMatchId),
      getDqMatchAnalysis(dqMatchId)
    ])
    if (detail.status === 'fulfilled' && detail.value) dqDetail.value = detail.value
    if (overview.status === 'fulfilled' && overview.value) dqOverview.value = overview.value
    if (lineup.status === 'fulfilled' && lineup.value) {
      dqLineup.value = lineup.value
      // 缓存懂球帝场馆数据，供赛程页面使用
      if (lineup.value.field && match.value?.dq_match_id) {
        cacheVenue(match.value.dq_match_id, lineup.value.field)
      }
    }
    if (odds.status === 'fulfilled' && odds.value) dqOdds.value = odds.value
    if (analysis.status === 'fulfilled' && analysis.value) dqAnalysis.value = analysis.value
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
    refreshTimer = setInterval(() => loadDqData(match.value.dq_match_id), 30000)
  } else if (status === 'scheduled') {
    refreshTimer = setInterval(async () => {
      await loadDqData(match.value.dq_match_id)
      if (dqDetail.value && !['scheduled'].includes(dqDetail.value.status)) {
        startAutoRefresh()
      }
    }, 120000)
  }
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

// 当前赔率数据
const currentOdds = computed(() => {
  if (!dqOdds.value) return []
  return dqOdds.value[oddsType.value] || []
})

// 赔率变化方向
const oddsTrend = (now, begin) => {
  const n = parseFloat(now)
  const b = parseFloat(begin)
  if (isNaN(n) || isNaN(b) || n === b) return ''
  return n < b ? 'down' : 'up'
}

// 比赛结果颜色
const matchResultColor = (color) => {
  if (color === 'win') return 'result-win'
  if (color === 'lose') return 'result-lose'
  return 'result-draw'
}

// 比赛结果文字
const matchResultText = (color) => {
  if (color === 'win') return '胜'
  if (color === 'lose') return '负'
  return '平'
}

// 格式化比赛日期
const formatMatchDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
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
          <div class="team-block" @click="router.push(`/team/${resolveTeamId(match.home_team)}`)">
            <div class="team-logo-wrap">
              <img v-if="homeLogo" :src="homeLogo" alt="" loading="lazy" class="team-logo-img" />
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

          <div class="team-block" @click="router.push(`/team/${resolveTeamId(match.away_team)}`)">
            <div class="team-logo-wrap">
              <img v-if="awayLogo" :src="awayLogo" alt="" loading="lazy" class="team-logo-img" />
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
          <div class="meta-item" v-if="venueName">
            <span class="meta-icon">🏟️</span>
            <span>{{ venueName }}</span>
          </div>
          <div class="meta-item" v-if="venueCity">
            <span class="meta-icon">📍</span>
            <span>{{ venueCity }}</span>
          </div>
        </div>
      </section>

      <!-- Tab 切换 -->
      <div class="tab-bar" v-if="dqDetail">
        <button
          v-for="tab in [
            { key: 'info', label: '赛况' },
            { key: 'stats', label: '统计' },
            { key: 'lineup', label: '阵容' },
            { key: 'odds', label: '指数' },
            { key: 'analysis', label: '分析' }
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
              <img :src="homeLogo" loading="lazy" class="lineup-team-logo" v-if="homeLogo" />
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
              <img :src="awayLogo" loading="lazy" class="lineup-team-logo" v-if="awayLogo" />
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

      <!-- 指数/赔率 -->
      <section class="tab-content" v-if="activeTab === 'odds' && dqDetail">
        <template v-if="dqOdds">
          <div class="odds-type-bar">
            <button
              v-for="t in [
                { key: 'europe', label: '欧指' },
                { key: 'asia', label: '亚盘' },
                { key: 'size', label: '大小球' }
              ]"
              :key="t.key"
              class="odds-type-btn"
              :class="{ active: oddsType === t.key }"
              @click="oddsType = t.key"
            >{{ t.label }}</button>
          </div>

          <!-- 欧指 -->
          <div class="card" v-if="oddsType === 'europe'">
            <!-- 欧指汇总 -->
            <div class="odds-summary" v-if="dqOdds.summary">
              <div class="summary-grid">
                <div class="summary-cell"></div>
                <div class="summary-cell group-label">
                  <span>初盘</span>
                </div>
                <div class="summary-cell group-label">
                  <span>即时</span>
                </div>
              </div>
              <div class="summary-grid sub-header">
                <div class="summary-cell"></div>
                <div class="summary-cell">主胜</div>
                <div class="summary-cell">平</div>
                <div class="summary-cell">客胜</div>
                <div class="summary-cell">主胜</div>
                <div class="summary-cell">平</div>
                <div class="summary-cell">客胜</div>
              </div>
              <div class="summary-grid" v-if="dqOdds.summary.max">
                <div class="summary-cell label">最高值</div>
                <div class="summary-cell">{{ dqOdds.summary.max.begin?.homeWin || '-' }}</div>
                <div class="summary-cell">{{ dqOdds.summary.max.begin?.draw || '-' }}</div>
                <div class="summary-cell">{{ dqOdds.summary.max.begin?.awayWin || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.max.now?.homeWin || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.max.now?.draw || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.max.now?.awayWin || '-' }}</div>
              </div>
              <div class="summary-grid" v-if="dqOdds.summary.min">
                <div class="summary-cell label">最低值</div>
                <div class="summary-cell">{{ dqOdds.summary.min.begin?.homeWin || '-' }}</div>
                <div class="summary-cell">{{ dqOdds.summary.min.begin?.draw || '-' }}</div>
                <div class="summary-cell">{{ dqOdds.summary.min.begin?.awayWin || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.min.now?.homeWin || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.min.now?.draw || '-' }}</div>
                <div class="summary-cell highlight">{{ dqOdds.summary.min.now?.awayWin || '-' }}</div>
              </div>
              <div class="summary-grid avg-row" v-if="dqOdds.summary.avg">
                <div class="summary-cell label accent">平均值</div>
                <div class="summary-cell accent">{{ dqOdds.summary.avg.begin?.homeWin || '-' }}</div>
                <div class="summary-cell accent">{{ dqOdds.summary.avg.begin?.draw || '-' }}</div>
                <div class="summary-cell accent">{{ dqOdds.summary.avg.begin?.awayWin || '-' }}</div>
                <div class="summary-cell accent bold">{{ dqOdds.summary.avg.now?.homeWin || '-' }}</div>
                <div class="summary-cell accent bold">{{ dqOdds.summary.avg.now?.draw || '-' }}</div>
                <div class="summary-cell accent bold">{{ dqOdds.summary.avg.now?.awayWin || '-' }}</div>
              </div>
            </div>
            <!-- 欧指明细 -->
            <div class="odds-list" v-if="currentOdds.length">
              <div class="odds-item" v-for="(c, i) in currentOdds" :key="i">
                <div class="odds-item-header">
                  <span class="odds-item-name">{{ c.abbr }}</span>
                  <span class="odds-item-area">{{ c.area }}</span>
                </div>
                <div class="odds-item-row">
                  <div class="odds-item-cell">
                    <span class="cell-label">主胜</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.homeWin, c.begin?.homeWin)">{{ c.now?.homeWin || '-' }}</span>
                  </div>
                  <div class="odds-item-cell">
                    <span class="cell-label">平</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.draw, c.begin?.draw)">{{ c.now?.draw || '-' }}</span>
                  </div>
                  <div class="odds-item-cell">
                    <span class="cell-label">客胜</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.awayWin, c.begin?.awayWin)">{{ c.now?.awayWin || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 亚盘 -->
          <div class="card" v-if="oddsType === 'asia' && currentOdds.length">
            <div class="odds-list">
              <div class="odds-item" v-for="(c, i) in currentOdds" :key="i">
                <div class="odds-item-header">
                  <span class="odds-item-name">{{ c.abbr }}</span>
                  <span class="odds-item-area">{{ c.area }}</span>
                </div>
                <div class="odds-item-row">
                  <div class="odds-item-cell">
                    <span class="cell-label">主</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.home, c.begin?.home)">{{ c.now?.home || '-' }}</span>
                  </div>
                  <div class="odds-item-cell center">
                    <span class="cell-label">盘口</span>
                    <span class="cell-value handicap">{{ c.now?.handicap || '-' }}</span>
                  </div>
                  <div class="odds-item-cell">
                    <span class="cell-label">客</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.away, c.begin?.away)">{{ c.now?.away || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 大小球 -->
          <div class="card" v-if="oddsType === 'size' && currentOdds.length">
            <div class="odds-list">
              <div class="odds-item" v-for="(c, i) in currentOdds" :key="i">
                <div class="odds-item-header">
                  <span class="odds-item-name">{{ c.abbr }}</span>
                  <span class="odds-item-area">{{ c.area }}</span>
                </div>
                <div class="odds-item-row">
                  <div class="odds-item-cell">
                    <span class="cell-label">大</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.over, c.begin?.over)">{{ c.now?.over || '-' }}</span>
                  </div>
                  <div class="odds-item-cell center">
                    <span class="cell-label">盘口</span>
                    <span class="cell-value handicap">{{ c.now?.line || '-' }}</span>
                  </div>
                  <div class="odds-item-cell">
                    <span class="cell-label">小</span>
                    <span class="cell-value" :class="oddsTrend(c.now?.under, c.begin?.under)">{{ c.now?.under || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-hint" v-if="!currentOdds.length">暂无赔率数据</div>
        </template>
        <div class="empty-hint" v-else>暂无指数数据</div>
      </section>

      <!-- 分析 -->
      <section class="tab-content" v-if="activeTab === 'analysis' && dqDetail">
        <template v-if="dqAnalysis">
          <!-- 交锋历史 -->
          <div class="card" v-if="battleHistory.length">
            <div class="card-title">交锋历史</div>
            <div class="history-list">
              <div v-for="(g, i) in battleHistory" :key="i" class="history-item">
                <div class="history-date">{{ g.year || '' }} {{ g.competition }}</div>
                <div class="history-match">
                  <span class="history-team">{{ g.team_A_name }}</span>
                  <span class="history-score" :class="matchResultColor(g.color === 'win' ? (g.main_team === 'team_A' ? 'win' : 'lose') : g.color === 'lose' ? (g.main_team === 'team_A' ? 'lose' : 'win') : 'draw')">
                    {{ g.score || 'VS' }}
                  </span>
                  <span class="history-team">{{ g.team_B_name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 近期战绩 -->
          <div class="card" v-if="recentHome.length || recentAway.length">
            <div class="card-title">
              近期战绩
              <div class="recent-count-bar">
                <button
                  v-for="n in [5, 10, 20]"
                  :key="n"
                  class="recent-count-btn"
                  :class="{ active: recentCount === n }"
                  @click="recentCount = n"
                >近{{ n }}场</button>
              </div>
            </div>
            <!-- 主队近期 -->
            <div class="recent-section" v-if="recentHome.length">
              <div class="recent-team">
                <img :src="dqAnalysis.team_A_logo" loading="lazy" class="recent-logo" v-if="dqAnalysis.team_A_logo" />
                {{ dqAnalysis.team_A }}
              </div>
              <div v-for="(g, i) in recentHome" :key="'h'+i" class="recent-item">
                <div class="recent-top">
                  <span class="recent-comp">{{ g.competition }}</span>
                  <span class="recent-date">{{ formatMatchDate(g.start_time) }}</span>
                </div>
                <div class="recent-match">
                  <span :class="{ 'recent-bold': g.main_team === 'team_A' }">{{ g.team_A_name }}</span>
                  <span class="recent-score" :class="matchResultColor(g.color)">{{ g.score || 'VS' }}</span>
                  <span :class="{ 'recent-bold': g.main_team === 'team_B' }">{{ g.team_B_name }}</span>
                </div>
              </div>
            </div>
            <!-- 客队近期 -->
            <div class="recent-section" v-if="recentAway.length">
              <div class="recent-team">
                <img :src="dqAnalysis.team_B_logo" loading="lazy" class="recent-logo" v-if="dqAnalysis.team_B_logo" />
                {{ dqAnalysis.team_B }}
              </div>
              <div v-for="(g, i) in recentAway" :key="'a'+i" class="recent-item">
                <div class="recent-top">
                  <span class="recent-comp">{{ g.competition }}</span>
                  <span class="recent-date">{{ formatMatchDate(g.start_time) }}</span>
                </div>
                <div class="recent-match">
                  <span :class="{ 'recent-bold': g.main_team === 'team_A' }">{{ g.team_A_name }}</span>
                  <span class="recent-score" :class="matchResultColor(g.color)">{{ g.score || 'VS' }}</span>
                  <span :class="{ 'recent-bold': g.main_team === 'team_B' }">{{ g.team_B_name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 未来三场 -->
          <div class="card" v-if="futureHome.length || futureAway.length">
            <div class="card-title">未来赛程</div>
            <div class="recent-section" v-if="futureHome.length">
              <div class="recent-team">
                <img :src="dqAnalysis.team_A_logo" loading="lazy" class="recent-logo" v-if="dqAnalysis.team_A_logo" />
                {{ dqAnalysis.team_A }}
              </div>
              <div v-for="(g, i) in futureHome" :key="'fh'+i" class="recent-item">
                <div class="recent-top">
                  <span class="recent-comp">{{ g.competition_name }}</span>
                  <span class="recent-date">{{ formatMatchDate(g.start_time) }}</span>
                </div>
                <div class="recent-match">
                  <span :class="{ 'recent-bold': g.current_team === 'home' }">{{ g.home }}</span>
                  <span class="recent-score">VS</span>
                  <span :class="{ 'recent-bold': g.current_team === 'away' }">{{ g.away }}</span>
                </div>
              </div>
            </div>
            <div class="recent-section" v-if="futureAway.length">
              <div class="recent-team">
                <img :src="dqAnalysis.team_B_logo" loading="lazy" class="recent-logo" v-if="dqAnalysis.team_B_logo" />
                {{ dqAnalysis.team_B }}
              </div>
              <div v-for="(g, i) in futureAway" :key="'fa'+i" class="recent-item">
                <div class="recent-top">
                  <span class="recent-comp">{{ g.competition_name }}</span>
                  <span class="recent-date">{{ formatMatchDate(g.start_time) }}</span>
                </div>
                <div class="recent-match">
                  <span :class="{ 'recent-bold': g.current_team === 'home' }">{{ g.home }}</span>
                  <span class="recent-score">VS</span>
                  <span :class="{ 'recent-bold': g.current_team === 'away' }">{{ g.away }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-hint" v-if="!battleHistory.length && !recentHome.length && !recentAway.length">暂无分析数据</div>
        </template>
        <div class="empty-hint" v-else>暂无分析数据</div>
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
  background: var(--wc-bg);
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
  background: linear-gradient(135deg, var(--wc-bg), var(--wc-bg-elevated));
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
  cursor: pointer;
  padding: var(--wc-space-sm);
  border-radius: var(--wc-radius-lg);
  transition: background 0.2s;
}

.team-block:active {
  background: var(--wc-surface-active);
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
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: var(--wc-space-md) 0;
  border: none;
  background: none;
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  white-space: nowrap;
  min-width: 56px;
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
  box-shadow: 0 0 8px var(--wc-primary-glow);
  border-radius: 2px;
}

/* Tab Content */
.tab-content {
  padding: var(--wc-space-md) var(--wc-space-lg);
}

/* Card */
.card {
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
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
  border-bottom: 1px solid var(--wc-border);
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
  background: rgba(255,255,255,0.08);
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
  background: rgba(255,255,255,0.08);
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
  background: rgba(255,255,255,0.08);
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

/* Odds */
.odds-type-bar {
  display: flex;
  gap: var(--wc-space-xs);
  margin-bottom: var(--wc-space-lg);
  background: rgba(255,255,255,0.08);
  border-radius: var(--wc-radius-lg);
  padding: 3px;
}

.odds-type-btn {
  flex: 1;
  padding: var(--wc-space-sm) 0;
  border: none;
  border-radius: var(--wc-radius-md);
  background: transparent;
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-sm);
  cursor: pointer;
  transition: all 0.25s;
}

.odds-type-btn.active {
  background: var(--wc-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--wc-primary-rgb, 64, 128, 255), 0.3);
}

/* Summary - grid layout */
.odds-summary {
  margin-bottom: var(--wc-space-lg);
  padding: var(--wc-space-md);
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-lg);
  border: 1px solid rgba(var(--wc-primary-rgb, 64, 128, 255), 0.1);
}

.summary-grid {
  display: grid;
  grid-template-columns: 60px repeat(6, 1fr);
  align-items: center;
  gap: 0;
}

.summary-grid.sub-header {
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-xs);
  border-bottom: 1px solid var(--wc-border);
  padding-bottom: var(--wc-space-xs);
  margin-bottom: var(--wc-space-xs);
}

.summary-grid.avg-row {
  border-top: 1px solid var(--wc-border);
  padding-top: var(--wc-space-xs);
  margin-top: var(--wc-space-xs);
}

.summary-cell {
  text-align: center;
  padding: 3px 0;
  font-size: var(--wc-font-size-sm);
  font-variant-numeric: tabular-nums;
}

.summary-cell.group-label {
  grid-column: span 3;
  font-size: var(--wc-font-size-xs);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-primary);
  text-align: center;
  padding-bottom: var(--wc-space-xs);
}

.summary-cell.label {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  text-align: left;
  padding-left: 2px;
}

.summary-cell.highlight {
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.summary-cell.accent {
  color: var(--wc-primary);
}

.summary-cell.bold {
  font-weight: var(--wc-font-weight-bold);
  font-size: var(--wc-font-size-base);
}

/* Odds list - card style per company */
.odds-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.odds-item {
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-md);
  transition: border-color 0.2s;
}

.odds-item:hover {
  border-color: var(--wc-primary);
}

.odds-item-header {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
  margin-bottom: var(--wc-space-sm);
  padding-bottom: var(--wc-space-xs);
  border-bottom: 1px solid var(--wc-border);
}

.odds-item-name {
  font-weight: var(--wc-font-weight-semibold);
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-primary);
}

.odds-item-area {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  background: rgba(255,255,255,0.08);
  padding: 1px 6px;
  border-radius: var(--wc-radius-sm);
}

.odds-item-row {
  display: flex;
  gap: var(--wc-space-xs);
}

.odds-item-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--wc-space-xs);
  background: var(--wc-surface-active);
  border-radius: var(--wc-radius-md);
}

.odds-item-cell.center {
  background: rgba(var(--wc-primary-rgb, 64, 128, 255), 0.06);
}

.cell-label {
  font-size: 10px;
  color: var(--wc-text-secondary);
  line-height: 1;
}

.cell-value {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--wc-text-primary);
  line-height: 1.2;
}

.cell-value.handicap {
  color: var(--wc-primary);
  font-weight: var(--wc-font-weight-bold);
}

.cell-value.up {
  color: #e53e3e;
}

.cell-value.down {
  color: #38a169;
}

/* Analysis */
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.history-item {
  padding: var(--wc-space-sm) 0;
  border-bottom: 1px solid var(--wc-border);
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  margin-bottom: 4px;
}

.history-match {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wc-space-md);
  font-size: var(--wc-font-size-sm);
}

.history-team {
  flex: 1;
  text-align: center;
}

.history-score {
  min-width: 48px;
  text-align: center;
  font-weight: var(--wc-font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.recent-count-bar {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.recent-count-btn {
  padding: 2px 10px;
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-sm);
  background: var(--wc-surface);
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-xs);
  cursor: pointer;
  transition: all 0.2s;
}

.recent-count-btn.active {
  background: var(--wc-primary);
  color: white;
  border-color: var(--wc-primary);
}

.recent-section {
  margin-bottom: var(--wc-space-lg);
}

.recent-section:last-child {
  margin-bottom: 0;
}

.recent-team {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-semibold);
  margin-bottom: var(--wc-space-sm);
  padding-bottom: var(--wc-space-xs);
  border-bottom: 1px solid var(--wc-border);
}

.recent-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.recent-item {
  padding: var(--wc-space-xs) 0;
  font-size: var(--wc-font-size-xs);
}

.recent-top {
  display: flex;
  justify-content: space-between;
  color: var(--wc-text-secondary);
  margin-bottom: 2px;
}

.recent-comp {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-match {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
}

.recent-match span {
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-bold {
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.recent-score {
  min-width: 36px;
  font-weight: var(--wc-font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.result-win {
  color: #e53e3e;
}

.result-lose {
  color: #38a169;
}

.result-draw {
  color: var(--wc-text-secondary);
}

.empty-hint {
  text-align: center;
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-sm);
  padding: var(--wc-space-2xl) 0;
}
</style>
