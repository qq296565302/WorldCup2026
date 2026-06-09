import { API_CONFIG } from './config'
import { juheClient, wheniskickoffClient, theSportsDbClient, dongqiudiClient } from './http'
import { dqMatchIdMap } from './dqMatchIds'

// ============ 聚合数据 API ============

/**
 * 获取赛程列表
 * @param {string} stage - 阶段：group/16/8/4/2/final
 * @param {string} group - 小组：A~L
 */
export const getSchedule = async (stage = '', group = '') => {
  try {
    if (!API_CONFIG.juhe.key) {
      throw new Error('聚合数据 API Key 未配置')
    }
    const params = { key: API_CONFIG.juhe.key }
    if (stage) params.stage = stage
    if (group) params.group = group
    const res = await juheClient.get(API_CONFIG.juhe.endpoints.schedule, { params })
    return res.result || []
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
  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.matches)
    const matches = res.data || []
    // 统一数据格式，时间转为北京时间
    return matches.map(m => {
      const { date, time } = utcToBeijing(m.date, m.time_utc)
      return {
        id: m.slug || m.num,
        num: m.num,
        dq_match_id: dqMatchIdMap[m.num] || null,
        date,
        time,
        time_utc: m.time_utc,
        home_team: m.home,
        away_team: m.away,
        home_name: m.home_name,
        away_name: m.away_name,
        home_score: null,
        away_score: null,
        group: m.group,
        venue: m.venue,
        venue_name: venueNameMap[m.venue_name] || m.venue_name,
        venue_city: venueCityMap[m.venue_city] || m.venue_city,
        stage: m.phase,
        status: 'scheduled'
      }
    })
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
  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.teams)
    return res.data || []
  } catch (error) {
    console.error('队伍数据获取失败:', error.message)
    return []
  }
}

/**
 * 获取场馆信息
 */
export const getVenuesFromApi = async () => {
  try {
    const res = await wheniskickoffClient.get(API_CONFIG.wheniskickoff.endpoints.venues)
    return res.data || []
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
