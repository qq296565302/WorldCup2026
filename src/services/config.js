// API 配置 — 统一走 /api/ 路径，由 Nginx 反向代理
export const API_CONFIG = {
  // 聚合数据 - 2026 美加墨世界杯 API
  juhe: {
    baseUrl: 'https://v.juhe.cn/worldcup',
    key: import.meta.env.VITE_JUHE_API_KEY || '',
    endpoints: {
      schedule: '/schedule',
      standing: '/standing',
      team: '/team',
      match: '/match'
    }
  },

  // wheniskickoff.com 数据源（通过 Nginx 代理）
  wheniskickoff: {
    baseUrl: '/api/wheniskickoff',
    endpoints: {
      matches: '/matches.json',
      teams: '/teams.json',
      groups: '/groups.json',
      venues: '/venues.json'
    }
  },

  // 懂球帝数据源（通过 Nginx 代理）
  dongqiudi: {
    baseUrl: '/api/dongqiudi',
    endpoints: {
      matchDetail: '/magicball/v1/match/app/detail',
      matchOverview: '/api/data/overview/match',
      matchLineup: '/sport-data/soccer/biz/dqd/v1/match/lineup',
      matchAnalysis: '/api/data/match/pre_analysis_v1',
      matchOdds: '/sport-data/soccer/biz/dqd/v1/match/odds/index'
    }
  },

  // TheSportsDB（通过 Nginx 代理）
  theSportsDb: {
    baseUrl: '/api/thesportsdb',
    worldCupLeagueId: '4429',
    endpoints: {
      allTeams: '/lookup_all_teams.php',
      team: '/lookupteam.php',
      player: '/lookupplayer.php',
      eventsSeason: '/eventsseason.php',
      searchPlayer: '/searchplayers.php'
    }
  },

  // 咪咕视频（通过 Nginx 代理）
  migu: {
    baseUrl: '/api/migu',
    competitionId: '10000991',
    endpoints: {
      // 赛程列表 API：获取指定赛事的全部比赛及解说信息
      matchList: '/vms-match/v6/staticcache/basic/match-list/normal-match-list'
    }
  }
}
