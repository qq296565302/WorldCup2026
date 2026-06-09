<script setup>
import BackButton from './BackButton.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  gradient: { type: String, default: 'primary' },
  showBack: { type: Boolean, default: false }
})

const emit = defineEmits(['back'])
</script>

<template>
  <header class="page-header" :class="[`gradient-${gradient}`, { 'has-back': showBack }]">
    <BackButton
      v-if="showBack"
      class="header-back"
      @click="emit('back')"
    />
    <div class="header-content">
      <div class="header-decoration">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
      </div>
      <h1 class="header-title">{{ title }}</h1>
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  position: relative;
  color: white;
  padding: var(--wc-space-2xl) var(--wc-space-lg) var(--wc-space-xl);
  overflow: hidden;
}

.has-back {
  padding-left: 56px;
}

.gradient-primary {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 50%, #9b2c2c 100%);
}

.gradient-secondary {
  background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 50%, #1a4e8a 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 50%, #276749 100%);
}

.gradient-dark {
  background: linear-gradient(135deg, #2d3748 0%, #1e3a5f 50%, #0f2744 100%);
}

.header-back {
  position: absolute;
  left: var(--wc-space-md);
  top: var(--wc-space-xl);
  z-index: 2;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  font-size: var(--wc-font-size-4xl);
  font-weight: var(--wc-font-weight-black);
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-subtitle {
  font-size: var(--wc-font-size-base);
  opacity: 0.9;
  margin-top: var(--wc-space-xs);
  font-weight: var(--wc-font-weight-medium);
}

/* 装饰元素 */
.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.c1 {
  width: 120px;
  height: 120px;
  top: -30px;
  right: -20px;
}

.c2 {
  width: 80px;
  height: 80px;
  bottom: -20px;
  left: 20%;
  background: rgba(255, 255, 255, 0.05);
}

.c3 {
  width: 60px;
  height: 60px;
  top: 50%;
  right: 30%;
  background: rgba(255, 255, 255, 0.06);
}
</style>
