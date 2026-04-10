<script setup>
const props = defineProps({
  pageTitle: {
    type: String,
    default: '精灵蛋尺寸查询'
  },

  pageDescription: {
    type: String,
    default: '可进行查询精灵蛋数据，同时可进行投稿'
  },

  sharingCapture: {
    type: Boolean,
    default: false
  },
  datasetCount: {
    type: Number,
    default: 0
  },
  shinyVisualActive: {
    type: Boolean,
    default: false
  },
  diameterInput: {
    type: [String, Number],
    default: ''
  },
  weightInput: {
    type: [String, Number],
    default: ''
  },
  refreshIcon: {
    type: [Object, Function],
    default: null
  },
  searchIcon: {
    type: [Object, Function],
    default: null
  },
  searching: {
    type: Boolean,
    default: false
  },
  loadingData: {
    type: Boolean,
    default: false
  },
  hasSearched: {
    type: Boolean,
    default: false
  },
  sharingPoster: {
    type: Boolean,
    default: false
  },
  shareImageUrl: {
    type: String,
    default: ''
  },
  shareImagesReady: {
    type: Boolean,
    default: true
  },
  searchMode: {
    type: String,
    default: ''
  },
  exactResults: {
    type: Array,
    default: () => []
  },
  candidates: {
    type: Array,
    default: () => []
  },
  getCreatureImageUrl: {
    type: Function,
    default: () => ''
  }
})

const emit = defineEmits([
  'update:diameterInput',
  'update:weightInput',
  'open-survey',
  'reset',
  'search',
  'share-long-image',
  'update-share-images-ready'
])

function updateDiameterInput(value) {
  emit('update:diameterInput', value)
}

function updateWeightInput(value) {
  emit('update:weightInput', value)
}

function onImageReady() {
  emit('update-share-images-ready')
}
</script>

<template>
  <main class="panel egg-size-page">
    <section v-if="!sharingCapture" class="search-card size-hero-card">
      <div class="page-hero__content">
        <div class="page-hero__title-row">
          <h1 class="page-hero__title">{{ pageTitle }}</h1>
        </div>
        <p class="page-hero__desc">{{ pageDescription }}</p>
        <p class="page-hero__meta">
          数据个数：<span class="dataset-value">{{ datasetCount }}</span>
        </p>
      </div>
    </section>

    <section class="search-card">
      <h2>查询条件</h2>
      <el-form label-position="top" class="search-form" @submit.prevent>
        <div class="grid">
          <el-form-item label="蛋尺寸" :class="{ 'shiny-field': shinyVisualActive }">
            <el-input
              :model-value="diameterInput"
              type="number"
              step="0.001"
              placeholder="例如：0.58"
              clearable
              size="large"
              @update:model-value="updateDiameterInput"
              @keyup.enter="$emit('search')"
            />
          </el-form-item>

          <el-form-item label="蛋重量" :class="{ 'shiny-field': shinyVisualActive }">
            <el-input
              :model-value="weightInput"
              type="number"
              step="0.001"
              placeholder="例如：8.6"
              clearable
              size="large"
              @update:model-value="updateWeightInput"
              @keyup.enter="$emit('search')"
            />
          </el-form-item>
        </div>

        <div v-if="!sharingCapture" class="actions">
          <el-button class="submit-btn" size="large" @click="$emit('open-survey')">投稿数据</el-button>
          <el-button class="reset-btn" size="large" :icon="refreshIcon" @click="$emit('reset')">重置</el-button>
          <el-button
            class="query-btn"
            type="primary"
            size="large"
            :icon="searchIcon"
            :loading="searching || loadingData"
            @click="$emit('search')"
          >
            立即查询
          </el-button>
          <el-button
            v-if="hasSearched"
            class="share-btn"
            size="large"
            :loading="sharingPoster"
            :disabled="searching || loadingData || (!shareImageUrl && !shareImagesReady)"
            @click="$emit('share-long-image')"
          >
            {{ shareImageUrl ? '点击下载' : '分享长图' }}
          </el-button>
        </div>
      </el-form>
    </section>

    <section class="result-card share-poster-target">
      <div v-if="sharingCapture" class="share-query-wrap">
        <div class="sub-head">查询条件</div>
        <div class="share-query-meta">
          <p class="share-query-item-line">
            蛋尺寸：{{ String(diameterInput || '').trim() || '--' }} ｜ 蛋重量：{{ String(weightInput || '').trim() || '--' }}
          </p>
        </div>
      </div>

      <div v-if="!sharingCapture" class="result-header">
        <h2>候选精灵</h2>
        <el-tag v-if="hasSearched && searchMode === 'precise'" type="danger" effect="light" round>精准命中</el-tag>
        <el-tag v-else-if="hasSearched && searchMode === 'tolerance1'" type="warning" effect="light" round>
          容差命中（尺寸 ±0.01，重量 ±0.1）
        </el-tag>
        <el-tag v-else-if="hasSearched && searchMode === 'tolerance2'" type="warning" effect="light" round>
          容差命中（尺寸 ±0.02，重量 ±0.2）
        </el-tag>
        <el-tag v-else-if="hasSearched && searchMode === 'matched'" type="success" effect="light" round>范围命中</el-tag>
        <el-tag v-else-if="hasSearched && searchMode === 'nearest'" type="info" effect="light" round>近似候选</el-tag>
      </div>

      <el-skeleton :loading="loadingData || searching" animated :rows="5">
        <template #default>
          <div v-if="!hasSearched" class="empty">请输入蛋尺寸和蛋重量后点击查询</div>
          <div v-else-if="!exactResults.length && !candidates.length" class="empty">未查询到候选精灵</div>

          <div v-if="exactResults.length" class="exact-block">
            <div class="sub-head">
              {{
                searchMode === 'precise'
                  ? '精准命中'
                  : searchMode === 'tolerance1'
                    ? '容差命中（容差：尺寸 ±0.01，重量 ±0.1）'
                    : '容差命中（容差：尺寸 ±0.02，重量 ±0.2）'
              }}
            </div>

            <transition-group name="rank" tag="div" class="result-list">
              <article
                v-for="(item, index) in exactResults"
                :key="`exact-${item.petId}-${index}`"
                class="result-item exact-item"
              >
                <div class="left">
                  <div class="pet-row">
                    <div class="pet-avatar" v-if="getCreatureImageUrl(item.petId)">
                      <img
                        :src="getCreatureImageUrl(item.petId)"
                        :alt="item.pet"
                        loading="lazy"
                        @load="onImageReady"
                        @error="onImageReady"
                      />
                    </div>

                    <div class="pet-meta">
                      <div class="title-row">
                        <h3>{{ index + 1 }}. {{ item.pet }}</h3>
                        <span class="pet-id">#{{ item.petId }}</span>
                      </div>
                      <p>精确尺寸：{{ item.eggDiameter }} m</p>
                      <p>精确重量：{{ item.eggWeight }} kg</p>
                    </div>
                  </div>
                </div>

                <div class="right">
                  <div class="prob">{{ item.probability }}%</div>
                  <el-progress
                    :percentage="item.probability"
                    :stroke-width="10"
                    :show-text="false"
                    :color="item.color"
                  />
                </div>
              </article>
            </transition-group>
          </div>

          <div v-if="candidates.length" class="other-block">
            <div class="sub-head">{{ exactResults.length ? '其他候选' : '结果列表' }}</div>

            <transition-group name="rank" tag="div" class="result-list">
              <article
                v-for="(item, index) in candidates"
                :key="`${item.petId}-${item.pet}`"
                class="result-item"
              >
                <div class="left">
                  <div class="pet-row">
                    <div class="pet-avatar" v-if="getCreatureImageUrl(item.petId)">
                      <img
                        :src="getCreatureImageUrl(item.petId)"
                        :alt="item.pet"
                        loading="lazy"
                        @load="onImageReady"
                        @error="onImageReady"
                      />
                    </div>

                    <div class="pet-meta">
                      <div class="title-row">
                        <h3>{{ index + 1 }}. {{ item.pet }}</h3>
                        <span class="pet-id">#{{ item.petId }}</span>
                      </div>
                      <p>蛋尺寸范围：{{ item.eggDiameter }} m</p>
                      <p>蛋重量范围：{{ item.eggWeight }} kg</p>
                      <p v-if="item.matchCount > 1" class="meta">命中记录：{{ item.matchCount }} 条</p>
                    </div>
                  </div>
                </div>

                <div class="right">
                  <div class="prob">{{ item.probability }}%</div>
                  <el-progress
                    :percentage="item.probability"
                    :stroke-width="10"
                    :show-text="false"
                    :color="item.color"
                  />
                </div>
              </article>
            </transition-group>
          </div>
        </template>
      </el-skeleton>
    </section>
  </main>
</template>

<style scoped>
.panel {
  width: min(100%, 1180px);
  margin: 0 auto;
}

.egg-size-page {
  display: grid;
  gap: 18px;
}

.search-card,
.result-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 250, 255, 0.94));
  border: 1px solid rgba(148, 188, 225, 0.38);
  box-shadow:
    0 16px 40px rgba(37, 99, 235, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
}

.search-card h2,
.result-card h2 {
  margin: 0 0 12px;
  color: var(--app-primary, #2563eb);
}

.page.theme-dark .search-card:not(.size-hero-card),
.page.theme-dark .result-card {
  background: rgba(12, 25, 52, 0.72);
  border-color: rgba(96, 165, 250, 0.22);
  box-shadow:
    0 18px 36px rgba(2, 6, 23, 0.5),
    inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

.page.theme-dark .page-hero__meta,
.page.theme-dark .result-card h2,
.page.theme-dark .result-item .left h3,
.page.theme-dark .left p,
.page.theme-dark .chain-text,
.page.theme-dark .empty {
  color: #cbd5e1;
}

.page.theme-dark .result-item {
  background: #0b1220;
  border-color: rgba(96, 165, 250, 0.28);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.55);
}

.page.theme-dark .exact-item {
  background: linear-gradient(180deg, #1a2130, #121827);
  border-color: rgba(248, 113, 113, 0.55);
}

.page.theme-dark .pet-id {
  color: #bfdbfe;
  background: #172554;
  border-color: #1d4ed8;
}

.page.theme-dark :deep(.el-input__wrapper) {
  background: #020617;
  color: #e5e7eb;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2) inset !important;
}

.page.theme-dark :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.28) inset !important;
}

.page.theme-dark :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.32) inset !important;
}

.page.theme-dark :deep(.el-input__inner) {
  color: #f1f5f9;
}

.page.theme-dark :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}

.page.theme-dark :deep(.el-form-item__label) {
  color: #93c5fd !important;
}

.size-hero-card {
  border-radius: 28px;
  padding: 28px 22px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.2), transparent 32%),
    linear-gradient(135deg, rgba(30, 64, 175, 0.94), rgba(14, 116, 144, 0.92));
  border: 1px solid rgba(96, 165, 250, 0.3);
  box-shadow: 0 24px 56px rgba(30, 64, 175, 0.22);
}

.dataset-value {
  color: #f8fbff;
  font-weight: 800;
}

.page-hero__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.page-hero__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.page-hero__title {
  margin: 0;
  color: #f8fbff;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: 0.02em;
}

.page-hero__desc {
  margin: 0;
  max-width: 760px;
  color: rgba(226, 232, 240, 0.92);
  line-height: 1.75;
  font-size: 14px;
}

.page-hero__meta {
  margin: 0;
  color: rgba(226, 232, 240, 0.92);
  line-height: 1.7;
  font-size: 14px;
}

.page-hero__home-btn {
  width: fit-content;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(186, 230, 253, 0.32);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  transition: 0.2s ease;
}

.page-hero__home-btn:hover {
  transform: translateY(-1px);
  background: rgba(56, 189, 248, 0.12);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-direction: column;
  width: 100%;
}

.actions :deep(.el-button) {
  min-width: 120px;
  flex: 1 1 100%;
  width: 100%;
}

.actions :deep(.el-button + .el-button) {
  margin-left: 0 !important;
}

.query-btn {
  border-radius: 999px !important;
  border: none !important;
  padding: 12px 28px !important;
  background: linear-gradient(135deg, var(--app-primary, #3f83bd), var(--app-primary-soft, #67a9de)) !important;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
}

.reset-btn {
  border-radius: 999px !important;
  border: none !important;
  padding: 12px 26px !important;
  background: #eff6ff !important;
  color: var(--app-primary, #3f83bd) !important;
}

.submit-btn {
  border-radius: 999px !important;
  border: 1px solid #bfdbfe !important;
  padding: 12px 26px !important;
  background: #ffffff !important;
  color: var(--app-primary, #3f83bd) !important;
}

.share-btn {
  border-radius: 999px !important;
  border: 1px dashed var(--app-primary-soft, #67a9de) !important;
  padding: 12px 26px !important;
  background: var(--app-tag-bg, #eff6ff) !important;
  color: var(--app-primary, #3f83bd) !important;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 10px;
}

.share-query-wrap {
  margin-bottom: 10px;
}

.share-query-meta {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--app-item-bg, #ffffff);
  border: 1px dashed var(--app-tag-border, #bfdbfe);
}

.share-query-item-line {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-soft, #5f5d72);
  font-weight: 700;
}

.empty {
  text-align: center;
  color: var(--app-text-muted, #6a6880);
  padding: 28px 10px;
}

.sub-head {
  font-weight: 700;
  color: var(--app-primary, #3f83bd);
  margin: 8px 2px 10px;
}

.other-block {
  margin-top: 12px;
}

.result-list {
  display: grid;
  gap: 12px;
}

.result-item {
  border-radius: 16px;
  background: var(--app-item-bg, #ffffff);
  border: 1px solid rgba(148, 188, 225, 0.32);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.06);
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.exact-item {
  border: 1px solid rgba(245, 108, 108, 0.35);
  background: linear-gradient(180deg, #fff, #fff9f9);
}

.pet-row {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  align-items: center;
}

.pet-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 1px solid rgba(148, 188, 225, 0.38);
  background: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pet-meta {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.left h3 {
  margin: 0 0 8px;
  color: var(--app-text, #1a1b21);
  font-size: 18px;
}

.pet-id {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-primary, #3f83bd);
  background: var(--app-tag-bg, #eff6ff);
  border: 1px solid var(--app-tag-border, #bfdbfe);
  border-radius: 999px;
  padding: 3px 9px;
}

.left p {
  margin: 3px 0;
  color: var(--app-text-soft, #5f5d72);
  font-size: 13px;
}

.chain-text {
  margin: 2px 0 4px;
  color: var(--app-text-muted, #6a6880);
  font-size: 12px;
}

.meta {
  color: #7c7498;
}

.right {
  display: grid;
  gap: 8px;
}

.prob {
  font-size: 20px;
  font-weight: 800;
  color: var(--app-primary, #3f83bd);
}

.rank-enter-active,
.rank-leave-active {
  transition: all 0.35s ease;
}

.rank-enter-from,
.rank-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.rank-move {
  transition: transform 0.35s ease;
}

:deep(.el-form-item__label) {
  color: #1d4ed8 !important;
  font-weight: 700;
}

:deep(.el-input__wrapper) {
  border-radius: 14px;
  background: #e8e7ef;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12) inset !important;
  min-height: 42px;
  align-items: center;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.16) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) inset !important;
}

:deep(.el-input__inner) {
  height: 42px;
  line-height: 42px;
}

:deep(.el-input__inner:focus) {
  outline: none !important;
}

.shiny-field :deep(.el-form-item__label) {
  color: #38bdf8 !important;
}

@media (min-width: 860px) {
  .size-hero-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .grid {
    grid-template-columns: 1fr 1fr;
  }

  .actions {
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-end;
    gap: 12px;
  }

  .actions :deep(.el-button) {
    flex: 0 0 auto;
    width: auto;
    min-width: 132px;
  }

  .result-item {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
  }
}

@media (max-width: 640px) {
  .search-card,
  .result-card,
  .size-hero-card {
    padding: 18px;
  }

  .page-hero__title-row,
  .title-row,
  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__home-btn {
    width: 100%;
  }
}
</style>
