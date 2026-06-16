// 懂球帝球队 ID 映射
// 映射规则：项目内部 team_id → 懂球帝 team_id
// 数据来源：https://www.dongqiudi.com/team/{dq_team_id}

export const dqTeamIdMap = {
  // A 组
  MEX: 6,       // 墨西哥
  RSA: 1613,    // 南非
  KOR: 47,      // 韩国
  CZE: 15,      // 捷克

  // B 组
  CAN: 71,      // 加拿大
  BIH: 55,      // 波黑
  SUI: 7,       // 瑞士
  QAT: 128,     // 卡塔尔

  // C 组
  BRA: 5,       // 巴西
  MAR: 112,     // 摩洛哥
  SCO: 22,      // 苏格兰
  HAI: 949,     // 海地

  // D 组
  USA: 14,      // 美国
  TUR: 32,      // 土耳其
  PAR: 60,      // 巴拉圭
  AUS: 48,      // 澳大利亚

  // E 组
  GER: 2,       // 德国
  ECU: 62,      // 厄瓜多尔
  CIV: 88,      // 科特迪瓦
  CUW: 950,     // 库拉索

  // F 组
  NED: 16,      // 荷兰
  SWE: 17,      // 瑞典
  JPN: 1146,    // 日本
  TUN: 89,      // 突尼斯

  // G 组
  FRA: 1,       // 法国
  UKR: 21,      // 乌克兰
  NGA: 68,      // 尼日利亚
  NZL: 149,     // 新西兰

  // H 组
  ARG: 3,       // 阿根廷
  COL: 38,      // 哥伦比亚
  DZA: 82,      // 阿尔及利亚
  UZB: 105,     // 乌兹别克斯坦

  // I 组
  ITA: 9,       // 意大利
  DEN: 11,      // 丹麦
  MLI: 95,      // 马里
  SLV: 948,     // 萨尔瓦多

  // J 组
  ESP: 4,       // 西班牙
  POL: 27,      // 波兰
  CPV: 944,     // 佛得角
  HON: 74,      // 洪都拉斯

  // K 组
  BEL: 10,      // 比利时
  IRN: 83,      // 伊朗
  EGY: 66,      // 埃及
  PAN: 75,      // 巴拿马

  // L 组
  ENG: 8,       // 英格兰
  CRO: 30,      // 克罗地亚
  SEN: 86,      // 塞内加尔
  IRQ: 84,      // 伊拉克

  // 第2档附加赛胜者
  NOR: 18,      // 挪威
  AUT: 25,      // 奥地利
  SRB: 28,      // 塞尔维亚

  // 第3档附加赛胜者
  JOR: 106,     // 约旦
  GHA: 67,      // 加纳
  COD: 90,      // 刚果(金)

  // 第4档附加赛胜者
  KSA: 78,      // 沙特
  URY: 61,      // 乌拉圭
}

/**
 * 获取懂球帝球队 ID
 * @param {string} teamId - 项目内部球队 ID
 * @returns {number|null} 懂球帝球队 ID
 */
export function getDqTeamId(teamId) {
  return dqTeamIdMap[teamId] || null
}
