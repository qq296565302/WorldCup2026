import { ref, watch } from 'vue'

const STORAGE_KEY = 'wc2026_favorites'
const ALERT_KEY = 'wc2026_alert_date'

const favorites = ref(new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')))

watch(favorites, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...val]))
}, { deep: true })

export function useFavorites() {
  const toggle = (matchId) => {
    if (favorites.value.has(matchId)) {
      favorites.value.delete(matchId)
    } else {
      favorites.value.add(matchId)
    }
    // 触发响应式更新
    favorites.value = new Set(favorites.value)
  }

  const isFav = (matchId) => favorites.value.has(matchId)

  const getAll = () => [...favorites.value]

  const count = () => favorites.value.size

  /**
   * 检查是否需要提醒当天收藏的比赛
   * 每天只提醒一次
   */
  const shouldAlertToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    const lastAlert = localStorage.getItem(ALERT_KEY)
    return lastAlert !== today
  }

  const markAlerted = () => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(ALERT_KEY, today)
  }

  return { favorites, toggle, isFav, getAll, count, shouldAlertToday, markAlerted }
}
