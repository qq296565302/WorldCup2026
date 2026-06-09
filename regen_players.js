// 批量抓取懂球帝球员详情数据，保存为本地 JS 文件
import fs from 'fs';
import https from 'https';
import vm from 'vm';

// 读取 squads.js 获取所有 personId
const squadsContent = fs.readFileSync('d:\\KaKaRoot\\WorldCup2026\\src\\data\\squads.js', 'utf8');

// 提取所有 personId
const personIdRegex = /personId:\s*'(\d+)'/g;
const personIds = new Set();
let match;
while ((match = personIdRegex.exec(squadsContent)) !== null) {
  personIds.add(match[1]);
}

console.log(`共找到 ${personIds.size} 个 personId`);

function fetchPage(personId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.dongqiudi.com/player/${personId}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.dongqiudi.com/'
      }
    }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const newUrl = loc.startsWith('http') ? loc : `https://www.dongqiudi.com${loc}`;
        https.get(newUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        }, (res2) => {
          let body = '';
          res2.on('data', chunk => body += chunk);
          res2.on('end', () => resolve(body));
        }).on('error', reject);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function extractNuxtData(html) {
  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*(.+?)<\/script>/s);
  if (!nuxtMatch) return null;

  const nuxtCode = nuxtMatch[1].trim();
  const context = vm.createContext({ console, Date, Math, Array, Object, String, Number, Boolean, RegExp, JSON, parseInt, parseFloat, isNaN, isFinite, NaN: NaN, Infinity: Infinity });
  const nuxtData = vm.runInContext(nuxtCode, context);

  const data = nuxtData?.data?.[0];
  if (!data) return null;

  const baseInfo = data.detail?.base_info || {};
  const ability = data.ability || null;

  // statsRaw 可能是对象（keyed by category like 'total'）或数组
  let statsRawArr = [];
  if (Array.isArray(data.statsRaw)) {
    statsRawArr = data.statsRaw;
  } else if (data.statsRaw && typeof data.statsRaw === 'object') {
    // statsRaw = { total: [...], category1: [...], ... }
    // 取第一个 key 对应的数组（通常是 total）
    const keys = Object.keys(data.statsRaw);
    if (keys.length > 0) {
      const firstVal = data.statsRaw[keys[0]];
      if (Array.isArray(firstVal)) {
        statsRawArr = firstVal;
      }
    }
  }

  const recentMatches = Array.isArray(data.recentMatches) ? data.recentMatches : [];
  const honorInfo = Array.isArray(data.detail?.honor_info) ? data.detail.honor_info : [];
  const transferInfo = Array.isArray(data.detail?.transfer_info) ? data.detail.transfer_info : [];
  const injuryInfo = Array.isArray(data.detail?.injury_info) ? data.detail.injury_info : [];

  return {
    baseInfo: {
      personId: baseInfo.person_id,
      name: baseInfo.person_name,
      nameEn: baseInfo.person_en_name,
      logo: baseInfo.person_logo,
      nationality: baseInfo.nationality,
      nationalityLogo: baseInfo.nationality_logo,
      dateOfBirth: baseInfo.date_of_birth,
      height: baseInfo.height,
      weight: baseInfo.weight,
      foot: baseInfo.foot,
      position: baseInfo.position,
      age: baseInfo.age,
      teamInfo: baseInfo.team_info ? {
        teamId: baseInfo.team_info.team_id,
        teamName: baseInfo.team_info.team_name,
        teamLogo: baseInfo.team_info.team_logo,
        shirtNumber: baseInfo.team_info.shirtnumber,
        role: baseInfo.team_info.role
      } : null,
      marketValue: baseInfo.market_value,
      weeklySalary: baseInfo.weekly_salary,
      contract: baseInfo.contract
    },
    ability: ability ? {
      radar: ability.redar || [],
      attrs: ability.attrs || [],
      fields: ability.fields || [],
      footInfo: ability.foot_info || null,
      goodPos: ability.good_pos || null,
      starBar: ability.star_bar || [],
      version: ability.version || ''
    } : null,
    // 赛季统计：每个赛季的球队、出场、进球等
    careerStats: statsRawArr.map(s => ({
      season: s.season ? s.season.name : '',
      team: s.team ? s.team.short_name || s.team.name : '',
      teamLogo: s.team ? s.team.logo : '',
      teamType: s.team ? s.team.type || '' : '',
      stats: (s.list || []).reduce((acc, item) => {
        acc[item.title] = item.value;
        return acc;
      }, {}),
      transferDate: s.transfer_date || ''
    })),
    recentMatches: recentMatches.slice(0, 10).map(m => ({
      matchId: m.matchId,
      date: m.date,
      competition: m.competition,
      homeName: m.homeName,
      awayName: m.awayName,
      teamScore: m.teamScore,
      opponentScore: m.opponentScore,
      result: m.result
    })),
    honorInfo: honorInfo.map(h => ({
      honor_id: h.honor_id,
      name: h.name,
      logo: h.logo,
      times: h.times
    })),
    // 完整转会信息
    transferInfo: transferInfo.map(t => ({
      type: t.type || '',
      date: t.announced_date || '',
      fromClub: t.from_club_name || '',
      fromLogo: t.from_team_logo || '',
      toClub: t.to_club_name || '',
      toLogo: t.to_team_logo || '',
      fee: t.money || '',
      description: t.description || ''
    })),
    // 伤病信息
    injuryInfo: injuryInfo.map(i => ({
      teamName: i.team_name || '',
      type: i.type || '',
      startDate: i.start_date || '',
      endDate: i.end_date || ''
    }))
  };
}

async function main() {
  const ids = [...personIds];
  const allPlayers = {};
  let success = 0;
  let fail = 0;

  for (let i = 0; i < ids.length; i++) {
    const pid = ids[i];
    try {
      const html = await fetchPage(pid);
      const data = extractNuxtData(html);
      if (data && data.baseInfo) {
        allPlayers[pid] = data;
        success++;
        console.log(`[${i + 1}/${ids.length}] OK ${pid} ${data.baseInfo.name}`);
      } else {
        fail++;
        console.log(`[${i + 1}/${ids.length}] SKIP ${pid} - no data`);
      }
    } catch (e) {
      fail++;
      console.log(`[${i + 1}/${ids.length}] ERR ${pid} - ${e.message}`);
    }
    // 间隔 500ms 避免被封
    if (i < ids.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n抓取完成: 成功 ${success}, 失败 ${fail}`);

  // 生成 JS 文件
  const esc = (s) => {
    if (s == null) return '';
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  };

  let output = `// 2026 美加墨世界杯球员详情数据\n// 数据来源：懂球帝 (dongqiudi.com)\n// 更新时间：${new Date().toISOString().split('T')[0]}\n\nexport const playerDetails = {\n`;

  const pids = Object.keys(allPlayers).sort();
  for (const pid of pids) {
    const p = allPlayers[pid];
    const bi = p.baseInfo;
    output += `  '${pid}': {\n`;
    output += `    baseInfo: {\n`;
    output += `      personId: '${esc(bi.personId)}',\n`;
    output += `      name: '${esc(bi.name)}',\n`;
    output += `      nameEn: '${esc(bi.nameEn)}',\n`;
    output += `      logo: '${esc(bi.logo)}',\n`;
    output += `      nationality: '${esc(bi.nationality)}',\n`;
    output += `      nationalityLogo: '${esc(bi.nationalityLogo)}',\n`;
    output += `      dateOfBirth: '${esc(bi.dateOfBirth)}',\n`;
    output += `      height: ${bi.height || 0},\n`;
    output += `      weight: ${bi.weight || 0},\n`;
    output += `      foot: '${esc(bi.foot)}',\n`;
    output += `      position: '${esc(bi.position)}',\n`;
    output += `      age: ${parseInt(bi.age) || 0},\n`;
    if (bi.teamInfo) {
      output += `      teamInfo: {\n`;
      output += `        teamId: '${esc(bi.teamInfo.teamId)}',\n`;
      output += `        teamName: '${esc(bi.teamInfo.teamName)}',\n`;
      output += `        teamLogo: '${esc(bi.teamInfo.teamLogo)}',\n`;
      output += `        shirtNumber: ${bi.teamInfo.shirtNumber || 0},\n`;
      output += `        role: '${esc(bi.teamInfo.role)}'\n`;
      output += `      },\n`;
    } else {
      output += `      teamInfo: null,\n`;
    }
    output += `      marketValue: '${esc(bi.marketValue)}',\n`;
    output += `      weeklySalary: '${esc(bi.weeklySalary)}',\n`;
    output += `      contract: '${esc(bi.contract)}'\n`;
    output += `    },\n`;

    // ability
    if (p.ability) {
      const ab = p.ability;
      output += `    ability: {\n`;
      output += `      radar: ${JSON.stringify(ab.radar)},\n`;
      output += `      attrs: ${JSON.stringify(ab.attrs)},\n`;
      output += `      fields: ${JSON.stringify(ab.fields)},\n`;
      output += `      footInfo: ${JSON.stringify(ab.footInfo)},\n`;
      output += `      goodPos: ${JSON.stringify(ab.goodPos)},\n`;
      output += `      starBar: ${JSON.stringify(ab.starBar)},\n`;
      output += `      version: '${esc(ab.version)}'\n`;
      output += `    },\n`;
    } else {
      output += `    ability: null,\n`;
    }

    // careerStats
    output += `    careerStats: ${JSON.stringify(p.careerStats)},\n`;

    // recentMatches
    output += `    recentMatches: ${JSON.stringify(p.recentMatches)},\n`;

    // honorInfo
    output += `    honorInfo: ${JSON.stringify(p.honorInfo)},\n`;

    // transferInfo
    output += `    transferInfo: ${JSON.stringify(p.transferInfo)},\n`;

    // injuryInfo
    output += `    injuryInfo: ${JSON.stringify(p.injuryInfo)}\n`;

    output += `  },\n`;
  }

  output += `}\n\n`;

  output += `// 根据 personId 获取球员详情\nexport const getPlayerDetailById = (personId) => {\n`;
  output += `  if (!personId) return null\n`;
  output += `  return playerDetails[String(personId)] || null\n`;
  output += `}\n`;

  fs.writeFileSync('d:\\KaKaRoot\\WorldCup2026\\src\\data\\players.js', output, 'utf8');
  console.log(`\n已保存到 src/data/players.js (${(Buffer.byteLength(output) / 1024).toFixed(0)} KB)`);
}

main();
