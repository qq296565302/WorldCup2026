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
    <section class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-top">
          <img :src="wcLogo" alt="2026 FIFA World Cup" loading="lazy" class="hero-logo" />
          <div class="hero-text">
            <h1 class="hero-title">小组积分榜</h1>
            <p class="hero-subtitle">12 个小组 · 48 支队伍</p>
          </div>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" color="var(--wc-accent)" />

    <div v-else class="standings-content">
      <div v-for="item in allStandings" :key="item.group" class="group-card">
        <div class="group-header">
          <span class="group-label">{{ item.group }}组</span>
        </div>
        <div class="table-wrap">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-team">球队</th>
                <th>场</th>
                <th class="col-result">胜</th>
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
                :class="{ 'is-qualified': index < 2 }"
              >
                <td class="col-rank">
                  <span class="rank-badge" :class="{ 'top': index < 2 }">{{ index + 1 }}</span>
                </td>
                <td class="col-team">
                  <div class="team-cell">
                    <span class="team-flag">
                      <img v-if="team.team_logo" :src="team.team_logo" :alt="team.team_name" loading="lazy" class="flag-img" />
                      <span v-else>{{ team.team_flag }}</span>
                    </span>
                    <span class="team-name">{{ team.team_name }}</span>
                  </div>
                </td>
                <td class="col-data">{{ team.played }}</td>
                <td class="col-data col-result">{{ team.won }}</td>
                <td class="col-data">{{ team.drawn }}</td>
                <td class="col-data">{{ team.lost }}</td>
                <td class="col-data col-hide-sm">{{ team.gf }}</td>
                <td class="col-data col-hide-sm">{{ team.ga }}</td>
                <td class="col-data" :class="{ 'gd-pos': team.gd > 0, 'gd-neg': team.gd < 0 }">
                  {{ team.gd > 0 ? '+' : '' }}{{ team.gd }}
                </td>
                <td class="col-pts">
                  <span class="pts-value">{{ team.points }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot is-qualified"></span>
          <span>晋级淘汰赛</span>
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
    radial-gradient(ellipse at 60% 30%, rgba(81, 207, 102, 0.1), transparent 60%),
    radial-gradient(ellipse at 30% 70%, rgba(81, 207, 102, 0.06), transparent 60%);
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
.standings-content {
  padding: var(--wc-space-lg) var(--wc-space-md);
}

/* 小组卡片 */
.group-card {
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-xl);
  overflow: hidden;
  margin-bottom: var(--wc-space-lg);
}

.group-card:last-of-type {
  margin-bottom: 0;
}

.group-header {
  padding: var(--wc-space-md) var(--wc-space-lg);
  border-bottom: 1px solid var(--wc-border);
}

.group-label {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-accent);
  padding: var(--wc-space-xs) var(--wc-space-md);
  background: var(--wc-accent-subtle);
  border-radius: var(--wc-radius-full);
}

/* 表格 */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.standings-table {
  width: 100%;
  min-width: 400px;
  border-collapse: collapse;
}

.standings-table th {
  padding: var(--wc-space-md) var(--wc-space-sm);
  font-size: 10px;
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-muted);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--wc-border);
  white-space: nowrap;
}

.standings-table td {
  padding: var(--wc-space-md) var(--wc-space-sm);
  font-size: var(--wc-font-size-base);
  text-align: center;
  border-bottom: 1px solid var(--wc-border-light);
  color: var(--wc-text-primary);
  transition: background var(--wc-transition-fast);
}

.standings-table tbody tr {
  transition: background var(--wc-transition-fast);
}

.standings-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.015);
}

.standings-table tbody tr:active {
  background: var(--wc-surface-active);
}

.standings-table tr:last-child td {
  border-bottom: none;
}

.col-rank { width: 36px; }

.col-team {
  text-align: left !important;
}

.col-data {
  font-variant-numeric: tabular-nums;
}

.col-pts { width: 52px; }

.col-result { color: var(--wc-accent); font-weight: var(--wc-font-weight-semibold); }

.col-hide-sm {}

@media (max-width: 359px) {
  .col-hide-sm { display: none; }
  .standings-table { min-width: 340px; }
}

/* 排名徽章 */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  background: rgba(255, 255, 255, 0.06);
  color: var(--wc-text-muted);
}

.rank-badge.top {
  background: var(--wc-accent);
  color: white;
  box-shadow: 0 0 8px var(--wc-accent-glow);
}

/* 球队单元格 */
.team-cell {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.team-flag {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.flag-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.team-name {
  font-weight: var(--wc-font-weight-medium);
  font-size: var(--wc-font-size-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 积分 */
.pts-value {
  display: inline-block;
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: var(--wc-radius-md);
  min-width: 28px;
  font-variant-numeric: tabular-nums;
}

/* 晋级行 */
.is-qualified {
  background: var(--wc-accent-subtle) !important;
  border-left: 3px solid var(--wc-accent);
}

/* 净胜球 */
.gd-pos { color: var(--wc-accent); font-weight: var(--wc-font-weight-semibold); }
.gd-neg { color: var(--wc-primary); font-weight: var(--wc-font-weight-semibold); }

/* 图例 */
.legend {
  display: flex;
  justify-content: center;
  padding: var(--wc-space-2xl) 0 var(--wc-space-lg);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--wc-radius-full);
  background: var(--wc-accent);
  box-shadow: 0 0 6px var(--wc-accent-glow);
}
</style>
