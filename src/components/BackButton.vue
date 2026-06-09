<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  color: { type: String, default: 'white' },
  to: { type: String, default: null }
})

const emit = defineEmits(['click'])
const router = useRouter()

const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  } else {
    router.back()
  }
  emit('click')
}
</script>

<template>
  <button class="back-btn" @click="handleClick" :style="{ color }">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  </button>
</template>

<style scoped>
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--wc-space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.back-btn svg {
  width: 24px;
  height: 24px;
}
</style>
