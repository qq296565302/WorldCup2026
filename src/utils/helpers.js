/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {string} 格式化后的日期
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 周${weekDay}`
}

/**
 * 格式化时间
 * @param {string} timeStr - 时间字符串 HH:mm
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.substring(0, 5)
}

/**
 * 获取比赛状态文本
 * @param {string} status - 比赛状态
 * @returns {string} 状态文本
 */
export const getMatchStatusText = (status) => {
  const statusMap = {
    scheduled: '未开始',
    live: '进行中',
    finished: '已结束',
    postponed: '推迟',
    cancelled: '取消',
    '1H': '上半场',
    '2H': '下半场',
    HT: '中场休息',
    FT: '全场结束',
    ET: '加时赛',
    P: '点球大战'
  }
  return statusMap[status] || status
}

/**
 * 获取比赛状态样式类
 * @param {string} status - 比赛状态
 * @returns {string} CSS 类名
 */
export const getMatchStatusClass = (status) => {
  if (['live', '1H', '2H', 'HT', 'ET', 'P'].includes(status)) return 'status-live'
  if (['finished', 'FT'].includes(status)) return 'status-finished'
  return 'status-scheduled'
}

/**
 * 获取球队国旗 URL（使用 flagcdn）
 * @param {string} countryCode - 国家代码（小写）
 * @returns {string} 国旗图片 URL
 */
export const getFlagUrl = (countryCode) => {
  if (!countryCode) return ''
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
}

/**
 * 防抖函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 获取阶段中文名
 * @param {string} stage - 阶段代码
 * @returns {string} 阶段中文名
 */
export const getStageName = (stage) => {
  const stageMap = {
    group: '小组赛',
    '16': '1/8 决赛',
    '8': '1/4 决赛',
    '4': '半决赛',
    '3': '三四名决赛',
    '2': '决赛',
    final: '决赛'
  }
  return stageMap[stage] || stage
}
