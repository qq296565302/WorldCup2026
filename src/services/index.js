import { API_CONFIG } from './config'
import { juheClient, wheniskickoffClient, theSportsDbClient, dongqiudiClient, miguClient } from './http'
import { dqMatchIdMap } from './dqMatchIds'
import { getTeamById } from '../data/teams'
import { getVenueByNum } from '../data/matchVenues'
import { getCachedVenue, cacheVenue, cacheMatchStatuses, getCachedMatchStatus } from '../composables/useVenueCache'
import { getCommentators, updateCommentators, getAllCommentators } from '../data/commentators'

// ============ 缓存 ============
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

function getCached(key) {
  const item = cache.get(key)
  if (item && Date.now() - item.time < CACHE_TTL) return item.data
  cache.delete(key)
  return null
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() })
}

/**
 * 分批并发执行异步任务
 * @param {Array} items - 待处理项
 * @param {Function} fn - 异步处理函数
 * @param {number} concurrency - 并发数
 */
async function batchAllSettled(items, fn, concurrency = 5) {
  const results = new Array(items.length)
  let index = 0
  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await Promise.resolve().then(() => fn(items[i], i)).then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      )
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

/**
 * 同步刷新已开赛/已结束比赛的实时状态
 * 等待结果后再返回，确保数据正确
 */
async function refreshMatchStatuses(matches, cacheKey) {
  const now = new Date()
  // 需要刷新状态的比赛（已过开赛时间且未结束）
  const needRefresh = matches.filter(m => {
    if (!m.dq_match_id) return false
    const matchTime = new Date(`${m.date}T${m.time}:00+08:00`)
    return matchTime <= now && m.status !== 'finished'
  })
  // 需要预缓存球场的比赛（还没有场馆缓存的）
  const needVenue = matches.filter(m => {
    if (!m.dq_match_id) return false
    return !getCachedVenue(m.dq_match_id)
  })

  if (needRefresh.length === 0 && needVenue.length === 0) return

  // 分批并发获取，避免同时请求过多导致超时
  const [statusResults, venueResults] = await Promise.all([
    needRefresh.length > 0
      ? batchAllSettled(needRefresh, m => getDqMatchDetail(m.dq_match_id), 5)
      : Promise.resolve([]),
    needVenue.length > 0
      ? batchAllSettled(needVenue, m => getDqMatchLineup(m.dq_match_id), 5)
      : Promise.resolve([])
  ])

  let changed = false

  // 更新状态
  needRefresh.forEach((m, i) => {
    const r = statusResults[i]
    if (r?.status === 'fulfilled' && r.value) {
      m.status = r.value.status || m.status
      if (r.value.homeScore !== null) m.home_score = r.value.homeScore
      if (r.value.awayScore !== null) m.away_score = r.value.awayScore
      changed = true
    }
  })

  // 预缓存球场
  needVenue.forEach((m, i) => {
    const r = venueResults[i]
    if (r?.status === 'fulfilled' && r.value?.field) {
      cacheVenue(m.dq_match_id, r.value.field)
      const parts = r.value.field.split('·')
      m.venue_name = parts[0]
      m.venue_city = parts.length >= 2 ? parts[parts.length - 1] : ''
      changed = true
    }
  })

  if (changed) {
    setCache(cacheKey, matches)
    cacheMatchStatuses(matches)
  }
}

// ============ 聚合数据 API ============

/**
 * 获取赛程列表
 * @param {string} stage - 阶段：group/16/8/4/2/final
 * @param {string} group - 小组：A~L
 */
export const getSchedule = async (stage = '', group = '') => {
  const cacheKey = `schedule:${stage}:${group}`
  const cached = getCached(cacheKey)
  if (cached) {
    // 同步刷新实时状态
    await refreshMatchStatuses(cached, cacheKey)

    return cached.map(m => {
      const dqVenue = m.dq_match_id ? getCachedVenue(m.dq_match_id) : null
      if (dqVenue) {
        return { ...m, venue_name: dqVenue.name, venue_city: dqVenue.city || '' }
      }
      const officialVenue = getVenueByNum(m.num)
      if (officialVenue) {
        return { ...m, venue_name: officialVenue.name, venue_city: `${officialVenue.city}·${officialVenue.country}` }
      }
      return m
    })
  }

  try {
    if (!API_CONFIG.juhe.key) {
      throw new Error('聚合数据 API Key 未配置')
    }
    const params = { key: API_CONFIG.juhe.key }
    if (stage) params.stage = stage
    if (group) params.group = group
    const res = await juheClient.get(API_CONFIG.juhe.endpoints.schedule, { params })
    const data = res.result || []
    setCache(cacheKey, data)
    return data
  } catch (error) {
    console.warn('聚合数据赛程获取失败，使用备用数据源:', error.message)
    return getScheduleFallback()
  }
}

/**
 * 获取积分榜
 * @param {string} group - 小组：A~L
 */
export const getStandings = async (group = '') => {
  // 从赛程数据中计算积分榜
  try {
    const allSchedule = await getScheduleFallback()
    if (!allSchedule || allSchedule.length === 0) return []

    // 按小组过滤比赛
    const schedule = group
      ? allSchedule.filter(m => m.group === group)
      : allSchedule

    // 初始化各队积分数据
    const table = {}
    schedule.forEach(m => {
      if (!table[m.home_team]) {
        const team = getTeamById(m.home_team)
        table[m.home_team] = {
          team_id: m.home_team,
          team_name: team?.name || m.home_name,
          played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, points: 0
        }
      }
      if (!table[m.away_team]) {
        const team = getTeamById(m.away_team)
        table[m.away_team] = {
          team_id: m.away_team,
          team_name: team?.name || m.away_name,
          played: 0, won: 0, drawn: 0, lost: 0,
          gf: 0, ga: 0, gd: 0, points: 0
        }
      }
    })

    // 从已结束的比赛计算积分
    schedule.forEach(m => {
      // 优先从 localStorage 获取最新状态
      const cachedStatus = m.dq_match_id ? getCachedMatchStatus(m.dq_match_id) : null
      const status = cachedStatus?.status || m.status
      const homeScore = cachedStatus?.home_score ?? m.home_score
      const awayScore = cachedStatus?.away_score ?? m.away_score

      if (status !== 'finished' || homeScore === null || awayScore === null) return
      const home = table[m.home_team]
      const away = table[m.away_team]
      if (!home || !away) return

      home.played++
      away.played++
      home.gf += homeScore
      home.ga += awayScore
      away.gf += awayScore
      away.ga += homeScore

      if (homeScore > awayScore) {
        home.won++
        home.points += 3
        away.lost++
      } else if (homeScore < awayScore) {
        away.won++
        away.points += 3
        home.lost++
      } else {
        home.drawn++
        away.drawn++
        home.points++
        away.points++
      }
    })

    // 计算净胜球
    Object.values(table).forEach(t => {
      t.gd = t.gf - t.ga
    })

    // 按积分、净胜球、进球数排序
    return Object.values(table).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      return b.gf - a.gf
    })
  } catch (error) {
    console.warn('积分榜计算失败:', error.message)
    return []
  }
}

// ============ wheniskickoff 数据源（主要数据源） ============

/**
 * UTC 时间转北京时间
 * @param {string} date - 日期 YYYY-MM-DD
 * @param {string} timeUtc - UTC 时间 HH:mm
 * @returns {{ date: string, time: string }} 北京时间
 */
const utcToBeijing = (date, timeUtc) => {
  if (!date || !timeUtc) return { date, time: timeUtc }

  const [hours, minutes] = timeUtc.split(':').map(Number)
  let beijingHours = hours + 8
  let beijingDate = new Date(date)

  if (beijingHours >= 24) {
    beijingHours -= 24
    beijingDate.setDate(beijingDate.getDate() + 1)
  }

  const year = beijingDate.getFullYear()
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0')
  const day = String(beijingDate.getDate()).padStart(2, '0')

  return {
    date: `${year}-${month}-${day}`,
    time: `${String(beijingHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
}

/**
 * 场馆名称中文翻译
 */
const venueNameMap = {
  'MetLife Stadium': '大都会人寿体育场',
  'SoFi Stadium': 'SoFi体育场',
  'AT&T Stadium': 'AT&T体育场',
  'Hard Rock Stadium': '硬石体育场',
  'Mercedes-Benz Stadium': '梅赛德斯-奔驰体育场',
  'NRG Stadium': 'NRG体育场',
  'Lincoln Financial Field': '林肯金融球场',
  'Lumen Field': '流明球场',
  "Levi's Stadium": '李维体育场',
  'Arrowhead Stadium': '箭头体育场',
  'Gillette Stadium': '吉列体育场',
  'Estadio Azteca': '阿兹特克体育场',
  'Estadio Akron': '阿克龙体育场',
  'Estadio BBVA': 'BBVA体育场',
  'BMO Field': 'BMO球场',
  'BC Place': 'BC Place体育馆'
}

/**
 * 城市名称中文翻译
 */
const venueCityMap = {
  'East Rutherford, NJ': '东拉瑟福德',
  'Los Angeles, CA': '洛杉矶',
  'Arlington, TX': '阿灵顿',
  'Miami Gardens, FL': '迈阿密花园',
  'Atlanta, GA': '亚特兰大',
  'Houston, TX': '休斯顿',
  'Philadelphia, PA': '费城',
  'Seattle, WA': '西雅图',
  'Santa Clara, CA': '圣克拉拉',
  'Kansas City, MO': '堪萨斯城',
  'Foxborough, MA': '福克斯堡',
  'Mexico City': '墨西哥城',
  'Guadalajara': '瓜达拉哈拉',
  'Monterrey': '蒙特雷',
  'Toronto': '多伦多',
  'Vancouver': '温哥华'
}

/**
 * 获取赛程数据
 * API 返回格式：{ meta: {...}, count: 104, data: [...] }
 * 单条数据：{ num, date, time_utc, home, away, group, venue, phase, home_name, away_name, venue_name, venue_city }
 */
export const getScheduleFallback = async () => {
  const cacheKey = 'schedule:fallback'
  const cached = getCached(cacheKey)
  if (cached) {
    // 同步刷新实时状态
    await refreshMatchStatuses(cached, cacheKey)

    return cached.map(m => {
      const dqVenue = m.dq_match_id ? getCachedVenue(m.dq_match_id) : null
      if (dqVenue) {
        return { ...m, venue_name: dqVenue.name, venue_city: dqVenue.city || '' }
      }
      const officialVenue = getVenueByNum(m.num)
      if (officialVenue) {
        return { ...m, venue_name: officialVenue.name, venue_city: `${officialVenue.city}·${officialVenue.country}` }
      }
      return m
    })
  }

  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.matches)
    const matches = res.data || []
    // 统一数据格式，时间转为北京时间
    const data = matches.map(m => {
      const { date, time } = utcToBeijing(m.date, m.time_utc)
      const homeTeam = getTeamById(m.home)
      const awayTeam = getTeamById(m.away)
      const dqMatchId = dqMatchIdMap[m.num] || null
      // 场馆优先级：懂球帝缓存 > FIFA 官方映射 > wheniskickoff 原始数据
      const dqVenue = dqMatchId ? getCachedVenue(dqMatchId) : null
      const officialVenue = getVenueByNum(m.num)
      // 先用 localStorage 恢复状态
      const cachedStatus = dqMatchId ? getCachedMatchStatus(dqMatchId) : null
      return {
        id: m.slug || m.num,
        num: m.num,
        dq_match_id: dqMatchId,
        date,
        time,
        time_utc: m.time_utc,
        home_team: m.home,
        away_team: m.away,
        home_name: homeTeam?.name || m.home_name,
        away_name: awayTeam?.name || m.away_name,
        home_score: cachedStatus?.home_score ?? null,
        away_score: cachedStatus?.away_score ?? null,
        group: m.group,
        venue: m.venue,
        venue_name: dqVenue?.name || officialVenue?.name || venueNameMap[m.venue_name] || m.venue_name,
        venue_city: dqVenue?.city || (officialVenue ? `${officialVenue.city}·${officialVenue.country}` : (venueCityMap[m.venue_city] || m.venue_city)),
        stage: m.phase,
        status: cachedStatus?.status || 'scheduled'
      }
    })

    // 同步刷新实时状态
    await refreshMatchStatuses(data, cacheKey)

    setCache(cacheKey, data)
    return data
  } catch (error) {
    console.error('赛程数据获取失败:', error.message)
    return []
  }
}

/**
 * 获取所有队伍
 * API 返回格式：{ meta: {...}, count: 49, data: [...] }
 * 单条数据：{ code, name, flag, group, rank, confederation, slug, matches }
 */
export const getTeamsFromApi = async () => {
  const cacheKey = 'teams'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.teams)
    const data = res.data || []
    setCache(cacheKey, data)
    return data
  } catch (error) {
    console.error('队伍数据获取失败:', error.message)
    return []
  }
}

/**
 * 获取场馆信息
 */
export const getVenuesFromApi = async () => {
  const cacheKey = 'venues'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.venues)
    const data = res.data || []
    setCache(cacheKey, data)
    return data
  } catch (error) {
    console.error('场馆数据获取失败:', error.message)
    return []
  }
}

// ============ TheSportsDB 深度数据源 ============

/**
 * 获取世界杯赛程（按赛季）
 */
export const getWorldCupEvents = async (season = '2026') => {
  try {
    const res = await theSportsDbClient.get(API_CONFIG.theSportsDb.endpoints.eventsSeason, {
      params: {
        id: API_CONFIG.theSportsDb.worldCupLeagueId,
        s: season
      }
    })
    return res.events || []
  } catch (error) {
    console.error('TheSportsDB 赛程获取失败:', error.message)
    return []
  }
}

/**
 * 获取队伍详情（TheSportsDB）
 */
export const getTeamDetail = async (teamId) => {
  try {
    const res = await theSportsDbClient.get(API_CONFIG.theSportsDb.endpoints.team, {
      params: { id: teamId }
    })
    return res.teams ? res.teams[0] : null
  } catch (error) {
    console.error('队伍详情获取失败:', error.message)
    return null
  }
}

/**
 * 获取球员详情（TheSportsDB）
 */
export const getPlayerDetail = async (playerId) => {
  try {
    const res = await theSportsDbClient.get(API_CONFIG.theSportsDb.endpoints.player, {
      params: { id: playerId }
    })
    return res.players ? res.players[0] : null
  } catch (error) {
    console.error('球员详情获取失败:', error.message)
    return null
  }
}

/**
 * 搜索球员（TheSportsDB）
 */
export const searchPlayer = async (playerName) => {
  try {
    const res = await theSportsDbClient.get(API_CONFIG.theSportsDb.endpoints.searchPlayer, {
      params: { p: playerName }
    })
    return res.player || []
  } catch (error) {
    console.error('球员搜索失败:', error.message)
    return []
  }
}

// ============ 懂球帝数据源 ============

/**
 * 比赛状态映射
 */
const dqStatusMap = {
  'Fixture': 'scheduled',
  'Playing': 'live',
  'Played': 'finished',
  'Half-time': 'HT',
  'Extra-time': 'ET',
  'Penalties': 'P',
  'Postponed': 'postponed',
  'Cancelled': 'cancelled'
}

/**
 * 获取懂球帝比赛详情
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {object|null} 比赛详情数据
 */
export const getDqMatchDetail = async (dqMatchId) => {
  try {
    const res = await dongqiudiClient.get(API_CONFIG.dongqiudi.endpoints.matchDetail, {
      params: { id: dqMatchId }
    })
    const sample = res.matchSample
    if (!sample) return null

    return {
      status: dqStatusMap[sample.status] || sample.status.toLowerCase(),
      dqStatus: sample.status,
      minute: sample.minute || '',
      homeScore: sample.fs_A !== '' ? Number(sample.fs_A) : null,
      awayScore: sample.fs_B !== '' ? Number(sample.fs_B) : null,
      homeHalfScore: sample.hts_A !== '' ? Number(sample.hts_A) : null,
      awayHalfScore: sample.hts_B !== '' ? Number(sample.hts_B) : null,
      homeExtraScore: sample.ets_A !== '' ? Number(sample.ets_A) : null,
      awayExtraScore: sample.ets_B !== '' ? Number(sample.ets_B) : null,
      homePenScore: sample.ps_A !== '' ? Number(sample.ps_A) : null,
      awayPenScore: sample.ps_B !== '' ? Number(sample.ps_B) : null,
      homeTeam: {
        id: sample.team_A_id,
        name: sample.team_A_name,
        logo: sample.team_A_logo,
        rank: sample.team_A_rank
      },
      awayTeam: {
        id: sample.team_B_id,
        name: sample.team_B_name,
        logo: sample.team_B_logo,
        rank: sample.team_B_rank
      },
      competition: sample.competition_name,
      group: sample.group_name,
      gameweek: sample.gameweek,
      dateUtc: sample.date_utc,
      timeUtc: sample.time_utc,
      startPlay: sample.start_play
    }
  } catch (error) {
    console.error('懂球帝比赛详情获取失败:', error.message)
    return null
  }
}

/**
 * 获取懂球帝比赛赛况/事件
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {object|null} { events, statistics }
 */
export const getDqMatchOverview = async (dqMatchId) => {
  try {
    const res = await dongqiudiClient.get(`${API_CONFIG.dongqiudi.endpoints.matchOverview}/${dqMatchId}`)
    // 转换统计数据格式：statistics 是 { team_A, team_B, list: [...] }
    const rawStats = res.statistics?.list || (Array.isArray(res.statistics) ? res.statistics : [])
    const statistics = rawStats.map(s => ({
      name: s.type || s.en_type || '',
      home: typeof s.team_A === 'object' ? s.team_A.value : s.team_A,
      away: typeof s.team_B === 'object' ? s.team_B.value : s.team_B,
      homePer: typeof s.team_A === 'object' ? s.team_A.per : null,
      awayPer: typeof s.team_B === 'object' ? s.team_B.per : null,
    }))
    // 转换事件数据格式：按分钟的对象 → 数组
    let events = res.events || []
    if (!Array.isArray(events) && typeof events === 'object') {
      events = Object.entries(events).map(([minute, data]) => ({
        minute,
        home: (data.teamAEvents || []).map(e => ({
          minute: data.minute || minute,
          minuteExtra: e.minute_extra || 0,
          person: e.person || '',
          personId: e.person_id || '',
          reason: e.reason || '',
          code: e.code || '',
          pic: e.event_pic || ''
        })),
        away: (data.teamBEvents || []).map(e => ({
          minute: data.minute || minute,
          minuteExtra: e.minute_extra || 0,
          person: e.person || '',
          personId: e.person_id || '',
          reason: e.reason || '',
          code: e.code || '',
          pic: e.event_pic || ''
        }))
      }))
    }
    return { events, statistics, matchStatus: res.match_status || '' }
  } catch (error) {
    console.error('懂球帝比赛赛况获取失败:', error.message)
    return null
  }
}

/**
 * 获取懂球帝比赛阵容
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {object|null} 阵容数据
 */
export const getDqMatchLineup = async (dqMatchId) => {
  try {
    const res = await dongqiudiClient.get(`${API_CONFIG.dongqiudi.endpoints.matchLineup}/${dqMatchId}`)
    // 映射球员字段名
    const mapPlayer = (p) => ({
      player_id: p.person_id,
      player_name: p.person,
      logo: p.logo,
      shirt_number: p.shirtnumber,
      position: p.position,
      captain: p.captain,
      is_mvp: p.is_mvp,
      events: p.events || [],
      nationality_name: p.nationality_name,
      foot: p.foot,
      height: p.height,
      rate: p.rate
    })
    const mapTeam = (team) => {
      if (!team) return null
      return {
        formation: team.formation,
        lineups: (team.lineups || team.start_players || []).map(mapPlayer),
        subs: (team.sub || team.sub_players || []).map(mapPlayer),
        coach: team.coach ? { player_name: team.coach.person, logo: team.coach.logo } : (team.team_coach ? { player_name: team.team_coach, logo: team.team_coach_logo } : null)
      }
    }
    return {
      weather: res.base?.weather || '',
      temperature: res.base?.temperature || '',
      field: res.base?.field || '',
      referee: res.base?.referee || '',
      home: mapTeam(res.persons?.team_A),
      away: mapTeam(res.persons?.team_B),
      homeForecast: mapTeam(res.forecasts?.team_A),
      awayForecast: mapTeam(res.forecasts?.team_B)
    }
  } catch (error) {
    console.error('懂球帝阵容获取失败:', error.message)
    return null
  }
}

/**
 * 获取懂球帝赛前分析
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {object|null} 分析数据
 */
export const getDqMatchAnalysis = async (dqMatchId) => {
  try {
    const res = await dongqiudiClient.get(`${API_CONFIG.dongqiudi.endpoints.matchAnalysis}/${dqMatchId}`)
    return res
  } catch (error) {
    console.error('懂球帝赛前分析获取失败:', error.message)
    return null
  }
}

/**
 * 获取懂球帝比赛赔率指数
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {object|null} { europe: [], asia: [], overUnder: [] }
 */
export const getDqMatchOdds = async (dqMatchId) => {
  try {
    const res = await dongqiudiClient.get(`${API_CONFIG.dongqiudi.endpoints.matchOdds}/${dqMatchId}`)
    if (!res) return null

    // 欧指：homeWin / draw / awayWin
    const europe = (res.europe || []).map(c => ({
      name: c.name,
      area: c.area,
      abbr: c.abbr,
      now: c.now ? { homeWin: c.now.homeWin, draw: c.now.draw, awayWin: c.now.awayWin, ts: c.now.ts } : null,
      begin: c.begin ? { homeWin: c.begin.homeWin, draw: c.begin.draw, awayWin: c.begin.awayWin, ts: c.begin.ts } : null
    }))

    // 亚盘：homeWin=主队水位, draw=盘口, awayWin=客队水位
    const asia = (res.asia || []).map(c => ({
      name: c.name,
      area: c.area,
      abbr: c.abbr,
      now: c.now ? { home: c.now.homeWin, handicap: c.now.draw, away: c.now.awayWin, ts: c.now.ts } : null,
      begin: c.begin ? { home: c.begin.homeWin, handicap: c.begin.draw, away: c.begin.awayWin, ts: c.begin.ts } : null
    }))

    // 大小球：homeWin=大球水位, draw=盘口, awayWin=小球水位
    const size = (res.size || []).map(c => ({
      name: c.name,
      area: c.area,
      abbr: c.abbr,
      now: c.now ? { over: c.now.homeWin, line: c.now.draw, under: c.now.awayWin, ts: c.now.ts } : null,
      begin: c.begin ? { over: c.begin.homeWin, line: c.begin.draw, under: c.begin.awayWin, ts: c.begin.ts } : null
    }))

    // 欧指极值/均值
    const summary = {}
    if (res.max) {
      summary.max = {
        name: res.max.name,
        now: { homeWin: res.max.now?.homeWin, draw: res.max.now?.draw, awayWin: res.max.now?.awayWin },
        begin: { homeWin: res.max.begin?.homeWin, draw: res.max.begin?.draw, awayWin: res.max.begin?.awayWin }
      }
    }
    if (res.min) {
      summary.min = {
        name: res.min.name,
        now: { homeWin: res.min.now?.homeWin, draw: res.min.now?.draw, awayWin: res.min.now?.awayWin },
        begin: { homeWin: res.min.begin?.homeWin, draw: res.min.begin?.draw, awayWin: res.min.begin?.awayWin }
      }
    }
    if (res.avg) {
      summary.avg = {
        name: res.avg.name,
        now: { homeWin: res.avg.now?.homeWin, draw: res.avg.now?.draw, awayWin: res.avg.now?.awayWin },
        begin: { homeWin: res.avg.begin?.homeWin, draw: res.avg.begin?.draw, awayWin: res.avg.begin?.awayWin }
      }
    }

    return { europe, asia, size, summary }
  } catch (error) {
    console.error('懂球帝赔率获取失败:', error.message)
    return null
  }
}

// ============ 咪咕视频解说数据 ============

// 咪咕解说数据缓存
let miguCommentatorsCache = null
let miguCommentatorsCacheTime = 0
const MIGU_CACHE_TTL = 30 * 60 * 1000 // 30分钟

/**
 * 咪咕中文队名 → 项目内部队伍 ID 映射
 * 用于将咪咕 API 返回的中文队名匹配到比赛编号
 */
const miguTeamNameToId = {
  '墨西哥': 'MEX', '南非': 'RSA', '韩国': 'KOR', '捷克': 'CZE',
  '加拿大': 'CAN', '波黑': 'BIH', '瑞士': 'SUI', '卡塔尔': 'QAT',
  '巴西': 'BRA', '摩洛哥': 'MAR', '苏格兰': 'SCO', '海地': 'HAI',
  '美国': 'USA', '土耳其': 'TUR', '巴拉圭': 'PAR', '澳大利亚': 'AUS',
  '德国': 'GER', '厄瓜多尔': 'ECU', '科特迪瓦': 'CIV', '库拉索': 'CUW',
  '荷兰': 'NED', '瑞典': 'SWE', '日本': 'JPN', '突尼斯': 'TUN',
  '比利时': 'BEL', '埃及': 'EGY', '伊朗': 'IRN', '新西兰': 'NZL',
  '西班牙': 'ESP', '沙特阿拉伯': 'KSA', '沙特': 'KSA', '乌拉圭': 'URU', '佛得角': 'CPV', '佛得角群岛': 'CPV',
  '法国': 'FRA', '塞内加尔': 'SEN', '挪威': 'NOR', '伊拉克': 'IRQ',
  '阿根廷': 'ARG', '奥地利': 'AUT', '约旦': 'JOR', '阿尔及利亚': 'DZA',
  '葡萄牙': 'POR', '哥伦比亚': 'COL', '乌兹别克斯坦': 'UZB', '民主刚果': 'COD', '刚果民主共和国': 'COD', '刚果(金)': 'COD',
  '英格兰': 'ENG', '克罗地亚': 'CRO', '加纳': 'GHA', '巴拿马': 'PAN'
}

/**
 * 根据咪咕返回的队名找到比赛编号
 * 通过 pkInfoTitle（如 "西班牙vs佛得角"）匹配
 */
function findMatchNumByTeamNames(pkInfoTitle) {
  if (!pkInfoTitle) return null
  // 解析 "主队vs客队" 或 "主队 VS 客队"
  const parts = pkInfoTitle.split(/\s*(?:vs|VS)\s*/)
  if (parts.length !== 2) return null

  const homeId = miguTeamNameToId[parts[0].trim()]
  const awayId = miguTeamNameToId[parts[1].trim()]
  if (!homeId || !awayId) return null

  // 从赛程数据中查找匹配的比赛编号
  // 使用缓存的赛程数据
  const schedule = cache.get('schedule:fallback')
  if (schedule?.data) {
    const match = schedule.data.find(m => m.home_team === homeId && m.away_team === awayId)
    if (match) return match.num
  }
  return null
}

/**
 * 从咪咕视频 API 获取赛程解说数据
 * 使用 competitionId=10000991 获取世界杯全部赛程
 * @returns {Object|null} 解说数据映射 { matchNum: commentators }
 */
export async function fetchMiguCommentators() {
  const now = Date.now()
  if (miguCommentatorsCache && (now - miguCommentatorsCacheTime) < MIGU_CACHE_TTL) {
    return miguCommentatorsCache
  }

  try {
    const endpoint = API_CONFIG.migu.endpoints.matchList
    const competitionId = API_CONFIG.migu.competitionId
    // API 路径：/vms-match/v6/staticcache/basic/match-list/normal-match-list/0/{competitionId}/default/1/miguvideo/
    const url = `${endpoint}/0/${competitionId}/default/1/miguvideo/`
    const data = await miguClient.get(url)

    if (data) {
      const result = parseMiguMatchData(data)
      if (Object.keys(result).length > 0) {
        miguCommentatorsCache = result
        miguCommentatorsCacheTime = now
        // 合并到静态数据（不覆盖已有数据）
        const current = getAllCommentators()
        Object.keys(result).forEach(key => {
          if (result[key] && !current[key]) {
            updateCommentators({ [key]: result[key] })
          }
        })
        return result
      }
    }
  } catch (error) {
    console.warn('咪咕 API 获取失败，使用静态数据:', error.message)
  }

  // API 失败时返回静态数据
  const staticData = {}
  const all = getAllCommentators()
  Object.keys(all).forEach(key => {
    if (all[key]) staticData[key] = all[key]
  })
  return staticData
}

/**
 * 解析咪咕 API 返回的赛程数据，提取解说名单
 * API 返回格式：{ data: [ { matchList: [ { pkInfoTitle, matchHost: [...] } ] } ] }
 */
function parseMiguMatchData(apiData) {
  const result = {}

  const parseMatch = (match) => {
    if (!match) return
    // 提取解说信息
    const hosts = match.matchHost || match.hosts || []
    const hostNames = hosts
      .map(h => h.hostName || h.name || '')
      .filter(Boolean)
      .join(',')

    if (!hostNames) return

    // 通过队名匹配比赛编号
    const matchNum = findMatchNumByTeamNames(match.pkInfoTitle)
    if (matchNum) {
      result[matchNum] = hostNames
    }
  }

  // 遍历数据结构
  const dataList = apiData.data || apiData
  if (Array.isArray(dataList)) {
    dataList.forEach(item => {
      if (item.matchList && Array.isArray(item.matchList)) {
        item.matchList.forEach(parseMatch)
      } else {
        parseMatch(item)
      }
    })
  } else if (dataList.matchList) {
    dataList.matchList.forEach(parseMatch)
  }

  return result
}

/**
 * 获取某场比赛的解说名单
 * @param {number|string} matchNum - 比赛编号
 * @returns {string} 解说名单
 */
export function getMatchCommentators(matchNum) {
  return getCommentators(matchNum)
}
