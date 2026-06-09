<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStandings } from '../services'
import { teams, getAllGroups, getTeamsByGroup, getTeamById } from '../data/teams'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import wcLogo from '../assets/wc2026-logo.webp'

const loading = ref(true)
const standings = ref({})

const groups = getAllGroups()

const initStandings = () => {
  const result = {}
  groups.forEach(group => {
    result[group] = getTeamsByGroup(group).map(team => ({
      team_id: team.id,
      team_name: team.name,
      team_logo: team.logo,
      team_flag: team.flag,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0
    }))
  })
  return result
}

const allStandings = computed(() =>
  groups.map(g => ({ group: g, teams: standings.value[g] || [] }))
)

onMounted(async () => {
  loading.value = true
  standings.value = initStandings()

  try {
    const results = await Promise.all(groups.map(group => getStandings(group)))
    results.forEach((data, idx) => {
      const group = groups[idx]
      if (data?.length > 0) {
        standings.value[group] = data.map(item => {
          const team = getTeamById(item.team_id || item.teamId)
          return {
            team_id: item.team_id || item.teamId,
            team_name: team?.name || item.team_name || item.teamName,
            team_logo: team?.logo || '',
            team_flag: team?.flag || '',
            played: item.played || 0,
            won: item.won || 0,
            drawn: item.drawn || 0,
            lost: item.lost || 0,
            gf: item.gf || item.goalsFor || 0,
            ga: item.ga || item.goalsAgainst || 0,
            gd: item.gd || item.goalDifference || 0,
            points: item.points || 0
          }
        })
      }
    })
  } catch (error) {
    console.warn('积分榜数据加载失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <section class="standings-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="banner-logo" />
        <div class="banner-text">
          <h1 class="banner-title">小组积分榜</h1>
          <p class="banner-sub">12 个小组 · 48 支队伍</p>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" color="var(--wc-accent)" />

    <div v-else class="standings-content">
      <div v-for="item in allStandings" :key="item.group" class="group-section">
        <div class="group-header">{{ item.group }}组</div>
        <div class="table-scroll">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="col-pos">#</th>
                <th class="col-team">球队</th>
                <th>场</th>
                <th>胜</th>
                <th>平</th>
                <th>负</th>
                <th class="col-hide-sm">进</th>
                <th class="col-hide-sm">失</th>
                <th>净</th>
                <th class="col-pts">积分</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, index) in item.teams"
                :key="team.team_id"
                :class="{ qualified: index < 2 }"
              >
                <td class="col-pos">
                  <span class="pos-badge" :class="{ 'top2': index < 2 }">{{ index + 1 }}</span>
                </td>
                <td class="col-team">
                  <span class="team-flag">
                    <img v-if="team.team_logo" :src="team.team_logo" :alt="team.team_name" loading="lazy" class="flag-img" />
                    <span v-else>{{ team.team_flag }}</span>
                  </span>
                  <span class="team-name">{{ team.team_name }}</span>
                </td>
                <td>{{ team.played }}</td>
                <td class="col-win">{{ team.won }}</td>
                <td>{{ team.drawn }}</td>
                <td>{{ team.lost }}</td>
                <td class="col-hide-sm">{{ team.gf }}</td>
                <td class="col-hide-sm">{{ team.ga }}</td>
                <td :class="{ positive: team.gd > 0, negative: team.gd < 0 }">
                  {{ team.gd > 0 ? '+' : '' }}{{ team.gd }}
                </td>
                <td class="col-pts">
                  <span class="points-badge">{{ team.points }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot qualified-dot"></span>
          <span>晋级淘汰赛</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Banner */
.standings-banner {
  position: relative;
  background: linear-gradient(135deg, #0a1628 0%, #132744 40%, #1a3a5c 100%);
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-xl);
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.2), transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(34,197,94,0.12), transparent 50%);
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

.standings-content {
  padding: var(--wc-space-md);
}

.group-section {
  margin-bottom: var(--wc-space-lg);
}

.group-section:last-of-type {
  margin-bottom: 0;
}

.group-header {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-accent);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  margin-bottom: var(--wc-space-sm);
  background: var(--wc-accent-light);
  border-radius: var(--wc-radius-md);
  display: inline-block;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--wc-radius-xl);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.standings-table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  background: var(--wc-surface);
}

.standings-table th {
  padding: var(--wc-space-md) var(--wc-space-sm);
  font-size: var(--wc-font-size-xs);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-secondary);
  text-align: center;
  background: var(--wc-gray-50);
  border-bottom: 2px solid var(--wc-border);
  white-space: nowrap;
}

.standings-table td {
  padding: var(--wc-space-md) var(--wc-space-sm);
  font-size: var(--wc-font-size-md);
  text-align: center;
  border-bottom: 1px solid var(--wc-border-light);
  color: var(--wc-text-primary);
  transition: background var(--wc-transition-fast);
}

.standings-table tbody tr {
  transition: background var(--wc-transition-fast);
}

.standings-table tbody tr:active {
  background: var(--wc-gray-50);
}

.standings-table tr:last-child td {
  border-bottom: none;
}

.col-pos { width: 36px; }

.col-team {
  text-align: left !important;
  padding-left: var(--wc-space-md) !important;
}

.col-pts { width: 50px; }

.col-win { color: var(--wc-accent); font-weight: var(--wc-font-weight-semibold); }

.col-hide-sm { }

@media (max-width: 359px) {
  .col-hide-sm { display: none; }
  .standings-table { min-width: 340px; }
}

.pos-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  background: var(--wc-gray-100);
  color: var(--wc-text-secondary);
}

.pos-badge.top2 {
  background: var(--wc-accent);
  color: white;
}

.team-flag {
  margin-right: var(--wc-space-sm);
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.flag-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.team-name {
  font-weight: var(--wc-font-weight-medium);
  font-size: var(--wc-font-size-base);
}

.points-badge {
  display: inline-block;
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
  background: var(--wc-gray-100);
  padding: var(--wc-space-xs) var(--wc-space-sm);
  border-radius: var(--wc-radius-md);
  min-width: 28px;
}

.qualified {
  background: var(--wc-accent-light);
}

.positive { color: var(--wc-accent); font-weight: var(--wc-font-weight-semibold); }
.negative { color: var(--wc-primary); font-weight: var(--wc-font-weight-semibold); }

.legend {
  display: flex;
  justify-content: center;
  padding: var(--wc-space-lg) 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--wc-radius-full);
}

.qualified-dot {
  background: var(--wc-accent);
}
</style>
