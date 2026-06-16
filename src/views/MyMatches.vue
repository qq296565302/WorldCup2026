<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSchedule } from '../services'
import { useFavorites } from '../composables/useFavorites'
import { formatDate } from '../utils/helpers'
import MatchCard from '../components/MatchCard.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import wcLogo from '../assets/wc2026-logo.webp'

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
        <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="banner-logo" />
        <div class="banner-text">
          <h1 class="banner-title">我的比赛</h1>
          <p class="banner-sub">已收藏 {{ favMatches.length }} 场比赛</p>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" />

    <div v-else-if="favMatches.length > 0" class="fav-content">
      <div v-for="(dayMatches, date) in matchesByDate" :key="date" class="date-group">
        <div class="date-line">
          <div class="date-dot"></div>
          <div class="date-info">
            <span class="date-text">{{ dateParts(date).month }}月{{ dateParts(date).day }}日 {{ dateParts(date).weekday }}</span>
            <span v-if="dateLabel(date)" class="date-tag">{{ dateLabel(date) }}</span>
          </div>
          <span class="date-count">{{ dayMatches.length }} 场</span>
        </div>
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

    <EmptyState v-else message="还没有收藏比赛" icon="⭐" />
  </div>
</template>

<style scoped>
.my-banner {
  position: relative;
  background: var(--wc-bg-elevated);
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-xl);
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(252,196,25,0.12), transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(77,171,247,0.08), transparent 50%);
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
  padding: var(--wc-space-lg) var(--wc-space-md);
}

.date-group {
  margin-bottom: var(--wc-space-2xl);
  padding-left: var(--wc-space-lg);
  border-left: 2px solid var(--wc-border);
  position: relative;
}

.date-group:last-child {
  margin-bottom: 0;
}

/* 时间线节点 */
.date-line {
  display: flex;
  align-items: center;
  gap: var(--wc-space-md);
  margin-bottom: var(--wc-space-lg);
  margin-left: calc(-1 * var(--wc-space-lg) - 1px);
  position: relative;
}

.date-dot {
  width: 10px;
  height: 10px;
  background: var(--wc-warning);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(252, 196, 25, 0.4);
}

.date-info {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  flex: 1;
  min-width: 0;
}

.date-text {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  white-space: nowrap;
}

.date-tag {
  font-size: 10px;
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-warning);
  background: var(--wc-warning-subtle);
  padding: 2px 6px;
  border-radius: var(--wc-radius-full);
  white-space: nowrap;
}

.date-count {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  white-space: nowrap;
}

.match-cards {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}
</style>
