<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { teams, getAllGroups, getTeamsByGroup } from '../data/teams'
import PageHeader from '../components/PageHeader.vue'
import wcLogo from '../assets/wc2026-logo.webp'

const router = useRouter()

const groups = getAllGroups()
const groupedTeams = computed(() =>
  groups.map(g => ({ group: g, teams: getTeamsByGroup(g) }))
)

const goToTeam = (teamId) => {
  router.push(`/team/${teamId}`)
}
</script>

<template>
  <div class="page-container">
    <section class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-top">
          <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="hero-logo" />
          <div class="hero-text">
            <h1 class="hero-title">参赛队伍</h1>
            <p class="hero-subtitle">48 支队伍 · 美国·加拿大·墨西哥</p>
          </div>
        </div>
      </div>
    </section>

    <div class="teams-content">
      <div v-for="g in groupedTeams" :key="g.group" class="group-section">
        <div class="group-header">
          <span class="group-label">{{ g.group }}组</span>
          <span class="group-count">{{ g.teams.length }} 队</span>
        </div>
        <div class="team-grid">
          <div
            v-for="(team, index) in g.teams"
            :key="team.id"
            class="team-card"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="goToTeam(team.id)"
          >
            <div class="card-flag">
              <img v-if="team.logo" :src="team.logo" :alt="team.name" loading="lazy" class="flag-img" />
              <span v-else>{{ team.flag }}</span>
            </div>
            <div class="card-info">
              <div class="card-name">{{ team.name }}</div>
              <div class="card-name-en">{{ team.nameEn }}</div>
            </div>
            <div class="card-rank" v-if="team.rank">
              <span class="rank-num">{{ team.rank }}</span>
              <span class="rank-label">FIFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    radial-gradient(ellipse at 60% 30%, rgba(77, 171, 247, 0.1), transparent 60%),
    radial-gradient(ellipse at 30% 70%, rgba(77, 171, 247, 0.06), transparent 60%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: var(--wc-space-xl);
}

.hero-logo {
  width: 72px;
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
}

/* 内容区 */
.teams-content {
  padding: var(--wc-space-lg) var(--wc-space-md);
}

.group-section {
  margin-bottom: var(--wc-space-2xl);
}

.group-section:last-child {
  margin-bottom: 0;
}

/* 分组头部 */
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--wc-space-md);
  padding: 0 var(--wc-space-xs);
}

.group-label {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-secondary);
  padding: var(--wc-space-xs) var(--wc-space-md);
  background: var(--wc-secondary-subtle);
  border-radius: var(--wc-radius-full);
}

.group-count {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

/* 2 列网格 */
.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--wc-space-sm);
}

.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wc-space-sm);
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-xl);
  padding: var(--wc-space-lg) var(--wc-space-md);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardEnter 0.4s ease both;
  text-align: center;
}

.team-card:active {
  transform: scale(0.96);
  background: var(--wc-surface-active);
  border-color: var(--wc-secondary-glow);
}

.card-flag {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--wc-radius-lg);
  padding: 4px;
}

.flag-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-info {
  min-width: 0;
  width: 100%;
}

.card-name {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-name-en {
  font-size: 10px;
  color: var(--wc-text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-rank {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  background: var(--wc-secondary-subtle);
  border-radius: var(--wc-radius-full);
}

.rank-num {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-secondary);
  line-height: 1;
}

.rank-label {
  font-size: 8px;
  color: var(--wc-secondary);
  font-weight: var(--wc-font-weight-semibold);
  text-transform: uppercase;
  opacity: 0.7;
}
</style>
