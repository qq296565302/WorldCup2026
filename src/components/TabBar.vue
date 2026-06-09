<script setup>
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
  color: { type: String, default: 'var(--wc-primary)' },
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['update:active'])
</script>

<template>
  <div class="tab-bar" :class="[`size-${size}`]">
    <div class="tab-scroll">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: active === tab.key }"
        :style="active === tab.key ? { background: color, borderColor: color } : {}"
        @click="emit('update:active', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  background: var(--wc-surface);
  border-bottom: 1px solid var(--wc-border);
  padding: var(--wc-space-sm) 0;
}

.tab-scroll {
  display: flex;
  overflow-x: auto;
  padding: 0 var(--wc-space-md);
  gap: var(--wc-space-sm);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  flex-shrink: 0;
  padding: var(--wc-space-sm) var(--wc-space-lg);
  border-radius: var(--wc-radius-2xl);
  border: 1px solid var(--wc-border);
  background: var(--wc-surface);
  color: var(--wc-text-secondary);
  font-size: var(--wc-font-size-md);
  cursor: pointer;
  transition: all var(--wc-transition-fast);
  white-space: nowrap;
  min-height: 36px;
}

.tab-btn.active {
  color: white;
  border-color: transparent;
}

.size-sm .tab-btn {
  padding: var(--wc-space-xs) var(--wc-space-md);
  font-size: var(--wc-font-size-sm);
  min-height: 32px;
}
</style>
