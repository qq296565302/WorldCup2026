// 2026 美加墨世界杯 16 个比赛场馆

export const venues = [
  // 美国
  { id: 'metlife', name: '大都会人寿体育场', nameEn: 'MetLife Stadium', city: '东卢瑟福', country: '美国', capacity: 82500 },
  { id: 'sofi', name: 'SoFi 体育场', nameEn: 'SoFi Stadium', city: '英格尔伍德', country: '美国', capacity: 70240 },
  { id: 'at&t', name: 'AT&T 体育场', nameEn: 'AT&T Stadium', city: '阿灵顿', country: '美国', capacity: 80000 },
  { id: 'hardrock', name: '硬石体育场', nameEn: 'Hard Rock Stadium', city: '迈阿密加登斯', country: '美国', capacity: 65326 },
  { id: 'mercedes', name: '梅赛德斯-奔驰体育场', nameEn: 'Mercedes-Benz Stadium', city: '亚特兰大', country: '美国', capacity: 71000 },
  { id: 'nrg', name: 'NRG 体育场', nameEn: 'NRG Stadium', city: '休斯顿', country: '美国', capacity: 72220 },
  { id: 'lincoln', name: '林肯金融球场', nameEn: 'Lincoln Financial Field', city: '费城', country: '美国', capacity: 69328 },
  { id: 'lumen', name: '流明球场', nameEn: 'Lumen Field', city: '西雅图', country: '美国', capacity: 68740 },
  { id: 'arrowhead', name: '箭头体育场', nameEn: 'Arrowhead Stadium', city: '堪萨斯城', country: '美国', capacity: 76416 },
  { id: 'gillette', name: '吉列体育场', nameEn: 'Gillette Stadium', city: '福克斯堡', country: '美国', capacity: 65878 },

  // 墨西哥
  { id: 'azteca', name: '阿兹特克体育场', nameEn: 'Estadio Azteca', city: '墨西哥城', country: '墨西哥', capacity: 87523 },
  { id: 'bbva', name: 'BBVA 体育场', nameEn: 'Estadio BBVA', city: '蒙特雷', country: '墨西哥', capacity: 53500 },
  { id: 'akron', name: '阿克伦体育场', nameEn: 'Estadio Akron', city: '瓜达拉哈拉', country: '墨西哥', capacity: 49850 },

  // 加拿大
  { id: 'bcplace', name: 'BC 体育馆', nameEn: 'BC Place', city: '温哥华', country: '加拿大', capacity: 54500 },
  { id: 'bmo', name: 'BMO 球场', nameEn: 'BMO Field', city: '多伦多', country: '加拿大', capacity: 30000 },
  { id: 'commonwealth', name: '英联邦体育场', nameEn: 'Commonwealth Stadium', city: '埃德蒙顿', country: '加拿大', capacity: 56302 }
]

export const getVenueById = (id) => venues.find(v => v.id === id)
