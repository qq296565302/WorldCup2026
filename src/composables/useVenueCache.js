// 懂球帝场馆缓存
// 当用户访问比赛详情页时，缓存懂球帝的场馆数据
// 赛程页面优先使用缓存中的场馆信息，确保一致性

const CACHE_KEY = 'wc2026_dq_venues'

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

/**
 * 缓存懂球帝场馆数据
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @param {string} field - 场馆字段（格式："多伦多体育场·加拿大"）
 */
export function cacheVenue(dqMatchId, field) {
  if (!dqMatchId || !field) return
  const cache = loadCache()
  cache[dqMatchId] = field
  saveCache(cache)
}

/**
 * 获取缓存的场馆数据
 * @param {string} dqMatchId - 懂球帝比赛ID
 * @returns {{ name: string, city: string } | null}
 */
export function getCachedVenue(dqMatchId) {
  if (!dqMatchId) return null
  const cache = loadCache()
  const field = cache[dqMatchId]
  if (!field) return null
  const parts = field.split('·')
  return {
    name: parts[0],
    city: parts.length >= 2 ? parts[parts.length - 1] : ''
  }
}
