<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: '赛程', icon: 'calendar' },
  { path: '/my-matches', label: '我的', icon: 'star' },
  { path: '/teams', label: '队伍', icon: 'team' },
  { path: '/standings', label: '积分榜', icon: 'chart' }
]

const activeTab = computed(() => {
  if (route.path.startsWith('/team') || route.path.startsWith('/player')) return '/teams'
  if (route.path.startsWith('/match')) return '/'
  if (route.path.startsWith('/my-matches')) return '/my-matches'
  return route.path
})

const navigate = (path) => {
  router.push(path)
}
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="page-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <nav class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: activeTab === tab.path }"
        @click="navigate(tab.path)"
      >
        <div class="tab-icon-wrap">
          <svg v-if="tab.icon === 'calendar'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <svg v-else-if="tab.icon === 'star'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <svg v-else-if="tab.icon === 'team'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <svg v-else-if="tab.icon === 'chart'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span class="active-dot" v-if="activeTab === tab.path"></span>
        </div>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* 页面过渡动画 */
.page-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 底部导航栏 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--wc-tab-bar-height);
  background: rgba(15, 25, 35, 0.9);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
  max-width: var(--wc-max-width);
  margin: 0 auto;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  color: var(--wc-text-muted);
  transition: color 0.2s ease;
  min-height: 44px;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: var(--wc-primary);
}

.tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.tab-icon {
  width: 22px;
  height: 22px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-item.active .tab-icon {
  transform: scale(1.15) translateY(-1px);
}

/* 活跃指示点 */
.active-dot {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--wc-primary);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--wc-primary-glow);
  animation: dotAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dotAppear {
  from {
    transform: translateX(-50%) scale(0);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

.tab-label {
  font-size: 10px;
  margin-top: 3px;
  font-weight: var(--wc-font-weight-medium);
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.tab-item.active .tab-label {
  font-weight: var(--wc-font-weight-bold);
  color: var(--wc-primary);
}
</style>
