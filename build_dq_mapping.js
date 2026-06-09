// 从 team.html 解析出的真实懂球帝比赛数据
const dqMatches = [
  // 小组赛 第1轮
  { id: "54328038", home: "墨西哥", away: "南非" },
  { id: "54329974", home: "韩国", away: "捷克" },
  { id: "54328042", home: "加拿大", away: "波黑" },
  { id: "54328045", home: "美国", away: "巴拉圭" },
  { id: "54329984", home: "卡塔尔", away: "瑞士" },
  { id: "54329930", home: "巴西", away: "摩洛哥" },
  { id: "54329987", home: "海地", away: "苏格兰" },
  { id: "54329990", home: "澳大利亚", away: "土耳其" },
  { id: "54329950", home: "德国", away: "库拉索" },
  { id: "54329953", home: "荷兰", away: "日本" },
  { id: "54329993", home: "科特迪瓦", away: "厄瓜多尔" },
  { id: "54329996", home: "瑞典", away: "突尼斯" },
  { id: "54329959", home: "西班牙", away: "佛得角" },
  { id: "54329956", home: "比利时", away: "埃及" },
  { id: "54330007", home: "沙特阿拉伯", away: "乌拉圭" },
  { id: "54329999", home: "伊朗", away: "新西兰" },
  { id: "54329962", home: "法国", away: "塞内加尔" },
  { id: "54330010", home: "伊拉克", away: "挪威" },
  { id: "54329965", home: "阿根廷", away: "阿尔及利亚" },
  { id: "54330013", home: "奥地利", away: "约旦" },
  { id: "54329969", home: "葡萄牙", away: "刚果民主共和国" },
  { id: "54329971", home: "英格兰", away: "克罗地亚" },
  { id: "54330020", home: "加纳", away: "巴拿马" },
  { id: "54330016", home: "乌兹别克斯坦", away: "哥伦比亚" },
  // 小组赛 第2轮
  { id: "54329975", home: "捷克", away: "南非" },
  { id: "54329985", home: "瑞士", away: "波黑" },
  { id: "54328043", home: "加拿大", away: "卡塔尔" },
  { id: "54328039", home: "墨西哥", away: "韩国" },
  { id: "54328046", home: "美国", away: "澳大利亚" },
  { id: "54329988", home: "苏格兰", away: "摩洛哥" },
  { id: "54329931", home: "巴西", away: "海地" },
  { id: "54329991", home: "土耳其", away: "巴拉圭" },
  { id: "54329954", home: "荷兰", away: "瑞典" },
  { id: "54329951", home: "德国", away: "科特迪瓦" },
  { id: "54329994", home: "厄瓜多尔", away: "库拉索" },
  { id: "54329997", home: "突尼斯", away: "日本" },
  { id: "54329960", home: "西班牙", away: "沙特阿拉伯" },
  { id: "54329957", home: "比利时", away: "伊朗" },
  { id: "54330008", home: "乌拉圭", away: "佛得角" },
  { id: "54330000", home: "新西兰", away: "埃及" },
  { id: "54329966", home: "阿根廷", away: "奥地利" },
  { id: "54329963", home: "法国", away: "伊拉克" },
  { id: "54330011", home: "挪威", away: "塞内加尔" },
  { id: "54330014", home: "约旦", away: "阿尔及利亚" },
  { id: "54329968", home: "葡萄牙", away: "乌兹别克斯坦" },
  { id: "54329972", home: "英格兰", away: "加纳" },
  { id: "54330021", home: "巴拿马", away: "克罗地亚" },
  { id: "54330018", home: "哥伦比亚", away: "刚果民主共和国" },
  // 小组赛 第3轮
  { id: "54328044", home: "瑞士", away: "加拿大" },
  { id: "54329986", home: "波黑", away: "卡塔尔" },
  { id: "54329989", home: "摩洛哥", away: "海地" },
  { id: "54329932", home: "苏格兰", away: "巴西" },
  { id: "54329976", home: "南非", away: "韩国" },
  { id: "54328041", home: "捷克", away: "墨西哥" },
  { id: "54329995", home: "库拉索", away: "科特迪瓦" },
  { id: "54329952", home: "厄瓜多尔", away: "德国" },
  { id: "54329998", home: "日本", away: "瑞典" },
  { id: "54329955", home: "突尼斯", away: "荷兰" },
  { id: "54328047", home: "土耳其", away: "美国" },
  { id: "54329992", home: "巴拉圭", away: "澳大利亚" },
  { id: "54329964", home: "挪威", away: "法国" },
  { id: "54330012", home: "塞内加尔", away: "伊拉克" },
  { id: "54329961", home: "乌拉圭", away: "西班牙" },
  { id: "54330009", home: "佛得角", away: "沙特阿拉伯" },
  { id: "54329958", home: "新西兰", away: "比利时" },
  { id: "54330001", home: "埃及", away: "伊朗" },
  { id: "54329973", home: "巴拿马", away: "英格兰" },
  { id: "54330022", home: "克罗地亚", away: "加纳" },
  { id: "54329970", home: "哥伦比亚", away: "葡萄牙" },
  { id: "54330019", home: "刚果民主共和国", away: "乌兹别克斯坦" },
  { id: "54329967", home: "约旦", away: "阿根廷" },
  { id: "54330015", home: "阿尔及利亚", away: "奥地利" },
]

// wheniskickoff比赛数据
const wkMatches = [
  {num:1,home:'MEX',away:'RSA'},{num:2,home:'KOR',away:'CZE'},
  {num:3,home:'CAN',away:'BIH'},{num:4,home:'USA',away:'PAR'},
  {num:5,home:'QAT',away:'SUI'},{num:6,home:'BRA',away:'MAR'},
  {num:7,home:'HAI',away:'SCO'},{num:8,home:'AUS',away:'TUR'},
  {num:9,home:'GER',away:'CUW'},{num:10,home:'NED',away:'JPN'},
  {num:11,home:'CIV',away:'ECU'},{num:12,home:'SWE',away:'TUN'},
  {num:13,home:'ESP',away:'CPV'},{num:14,home:'BEL',away:'EGY'},
  {num:15,home:'KSA',away:'URY'},{num:16,home:'IRN',away:'NZL'},
  {num:17,home:'FRA',away:'SEN'},{num:18,home:'IRQ',away:'NOR'},
  {num:19,home:'ARG',away:'DZA'},{num:20,home:'AUT',away:'JOR'},
  {num:21,home:'POR',away:'COD'},{num:22,home:'ENG',away:'CRO'},
  {num:23,home:'GHA',away:'PAN'},{num:24,home:'UZB',away:'COL'},
  {num:25,home:'CZE',away:'RSA'},{num:26,home:'SUI',away:'BIH'},
  {num:27,home:'CAN',away:'QAT'},{num:28,home:'MEX',away:'KOR'},
  {num:29,home:'USA',away:'AUS'},{num:30,home:'SCO',away:'MAR'},
  {num:31,home:'BRA',away:'HAI'},{num:32,home:'TUR',away:'PAR'},
  {num:33,home:'NED',away:'SWE'},{num:34,home:'GER',away:'CIV'},
  {num:35,home:'ECU',away:'CUW'},{num:36,home:'TUN',away:'JPN'},
  {num:37,home:'ESP',away:'KSA'},{num:38,home:'BEL',away:'IRN'},
  {num:39,home:'URY',away:'CPV'},{num:40,home:'NZL',away:'EGY'},
  {num:41,home:'ARG',away:'AUT'},{num:42,home:'FRA',away:'IRQ'},
  {num:43,home:'NOR',away:'SEN'},{num:44,home:'JOR',away:'DZA'},
  {num:45,home:'POR',away:'UZB'},{num:46,home:'ENG',away:'GHA'},
  {num:47,home:'PAN',away:'CRO'},{num:48,home:'COL',away:'COD'},
  {num:49,home:'SUI',away:'CAN'},{num:50,home:'BIH',away:'QAT'},
  {num:51,home:'MAR',away:'HAI'},{num:52,home:'SCO',away:'BRA'},
  {num:53,home:'CZE',away:'MEX'},{num:54,home:'RSA',away:'KOR'},
  {num:55,home:'ECU',away:'GER'},{num:56,home:'CUW',away:'CIV'},
  {num:57,home:'TUN',away:'NED'},{num:58,home:'JPN',away:'SWE'},
  {num:59,home:'TUR',away:'USA'},{num:60,home:'PAR',away:'AUS'},
  {num:61,home:'NOR',away:'FRA'},{num:62,home:'SEN',away:'IRQ'},
  {num:63,home:'URY',away:'ESP'},{num:64,home:'CPV',away:'KSA'},
  {num:65,home:'NZL',away:'BEL'},{num:66,home:'EGY',away:'IRN'},
  {num:67,home:'PAN',away:'ENG'},{num:68,home:'CRO',away:'GHA'},
  {num:69,home:'COL',away:'POR'},{num:70,home:'COD',away:'UZB'},
  {num:71,home:'JOR',away:'ARG'},{num:72,home:'DZA',away:'AUT'},
]

const codeToName = {
  MEX:'墨西哥',RSA:'南非',KOR:'韩国',CZE:'捷克',CAN:'加拿大',BIH:'波黑',
  SUI:'瑞士',QAT:'卡塔尔',USA:'美国',PAR:'巴拉圭',AUS:'澳大利亚',TUR:'土耳其',
  BRA:'巴西',MAR:'摩洛哥',SCO:'苏格兰',HAI:'海地',GER:'德国',CUW:'库拉索',
  ECU:'厄瓜多尔',CIV:'科特迪瓦',NED:'荷兰',JPN:'日本',SWE:'瑞典',TUN:'突尼斯',
  BEL:'比利时',EGY:'埃及',IRN:'伊朗',NZL:'新西兰',ESP:'西班牙',CPV:'佛得角',
  KSA:'沙特阿拉伯',URY:'乌拉圭',PAN:'巴拿马',FRA:'法国',SEN:'塞内加尔',
  IRQ:'伊拉克',NOR:'挪威',ARG:'阿根廷',DZA:'阿尔及利亚',AUT:'奥地利',JOR:'约旦',
  POR:'葡萄牙',COD:'刚果民主共和国',ENG:'英格兰',CRO:'克罗地亚',GHA:'加纳',
  UZB:'乌兹别克斯坦',COL:'哥伦比亚',ALB:'阿尔巴尼亚',
}

function teamPair(home, away) {
  return [home, away].sort().join('-')
}

// 全局匹配: 每个wkMatch在dqMatches中找球队对匹配
const usedDqIds = new Set()
const result = {}
let warnings = 0

for (const wk of wkMatches) {
  const homeName = codeToName[wk.home]
  const awayName = codeToName[wk.away]
  if (!homeName || !awayName) {
    console.warn(`num=${wk.num} ${wk.home}-${wk.away}: 未知球队代码`)
    warnings++
    continue
  }
  const pair = teamPair(homeName, awayName)
  const matched = dqMatches.filter(m => teamPair(m.home, m.away) === pair && !usedDqIds.has(m.id))

  if (matched.length === 1) {
    result[wk.num] = matched[0].id
    usedDqIds.add(matched[0].id)
  } else if (matched.length > 1) {
    // 优先选主客队顺序一致的
    const exact = matched.find(m => m.home === homeName && m.away === awayName)
    const chosen = exact || matched[0]
    result[wk.num] = chosen.id
    usedDqIds.add(chosen.id)
    console.warn(`num=${wk.num} ${wk.home}-${wk.away}: 多个匹配，选 ${chosen.id} (${chosen.home} vs ${chosen.away})`)
    warnings++
  } else {
    console.warn(`num=${wk.num} ${wk.home}-${wk.away} (${homeName}-${awayName}): 未找到匹配`)
    warnings++
  }
}

// 淘汰赛
const knockoutIds = {
  73:"54327932",74:"54327935",75:"54327933",76:"54327934",
  77:"54327937",78:"54327936",79:"54327939",80:"54327940",
  81:"54327943",82:"54327941",83:"54327945",84:"54327944",
  85:"54327946",86:"54328013",87:"54327947",88:"54328012",
  89:"54328018",90:"54328017",91:"54328019",92:"54328020",
  93:"54328021",94:"54328022",95:"54328023",96:"54328024",
  97:"54328025",98:"54328026",99:"54328027",100:"54328028",
  101:"54328029",102:"54328030",103:"54328032",104:"54328033",
}
Object.assign(result, knockoutIds)

console.log('\nexport const dqMatchIdMap = {')
Object.keys(result).sort((a,b) => Number(a) - Number(b)).forEach(k => {
  console.log(`  ${k}: "${result[k]}",`)
})
console.log('}')
console.log(`\n// Total: ${Object.keys(result).length} mappings, Warnings: ${warnings}`)
