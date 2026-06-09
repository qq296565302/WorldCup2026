import fs from 'fs';
import https from 'https';

const idToCode = {
  '1278': 'MEX', '1181': 'KOR', '1753': 'RSA', '453': 'CZE',
  '303': 'CAN', '1931': 'SUI', '1542': 'QAT', '219': 'BIH',
  '269': 'BRA', '1289': 'MAR', '1683': 'SCO', '916': 'HAI',
  '2008': 'USA', '87': 'AUS', '1405': 'PAR', '1977': 'TUR',
  '868': 'GER', '510': 'ECU', '454': 'CIV', '1332': 'CUW',
  '1331': 'NED', '1146': 'JPN', '1941': 'TUN', '1904': 'SWE',
  '203': 'BEL', '986': 'IRN', '511': 'EGY', '1341': 'NZL',
  '1869': 'ESP', '2026': 'URU', '1640': 'KSA', '304': 'CPV',
  '789': 'FRA', '1684': 'SEN', '1389': 'NOR', '987': 'IRQ',
  '67': 'ARG', '108': 'AUT', '13': 'DZA', '1147': 'JOR',
  '1540': 'POR', '364': 'COL', '2027': 'UZB', '366': 'COD',
  '627': 'ENG', '396': 'CRO', '1393': 'PAN', '869': 'GHA'
};

const codeToGroup = {
  MEX: 'A', RSA: 'A', KOR: 'A', CZE: 'A',
  CAN: 'B', SUI: 'B', BIH: 'B', QAT: 'B',
  BRA: 'C', MAR: 'C', SCO: 'C', HAI: 'C',
  USA: 'D', TUR: 'D', PAR: 'D', AUS: 'D',
  GER: 'E', ECU: 'E', CIV: 'E', CUW: 'E',
  NED: 'F', SWE: 'F', JPN: 'F', TUN: 'F',
  BEL: 'G', EGY: 'G', IRN: 'G', NZL: 'G',
  ESP: 'H', KSA: 'H', URU: 'H', CPV: 'H',
  FRA: 'I', SEN: 'I', NOR: 'I', IRQ: 'I',
  ARG: 'J', AUT: 'J', DZA: 'J', JOR: 'J',
  POR: 'K', COL: 'K', UZB: 'K', COD: 'K',
  ENG: 'L', CRO: 'L', GHA: 'L', PAN: 'L'
};

const typeMap = {
  '主教练': 'head_coach',
  '助理教练': 'assistant_coach',
  '守门员教练': 'gk_coach',
  '体能教练': 'fitness_coach',
  'goalkeeper': '门将',
  'defender': '后卫',
  'midfielder': '中场',
  'attacker': '前锋'
};

function fetchTeam(teamId) {
  return new Promise((resolve, reject) => {
    const url = `https://pc.dongqiudi.com/sport-data/soccer/biz/dqd/v1/team/member_v2/${teamId}?app=dqd`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseStatistic(stat) {
  if (!stat || !Array.isArray(stat)) return {};
  const result = {};
  for (const item of stat) {
    for (const [key, value] of Object.entries(item)) {
      result[key] = value;
    }
  }
  return result;
}

async function main() {
  const teamIds = Object.keys(idToCode);
  const allData = {};

  for (let i = 0; i < teamIds.length; i++) {
    const tid = teamIds[i];
    const code = idToCode[tid];
    try {
      const data = await fetchTeam(tid);
      if (data.code === 0 && data.data && data.data.list) {
        const coaches = [];
        const players = [];

        for (const group of data.data.list) {
          for (const person of group.data) {
            if (group.type === 'coach') {
              coaches.push({
                personId: person.person_id,
                name: person.person_name,
                nameEn: person.person_en_name || '',
                type: person.type,
                nationality: person.nationality_name,
                age: parseInt(person.age) || 0,
                logo: person.person_logo || ''
              });
            } else {
              const posZh = typeMap[person.type] || person.type;
              const stats = parseStatistic(person.statistic);
              players.push({
                personId: person.person_id,
                name: person.person_name,
                nameEn: person.person_en_name || '',
                position: posZh,
                number: person.shirtnumber ? parseInt(person.shirtnumber) : 0,
                age: parseInt(person.age) || 0,
                club: person.nationality_name || '',
                logo: person.person_logo,
                isCaptain: !!person.captain_logo,
                statistic: stats
              });
            }
          }
        }

        const posOrder = { '门将': 0, '后卫': 1, '中场': 2, '前锋': 3 };
        players.sort((a, b) => {
          const pa = posOrder[a.position] ?? 4;
          const pb = posOrder[b.position] ?? 4;
          if (pa !== pb) return pa - pb;
          return (a.number || 99) - (b.number || 99);
        });

        allData[code] = { coaches, players };
        console.log(`[${i + 1}/${teamIds.length}] ${code} (${tid}): coaches=${coaches.length}, players=${players.length}`);
      } else {
        console.log(`[${i + 1}/${teamIds.length}] ${code} (${tid}): API error`);
        allData[code] = { coaches: [], players: [] };
      }
    } catch (e) {
      console.log(`[${i + 1}/${teamIds.length}] ${code} (${tid}): fetch error ${e.message}`);
      allData[code] = { coaches: [], players: [] };
    }
    if (i < teamIds.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  const esc = (s) => (s || '').replace(/'/g, "\\'");

  let output = `// 2026 美加墨世界杯各队球员和教练数据\n// 数据来源：懂球帝 API (dongqiudi.com)\n// 更新时间：${new Date().toISOString().split('T')[0]}\n\nexport const squads = {\n`;

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  for (const g of groups) {
    const groupTeams = Object.entries(allData).filter(([code]) => codeToGroup[code] === g);
    if (groupTeams.length === 0) continue;
    output += `\n  // ${g} 组\n`;
    for (const [code, data] of groupTeams) {
      output += `  ${code}: {\n`;
      output += `    coaches: [\n`;
      for (const c of data.coaches) {
        const logoStr = c.logo ? `, logo: '${esc(c.logo)}'` : '';
        output += `      { personId: '${esc(c.personId)}', name: '${esc(c.name)}', nameEn: '${esc(c.nameEn)}', type: '${esc(c.type)}', nationality: '${esc(c.nationality)}', age: ${c.age}${logoStr} },\n`;
      }
      output += `    ],\n`;
      output += `    players: [\n`;
      for (const p of data.players) {
        const statStr = Object.keys(p.statistic).length > 0
          ? `, statistic: ${JSON.stringify(p.statistic)}`
          : '';
        const logoStr = p.logo ? `, logo: '${esc(p.logo)}'` : '';
        const captainStr = p.isCaptain ? ', isCaptain: true' : '';
        output += `      { personId: '${esc(p.personId)}', name: '${esc(p.name)}', nameEn: '${esc(p.nameEn)}', position: '${esc(p.position)}', number: ${p.number}, age: ${p.age}, club: '${esc(p.club)}'${captainStr}${logoStr}${statStr} },\n`;
      }
      output += `    ]\n`;
      output += `  },\n`;
    }
  }

  output += `}\n\n`;
  output += `// 根据队伍 ID 获取阵容\nexport const getSquadByTeamId = (teamId) => {\n  if (!teamId) return null\n  return squads[teamId.toUpperCase()] || null\n}\n\n`;
  output += `// 根据 personId 查找球员\nexport const getPlayerByPersonId = (personId) => {\n  if (!personId) return null\n  for (const squad of Object.values(squads)) {\n    const player = squad.players.find(p => p.personId === personId)\n    if (player) return player\n  }\n  return null\n}\n\n`;
  output += `// 根据 personId 查找球员所属队伍\nexport const getTeamByPersonId = (personId) => {\n  if (!personId) return null\n  for (const [teamId, squad] of Object.entries(squads)) {\n    const player = squad.players.find(p => p.personId === personId)\n    if (player) return teamId\n  }\n  return null\n}\n`;

  fs.writeFileSync('d:\\KaKaRoot\\WorldCup2026\\src\\data\\squads.js', output, 'utf8');
  const totalPlayers = Object.values(allData).reduce((s, d) => s + d.players.length, 0);
  const totalCoaches = Object.values(allData).reduce((s, d) => s + d.coaches.length, 0);
  console.log(`\nDone! ${totalCoaches} coaches, ${totalPlayers} players across 48 teams`);
}

main();
