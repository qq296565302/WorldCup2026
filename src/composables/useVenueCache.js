// 懂球帝场馆缓存
// 当用户访问比赛详情页时，缓存懂球帝的场馆数据
// 赛程页面优先使用缓存中的场馆信息，确保一致性

const VENUE_CACHE_KEY = 'wc2026_dq_venues'
const STATUS_CACHE_KEY = 'wc2026_match_status'

function loadCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

function saveCache(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ============ 场馆缓存 ============

/**
 * 缓存懂球帝场馆数据
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @param {string} field - 场馆字段（格式："多伦多体育场·加拿大"）
 */
export function cacheVenue(dqMatchId, field) {
  if (!dqMatchId || !field) return
  const cache = loadCache(VENUE_CACHE_KEY)
  cache[dqMatchId] = field
  saveCache(VENUE_CACHE_KEY, cache)
}

/**
 * 获取缓存的场馆数据
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {{ name: string, city: string } | null}
 */
export function getCachedVenue(dqMatchId) {
  if (!dqMatchId) return null
  const cache = loadCache(VENUE_CACHE_KEY)
  const field = cache[dqMatchId]
  if (!field) return null
  const parts = field.split('·')
  return {
    name: parts[0],
    city: parts.length >= 2 ? parts[parts.length - 1] : ''
  }
}

// ============ 比赛状态缓存 ============

/**
 * 批量缓存比赛状态数据
 * @param {Array} matches - 比赛列表，每项需包含 dq_match_id, status, home_score, away_score
 */
export function cacheMatchStatuses(matches) {
  const cache = loadCache(STATUS_CACHE_KEY)
  matches.forEach(m => {
    if (!m.dq_match_id) return
    cache[m.dq_match_id] = {
      status: m.status,
      home_score: m.home_score,
      away_score: m.away_score,
      updated: Date.now()
    }
  })
  saveCache(STATUS_CACHE_KEY, cache)
}

/**
 * 获取缓存的比赛状态
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {{ status: string, home_score: number|null, away_score: number|null } | null}
 */
export function getCachedMatchStatus(dqMatchId) {
  if (!dqMatchId) return null
  const cache = loadCache(STATUS_CACHE_KEY)
  return cache[dqMatchId] || null
}
