import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '赛程' }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('../views/Teams.vue'),
    meta: { title: '队伍' }
  },
  {
    path: '/team/:id',
    name: 'TeamDetail',
    component: () => import('../views/TeamDetail.vue'),
    meta: { title: '队伍详情' }
  },
  {
    path: '/player/:id',
    name: 'PlayerDetail',
    component: () => import('../views/PlayerDetail.vue'),
    meta: { title: '球员详情' }
  },
  {
    path: '/match/:id',
    name: 'MatchDetail',
    component: () => import('../views/MatchDetail.vue'),
    meta: { title: '比赛详情' }
  },
  {
    path: '/standings',
    name: 'Standings',
    component: () => import('../views/Standings.vue'),
    meta: { title: '积分榜' }
  },
  {
    path: '/my-matches',
    name: 'MyMatches',
    component: () => import('../views/MyMatches.vue'),
    meta: { title: '我的比赛' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 2026 世界杯` : '2026 美加墨世界杯'
  next()
})

export default router
