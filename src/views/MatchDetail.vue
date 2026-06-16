<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getScheduleFallback, getDqMatchDetail, getDqMatchOverview, getDqMatchLineup, getDqMatchOdds, getDqMatchAnalysis } from '../services'
import { getTeamById } from '../data/teams'
import { formatDate, getStageName } from '../utils/helpers'
import { cacheVenue, cacheMatchStatuses } from '../composables/useVenueCache'
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

// 扁平化事件列表（将 home/away 事件合并为按时间排序的单一列表）
const flatEvents = computed(() => {
  const events = matchEvents.value
  if (!Array.isArray(events)) return []
  const list = []
  events.forEach(e => {
    const minute = e.minute || ''
    const extra = e.minuteExtra ? `+${e.minuteExtra}` : ''
    const displayMinute = `${minute}${extra}`
    ;(e.home || []).forEach(h => list.push({ ...h, side: 'home', displayMinute }))
    ;(e.away || []).forEach(a => list.push({ ...a, side: 'away', displayMinute }))
  })
  return list
})

// 比赛统计
const matchStats = computed(() => dqOverview.value?.statistics || [])

// 阵容信息
const lineupInfo = computed(() => dqLineup.value || null)

// 半场比分
const halfScore = computed(() => {
  const d = dqDetail.value
  if (d && d.homeHalfScore != null && d.awayHalfScore != null) {
    return `${d.homeHalfScore} - ${d.awayHalfScore}`
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
    if (detail.status === 'fulfilled' && detail.value) {
      dqDetail.value = detail.value
      // 缓存比赛状态到 localStorage，供赛程页面使用
      if (match.value?.dq_match_id) {
        cacheMatchStatuses([{
          dq_match_id: match.value.dq_match_id,
          status: detail.value.status,
          home_score: detail.value.homeScore,
          away_score: detail.value.awayScore
        }])
      }
    }
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
const eventIcon = (code) => {
  const icons = {
    goal: '⚽', G: '⚽', OG: '⚽', PG: '⚽', PG_M: '❌',
    YC: '🟨', RC: '🟥', YC2: '🟨🟥',
    SI: '', SO: '', VAR: '📺', A: '', AS: '',
    // 兼容旧格式
    own_goal: '⚽', penalty: '⚽', penalty_miss: '❌',
    yellow_card: '🟨', red_card: '🟥', second_yellow_card: '🟨🟥',
    substitution: '', var: '📺', injury: '🤕', assist: ''
  }
  return icons[code] || ''
}

// 统计数据百分比
const statPercent = (home, away) => {
  const h = parseFloat(home) || 0
  const a = parseFloat(away) || 0
  const total = h + a
  if (total === 0) return { home: 50, away: 50 }
  return { home: Math.round(h / total * 100), away: Math.round(a / total * 100) }
}

// 位置分类：0=门将, 1=后卫, 2=中场, 3=前锋
const getPositionGroup = (pos) => {
  if (!pos) return 2
  const p = String(pos).toUpperCase().trim()
  // 中文
  if (p.includes('门将') || p.includes('守门员')) return 0
  if (p.includes('后卫') || p.includes('中卫') || p.includes('边卫')) return 1
  if (p.includes('中场') || p.includes('前卫') || p.includes('后腰') || p.includes('前腰')) return 2
  if (p.includes('前锋') || p.includes('边锋') || p.includes('中锋') || p.includes('影锋')) return 3
  // 数字
  if (p === '1') return 0
  if (p === '2') return 1
  if (p === '3') return 2
  if (p === '4') return 3
  // 英文缩写
  if (p === 'GK') return 0
  if (/^(RB|RCB|CB|LCB|LB|RWB|LWB|DF|SW)$/.test(p) || p.includes('BACK') || p.includes('DEF')) return 1
  if (/^(CDM|RDM|LDM|CM|RCM|LCM|CAM|RAM|LAM|RM|LM|MF|DM|AM)$/.test(p) || p.includes('MID')) return 2
  if (/^(RW|LW|RF|LF|CF|ST|RS|LS|FW|SS)$/.test(p) || p.includes('FORW') || p.includes('STR')) return 3
  return 2
}

// 球员在球场上的位置
const pitchPosition = (player, side) => {
  const lineups = side === 'home'
    ? (lineupInfo.value?.home?.lineups || [])
    : (lineupInfo.value?.away?.lineups || [])

  if (lineups.length === 0) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  // 按 position 分组
  const groups = [[], [], [], []]
  lineups.forEach(p => groups[getPositionGroup(p.position)].push(p))

  // 当前球员的分组和组内位置
  const group = getPositionGroup(player.position)
  const groupPlayers = groups[group]
  const posInGroup = groupPlayers.indexOf(player)

  // Y 位置：主队 GK→7%, DF→20%, MF→35%, FW→47% (上半场，靠近中线)
  // 客队 GK→93%, DF→80%, MF→65%, FW→53% (下半场，靠近中线)
  const yMapHome = [7, 20, 35, 47]
  const yMapAway = [93, 80, 65, 53]
  const yPct = side === 'home' ? yMapHome[group] : yMapAway[group]

  // X 位置：组内均匀分布
  const groupSize = groupPlayers.length
  const xStart = 12
  const xEnd = 88
  const xRange = xEnd - xStart
  const xPct = groupSize <= 1 ? 50 : xStart + (posInGroup / (groupSize - 1)) * xRange

  return {
    top: `${yPct}%`,
    left: `${xPct}%`,
    transform: 'translate(-50%, -50%)'
  }
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
        <div class="card" v-if="flatEvents.length > 0">
          <div class="card-title">比赛事件</div>
          <div class="event-list">
            <div
              v-for="(evt, i) in flatEvents"
              :key="i"
              class="event-item"
              :class="{ 'event-home': evt.side === 'home', 'event-away': evt.side === 'away' }"
            >
              <span class="event-minute">{{ evt.displayMinute }}'</span>
              <span class="event-icon" v-if="eventIcon(evt.code)">{{ eventIcon(evt.code) }}</span>
              <span class="event-text">
                {{ evt.person }}
                <span v-if="evt.code === 'SI'" class="event-tag tag-sub-in" title="换上">
                  <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 2l5 6H9v6H7V8H3z" fill="currentColor"/></svg>
                </span>
                <span v-else-if="evt.code === 'SO'" class="event-tag tag-sub-out" title="换下">
                  <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 14l5-6H9V2H7v6H3z" fill="currentColor"/></svg>
                </span>
                <span v-else-if="['G', 'goal'].includes(evt.code)" class="event-tag tag-goal">进球</span>
                <span v-else-if="evt.code === 'PG'" class="event-tag tag-penalty">点球</span>
                <span v-else-if="evt.code === 'OG'" class="event-tag tag-own-goal">乌龙</span>
                <span v-else-if="['A', 'AS', 'assist'].includes(evt.code)" class="event-tag tag-assist">助攻</span>
                <template v-else-if="evt.reason && evt.code !== 'VAR'">
                  <span v-if="evt.reason.includes('助攻')" class="event-tag tag-assist">{{ evt.reason }}</span>
                  <span v-else> ({{ evt.reason }})</span>
                </template>
              </span>
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
        <div class="empty-hint" v-if="!flatEvents.length && !lineupInfo">暂无赛况数据</div>
      </section>

      <!-- 统计 -->
      <section class="tab-content" v-if="activeTab === 'stats' && dqDetail">
        <div class="card" v-if="matchStats.length > 0">
          <div class="stat-list">
            <div v-for="(stat, i) in matchStats" :key="i" class="stat-row">
              <span class="stat-home">{{ stat.home }}</span>
              <div class="stat-bar-wrap">
                <span class="stat-name">{{ stat.name }}</span>
                <div class="stat-bar">
                  <div class="stat-bar-fill home" :style="{ width: statPercent(stat.home, stat.away).home + '%' }"></div>
                  <div class="stat-bar-fill away" :style="{ width: statPercent(stat.home, stat.away).away + '%' }"></div>
                </div>
              </div>
              <span class="stat-away">{{ stat.away }}</span>
            </div>
          </div>
        </div>
        <div class="empty-hint" v-else>暂无统计数据</div>
      </section>

      <!-- 阵容 -->
      <section class="tab-content" v-if="activeTab === 'lineup' && dqDetail">
        <template v-if="lineupInfo">
          <!-- 足球场阵型图 -->
          <div class="card" v-if="lineupInfo.home?.lineups?.length || lineupInfo.away?.lineups?.length">
            <div class="pitch-header">
              <div class="pitch-team">
                <img :src="homeLogo" loading="lazy" class="pitch-team-logo" v-if="homeLogo" />
                <span>{{ getTeamInfo(match.home_team, match.home_name).name }}</span>
                <span class="formation" v-if="lineupInfo.home?.formation">{{ lineupInfo.home.formation }}</span>
              </div>
              <div class="pitch-team">
                <span class="formation" v-if="lineupInfo.away?.formation">{{ lineupInfo.away.formation }}</span>
                <span>{{ getTeamInfo(match.away_team, match.away_name).name }}</span>
                <img :src="awayLogo" loading="lazy" class="pitch-team-logo" v-if="awayLogo" />
              </div>
            </div>
            <div class="pitch">
              <!-- SVG 足球场背景 -->
              <svg viewBox="0 0 300 440" class="pitch-svg" preserveAspectRatio="xMidYMid meet">
                <rect x="0" y="0" width="300" height="440" rx="4" fill="#1a6b3c" />
                <!-- 外框 -->
                <rect x="8" y="8" width="284" height="424" rx="2" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 中线 -->
                <line x1="8" y1="220" x2="292" y2="220" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 中圈 -->
                <circle cx="150" cy="220" r="40" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <circle cx="150" cy="220" r="2" fill="rgba(255,255,255,0.35)" />
                <!-- 上方禁区 -->
                <rect x="70" y="8" width="160" height="70" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 上方小禁区 -->
                <rect x="110" y="8" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 上方罚球点 -->
                <circle cx="150" cy="58" r="2" fill="rgba(255,255,255,0.35)" />
                <!-- 上方罚球弧 -->
                <path d="M 120 78 A 40 40 0 0 0 180 78" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 下方禁区 -->
                <rect x="70" y="362" width="160" height="70" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 下方小禁区 -->
                <rect x="110" y="402" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 下方罚球点 -->
                <circle cx="150" cy="382" r="2" fill="rgba(255,255,255,0.35)" />
                <!-- 下方罚球弧 -->
                <path d="M 120 362 A 40 40 0 0 1 180 362" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
                <!-- 四角弧 -->
                <path d="M 8 18 A 10 10 0 0 1 18 8" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
                <path d="M 282 8 A 10 10 0 0 1 292 18" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
                <path d="M 8 422 A 10 10 0 0 0 18 432" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
                <path d="M 282 432 A 10 10 0 0 0 292 422" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
              </svg>
              <!-- 主队球员（上半场） -->
              <div
                v-for="p in lineupInfo.home?.lineups || []"
                :key="'h' + p.player_id"
                class="pitch-player pitch-player-home"
                :style="pitchPosition(p, 'home')"
              >
                <img :src="p.logo" loading="lazy" class="pitch-player-avatar" v-if="p.logo" />
                <span class="pitch-player-name">{{ p.shirt_number }}-{{ p.player_name }}</span>
              </div>
              <!-- 客队球员（下半场） -->
              <div
                v-for="p in lineupInfo.away?.lineups || []"
                :key="'a' + p.player_id"
                class="pitch-player pitch-player-away"
                :style="pitchPosition(p, 'away')"
              >
                <img :src="p.logo" loading="lazy" class="pitch-player-avatar" v-if="p.logo" />
                <span class="pitch-player-name">{{ p.shirt_number }}-{{ p.player_name }}</span>
              </div>
            </div>
          </div>

          <!-- 替补球员 - 左右布局 -->
          <div class="subs-row" v-if="lineupInfo.home?.subs?.length || lineupInfo.away?.subs?.length">
            <div class="card subs-card" v-if="lineupInfo.home?.subs?.length">
              <div class="subs-team-label">
                <img :src="homeLogo" loading="lazy" class="pitch-team-logo" v-if="homeLogo" />
                替补
              </div>
              <div class="subs-list">
                <div v-for="p in lineupInfo.home.subs" :key="p.player_id" class="subs-player">
                  <img :src="p.logo" loading="lazy" class="subs-avatar" v-if="p.logo" />
                  <span class="subs-number">{{ p.shirt_number }}</span>
                  <span class="subs-name">{{ p.player_name }}</span>
                </div>
              </div>
            </div>
            <div class="card subs-card" v-if="lineupInfo.away?.subs?.length">
              <div class="subs-team-label">
                <img :src="awayLogo" loading="lazy" class="pitch-team-logo" v-if="awayLogo" />
                替补
              </div>
              <div class="subs-list">
                <div v-for="p in lineupInfo.away.subs" :key="p.player_id" class="subs-player">
                  <img :src="p.logo" loading="lazy" class="subs-avatar" v-if="p.logo" />
                  <span class="subs-number">{{ p.shirt_number }}</span>
                  <span class="subs-name">{{ p.player_name }}</span>
                </div>
              </div>
            </div>
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
  display: inline-flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
  border-radius: var(--wc-radius-sm);
  background: var(--wc-bg-card, rgba(255,255,255,0.06));
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  flex-shrink: 0;
  white-space: nowrap;
}

.tag-sub-in {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.tag-sub-out {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.tag-goal {
  color: #fff;
  background: #f59e0b;
}

.tag-penalty {
  color: #fff;
  background: #8b5cf6;
}

.tag-own-goal {
  color: #fff;
  background: #ef4444;
}

.tag-assist {
  color: #fff;
  background: #3b82f6;
}

.event-home {
  align-self: flex-start;
}

.event-away {
  flex-direction: row-reverse;
  align-self: flex-end;
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

/* Lineup - Pitch */
.pitch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--wc-space-sm) var(--wc-space-md);
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-semibold);
}

.pitch-team {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
}

.pitch-team-logo {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.formation {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  background: rgba(255,255,255,0.08);
  padding: 1px 6px;
  border-radius: var(--wc-radius-sm);
}

.pitch {
  position: relative;
  width: 100%;
  border-radius: var(--wc-radius-md);
  overflow: hidden;
  margin: 0 auto;
}

.pitch-svg {
  display: block;
  width: 100%;
  height: auto;
}

.pitch-player {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  width: 52px;
}

.pitch-player-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.6);
}

.pitch-player-name {
  font-size: 9px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52px;
  text-align: center;
  line-height: 1.2;
  margin-top: 1px;
}

.pitch-player-home .pitch-player-avatar {
  border-color: var(--wc-primary, #e63946);
}

.pitch-player-away .pitch-player-avatar {
  border-color: var(--wc-accent, #457b9d);
}

.pitch-player-away .pitch-player-name {
  text-align: right;
}

/* Substitutes */
.subs-row {
  display: flex;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-sm);
}

.subs-card {
  flex: 1;
  min-width: 0;
}

.subs-team-label {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  padding-bottom: var(--wc-space-xs);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: var(--wc-space-xs);
}

.subs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subs-player {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
  font-size: var(--wc-font-size-xs);
  padding: 2px 0;
}

.subs-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.subs-number {
  min-width: 18px;
  text-align: center;
  color: var(--wc-text-secondary);
  font-size: 10px;
}

.subs-name {
  color: var(--wc-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
