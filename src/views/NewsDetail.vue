<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticleDetail } from '../services'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const articleId = Number(route.params.id)

const article = ref(null)
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const data = await getArticleDetail(articleId)
    if (data) {
      article.value = data
    } else {
      error.value = true
    }
  } catch (e) {
    console.error('文章加载失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="news-detail-page">
    <PageHeader
      :title="article?.title || '资讯详情'"
      gradient="secondary"
      show-back
      @back="goBack"
    />

    <div class="page-body">
      <LoadingState v-if="loading" message="加载中..." />

      <EmptyState
        v-else-if="error || !article"
        message="文章加载失败"
        icon="📄"
      />

      <article v-else class="article-content">
        <!-- 文章元信息 -->
        <div class="article-meta">
          <span class="meta-source" v-if="article.source">{{ article.source }}</span>
          <span class="meta-time">{{ article.publishedAt }}</span>
          <span class="meta-category" v-if="article.category">{{ article.category }}</span>
        </div>

        <!-- 文章正文 -->
        <div class="article-body" v-html="article.body"></div>

        <!-- 相关标签 -->
        <div class="article-tags" v-if="article.channels?.length">
          <span class="tag-label">相关</span>
          <span
            v-for="ch in article.channels"
            :key="ch.entityId"
            class="tag-item"
            @click="ch.entityId && router.push(`/team/${ch.entityId.replace('5000', '')}`)"
          >{{ ch.tag }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.page-body {
  padding: var(--wc-space-lg);
}

.article-content {
  background: var(--wc-surface);
  border: 1px solid var(--wc-border);
  border-radius: var(--wc-radius-lg);
  padding: var(--wc-space-lg);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  margin-bottom: var(--wc-space-lg);
  padding-bottom: var(--wc-space-md);
  border-bottom: 1px solid var(--wc-border);
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
}

.meta-source {
  color: var(--wc-primary);
  font-weight: var(--wc-font-weight-semibold);
}

.meta-category {
  background: var(--wc-primary-light);
  color: var(--wc-primary);
  padding: 2px 8px;
  border-radius: var(--wc-radius-sm);
  font-size: var(--wc-font-size-xs);
}

/* 文章正文样式 */
.article-body {
  font-size: var(--wc-font-size-base);
  line-height: 1.8;
  color: var(--wc-text-primary);
  word-break: break-word;
}

.article-body :deep(p) {
  margin: 0 0 var(--wc-space-md) 0;
}

.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--wc-radius-md);
  margin: var(--wc-space-sm) 0;
  display: block;
}

.article-body :deep(img.face) {
  display: inline;
  width: 20px;
  height: 20px;
  vertical-align: middle;
  margin: 0 2px;
  border-radius: 0;
}

.article-body :deep(span) {
  white-space: pre-wrap;
}

.article-body :deep(a) {
  color: var(--wc-primary);
  text-decoration: none;
}

.article-body :deep(strong),
.article-body :deep(b) {
  font-weight: var(--wc-font-weight-bold);
}

.article-body :deep(blockquote) {
  margin: var(--wc-space-md) 0;
  padding: var(--wc-space-sm) var(--wc-space-md);
  border-left: 3px solid var(--wc-primary);
  background: var(--wc-primary-light);
  border-radius: 0 var(--wc-radius-sm) var(--wc-radius-sm) 0;
  color: var(--wc-text-secondary);
}

/* 相关标签 */
.article-tags {
  display: flex;
  align-items: center;
  gap: var(--wc-space-sm);
  margin-top: var(--wc-space-xl);
  padding-top: var(--wc-space-md);
  border-top: 1px solid var(--wc-border);
  flex-wrap: wrap;
}

.tag-label {
  font-size: var(--wc-font-size-xs);
  color: var(--wc-text-muted);
  flex-shrink: 0;
}

.tag-item {
  font-size: var(--wc-font-size-xs);
  padding: 4px 10px;
  border-radius: var(--wc-radius-sm);
  background: var(--wc-bg);
  border: 1px solid var(--wc-border);
  color: var(--wc-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-item:active {
  transform: scale(0.95);
  background: var(--wc-primary-light);
  color: var(--wc-primary);
  border-color: var(--wc-primary);
}
</style>
