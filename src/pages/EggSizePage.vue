<script setup>
import '../styles/tool-pages.css'

defineProps({
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

    <section class="result-card share-poster-target" :class="{ 'share-capture-card': sharingCapture }">
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




.dataset-value {
  font-weight: 800;
}

.page-hero__meta {
  margin: 0;
  line-height: 1.7;
  font-size: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}



.share-query-wrap {
  margin-bottom: 10px;
}

.egg-size-page .result-card.share-poster-target.share-capture-card.theme-dark {
  background: #2f394b !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.share-capture-card.theme-dark .share-query-meta,
.share-capture-card.theme-dark .result-item,
.share-capture-card.theme-dark .exact-item {
  background: rgba(148, 163, 184, 0.18) !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.share-capture-card.theme-dark .share-query-meta {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.share-query-item-line {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-soft, #5f5d72);
  font-weight: 700;
}

.other-block {
  margin-top: 12px;
}

.result-list {
  display: grid;
  gap: 12px;
}

.result-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
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

.meta {
  color: #7c7498;
}

.right {
  display: grid;
  gap: 8px;
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

@media (min-width: 860px) {
  .size-hero-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .result-item {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
  }
}
</style>
