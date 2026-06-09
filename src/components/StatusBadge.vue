<script setup>
import { computed } from 'vue'
import { getMatchStatusText } from '../utils/helpers'

const props = defineProps({
  status: { type: String, required: true },
  variant: { type: String, default: 'light' }
})

const statusClass = computed(() => {
  const s = props.status
  if (['live', '1H', '2H', 'HT', 'ET', 'P'].includes(s)) return 'status-live'
  if (['finished', 'FT'].includes(s)) return 'status-finished'
  return 'status-scheduled'
})

const statusText = computed(() => getMatchStatusText(props.status))
</script>

<template>
  <span
    class="status-badge"
    :class="[statusClass, `variant-${variant}`]"
  >
    {{ statusText }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px var(--wc-space-sm);
  border-radius: var(--wc-radius-full);
  font-size: var(--wc-font-size-xs);
  white-space: nowrap;
}

/* 浅色变体（用于浅色背景） */
.variant-light.status-scheduled {
  background: var(--wc-gray-100);
  color: var(--wc-text-secondary);
}

.variant-light.status-live {
  background: var(--wc-primary-light);
  color: var(--wc-primary);
  animation: pulse 2s infinite;
}

.variant-light.status-finished {
  background: var(--wc-accent-light);
  color: var(--wc-accent);
}

/* 实心变体（用于深色背景） */
.variant-solid.status-scheduled {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.variant-solid.status-live {
  background: var(--wc-primary);
  color: white;
  animation: pulse 2s infinite;
}

.variant-solid.status-finished {
  background: var(--wc-accent);
  color: white;
}
</style>
