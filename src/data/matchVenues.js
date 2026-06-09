// 2026 世界杯官方赛程场馆映射
// 数据来源：FIFA 官方 https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
// wheniskickoff API 的场馆分配有误，使用此映射覆盖

// FIFA 官方场馆名称 → 中文场馆名 + 城市
const venueMap = {
  'Mexico City Stadium': { name: '阿兹特克体育场', city: '墨西哥城', country: '墨西哥' },
  'Estadio Guadalajara': { name: '阿克伦体育场', city: '瓜达拉哈拉', country: '墨西哥' },
  'Toronto Stadium': { name: 'BMO球场', city: '多伦多', country: '加拿大' },
  'Los Angeles Stadium': { name: 'SoFi体育场', city: '洛杉矶', country: '美国' },
  'Boston Stadium': { name: '吉列体育场', city: '波士顿', country: '美国' },
  'BC Place Vancouver': { name: 'BC Place体育馆', city: '温哥华', country: '加拿大' },
  'New York New Jersey Stadium': { name: '大都会人寿体育场', city: '纽约/新泽西', country: '美国' },
  'San Francisco Bay Area Stadium': { name: '李维体育场', city: '旧金山湾区', country: '美国' },
  'Philadelphia Stadium': { name: '林肯金融球场', city: '费城', country: '美国' },
  'Houston Stadium': { name: 'NRG体育场', city: '休斯顿', country: '美国' },
  'Dallas Stadium': { name: 'AT&T体育场', city: '达拉斯', country: '美国' },
  'Estadio Monterrey': { name: 'BBVA体育场', city: '蒙特雷', country: '墨西哥' },
  'Miami Stadium': { name: '硬石体育场', city: '迈阿密', country: '美国' },
  'Atlanta Stadium': { name: '梅赛德斯-奔驰体育场', city: '亚特兰大', country: '美国' },
  'Seattle Stadium': { name: '流明球场', city: '西雅图', country: '美国' },
  'Kansas City Stadium': { name: '箭头体育场', city: '堪萨斯城', country: '美国' },
}

// wheniskickoff num → FIFA 官方场馆名
export const matchVenueMap = {
  // === 小组赛第1轮 ===
  1: 'Mexico City Stadium',       // MEX vs RSA
  2: 'Estadio Guadalajara',       // KOR vs CZE
  3: 'Toronto Stadium',           // CAN vs BIH
  4: 'Los Angeles Stadium',       // USA vs PAR
  5: 'Boston Stadium',            // HAI vs SCO
  6: 'BC Place Vancouver',        // AUS vs TUR
  7: 'New York New Jersey Stadium', // BRA vs MAR
  8: 'San Francisco Bay Area Stadium', // QAT vs SUI
  9: 'Philadelphia Stadium',      // CIV vs ECU
  10: 'Houston Stadium',          // GER vs CUW
  11: 'Dallas Stadium',           // NED vs JPN
  12: 'Estadio Monterrey',        // SWE vs TUN
  13: 'Miami Stadium',            // KSA vs URY
  14: 'Atlanta Stadium',          // ESP vs CPV
  15: 'Los Angeles Stadium',      // IRN vs NZL
  16: 'Seattle Stadium',          // BEL vs EGY
  17: 'New York New Jersey Stadium', // FRA vs SEN
  18: 'Boston Stadium',           // IRQ vs NOR
  19: 'Kansas City Stadium',      // ARG vs DZA
  20: 'San Francisco Bay Area Stadium', // AUT vs JOR
  21: 'Toronto Stadium',          // GHA vs PAN
  22: 'Dallas Stadium',           // ENG vs CRO
  23: 'Houston Stadium',          // POR vs COD
  24: 'Mexico City Stadium',      // UZB vs COL

  // === 小组赛第2轮 ===
  25: 'Atlanta Stadium',          // CZE vs RSA
  26: 'Los Angeles Stadium',      // SUI vs BIH
  27: 'BC Place Vancouver',       // CAN vs QAT
  28: 'Estadio Guadalajara',      // MEX vs KOR
  29: 'Philadelphia Stadium',     // BRA vs HAI
  30: 'Boston Stadium',           // SCO vs MAR
  31: 'San Francisco Bay Area Stadium', // TUR vs PAR
  32: 'Seattle Stadium',          // USA vs AUS
  33: 'Toronto Stadium',          // GER vs CIV
  34: 'Kansas City Stadium',      // ECU vs CUW
  35: 'Houston Stadium',          // NED vs SWE
  36: 'Estadio Monterrey',        // TUN vs JPN
  37: 'Miami Stadium',            // URY vs CPV
  38: 'Atlanta Stadium',          // ESP vs KSA
  39: 'Los Angeles Stadium',      // BEL vs IRN
  40: 'BC Place Vancouver',       // NZL vs EGY
  41: 'New York New Jersey Stadium', // NOR vs SEN
  42: 'Philadelphia Stadium',     // FRA vs IRQ
  43: 'Dallas Stadium',           // ARG vs AUT
  44: 'San Francisco Bay Area Stadium', // JOR vs DZA
  45: 'Boston Stadium',           // ENG vs GHA
  46: 'Toronto Stadium',          // PAN vs CRO
  47: 'Houston Stadium',          // POR vs UZB
  48: 'Estadio Guadalajara',      // COL vs COD

  // === 小组赛第3轮 ===
  49: 'Miami Stadium',            // SCO vs BRA
  50: 'Atlanta Stadium',          // MAR vs HAI
  51: 'BC Place Vancouver',       // SUI vs CAN
  52: 'Seattle Stadium',          // BIH vs QAT
  53: 'Mexico City Stadium',      // CZE vs MEX
  54: 'Estadio Monterrey',        // RSA vs KOR
  55: 'Philadelphia Stadium',     // CUW vs CIV
  56: 'New York New Jersey Stadium', // ECU vs GER
  57: 'Dallas Stadium',           // JPN vs SWE
  58: 'Kansas City Stadium',      // TUN vs NED
  59: 'Los Angeles Stadium',      // TUR vs USA
  60: 'San Francisco Bay Area Stadium', // PAR vs AUS
  61: 'Boston Stadium',           // NOR vs FRA
  62: 'Toronto Stadium',          // SEN vs IRQ
  63: 'Seattle Stadium',          // EGY vs IRN
  64: 'BC Place Vancouver',       // NZL vs BEL
  65: 'Houston Stadium',          // CPV vs KSA
  66: 'Estadio Guadalajara',      // URY vs ESP
  67: 'New York New Jersey Stadium', // PAN vs ENG
  68: 'Philadelphia Stadium',     // CRO vs GHA
  69: 'Kansas City Stadium',      // DZA vs AUT
  70: 'Dallas Stadium',           // JOR vs ARG
  71: 'Miami Stadium',            // COL vs POR
  72: 'Atlanta Stadium',          // COD vs UZB

  // === 淘汰赛 1/16 决赛 ===
  73: 'Los Angeles Stadium',
  74: 'Boston Stadium',
  75: 'Estadio Monterrey',
  76: 'Houston Stadium',
  77: 'New York New Jersey Stadium',
  78: 'Dallas Stadium',
  79: 'Mexico City Stadium',
  80: 'Atlanta Stadium',
  81: 'San Francisco Bay Area Stadium',
  82: 'Seattle Stadium',
  83: 'Toronto Stadium',
  84: 'Los Angeles Stadium',
  85: 'BC Place Vancouver',
  86: 'Miami Stadium',
  87: 'Kansas City Stadium',
  88: 'Dallas Stadium',

  // === 1/8 决赛 ===
  89: 'Philadelphia Stadium',
  90: 'Houston Stadium',
  91: 'New York New Jersey Stadium',
  92: 'Mexico City Stadium',
  93: 'Dallas Stadium',
  94: 'Seattle Stadium',
  95: 'Atlanta Stadium',
  96: 'BC Place Vancouver',

  // === 1/4 决赛 ===
  97: 'Boston Stadium',
  98: 'Los Angeles Stadium',
  99: 'Miami Stadium',
  100: 'Kansas City Stadium',

  // === 半决赛 ===
  101: 'Dallas Stadium',
  102: 'Atlanta Stadium',

  // === 三四名 ===
  103: 'Miami Stadium',

  // === 决赛 ===
  104: 'New York New Jersey Stadium',
}

export const getVenueByNum = (num) => {
  const fifaVenue = matchVenueMap[num]
  if (fifaVenue && venueMap[fifaVenue]) {
    return venueMap[fifaVenue]
  }
  return null
}
