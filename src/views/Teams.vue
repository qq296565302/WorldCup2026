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
    <section class="teams-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="banner-logo" />
        <div class="banner-text">
          <h1 class="banner-title">参赛队伍</h1>
          <p class="banner-sub">48 支队伍 · 美国·加拿大·墨西哥</p>
        </div>
      </div>
    </section>

    <div class="teams-content">
      <div v-for="g in groupedTeams" :key="g.group" class="group-section">
        <div class="group-header">{{ g.group }}组</div>
        <div class="team-grid">
          <div
            v-for="(team, index) in g.teams"
            :key="team.id"
            class="team-card"
            :style="{ animationDelay: `${index * 60}ms` }"
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
            <div class="card-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Banner */
.teams-banner {
  position: relative;
  background: linear-gradient(135deg, #1a0a28 0%, #2d1544 40%, #3d1f5c 100%);
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-xl);
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.2), transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(59,130,246,0.12), transparent 50%);
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

.teams-content {
  padding: var(--wc-space-md);
}

.group-section {
  margin-bottom: var(--wc-space-lg);
}

.group-section:last-child {
  margin-bottom: 0;
}

.group-header {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-secondary);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  margin-bottom: var(--wc-space-sm);
  background: var(--wc-secondary-light);
  border-radius: var(--wc-radius-md);
  display: inline-block;
}

.team-grid {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.team-card {
  display: flex;
  align-items: center;
  background: var(--wc-surface);
  border-radius: var(--wc-radius-xl);
  padding: var(--wc-space-md) var(--wc-space-lg);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--wc-border-light);
  animation: slideInUp 0.4s ease forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.team-card:active {
  transform: scale(0.98);
  background: var(--wc-gray-50);
}

.card-flag {
  width: 36px;
  height: 36px;
  margin-right: var(--wc-space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.flag-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: var(--wc-font-size-lg);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.card-name-en {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-muted);
  margin-top: 2px;
}

.card-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: var(--wc-space-md);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  background: var(--wc-secondary-light);
  border-radius: var(--wc-radius-md);
}

.rank-num {
  font-size: var(--wc-font-size-lg);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-secondary);
  line-height: 1;
}

.rank-label {
  font-size: 9px;
  color: var(--wc-secondary);
  font-weight: var(--wc-font-weight-semibold);
  text-transform: uppercase;
}

.card-arrow {
  width: 20px;
  height: 20px;
  color: var(--wc-gray-300);
  transition: transform var(--wc-transition-fast);
}

.team-card:active .card-arrow {
  transform: translateX(4px);
}
</style>
