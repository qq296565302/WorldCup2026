<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTeamById } from '../data/teams'
import { getSquadByTeamId } from '../data/squads'
import { getScheduleFallback } from '../services'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import SectionTitle from '../components/SectionTitle.vue'
import MatchCard from '../components/MatchCard.vue'

const route = useRoute()
const router = useRouter()
const team = ref(null)
const squad = ref(null)
const teamMatches = ref([])
const loading = ref(true)
const teamId = route.params.id

const positionGroups = [
  { key: '门将', label: '门将', icon: '🧤' },
  { key: '后卫', label: '后卫', icon: '🛡️' },
  { key: '中场', label: '中场', icon: '⚙️' },
  { key: '前锋', label: '前锋', icon: '⚽' },
]

const groupedPlayers = computed(() => {
  if (!squad.value?.players) return []
  return positionGroups
    .map(g => ({
      ...g,
      players: squad.value.players.filter(p => p.position === g.key)
    }))
    .filter(g => g.players.length > 0)
})

onMounted(async () => {
  loading.value = true
  team.value = getTeamById(teamId)
  squad.value = getSquadByTeamId(teamId)

  try {
    const matches = await getScheduleFallback()
    teamMatches.value = matches.filter(m => {
      const home = getTeamById(m.home_team)
      const away = getTeamById(m.away_team)
      return (home && home.id === team.value.id) || (away && away.id === team.value.id)
    })
  } catch (error) {
    console.error('队伍详情加载失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container" v-if="team">
    <!-- 队伍头部 -->
    <header class="team-header">
      <button class="back-btn" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="header-bg">
        <div class="bg-circle c1"></div>
        <div class="bg-circle c2"></div>
      </div>
      <div class="header-content">
        <div class="team-flag">
          <img v-if="team.logo" :src="team.logo" :alt="team.name" class="team-flag-img" />
          <span v-else>{{ team.flag }}</span>
        </div>
        <h1 class="team-name">{{ team.name }}</h1>
        <p class="team-name-en">{{ team.nameEn }}</p>
        <div class="team-badges">
          <span class="badge group-badge">{{ team.group }}组</span>
          <span class="badge conf-badge">{{ team.confederation }}</span>
          <span class="badge rank-badge" v-if="team.rank">FIFA #{{ team.rank }}</span>
        </div>
      </div>
    </header>

    <LoadingState v-if="loading" />

    <template v-else>
      <!-- 教练组 -->
      <section v-if="squad?.coaches?.length" class="section">
        <SectionTitle title="教练组" accent />
        <div class="coach-list">
          <div v-for="coach in squad.coaches" :key="coach.name" class="coach-card">
            <div class="coach-avatar">
              <img v-if="coach.logo" :src="coach.logo" :alt="coach.name" class="avatar-img" />
              <span v-else class="avatar-icon">👤</span>
            </div>
            <div class="coach-info">
              <div class="coach-name">{{ coach.name }}</div>
              <div class="coach-name-en" v-if="coach.nameEn">{{ coach.nameEn }}</div>
              <div class="coach-meta">
                <span class="meta-tag coach-type">{{ coach.type }}</span>
                <span class="meta-tag">{{ coach.nationality }}</span>
                <span class="meta-tag">{{ coach.age }}岁</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 球员名单 -->
      <section v-if="squad?.players?.length" class="section">
        <SectionTitle title="球员名单" accent />
        <div v-for="group in groupedPlayers" :key="group.key" class="position-group">
          <div class="position-header">
            <span class="position-icon">{{ group.icon }}</span>
            <span class="position-label">{{ group.label }}</span>
            <span class="position-count">{{ group.players.length }}人</span>
          </div>
          <div class="player-grid">
            <div
              v-for="(player, index) in group.players"
              :key="player.personId || player.nameEn"
              class="player-card"
              :style="{ animationDelay: `${index * 40}ms` }"
              @click="player.personId && router.push(`/player/${player.personId}`)"
              :class="{ clickable: !!player.personId }"
            >
              <div class="player-number">{{ player.number }}</div>
              <div class="player-avatar">
                <img v-if="player.logo" :src="player.logo" :alt="player.name" class="player-avatar-img" />
                <span v-else class="player-avatar-placeholder">{{ player.name[0] }}</span>
              </div>
              <div class="player-info">
                <div class="player-name-row">
                  <span class="player-name">{{ player.name }}</span>
                  <span v-if="player.isCaptain" class="captain-badge">C</span>
                </div>
                <div class="player-sub">
                  <span class="player-club" v-if="player.club">{{ player.club }}</span>
                </div>
              </div>
              <div class="player-stats" v-if="player.statistic && Object.keys(player.statistic).length">
                <div class="stat-item" v-if="player.statistic['出场']">
                  <span class="stat-value">{{ player.statistic['出场'] }}</span>
                  <span class="stat-label">出场</span>
                </div>
                <div class="stat-item" v-if="player.statistic['进球']">
                  <span class="stat-value">{{ player.statistic['进球'] }}</span>
                  <span class="stat-label">进球</span>
                </div>
                <div class="stat-item" v-if="player.statistic['身价(欧)']">
                  <span class="stat-value stat-value--sm">{{ player.statistic['身价(欧)'] }}</span>
                  <span class="stat-label">身价</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 赛程 -->
      <section class="section">
        <SectionTitle title="赛程" accent />
        <div v-if="teamMatches.length > 0" class="match-list">
          <MatchCard
            v-for="match in teamMatches"
            :key="match.id"
            :match="match"
            compact
            :showStage="false"
            @click="router.push(`/match/${match.id}`)"
          />
        </div>
        <div v-else class="empty-text">暂无赛程数据</div>
      </section>
    </template>
  </div>

  <EmptyState
    v-else
    message="未找到该队伍信息"
    icon="🏳️"
    actionText="返回队伍列表"
    actionTo="/teams"
  />
</template>

<style scoped>
.team-header {
  position: relative;
  background: linear-gradient(135deg, var(--wc-dark), var(--wc-darker));
  color: white;
  padding: var(--wc-space-4xl) var(--wc-space-lg) var(--wc-space-2xl);
  overflow: hidden;
}

.back-btn {
  position: absolute;
  left: var(--wc-space-md);
  top: var(--wc-space-lg);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: var(--wc-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background var(--wc-transition-fast);
}

.back-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.bg-circle.c1 {
  width: 150px;
  height: 150px;
  top: -40px;
  right: -30px;
}

.bg-circle.c2 {
  width: 100px;
  height: 100px;
  bottom: -20px;
  left: 10%;
}

.header-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.team-flag {
  width: 80px;
  height: 80px;
  margin-bottom: var(--wc-space-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-flag-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.team-name {
  font-size: var(--wc-font-size-4xl);
  font-weight: var(--wc-font-weight-black);
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.team-name-en {
  font-size: var(--wc-font-size-base);
  opacity: 0.8;
  margin-top: var(--wc-space-xs);
}

.team-badges {
  display: flex;
  justify-content: center;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-lg);
  flex-wrap: wrap;
}

.badge {
  padding: var(--wc-space-xs) var(--wc-space-md);
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-medium);
}

.group-badge {
  background: rgba(255, 255, 255, 0.25);
}

.conf-badge {
  background: rgba(255, 255, 255, 0.15);
}

.rank-badge {
  background: var(--wc-primary);
}

.section {
  padding: var(--wc-space-lg);
}

/* 教练列表 */
.coach-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

/* 教练卡片 */
.coach-card {
  display: flex;
  align-items: center;
  background: var(--wc-surface);
  border-radius: var(--wc-radius-xl);
  padding: var(--wc-space-md) var(--wc-space-lg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.coach-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--wc-radius-full);
  background: var(--wc-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--wc-space-lg);
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 28px;
}

.coach-info {
  flex: 1;
}

.coach-name {
  font-size: var(--wc-font-size-xl);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
}

.coach-name-en {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
  margin-top: 2px;
}

.coach-meta {
  display: flex;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-sm);
}

.meta-tag {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  background: var(--wc-gray-100);
  padding: 2px var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
}

.meta-tag.coach-type {
  color: var(--wc-primary);
  background: var(--wc-primary-light);
  font-weight: var(--wc-font-weight-semibold);
}

/* 位置分组 */
.position-group {
  margin-bottom: var(--wc-space-lg);
}

.position-group:last-child {
  margin-bottom: 0;
}

.position-header {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  margin-bottom: var(--wc-space-sm);
  padding: 0 var(--wc-space-xs);
}

.position-icon {
  font-size: var(--wc-font-size-base);
}

.position-label {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
}

.position-count {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  background: var(--wc-gray-100);
  padding: 1px var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
}

/* 球员网格 */
.player-grid {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.player-card {
  display: flex;
  align-items: center;
  background: var(--wc-surface);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-md);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  animation: slideIn 0.3s ease forwards;
  opacity: 0;
  transform: translateX(-10px);
}

.player-card.clickable {
  cursor: pointer;
  transition: transform var(--wc-transition-fast), box-shadow var(--wc-transition-fast);
}

.player-card.clickable:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.player-number {
  width: 28px;
  height: 28px;
  border-radius: var(--wc-radius-md);
  background: var(--wc-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  margin-right: var(--wc-space-sm);
  flex-shrink: 0;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--wc-radius-full);
  background: var(--wc-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--wc-space-md);
  flex-shrink: 0;
  overflow: hidden;
}

.player-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-avatar-placeholder {
  font-size: var(--wc-font-size-lg);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-secondary);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xs);
}

.player-name {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.captain-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--wc-primary);
  color: white;
  font-size: 10px;
  font-weight: var(--wc-font-weight-bold);
  line-height: 1;
}

.player-sub {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  margin-top: 2px;
}

.player-position {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
}

.player-club {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  background: var(--wc-gray-100);
  padding: 1px var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-stats {
  display: flex;
  gap: var(--wc-space-sm);
  flex-shrink: 0;
  margin-left: var(--wc-space-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 32px;
}

.stat-value {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
  line-height: 1.2;
}

.stat-value--sm {
  font-size: var(--wc-font-size-xs);
}

.stat-label {
  font-size: 10px;
  color: var(--wc-text-muted);
  line-height: 1.2;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}

.empty-text {
  text-align: center;
  color: var(--wc-text-muted);
  padding: var(--wc-space-2xl);
}
</style>
