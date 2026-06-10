<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  message: { type: String, required: true },
  icon: { type: String, default: null },
  actionText: { type: String, default: null },
  actionTo: { type: String, default: null }
})

const emit = defineEmits(['action'])
const router = useRouter()

const handleAction = () => {
  if (props.actionTo) {
    router.push(props.actionTo)
  } else {
    emit('action')
  }
}
</script>

<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <p class="empty-message">{{ message }}</p>
    <button
      v-if="actionText"
      class="empty-action"
      @click="handleAction"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--wc-space-5xl) var(--wc-space-xl);
  color: var(--wc-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--wc-space-lg);
}

.empty-message {
  font-size: var(--wc-font-size-base);
  text-align: center;
}

.empty-action {
  margin-top: var(--wc-space-lg);
  padding: var(--wc-space-sm) var(--wc-space-xl);
  background: var(--wc-primary);
  color: white;
  border: none;
  border-radius: var(--wc-radius-md);
  font-size: var(--wc-font-size-base);
  cursor: pointer;
  transition: background var(--wc-transition-fast);
  min-height: 44px;
}

.empty-action:active {
  background: var(--wc-primary-dark);
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
}
</style>
