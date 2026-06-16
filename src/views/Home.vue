<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { getSchedule, fetchMiguCommentators } from '../services'
import { useFavorites } from '../composables/useFavorites'
import { formatDate } from '../utils/helpers'
import TabBar from '../components/TabBar.vue'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import MatchCard from '../components/MatchCard.vue'
import wcLogo from '../assets/wc2026-logo.webp'

const router = useRouter()
const { isFav, shouldAlertToday, markAlerted } = useFavorites()
const matches = ref([])
const loading = ref(true)
const activeFilter = ref('all')
let refreshTimer = null

const filters = [
  { key: 'all', label: '全部' },
  { key: 'scheduled', label: '未开始' },
  { key: 'live', label: '进行中' },
  { key: 'finished', label: '已结束' }
]

const liveStatuses = ['live', '1H', '2H', 'HT', 'ET', 'P']
const finishedStatuses = ['finished', 'FT']

const filteredMatches = computed(() => {
  const val = activeFilter.value
  if (val === 'all') return matches.value
  if (val === 'live') return matches.value.filter(m => liveStatuses.includes(m.status))
  if (val === 'finished') return matches.value.filter(m => finishedStatuses.includes(m.status))
  return matches.value.filter(m => !liveStatuses.includes(m.status) && !finishedStatuses.includes(m.status))
})

const matchesByDate = computed(() => {
  const grouped = {}
  filteredMatches.value.forEach(match => {
    const date = match.date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(match)
  })
  return grouped
})

const totalMatches = computed(() => filteredMatches.value.length)

const dateLabel = (date) => {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  if (date === today) return '今日'
  if (date === tomorrow) return '明日'
  return ''
}

const dateParts = (date) => {
  const d = new Date(date)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    weekday: weekDays[d.getDay()],
    year: d.getFullYear()
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // 并行加载赛程和咪咕解说数据
    const [scheduleData] = await Promise.all([
      getSchedule(),
      fetchMiguCommentators().catch(e => console.warn('解说数据获取失败:', e.message))
    ])
    matches.value = scheduleData
    if (shouldAlertToday()) {
      const today = new Date().toISOString().slice(0, 10)
      const todayFav = matches.value.filter(m => isFav(m.num) && m.date === today && m.status === 'scheduled')
      if (todayFav.length > 0) {
        const names = todayFav.map(m => `${m.home_name} vs ${m.away_name}`).join('、')
        ElNotification({
          title: '今日收藏比赛提醒',
          message: `今日有 ${todayFav.length} 场收藏比赛即将开始：${names}`,
          type: 'success',
          duration: 0,
          position: 'top-right'
        })
        markAlerted()
      }
    }
  } catch (error) {
    console.error('赛程数据加载失败:', error)
  } finally {
    loading.value = false
  }
})

// 进行中的比赛自动刷新比分

function startLiveRefresh() {
  stopLiveRefresh()
  refreshTimer = setInterval(async () => {
    const hasLive = matches.value.some(m => liveStatuses.includes(m.status))
    if (!hasLive) {
      stopLiveRefresh()
      return
    }
    try {
      matches.value = await getSchedule()
    } catch (e) {
      // 静默失败
    }
  }, 30000) // 30秒刷新一次
}

function stopLiveRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 监听比赛数据变化，有进行中的比赛时启动轮询
watch(() => matches.value, () => {
  const hasLive = matches.value.some(m => liveStatuses.includes(m.status))
  if (hasLive && !refreshTimer) {
    startLiveRefresh()
  }
}, { deep: true })

onUnmounted(() => {
  stopLiveRefresh()
})
</script>

<template>
  <div class="page-container">
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-top">
          <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="hero-logo" />
          <div class="hero-text">
            <h1 class="hero-title">赛程总览</h1>
            <p class="hero-subtitle">2026 FIFA World Cup</p>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-pill">
            <span class="stat-value">{{ totalMatches }}</span>
            <span class="stat-unit">场比赛</span>
          </div>
          <div class="stat-pill">
            <span class="stat-value">48</span>
            <span class="stat-unit">支队伍</span>
          </div>
          <div class="stat-pill">
            <span class="stat-value">16</span>
            <span class="stat-unit">个场馆</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <TabBar :tabs="filters" v-model:active="activeFilter" />
    </div>

    <LoadingState v-if="loading" />

    <div v-else-if="Object.keys(matchesByDate).length > 0" class="match-list">
      <div v-for="(dayMatches, date) in matchesByDate" :key="date" class="date-group">
        <!-- 日期头部 -->
        <div class="date-header">
          <div class="date-badge" :class="{ 'is-today': dateLabel(date) === '今日' }">
            <span class="date-day">{{ dateParts(date).day }}</span>
            <div class="date-meta">
              <span class="date-month">{{ dateParts(date).month }}月</span>
              <span class="date-weekday">{{ dateParts(date).weekday }}</span>
            </div>
          </div>
          <div class="date-info">
            <span v-if="dateLabel(date)" class="date-tag">{{ dateLabel(date) }}</span>
            <span class="date-count">{{ dayMatches.length }} 场</span>
          </div>
        </div>

        <!-- 比赛列表 -->
        <div class="match-cards">
          <MatchCard
            v-for="match in dayMatches"
            :key="match.id"
            :match="match"
            @click="router.push(`/match/${match.id}`)"
          />
        </div>
      </div>
    </div>

    <EmptyState v-else message="暂无比赛数据" icon="⚽" />
  </div>
</template>

<style scoped>
/* Hero Banner */
.hero-banner {
  position: relative;
  padding: var(--wc-space-3xl) var(--wc-space-lg) var(--wc-space-2xl);
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 25, 35, 0) 0%, var(--wc-bg) 100%),
    radial-gradient(ellipse at 60% 30%, rgba(255, 71, 87, 0.12), transparent 60%),
    radial-gradient(ellipse at 30% 70%, rgba(77, 171, 247, 0.08), transparent 60%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xl);
  margin-bottom: var(--wc-space-2xl);
}

.hero-logo {
  width: 80px;
  height: auto;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: var(--wc-font-size-4xl);
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-text-primary);
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-muted);
  margin-top: 4px;
  font-weight: var(--wc-font-weight-medium);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 统计胶囊 */
.hero-stats {
  display: flex;
  gap: var(--wc-space-sm);
}

.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--wc-space-md) var(--wc-space-sm);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-xl);
}

.stat-value {
  font-size: var(--wc-font-size-2xl);
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-text-primary);
  line-height: 1;
}

.stat-unit {
  font-size: 10px;
  color: var(--wc-text-muted);
  font-weight: var(--wc-font-weight-medium);
}

/* 筛选栏 */
.filter-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--wc-bg);
  border-bottom: 1px solid var(--wc-border-light);
}

/* 比赛列表 */
.match-list {
  padding: var(--wc-space-lg) var(--wc-space-md);
}

.date-group {
  margin-bottom: var(--wc-space-3xl);
}

.date-group:last-child {
  margin-bottom: 0;
}

/* 日期头部 */
.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--wc-space-lg);
  padding: 0 var(--wc-space-xs);
}

.date-badge {
  display: flex;
  align-items: center;
  gap: var(--wc-space-md);
}

.date-badge.is-today .date-day {
  color: var(--wc-primary);
}

.date-day {
  font-size: 32px;
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-text-primary);
  line-height: 1;
  letter-spacing: -1px;
  min-width: 36px;
}

.date-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.date-month {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.date-weekday {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

.date-info {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.date-tag {
  font-size: var(--wc-font-size-xs);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-primary);
  background: var(--wc-primary-subtle);
  padding: 2px 8px;
  border-radius: var(--wc-radius-full);
}

.date-count {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

/* 比赛卡片列表 */
.match-cards {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}
</style>
