// 2026 美加墨世界杯球员详情数据索引
// 数据来源：懂球帝 (dongqiudi.com)
// 更新时间：2026-06-09
// 每个球员的详细数据存储在 public/data/players/ 目录下，按需 fetch 加载

// 根据 personId 异步加载球员详情
export const getPlayerDetailById = async (personId) => {
  if (!personId) return null
  try {
    const res = await fetch(`/data/players/${personId}.json`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
