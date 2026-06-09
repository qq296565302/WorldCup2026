// 2026 美加墨世界杯 48 支参赛队伍数据
// 数据来源：wheniskickoff.com（实时 API）

export const teams = [
  // A 组
  { id: 'MEX', name: '墨西哥', nameEn: 'Mexico', group: 'A', flag: '🇲🇽', confederation: 'CONCACAF', rank: 15, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7A/ChOxM1xC2NOAIENZAAAIVenmXhE159.png' },
  { id: 'RSA', name: '南非', nameEn: 'South Africa', group: 'A', flag: '🇿🇦', confederation: 'CAF', rank: 55, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7E/ChOxM1xC2RuADToCAAAEmtXhz7o022.png' },
  { id: 'KOR', name: '韩国', nameEn: 'South Korea', group: 'A', flag: '🇰🇷', confederation: 'AFC', rank: 23, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7A/ChOxM1xC2MSAQaWAAAAL1VFSq5U098.png' },
  { id: 'CZE', name: '捷克', nameEn: 'Czechia', group: 'A', flag: '🇨🇿', confederation: 'UEFA', rank: 36, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/74/ChOxM1xC2EuAYSDaAAACk9Rvueg747.png' },

  // B 组
  { id: 'CAN', name: '加拿大', nameEn: 'Canada', group: 'B', flag: '🇨🇦', confederation: 'CONCACAF', rank: 40, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/73/ChOxM1xC2DSAay2bAAAF1Vkv5Qg286.png' },
  { id: 'BIH', name: '波黑', nameEn: 'Bosnia-Herzegovina', group: 'B', flag: '🇧🇦', confederation: 'UEFA', rank: 62, logo: 'https://sd.qunliao.info/fastdfs8/M00/B2/25/rBXRn2n-1cyATlgZAAAH0Sxz8ck704.png' },
  { id: 'SUI', name: '瑞士', nameEn: 'Switzerland', group: 'B', flag: '🇨🇭', confederation: 'UEFA', rank: 16, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7F/ChOxM1xC2TyANIAKAAABeUfO5gM520.png' },
  { id: 'QAT', name: '卡塔尔', nameEn: 'Qatar', group: 'B', flag: '🇶🇦', confederation: 'AFC', rank: 35, logo: 'https://sd.qunliao.info/fastdfs6/M00/23/44/rBUCgGNYoSGAKiiUAAATPmO8oGA233.png' },

  // C 组
  { id: 'BRA', name: '巴西', nameEn: 'Brazil', group: 'C', flag: '🇧🇷', confederation: 'CONMEBOL', rank: 3, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/73/ChOxM1xC2DCAM4slAAAMODYb5Wo093.png' },
  { id: 'MAR', name: '摩洛哥', nameEn: 'Morocco', group: 'C', flag: '🇲🇦', confederation: 'CAF', rank: 10, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7A/ChOxM1xC2NWAZiM1AAADL6R9t6s156.png' },
  { id: 'SCO', name: '苏格兰', nameEn: 'Scotland', group: 'C', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', rank: 32, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7D/ChOxM1xC2RGARlXJAAADZRt3Z5E811.png' },
  { id: 'HAI', name: '海地', nameEn: 'Haiti', group: 'C', flag: '🇭🇹', confederation: 'CONCACAF', rank: 85, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/78/ChOxM1xC2JeASopzAAAGuTgfj7A505.png' },

  // D 组
  { id: 'USA', name: '美国', nameEn: 'United States', group: 'D', flag: '🇺🇸', confederation: 'CONCACAF', rank: 11, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7F/ChOxM1xC2UmAAa6sAAAQEZEKYAA997.png' },
  { id: 'TUR', name: '土耳其', nameEn: 'Turkey', group: 'D', flag: '🇹🇷', confederation: 'UEFA', rank: 41, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7F/ChOxM1xC2UOAAUUEAAAE_nJ2nXk049.png' },
  { id: 'PAR', name: '巴拉圭', nameEn: 'Paraguay', group: 'D', flag: '🇵🇾', confederation: 'CONMEBOL', rank: 40, logo: 'https://sd.qunliao.info/fastdfs8/M00/B2/45/rBXRDGn-3pCASTguAAAK68EPPjA393.png' },
  { id: 'AUS', name: '澳大利亚', nameEn: 'Australia', group: 'D', flag: '🇦🇺', confederation: 'AFC', rank: 24, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/72/ChOxM1xC2BGALh9vAAAQzrycW40209.png' },

  // E 组
  { id: 'GER', name: '德国', nameEn: 'Germany', group: 'E', flag: '🇩🇪', confederation: 'UEFA', rank: 8, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/77/ChOxM1xC2JGAd79VAAAAyGVvoVQ975.png' },
  { id: 'ECU', name: '厄瓜多尔', nameEn: 'Ecuador', group: 'E', flag: '🇪🇨', confederation: 'CONMEBOL', rank: 30, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/75/ChOxM1xC2FSADy_DAAALaURezqo279.png' },
  { id: 'CIV', name: '科特迪瓦', nameEn: 'Ivory Coast', group: 'E', flag: '🇨🇮', confederation: 'CAF', rank: 44, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/74/ChOxM1xC2EuAJyTAAAAAugs6_Cg267.png' },
  { id: 'CUW', name: '库拉索', nameEn: 'Curaçao', group: 'E', flag: '🇨🇼', confederation: 'CONCACAF', rank: 85, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7B/ChOxM1xC2N6AK5gOAAADXUM7-Kk431.png' },

  // F 组
  { id: 'NED', name: '荷兰', nameEn: 'Netherlands', group: 'F', flag: '🇳🇱', confederation: 'UEFA', rank: 8, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7B/ChOxM1xC2N6AEWYMAAABPByVIVM465.png' },
  { id: 'SWE', name: '瑞典', nameEn: 'Sweden', group: 'F', flag: '🇸🇪', confederation: 'UEFA', rank: 45, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7F/ChOxM1xC2TeAejqdAAABczmP1jg125.png' },
  { id: 'JPN', name: '日本', nameEn: 'Japan', group: 'F', flag: '🇯🇵', confederation: 'AFC', rank: 14, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/79/ChOxM1xC2L6AHvC4AAAEdawnP9Q689.png' },
  { id: 'TUN', name: '突尼斯', nameEn: 'Tunisia', group: 'F', flag: '🇹🇳', confederation: 'CAF', rank: 42, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7F/ChOxM1xC2T6AVxyuAAAF5xZKmyM136.png' },

  // G 组
  { id: 'BEL', name: '比利时', nameEn: 'Belgium', group: 'G', flag: '🇧🇪', confederation: 'UEFA', rank: 9, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/72/ChOxM1xC2CKAJTG3AAAAypTh1A8948.png' },
  { id: 'EGY', name: '埃及', nameEn: 'Egypt', group: 'G', flag: '🇪🇬', confederation: 'CAF', rank: 33, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/75/ChOxM1xC2FSAG-vgAAAEuBDOMI0727.png' },
  { id: 'IRN', name: '伊朗', nameEn: 'Iran', group: 'G', flag: '🇮🇷', confederation: 'AFC', rank: 22, logo: 'https://sd.qunliao.info/fastdfs8/M00/B2/4F/rBXRDGn-4pSAbpoIAAAdWfynXzU837.png' },
  { id: 'NZL', name: '新西兰', nameEn: 'New Zealand', group: 'G', flag: '🇳🇿', confederation: 'OFC', rank: 93, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7B/ChOxM1xC2N-Aa55oAAAKHk0Xucs443.png' },

  // H 组
  { id: 'ESP', name: '西班牙', nameEn: 'Spain', group: 'H', flag: '🇪🇸', confederation: 'UEFA', rank: 6, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7E/ChOxM1xC2TCAWMemAAAJsy8Pgbg246.png' },
  { id: 'KSA', name: '沙特阿拉伯', nameEn: 'Saudi Arabia', group: 'H', flag: '🇸🇦', confederation: 'AFC', rank: 56, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7D/ChOxM1xC2QmAWthoAAAKQAUuoQY168.png' },
  { id: 'URU', name: '乌拉圭', nameEn: 'Uruguay', group: 'H', flag: '🇺🇾', confederation: 'CONMEBOL', rank: 12, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/80/ChOxM1xC2UyAFIQpAAAJFbiniWQ532.png' },
  { id: 'CPV', name: '佛得角', nameEn: 'Cape Verde Islands', group: 'H', flag: '🇨🇻', confederation: 'CAF', rank: 75, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/73/ChOxM1xC2DSAf9W9AAAGgOp7u4w404.png' },

  // I 组
  { id: 'FRA', name: '法国', nameEn: 'France', group: 'I', flag: '🇫🇷', confederation: 'UEFA', rank: 2, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/77/ChOxM1xC2IKANG6tAAABFW9OqCQ523.png' },
  { id: 'SEN', name: '塞内加尔', nameEn: 'Senegal', group: 'I', flag: '🇸🇳', confederation: 'CAF', rank: 17, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7D/ChOxM1xC2RKAS3NNAAAC2Nr8OzA389.png' },
  { id: 'NOR', name: '挪威', nameEn: 'Norway', group: 'I', flag: '🇳🇴', confederation: 'UEFA', rank: 46, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7B/ChOxM1xC2OaAYv00AAABrhQP22I466.png' },
  { id: 'IRQ', name: '伊拉克', nameEn: 'Iraq', group: 'I', flag: '🇮🇶', confederation: 'AFC', rank: null, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/78/ChOxM1xC2KKAUYxJAAAETkn3xgs261.png' },

  // J 组
  { id: 'ARG', name: '阿根廷', nameEn: 'Argentina', group: 'J', flag: '🇦🇷', confederation: 'CONMEBOL', rank: 1, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/72/ChOxM1xC2A-AI_uOAAAHB-5pMAU501.png' },
  { id: 'AUT', name: '奥地利', nameEn: 'Austria', group: 'J', flag: '🇦🇹', confederation: 'UEFA', rank: 25, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/72/ChOxM1xC2BSAd33sAAAAwSmUl1c875.png' },
  { id: 'JOR', name: '约旦', nameEn: 'Jordan', group: 'J', flag: '🇯🇴', confederation: 'AFC', rank: 68, logo: 'https://sd.qunliao.info/fastdfs8/M00/B2/95/rBXRDGn-_caAPquQAAAJz5HaNGQ223.png' },
  { id: 'DZA', name: '阿尔及利亚', nameEn: 'Algeria', group: 'J', flag: '🇩🇿', confederation: 'CAF', rank: 38, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/71/ChOxM1xC2ASAL31DAAAHtIt8DXA565.png' },

  // K 组
  { id: 'POR', name: '葡萄牙', nameEn: 'Portugal', group: 'K', flag: '🇵🇹', confederation: 'UEFA', rank: 6, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7C/ChOxM1xC2PuALvwRAAAK3F_koeE108.png' },
  { id: 'COL', name: '哥伦比亚', nameEn: 'Colombia', group: 'K', flag: '🇨🇴', confederation: 'CONMEBOL', rank: 16, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/74/ChOxM1xC2EGAaUoxAAABWBGyGJo937.png' },
  { id: 'UZB', name: '乌兹别克斯坦', nameEn: 'Uzbekistan', group: 'K', flag: '🇺🇿', confederation: 'AFC', rank: 62, logo: 'https://sd.qunliao.info/fastdfs8/M00/B2/9B/rBXRDGn_AAiABoBOAAAMkGBJ8fQ234.png' },
  { id: 'COD', name: '刚果(金)', nameEn: 'Congo DR', group: 'K', flag: '🇨🇩', confederation: 'CAF', rank: null, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/74/ChOxM1xC2EGACTivAAAFzVDGsuI699.png' },

  // L 组
  { id: 'ENG', name: '英格兰', nameEn: 'England', group: 'L', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', rank: 5, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/76/ChOxM1xC2G2Acp31AAABNMvdP0U855.png' },
  { id: 'CRO', name: '克罗地亚', nameEn: 'Croatia', group: 'L', flag: '🇭🇷', confederation: 'UEFA', rank: 7, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/74/ChOxM1xC2EOAbUHIAAAOg6JpgzM729.png' },
  { id: 'GHA', name: '加纳', nameEn: 'Ghana', group: 'L', flag: '🇬🇭', confederation: 'CAF', rank: 60, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/77/ChOxM1xC2JGASs2QAAAEP6RcnSU543.png' },
  { id: 'PAN', name: '巴拿马', nameEn: 'Panama', group: 'L', flag: '🇵🇦', confederation: 'CONCACAF', rank: 58, logo: 'https://sd.qunliao.info/fastdfs3/M00/B5/7B/ChOxM1xC2OeAS3ajAAADqpnHFS0036.png' }
]

// wheniskickoff API 使用的 IOC 代码 → FIFA 代码映射
const codeAliases = {
  URY: 'URU', // 乌拉圭
  CIV: 'CIV', // 科特迪瓦 (IOC=CIV, FIFA=CIV，一致)
}

// 根据 ID 获取队伍
export const getTeamById = (id) => {
  if (!id) return null
  let lookup = id.toUpperCase()
  // 先查别名表
  if (codeAliases[lookup]) lookup = codeAliases[lookup]
  // 按 FIFA 代码匹配
  const byCode = teams.find(t => t.id === lookup)
  if (byCode) return byCode
  // 再按英文名匹配（赛程数据可能用英文名）
  return teams.find(t => t.nameEn && t.nameEn.toLowerCase() === id.toLowerCase())
}

// 获取指定小组的队伍
export const getTeamsByGroup = (group) => teams.filter(t => t.group === group)

// 获取所有小组
export const getAllGroups = () => [...new Set(teams.map(t => t.group))].sort()
