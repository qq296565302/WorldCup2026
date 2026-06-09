<script setup>
defineProps({
  message: { type: String, default: '加载中...' },
  color: { type: String, default: null },
  size: { type: String, default: 'md' }
})
</script>

<template>
  <div class="loading-state">
    <div
      class="spinner"
      :class="[`spinner-${size}`]"
      :style="color ? { borderTopColor: color } : {}"
    ></div>
    <p class="loading-text">{{ message }}</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--wc-space-5xl) var(--wc-space-xl);
  color: var(--wc-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--wc-border);
  border-top-color: var(--wc-primary);
  border-radius: var(--wc-radius-full);
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-lg {
  width: 40px;
  height: 40px;
}

.loading-text {
  margin-top: var(--wc-space-md);
  font-size: var(--wc-font-size-base);
}
</style>
