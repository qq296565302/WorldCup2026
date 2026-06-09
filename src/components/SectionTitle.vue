<script setup>
defineProps({
  title: { type: String, required: true },
  accent: { type: Boolean, default: false },
  color: { type: String, default: 'var(--wc-primary)' }
})
</script>

<template>
  <h3 class="section-title" :class="{ 'has-accent': accent }">
    <span v-if="accent" class="accent-bar" :style="{ background: color }"></span>
    {{ title }}
  </h3>
</template>

<style scoped>
.section-title {
  font-size: var(--wc-font-size-xl);
  font-weight: var(--wc-font-weight-semibold);
  color: var(--wc-text-primary);
  margin: 0 0 var(--wc-space-lg);
  padding-bottom: var(--wc-space-sm);
  display: inline-block;
}

.has-accent {
  position: relative;
  padding-left: var(--wc-space-md);
}

.accent-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  border-radius: 2px;
}
</style>
