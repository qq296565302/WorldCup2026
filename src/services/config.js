// 判断是否为开发环境
const isDev = import.meta.env.DEV

// API 配置
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

  // wheniskickoff.com 数据源（开发环境走代理）
  wheniskickoff: {
    baseUrl: isDev ? '/api/wheniskickoff' : 'https://wheniskickoff.com/data/v1',
    endpoints: {
      matches: '/matches.json',
      teams: '/teams.json',
      groups: '/groups.json',
      venues: '/venues.json'
    }
  },

  // 懂球帝数据源（开发环境走代理）
  dongqiudi: {
    baseUrl: isDev ? '/api/dongqiudi' : 'https://www.dongqiudi.com',
    endpoints: {
      matchDetail: '/magicball/v1/match/app/detail',
      matchOverview: '/api/data/overview/match',
      matchLineup: '/sport-data/soccer/biz/dqd/v1/match/lineup',
      matchAnalysis: '/api/data/match/pre_analysis_v1'
    }
  },

  // TheSportsDB（开发环境走代理）
  theSportsDb: {
    baseUrl: isDev ? '/api/thesportsdb' : 'https://www.thesportsdb.com/api/v1/json/3',
    worldCupLeagueId: '4429',
    endpoints: {
      allTeams: '/lookup_all_teams.php',
      team: '/lookupteam.php',
      player: '/lookupplayer.php',
      eventsSeason: '/eventsseason.php',
      searchPlayer: '/searchplayers.php'
    }
  }
}
