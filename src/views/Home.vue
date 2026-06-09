<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSchedule } from '../services'
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
const activeStage = ref('all')

const stages = [
  { key: 'all', label: '全部' },
  { key: 'group', label: '小组赛' },
  { key: '16', label: '1/8 决赛' },
  { key: '8', label: '1/4 决赛' },
  { key: '4', label: '半决赛' },
  { key: '3', label: '三四名' },
  { key: '2', label: '决赛' }
]

const filteredMatches = computed(() => {
  let result = matches.value
  if (activeStage.value !== 'all') {
    result = result.filter(m => m.stage === activeStage.value)
  }
  return result
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
    matches.value = await getSchedule()
    // 提醒当天收藏的未开始比赛
    if (shouldAlertToday()) {
      const today = new Date().toISOString().slice(0, 10)
      const todayFav = matches.value.filter(m => isFav(m.num) && m.date === today && m.status === 'scheduled')
      if (todayFav.length > 0) {
        const names = todayFav.map(m => `${m.home_name} vs ${m.away_name}`).join('、')
        alert(`今日收藏比赛提醒：${names}`)
        markAlerted()
      }
    }
  } catch (error) {
    console.error('赛程数据加载失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <section class="schedule-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="banner-logo" />
        <div class="banner-text">
          <h1 class="banner-title">赛程总览</h1>
          <p class="banner-sub">104 场比赛 · 美国·加拿大·墨西哥</p>
        </div>
      </div>
      <div class="banner-stats">
        <div class="stat-item">
          <span class="stat-num">{{ totalMatches }}</span>
          <span class="stat-label">场比赛</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">48</span>
          <span class="stat-label">支队伍</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">16</span>
          <span class="stat-label">个场馆</span>
        </div>
      </div>
    </section>

    <div class="filter-section">
      <TabBar :tabs="stages" v-model:active="activeStage" />
    </div>

    <LoadingState v-if="loading" />

    <div v-else-if="Object.keys(matchesByDate).length > 0" class="match-list">
      <div v-for="(dayMatches, date) in matchesByDate" :key="date" class="date-group">
        <div class="date-header">
          <div class="date-card">
            <div class="date-card-main">
              <span class="date-card-day">{{ dateParts(date).day }}</span>
              <div class="date-card-meta">
                <span class="date-card-month">{{ dateParts(date).month }}月</span>
                <span class="date-card-weekday">{{ dateParts(date).weekday }}</span>
              </div>
            </div>
            <span v-if="dateLabel(date)" class="date-card-badge">{{ dateLabel(date) }}</span>
          </div>
          <div class="date-divider">
            <span class="date-match-count">{{ dayMatches.length }} 场比赛</span>
          </div>
        </div>
        <div class="date-matches">
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
/* Banner */
.schedule-banner {
  position: relative;
  background: linear-gradient(135deg, #1a0a0a 0%, #3d1515 40%, #5c1a1a 100%);
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-lg);
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(229,62,62,0.25), transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(251,191,36,0.12), transparent 50%);
}

.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--wc-space-lg);
}

.banner-logo {
  width: 72px;
  height: auto;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}

.banner-text {
  flex: 1;
}

.banner-title {
  font-size: var(--wc-font-size-3xl);
  font-weight: var(--wc-font-weight-black);
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.banner-sub {
  font-size: var(--wc-font-size-sm);
  opacity: 0.7;
  margin-top: 4px;
}

.banner-stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wc-space-lg);
  margin-top: var(--wc-space-lg);
  padding-top: var(--wc-space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: var(--wc-font-size-2xl);
  font-weight: var(--wc-font-weight-black);
  line-height: 1;
}

.stat-label {
  font-size: var(--wc-font-size-xs);
  opacity: 0.7;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
}

.filter-section {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--wc-surface);
}

.group-filter {
  border-top: 1px solid var(--wc-border-light);
}

.match-list {
  padding: var(--wc-space-md);
}

.date-group {
  margin-bottom: var(--wc-space-xl);
}

.date-header {
  margin-bottom: var(--wc-space-md);
}

.date-card {
  display: flex;
  align-items: center;
  gap: var(--wc-space-md);
  background: linear-gradient(135deg, var(--wc-primary) 0%, #c53030 100%);
  color: white;
  padding: var(--wc-space-md) var(--wc-space-lg);
  border-radius: var(--wc-radius-lg);
  box-shadow: 0 2px 8px rgba(229, 62, 62, 0.2);
}

.date-card-main {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.date-card-day {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -1px;
}

.date-card-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.date-card-month {
  font-size: var(--wc-font-size-base);
  font-weight: 600;
  opacity: 0.9;
}

.date-card-weekday {
  font-size: var(--wc-font-size-sm);
  opacity: 0.7;
}

.date-card-badge {
  font-size: var(--wc-font-size-xs);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 10px;
  border-radius: var(--wc-radius-full);
  margin-left: auto;
  backdrop-filter: blur(4px);
}

.date-divider {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-xs) 0 0;
}

.date-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--wc-border-light);
}

.date-match-count {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  white-space: nowrap;
}

.date-matches {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}
</style>
