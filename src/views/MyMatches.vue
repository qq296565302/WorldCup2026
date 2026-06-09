<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSchedule } from '../services'
import { useFavorites } from '../composables/useFavorites'
import { formatDate } from '../utils/helpers'
import MatchCard from '../components/MatchCard.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import wcLogo from '../assets/wc2026-logo.png'

const router = useRouter()
const { isFav } = useFavorites()
const matches = ref([])
const loading = ref(true)

const favMatches = computed(() => {
  return matches.value.filter(m => isFav(m.num))
})

// 按日期分组
const matchesByDate = computed(() => {
  const grouped = {}
  favMatches.value.forEach(match => {
    const date = match.date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(match)
  })
  return grouped
})

// 判断日期标签
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
  } catch (error) {
    console.error('赛程数据加载失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <section class="my-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <img :src="wcLogo" alt="2026 FIFA World Cup" class="banner-logo" />
        <div class="banner-text">
          <h1 class="banner-title">我的比赛</h1>
          <p class="banner-sub">已收藏 {{ favMatches.length }} 场比赛</p>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" />

    <div v-else-if="favMatches.length > 0" class="fav-content">
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

    <EmptyState v-else message="还没有收藏比赛" icon="⭐" />
  </div>
</template>

<style scoped>
.my-banner {
  position: relative;
  background: linear-gradient(135deg, #0a1a28 0%, #153044 40%, #1a4a5c 100%);
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-xl);
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(246,173,85,0.2), transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(64,128,255,0.15), transparent 50%);
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

.fav-content {
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
  background: linear-gradient(135deg, #2b6cb0 0%, #1a4a7c 100%);
  color: white;
  padding: var(--wc-space-md) var(--wc-space-lg);
  border-radius: var(--wc-radius-lg);
  box-shadow: 0 2px 8px rgba(43, 108, 176, 0.2);
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
