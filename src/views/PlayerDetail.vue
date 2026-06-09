<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPlayerDetailById } from '../data/players'
import { getPlayerByPersonId, getTeamByPersonId } from '../data/squads'
import { getTeamById } from '../data/teams'
import PageHeader from '../components/PageHeader.vue'
import EmptyState from '../components/EmptyState.vue'
import SectionTitle from '../components/SectionTitle.vue'

const route = useRoute()
const router = useRouter()
const personId = route.params.id
const localPlayer = ref(null)
const teamCode = ref('')
const playerData = ref(null)

// 本地数据（来自 squads.js）
localPlayer.value = getPlayerByPersonId(personId)
teamCode.value = getTeamByPersonId(personId) || ''

// 本地详情数据（来自 players.js）
playerData.value = getPlayerDetailById(personId)

const team = computed(() => teamCode.value ? getTeamById(teamCode.value) : null)

// 能力值颜色
const getAbilityColor = (val) => {
  if (val >= 85) return '#ef4444'
  if (val >= 70) return '#f97316'
  if (val >= 55) return '#eab308'
  return '#3b82f6'
}

// 热力图专用：连续渐变色，低值深蓝→中值黄绿→高值亮红
const getHeatColor = (val) => {
  const t = Math.max(0, Math.min(1, (val - 30) / 70)) // 30~100 映射到 0~1
  let r, g, b
  if (t < 0.35) {
    // 深蓝 → 青
    const s = t / 0.35
    r = 20; g = Math.round(60 + s * 160); b = Math.round(180 - s * 40)
  } else if (t < 0.6) {
    // 青 → 黄绿
    const s = (t - 0.35) / 0.25
    r = Math.round(20 + s * 220); g = Math.round(220 - s * 20); b = Math.round(140 - s * 120)
  } else {
    // 黄绿 → 亮红
    const s = (t - 0.6) / 0.4
    r = Math.round(240 + s * 15); g = Math.round(200 - s * 170); b = Math.round(20 + s * 10)
  }
  return `rgb(${r},${g},${b})`
}

const getAbilityClass = (val) => {
  if (val >= 85) return 'elite'
  if (val >= 70) return 'good'
  if (val >= 55) return 'average'
  return 'low'
}

// 位置名称映射
const positionMap = {
  attacker: '前锋', midfielder: '中场', defender: '后卫', goalkeeper: '门将'
}

// 球场位置坐标映射 (基于 300x440 的 SVG viewBox)
// 数据中 lcb/lcm/ldm/lam/ls/lf 实际代表中路唯一位置，映射到中心
const pitchPositions = {
  gk:  { x: 150, y: 400 },
  rcb: { x: 90,  y: 330 },
  cb:  { x: 150, y: 330 },
  lcb: { x: 150, y: 330 },
  rb:  { x: 50,  y: 310 },
  lb:  { x: 250, y: 310 },
  rwb: { x: 40,  y: 250 },
  lwb: { x: 260, y: 250 },
  rdm: { x: 100, y: 260 },
  cdm: { x: 150, y: 260 },
  ldm: { x: 150, y: 260 },
  rcm: { x: 100, y: 210 },
  cm:  { x: 150, y: 210 },
  lcm: { x: 150, y: 210 },
  ram: { x: 100, y: 160 },
  cam: { x: 150, y: 160 },
  lam: { x: 150, y: 140 },
  rm:  { x: 40,  y: 190 },
  lm:  { x: 260, y: 190 },
  rw:  { x: 50,  y: 110 },
  lw:  { x: 250, y: 110 },
  rs:  { x: 110, y: 80 },
  cf:  { x: 150, y: 80 },
  ls:  { x: 135, y: 55 },
  st:  { x: 150, y: 45 },
  rf:  { x: 110, y: 90 },
  lf:  { x: 165, y: 70 },
}

// 获取位置在球场上的坐标
const getPosCoord = (css) => pitchPositions[css] || null

// 雷达图背景多边形点计算
const radarBgPoints = (count, level) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i / count) - Math.PI / 2
    const r = level * 0.8
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
}

// 雷达图数据多边形点计算
const radarDataPoints = (items) => {
  return items.map((item, i) => {
    const angle = (Math.PI * 2 * i / items.length) - Math.PI / 2
    const r = item.val * 0.8
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
}

// 雷达图数据点坐标
const radarPointCoord = (items, i) => {
  const angle = (Math.PI * 2 * i / items.length) - Math.PI / 2
  const r = items[i].val * 0.8
  return { cx: 100 + r * Math.cos(angle), cy: 100 + r * Math.sin(angle) }
}

// 雷达图标签坐标
const radarLabelCoord = (count, i) => {
  const angle = (Math.PI * 2 * i / count) - Math.PI / 2
  const r = 98
  return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) }
}

// 有效的位置能力数据（过滤空值）
const validFields = computed(() => {
  return (playerData.value?.ability?.fields || []).filter(f => f && f.css && getPosCoord(f.css))
})

const goBack = () => {
  if (teamCode.value) {
    router.push(`/team/${teamCode.value}`)
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="page-container">
    <PageHeader title="球员详情" gradient="dark" showBack @back="goBack()" />

    <template v-if="playerData || localPlayer">
      <!-- 球员基本信息头部 -->
      <section class="player-header">
        <div class="header-bg"></div>
        <div class="header-content">
          <!-- 左侧：大头像 -->
          <div class="header-left">
            <div class="player-avatar">
              <img v-if="playerData?.baseInfo?.logo" :src="playerData.baseInfo.logo" :alt="localPlayer?.name || playerData?.baseInfo?.name" />
              <img v-else-if="localPlayer?.logo" :src="localPlayer.logo" :alt="localPlayer.name" />
              <span v-else class="avatar-text">{{ (localPlayer?.name || '?')[0] }}</span>
            </div>
            <div class="player-value" v-if="playerData?.baseInfo?.marketValue">
              <span class="value-label">身价</span>
              <span class="value-num">{{ playerData.baseInfo.marketValue }}万欧</span>
            </div>
          </div>
          <!-- 右侧：球员信息 -->
          <div class="header-right">
            <h2 class="player-name">{{ localPlayer?.name || playerData?.baseInfo?.name }}</h2>
            <p class="player-name-en" v-if="playerData?.baseInfo?.nameEn || localPlayer?.nameEn">
              {{ playerData?.baseInfo?.nameEn || localPlayer?.nameEn }}
            </p>
            <div class="player-tags">
              <span class="tag" v-if="localPlayer?.isCaptain">C 队长</span>
              <span class="tag">{{ localPlayer?.position || positionMap[playerData?.baseInfo?.position] || '球员' }}</span>
              <span class="tag" v-if="localPlayer?.number">{{ localPlayer.number }}号</span>
            </div>
            <div class="player-meta">
              <div class="meta-item" v-if="playerData?.baseInfo?.nationality || team">
                <img v-if="playerData?.baseInfo?.nationalityLogo" :src="playerData.baseInfo.nationalityLogo" class="meta-flag" />
                <span v-else-if="team?.logo"><img :src="team.logo" class="meta-flag" /></span>
                <span>{{ playerData?.baseInfo?.nationality || team?.name }}</span>
              </div>
              <div class="meta-item" v-if="playerData?.baseInfo?.age || localPlayer?.age">
                {{ String(playerData?.baseInfo?.age || localPlayer.age).replace('岁', '') }}岁
              </div>
              <div class="meta-item" v-if="playerData?.baseInfo?.height">
                {{ playerData.baseInfo.height }}cm
              </div>
              <div class="meta-item" v-if="playerData?.baseInfo?.weight">
                {{ playerData.baseInfo.weight }}kg
              </div>
              <div class="meta-item" v-if="playerData?.baseInfo?.foot">
                {{ playerData.baseInfo.foot }}
              </div>
            </div>
            <div class="player-club" v-if="playerData?.baseInfo?.teamInfo">
              <img v-if="playerData.baseInfo.teamInfo.teamLogo" :src="playerData.baseInfo.teamInfo.teamLogo" class="club-logo" />
              <span>{{ playerData.baseInfo.teamInfo.teamName }}</span>
              <span class="club-number" v-if="playerData.baseInfo.teamInfo.shirtNumber">{{ playerData.baseInfo.teamInfo.shirtNumber }}号</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 能力值雷达图 -->
      <section v-if="playerData?.ability?.radar?.length" class="section">
        <SectionTitle title="能力值" accent />
        <div class="radar-wrap">
          <svg viewBox="0 0 200 200" class="radar-svg">
            <!-- 背景网格 -->
            <polygon v-for="level in [20, 40, 60, 80, 100]" :key="level"
              :points="radarBgPoints(playerData.ability.radar.length, level)"
              fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"
            />
            <!-- 轴线 -->
            <line v-for="(_, i) in playerData.ability.radar" :key="'ax'+i"
              x1="100" y1="100"
              :x2="100 + 80 * Math.cos((Math.PI * 2 * i / playerData.ability.radar.length) - Math.PI / 2)"
              :y2="100 + 80 * Math.sin((Math.PI * 2 * i / playerData.ability.radar.length) - Math.PI / 2)"
              stroke="rgba(255,255,255,0.2)" stroke-width="0.6"
            />
            <!-- 数据区域 -->
            <polygon
              :points="radarDataPoints(playerData.ability.radar)"
              fill="rgba(59, 130, 246, 0.25)" stroke="#3b82f6" stroke-width="1.5"
            />
            <!-- 数据点 -->
            <circle v-for="(item, i) in playerData.ability.radar" :key="i"
              :cx="radarPointCoord(playerData.ability.radar, i).cx"
              :cy="radarPointCoord(playerData.ability.radar, i).cy"
              r="2.5" fill="#3b82f6"
            />
            <!-- 标签 -->
            <text v-for="(item, i) in playerData.ability.radar" :key="'lb'+i"
              :x="radarLabelCoord(playerData.ability.radar.length, i).x"
              :y="radarLabelCoord(playerData.ability.radar.length, i).y"
              text-anchor="middle" dominant-baseline="middle"
              fill="rgba(255,255,255,0.85)" font-size="9" font-weight="500"
            >{{ item.name }}</text>
          </svg>
          <div class="radar-values">
            <div v-for="item in playerData.ability.radar" :key="item.name" class="radar-item">
              <span class="radar-name">{{ item.name }}</span>
              <span class="radar-val" :class="getAbilityClass(item.val)">{{ item.val }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 详细属性 -->
      <section v-if="playerData?.ability?.attrs?.length" class="section">
        <SectionTitle title="详细属性" accent />
        <div class="attrs-grid">
          <div v-for="group in playerData.ability.attrs" :key="group.title" class="attr-group">
            <div class="attr-group-title">{{ group.title }} <span class="attr-total">{{ group.total }}</span></div>
            <div class="attr-items">
              <div v-for="attr in group.detail" :key="attr.name" class="attr-row">
                <span class="attr-name">{{ attr.name }}</span>
                <div class="attr-bar-wrap">
                  <div class="attr-bar" :style="{ width: attr.val + '%', background: getAbilityColor(attr.val) }"></div>
                </div>
                <span class="attr-val" :class="getAbilityClass(attr.val)">{{ attr.val }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 位置能力 -->
      <section v-if="validFields.length" class="section">
        <SectionTitle title="位置能力" accent />
        <div class="pitch-container">
          <svg viewBox="0 0 300 440" class="pitch-svg">
            <defs>
              <!-- 高斯模糊滤镜 -->
              <filter id="heatmap-blur">
                <feGaussianBlur stdDeviation="30" />
              </filter>
              <!-- 每个位置的径向渐变 -->
              <radialGradient v-for="pos in validFields" :key="'g-'+pos.css"
                :id="'hg-'+pos.css" cx="50%" cy="50%" r="50%">
                <stop offset="0%" :stop-color="getHeatColor(pos.val)" stop-opacity="0.95" />
                <stop offset="40%" :stop-color="getHeatColor(pos.val)" stop-opacity="0.6" />
                <stop offset="100%" :stop-color="getHeatColor(pos.val)" stop-opacity="0" />
              </radialGradient>
            </defs>

            <!-- 球场背景 -->
            <rect x="0" y="0" width="300" height="440" rx="4" fill="#1a6b3c" />

            <!-- 热力图层 -->
            <g filter="url(#heatmap-blur)">
              <circle v-for="pos in validFields" :key="'h-'+pos.css"
                :cx="getPosCoord(pos.css).x"
                :cy="getPosCoord(pos.css).y"
                :r="70 + (pos.val - 30) * 0.8"
                :fill="'url(#hg-'+pos.css+')'"
              />
            </g>

            <!-- 球场线条 -->
            <rect x="8" y="8" width="284" height="424" rx="2" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 中线 -->
            <line x1="8" y1="220" x2="292" y2="220" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 中圈 -->
            <circle cx="150" cy="220" r="40" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <circle cx="150" cy="220" r="2" fill="rgba(255,255,255,0.35)" />
            <!-- 上方禁区 -->
            <rect x="70" y="8" width="160" height="70" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 上方小禁区 -->
            <rect x="110" y="8" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 上方罚球点 -->
            <circle cx="150" cy="58" r="2" fill="rgba(255,255,255,0.35)" />
            <!-- 上方罚球弧 -->
            <path d="M 120 78 A 40 40 0 0 0 180 78" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 下方禁区 -->
            <rect x="70" y="362" width="160" height="70" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 下方小禁区 -->
            <rect x="110" y="402" width="80" height="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 下方罚球点 -->
            <circle cx="150" cy="382" r="2" fill="rgba(255,255,255,0.35)" />
            <!-- 下方罚球弧 -->
            <path d="M 120 362 A 40 40 0 0 1 180 362" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" />
            <!-- 四角弧 -->
            <path d="M 8 18 A 10 10 0 0 1 18 8" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
            <path d="M 282 8 A 10 10 0 0 1 292 18" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
            <path d="M 8 422 A 10 10 0 0 0 18 432" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />
            <path d="M 282 432 A 10 10 0 0 0 292 422" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />

            <!-- 位置数值标记 -->
            <g v-for="pos in validFields" :key="pos.css">
              <template v-if="getPosCoord(pos.css)">
                <circle
                  :cx="getPosCoord(pos.css).x"
                  :cy="getPosCoord(pos.css).y"
                  r="12" fill="rgba(0,0,0,0.5)"
                />
                <text
                  :x="getPosCoord(pos.css).x"
                  :y="getPosCoord(pos.css).y + 1"
                  text-anchor="middle" dominant-baseline="middle"
                  fill="white" font-size="10" font-weight="bold"
                >{{ pos.val }}</text>
              </template>
            </g>
          </svg>
        </div>
      </section>

      <!-- 特殊属性 -->
      <section v-if="playerData?.ability?.starBar?.length" class="section">
        <SectionTitle title="特殊属性" accent />
        <div class="star-bars">
          <div v-for="item in playerData.ability.starBar" :key="item.name" class="star-item">
            <span class="star-name">{{ item.name }}</span>
            <div class="star-dots">
              <span v-for="n in 5" :key="n" class="dot" :class="{ filled: n <= item.val }"></span>
            </div>
          </div>
        </div>
        <div class="ability-footer" v-if="playerData.ability.version">
          数据来源：{{ playerData.ability.version }}
        </div>
      </section>

      <!-- 赛季统计 -->
      <section v-if="playerData?.careerStats?.length" class="section">
        <SectionTitle title="赛季数据" accent />
        <div class="stats-scroll">
          <table class="stats-table">
            <thead>
              <tr>
                <th>赛季</th>
                <th>球队</th>
                <th>出场</th>
                <th>首发</th>
                <th>进球</th>
                <th>助攻</th>
                <th>黄牌</th>
                <th>红牌</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stat, idx) in playerData.careerStats" :key="idx">
                <td>{{ stat.season }}</td>
                <td>
                  <div class="stat-team">
                    <img v-if="stat.teamLogo" :src="stat.teamLogo" class="stat-team-logo" />
                    <span>{{ stat.team }}</span>
                  </div>
                </td>
                <td>{{ stat.stats?.['出场'] || 0 }}</td>
                <td>{{ stat.stats?.['首发'] || 0 }}</td>
                <td class="stat-goal">{{ stat.stats?.['进球'] || 0 }}</td>
                <td class="stat-assist">{{ stat.stats?.['助攻'] || 0 }}</td>
                <td>{{ stat.stats?.['黄牌'] || 0 }}</td>
                <td>{{ stat.stats?.['红牌'] || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 荣誉 -->
      <section v-if="playerData?.honorInfo?.length" class="section">
        <SectionTitle title="荣誉" accent />
        <div class="honor-list">
          <div v-for="honor in playerData.honorInfo" :key="honor.honor_id" class="honor-item">
            <img v-if="honor.logo" :src="honor.logo" class="honor-logo" />
            <div class="honor-info">
              <span class="honor-name">{{ honor.name }}</span>
              <span class="honor-times">x{{ honor.times }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 转会记录 -->
      <section v-if="playerData?.transferInfo?.some(t => t.fromClub || t.toClub)" class="section">
        <SectionTitle title="转会记录" accent />
        <div class="transfer-list">
          <div v-for="(t, idx) in playerData.transferInfo.filter(t => t.fromClub || t.toClub)" :key="idx" class="transfer-item">
            <div class="transfer-date">{{ t.date }}</div>
            <div class="transfer-body">
              <div class="transfer-club">
                <img v-if="t.fromLogo" :src="t.fromLogo" class="transfer-logo" />
                <span>{{ t.fromClub }}</span>
              </div>
              <div class="transfer-arrow">
                <span class="transfer-type">{{ t.type }}</span>
                <span class="arrow-icon">→</span>
              </div>
              <div class="transfer-club">
                <img v-if="t.toLogo" :src="t.toLogo" class="transfer-logo" />
                <span>{{ t.toClub }}</span>
              </div>
            </div>
            <div class="transfer-fee" v-if="t.fee">{{ t.fee }}</div>
          </div>
        </div>
      </section>

      <!-- 伤病记录 -->
      <section v-if="playerData?.injuryInfo?.length" class="section">
        <SectionTitle title="伤病记录" accent />
        <div class="injury-list">
          <div v-for="(inj, idx) in playerData.injuryInfo" :key="idx" class="injury-item">
            <div class="injury-icon">🏥</div>
            <div class="injury-body">
              <div class="injury-type">{{ inj.type }}</div>
              <div class="injury-meta">
                <span>{{ inj.teamName }}</span>
                <span class="injury-date">{{ inj.startDate }} - {{ inj.endDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 近期比赛 -->
      <section v-if="playerData?.recentMatches?.length" class="section">
        <SectionTitle title="近期比赛" accent />
        <div class="match-list">
          <div v-for="match in playerData.recentMatches.slice(0, 10)" :key="match.matchId" class="match-item">
            <div class="match-date">{{ match.date?.substring(5, 10) }}</div>
            <div class="match-body">
              <span class="match-comp">{{ match.competition }}</span>
              <span class="match-teams">{{ match.homeName }} {{ match.teamScore }}-{{ match.opponentScore }} {{ match.awayName }}</span>
              <span class="match-result" :class="match.result?.toLowerCase()">{{ match.result }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <EmptyState v-else message="未找到该球员信息" icon="👤" />
  </div>
</template>

<style scoped>
/* 头部 */
.player-header {
  position: relative;
  background: linear-gradient(135deg, var(--wc-dark), var(--wc-darker));
  color: white;
  padding: var(--wc-space-xl) var(--wc-space-lg) var(--wc-space-2xl);
  overflow: hidden;
}

.header-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.18), transparent 65%);
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: var(--wc-space-xl);
}

.header-left {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wc-space-sm);
}

.header-right {
  flex: 1;
  min-width: 0;
}

.player-avatar {
  width: 120px;
  height: 120px;
  border-radius: var(--wc-radius-lg);
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 48px;
  font-weight: var(--wc-font-weight-bold);
}

.player-name {
  font-size: var(--wc-font-size-2xl);
  font-weight: var(--wc-font-weight-bold);
  margin: 0;
  line-height: 1.2;
}

.player-name-en {
  font-size: var(--wc-font-size-sm);
  opacity: 0.6;
  margin-top: 2px;
}

.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-sm);
}

.tag {
  font-size: var(--wc-font-size-xs);
  padding: 2px 8px;
  border-radius: var(--wc-radius-full);
  background: rgba(255,255,255,0.15);
}

.player-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--wc-space-sm) var(--wc-space-md);
  margin-top: var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-flag {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.player-club {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
  opacity: 0.9;
}

.club-logo {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.club-number {
  opacity: 0.7;
}

.player-value {
  text-align: center;
}

.value-label {
  font-size: var(--wc-font-size-xs);
  opacity: 0.6;
  margin-right: var(--wc-space-xs);
}

.value-num {
  font-size: var(--wc-font-size-base);
  font-weight: var(--wc-font-weight-bold);
  color: #22c55e;
}

/* 通用 section */
.section {
  padding: var(--wc-space-lg);
}

/* 雷达图 */
.radar-wrap {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-lg);
  display: flex;
  align-items: center;
  gap: var(--wc-space-lg);
  box-shadow: var(--wc-shadow-md);
}

.radar-svg {
  flex-shrink: 0;
  width: 180px;
  height: 180px;
}

.radar-values {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.radar-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--wc-space-xs) 0;
}

.radar-name {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-secondary);
}

.radar-val {
  font-size: var(--wc-font-size-xl);
  font-weight: var(--wc-font-weight-bold);
}

.radar-val.elite { color: #ef4444; }
.radar-val.good { color: #f97316; }
.radar-val.average { color: #eab308; }
.radar-val.low { color: #3b82f6; }

/* 详细属性 */
.attrs-grid {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-md);
}

.attr-group {
  background: var(--wc-surface);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-md);
  box-shadow: var(--wc-shadow-sm);
}

.attr-group-title {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-text-primary);
  margin-bottom: var(--wc-space-sm);
  display: flex;
  justify-content: space-between;
}

.attr-total {
  font-size: var(--wc-font-size-lg);
  color: var(--wc-primary);
}

.attr-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.attr-name {
  width: 60px;
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-secondary);
  flex-shrink: 0;
}

.attr-bar-wrap {
  flex: 1;
  height: 4px;
  background: var(--wc-gray-200);
  border-radius: 2px;
  overflow: hidden;
}

.attr-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.attr-val {
  width: 28px;
  text-align: right;
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
}

.attr-val.elite { color: #ef4444; }
.attr-val.good { color: #f97316; }
.attr-val.average { color: #eab308; }
.attr-val.low { color: #3b82f6; }

/* 位置能力 - 球场 */
.pitch-container {
  border-radius: var(--wc-radius-lg);
  overflow: hidden;
  box-shadow: var(--wc-shadow-md);
}

.pitch-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* 特殊属性 */
.star-bars {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.star-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--wc-space-sm) var(--wc-space-md);
  background: var(--wc-surface);
  border-radius: var(--wc-radius-md);
}

.star-name {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-primary);
}

.star-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--wc-gray-200);
}

.dot.filled {
  background: #eab308;
}

.ability-footer {
  text-align: center;
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  margin-top: var(--wc-space-md);
}

/* 赛季统计 */
.stats-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--wc-radius-lg);
  box-shadow: var(--wc-shadow-sm);
}

.stats-table {
  width: 100%;
  min-width: 500px;
  border-collapse: collapse;
  background: var(--wc-surface);
  font-size: var(--wc-font-size-sm);
}

.stats-table th {
  padding: var(--wc-space-sm) var(--wc-space-xs);
  font-size: var(--wc-font-size-xs);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-secondary);
  text-align: center;
  background: var(--wc-gray-50);
  border-bottom: 2px solid var(--wc-border);
  white-space: nowrap;
}

.stats-table td {
  padding: var(--wc-space-sm) var(--wc-space-xs);
  text-align: center;
  border-bottom: 1px solid var(--wc-border-light);
  color: var(--wc-text-primary);
}

.stat-goal { color: var(--wc-accent); font-weight: var(--wc-font-weight-bold); }
.stat-assist { color: #3b82f6; font-weight: var(--wc-font-weight-bold); }

.stat-team {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.stat-team-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* 荣誉 */
.honor-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.honor-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-sm) var(--wc-space-md);
  background: var(--wc-surface);
  border-radius: var(--wc-radius-md);
}

.honor-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.honor-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.honor-name {
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-primary);
}

.honor-times {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-bold);
  color: #eab308;
}

/* 近期比赛 */
.match-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-xs);
}

.match-item {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-sm) var(--wc-space-md);
  background: var(--wc-surface);
  border-radius: var(--wc-radius-md);
}

.match-date {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  width: 40px;
  flex-shrink: 0;
}

.match-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  font-size: var(--wc-font-size-sm);
}

.match-comp {
  color: var(--wc-text-muted);
  font-size: var(--wc-font-size-xs);
  flex-shrink: 0;
}

.match-teams {
  flex: 1;
  color: var(--wc-text-primary);
}

.match-result {
  font-weight: var(--wc-font-weight-bold);
  width: 20px;
  text-align: center;
}

.match-result.w { color: #22c55e; }
.match-result.d { color: #eab308; }
.match-result.l { color: #ef4444; }

/* 转会记录 */
.transfer-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.transfer-item {
  padding: var(--wc-space-sm) var(--wc-space-md);
  background: var(--wc-surface);
  border-radius: var(--wc-radius-md);
}

.transfer-date {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  margin-bottom: 4px;
}

.transfer-body {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
}

.transfer-club {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--wc-font-size-sm);
  color: var(--wc-text-primary);
}

.transfer-club:last-child {
  justify-content: flex-end;
  text-align: right;
}

.transfer-logo {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.transfer-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.transfer-type {
  font-size: 10px;
  color: var(--wc-text-muted);
  white-space: nowrap;
}

.arrow-icon {
  color: var(--wc-accent);
  font-size: var(--wc-font-size-lg);
  font-weight: bold;
}

.transfer-fee {
  text-align: center;
  font-size: var(--wc-font-size-xs);
  color: #22c55e;
  font-weight: var(--wc-font-weight-bold);
  margin-top: 4px;
}

/* 伤病记录 */
.injury-list {
  display: flex;
  flex-direction: column;
  gap: var(--wc-space-sm);
}

.injury-item {
  display: flex;
  align-items: flex-start;
  gap: var(--wc-space-sm);
  padding: var(--wc-space-sm) var(--wc-space-md);
  background: var(--wc-surface);
  border-radius: var(--wc-radius-md);
}

.injury-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.injury-body {
  flex: 1;
}

.injury-type {
  font-size: var(--wc-font-size-sm);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
}

.injury-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  margin-top: 2px;
}

.injury-date {
  color: var(--wc-text-secondary);
}
</style>
