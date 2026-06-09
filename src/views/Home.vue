<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSchedule } from '../services'
import { formatDate } from '../utils/helpers'
import TabBar from '../components/TabBar.vue'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import MatchCard from '../components/MatchCard.vue'
import wcLogo from '../assets/wc2026-logo.png'

const router = useRouter()
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

onMounted(async () => {
  loading.value = true
  try {
    matches.value = await getSchedule()
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
        <img :src="wcLogo" alt="2026 FIFA World Cup" class="banner-logo" />
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
          <div class="date-left">
            <span class="date-day">{{ date.split('-')[2] }}</span>
            <div class="date-info">
              <span class="date-month">{{ date.split('-')[1] }}月</span>
              <span class="date-weekday">{{ formatDate(date).split(' ')[1] }}</span>
            </div>
          </div>
          <span class="match-count">{{ dayMatches.length }} 场比赛</span>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--wc-space-sm) var(--wc-space-xs);
  margin-bottom: var(--wc-space-md);
}

.date-left {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.date-day {
  font-size: var(--wc-font-size-4xl);
  font-weight: var(--wc-font-weight-black);
  color: var(--wc-primary);
  line-height: 1;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date-month {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.date-weekday {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
}

.match-count {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-muted);
  background: var(--wc-gray-100);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
}

.date-matches {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}
</style>
