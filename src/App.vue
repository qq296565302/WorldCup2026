<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: '赛程', icon: 'calendar' },
  { path: '/teams', label: '队伍', icon: 'team' },
  { path: '/standings', label: '积分榜', icon: 'chart' }
]

const activeTab = computed(() => {
  if (route.path.startsWith('/team') || route.path.startsWith('/player')) return '/teams'
  if (route.path.startsWith('/match')) return '/'
  return route.path
})

const navigate = (path) => {
  router.push(path)
}
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
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
        <svg v-if="tab.icon === 'calendar'" class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
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
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--wc-tab-bar-height);
  background: var(--wc-surface);
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid var(--wc-border);
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
  transition: color var(--wc-transition-fast);
  min-height: 44px;
}

.tab-item.active {
  color: var(--wc-primary);
}

.tab-icon {
  width: 22px;
  height: 22px;
}

.tab-label {
  font-size: var(--wc-font-size-xs);
  margin-top: 2px;
}
</style>
