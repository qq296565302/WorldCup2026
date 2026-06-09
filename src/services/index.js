import { API_CONFIG } from './config'
import { juheClient, wheniskickoffClient, theSportsDbClient, dongqiudiClient } from './http'
import { dqMatchIdMap } from './dqMatchIds'
import { getTeamById } from '../data/teams'
import { getVenueByNum } from '../data/matchVenues'
import { getCachedVenue } from '../composables/useVenueCache'

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
    // 即使命中内存缓存，也要用 localStorage 中的懂球帝场馆缓存更新场馆字段
    return cached.map(m => {
      if (m.dq_match_id) {
        const dqVenue = getCachedVenue(m.dq_match_id)
        if (dqVenue) {
          return { ...m, venue_name: dqVenue.name, venue_city: dqVenue.city || '' }
        }
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
  try {
    if (!API_CONFIG.juhe.key) {
      throw new Error('聚合数据 API Key 未配置')
    }
    const params = { key: API_CONFIG.juhe.key }
    if (group) params.group = group
    const res = await juheClient.get(API_CONFIG.juhe.endpoints.standing, { params })
    return res.result || []
  } catch (error) {
    console.warn('聚合数据积分榜获取失败:', error.message)
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
    // 即使命中内存缓存，也要用 localStorage 中的懂球帝场馆缓存更新场馆字段
    return cached.map(m => {
      if (m.dq_match_id) {
        const dqVenue = getCachedVenue(m.dq_match_id)
        if (dqVenue) {
          return { ...m, venue_name: dqVenue.name, venue_city: dqVenue.city || '' }
        }
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
      // 场馆优先级：懂球帝缓存 > FIFA官方映射 > wheniskickoff原始数据
      const dqVenue = dqMatchId ? getCachedVenue(dqMatchId) : null
      const officialVenue = dqVenue ? null : getVenueByNum(m.num)
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
        home_score: null,
        away_score: null,
        group: m.group,
        venue: m.venue,
        venue_name: dqVenue?.name || officialVenue?.name || venueNameMap[m.venue_name] || m.venue_name,
        venue_city: dqVenue ? (dqVenue.city || '') : (officialVenue ? `${officialVenue.city}·${officialVenue.country}` : (venueCityMap[m.venue_city] || m.venue_city)),
        stage: m.phase,
        status: 'scheduled'
      }
    })
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
  'Half-time': 'halftime',
  'Extra-time': 'extra_time',
  'Penalties': 'penalties',
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
    return {
      events: res.events || [],
      statistics: res.statistics || [],
      matchStatus: res.match_status || ''
    }
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
    return {
      weather: res.base?.weather || '',
      temperature: res.base?.temperature || '',
      field: res.base?.field || '',
      referee: res.base?.referee || '',
      home: res.persons?.team_A || null,
      away: res.persons?.team_B || null,
      homeForecast: res.forecasts?.team_A || null,
      awayForecast: res.forecasts?.team_B || null
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
