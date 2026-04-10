<script setup>
import { Refresh, Search } from '@element-plus/icons-vue'

const emit = defineEmits([
  'update:groupKeyword',
  'update:groupStage',
  'reset',
  'search'
])

const props = defineProps({
  pageTitle: {
    type: String,
    default: '精灵蛋蛋组查询'
  },
  groupModeHint: {
    type: String,
    default: '可单独查询精灵蛋组或者查询独自的蛋组，互斥'
  },
  groupKeyword: {
    type: String,
    default: ''
  },
  groupStage: {
    type: String,
    default: ''
  },
  groupStageOptions: {
    type: Array,
    default: () => []
  },
  groupSearching: {
    type: Boolean,
    default: false
  },
  loadingData: {
    type: Boolean,
    default: false
  },
  groupHasSearched: {
    type: Boolean,
    default: false
  },
  groupResults: {
    type: Array,
    default: () => []
  }
})

function updateGroupKeyword(value) {
  emit('update:groupKeyword', value)
}

function updateGroupStage(value) {
  emit('update:groupStage', value)
}

function onSearch() {
  emit('search')
}

function onReset() {
  emit('reset')
}
</script>

<template>
  <main class="panel tool-page">
    <section class="search-card breeding-hero-card">
      <div class="page-hero__content">
        <div class="page-hero__title-row">
          <h1 class="page-hero__title">{{ pageTitle }}</h1>
        </div>
        <p class="page-hero__desc">{{ groupModeHint }}</p>
      </div>
    </section>

    <section class="search-card">
      <div class="section-head">
        <div>
          <h2 class="section-title">查询条件</h2>
        </div>
      </div>

      <el-form label-position="top" class="search-form" @submit.prevent>
        <div class="grid">
          <el-form-item label="精灵名称">
            <el-input
              :model-value="groupKeyword"
              placeholder="请输入精灵名称"
              clearable
              size="large"
              :disabled="!!groupStage"
              @update:model-value="updateGroupKeyword"
              @keyup.enter="onSearch"
            />
          </el-form-item>

          <el-form-item label="蛋组">
            <el-select
              :model-value="groupStage"
              placeholder="请选择蛋组"
              clearable
              size="large"
              :disabled="!!groupKeyword"
              @update:model-value="updateGroupStage"
            >
              <el-option
                v-for="group in groupStageOptions"
                :key="group"
                :label="group"
                :value="group"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="actions">
          <el-button class="reset-btn" size="large" :icon="Refresh" @click="onReset">
            重置
          </el-button>
          <el-button
            class="query-btn"
            type="primary"
            size="large"
            :icon="Search"
            :loading="groupSearching || loadingData"
            @click="onSearch"
          >
            立即查询
          </el-button>
        </div>
      </el-form>
    </section>

    <section class="result-card">
      <div class="result-header">
        <h2>蛋组查询结果</h2>
        <el-tag v-if="groupHasSearched" type="success" effect="light" round>
          匹配 {{ groupResults.length }} 条
        </el-tag>
        <el-tag v-else type="info" effect="light" round>
          待查询
        </el-tag>
      </div>

      <el-skeleton :loading="groupSearching || loadingData" animated :rows="6">
        <template #default>
          <div v-if="!groupHasSearched" class="empty-state">
            <div class="empty-state__icon">✦</div>
            <div class="empty-state__title">请输入精灵名称或选择蛋组后点击查询</div>
            <p class="empty-state__desc">支持按精灵名称查询，或直接按蛋组筛选结果。</p>
          </div>

          <div v-else-if="!groupResults.length" class="empty-state">
            <div class="empty-state__icon">◌</div>
            <div class="empty-state__title">未查询到匹配结果</div>
            <p class="empty-state__desc">你可以尝试更换关键字，或者清空后重新筛选。</p>
          </div>

          <transition-group v-else name="rise" tag="div" class="group-result-list">
            <article
              v-for="item in groupResults"
              :key="item.pet"
              class="result-item group-item"
            >
              <div class="title-row">
                <h3 class="group-pet-name">{{ item.pet }}</h3>
                <span class="pet-id">蛋组 {{ item.groups?.length || 0 }} 个</span>
              </div>

              <p class="chain-text">{{ item.chain }}</p>

              <div class="group-tags">
                <el-tag
                  v-for="group in item.groups"
                  :key="`${item.pet}-${group}`"
                  effect="light"
                  round
                >
                  {{ group }}
                </el-tag>
              </div>
            </article>
          </transition-group>
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

.tool-page {
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 250, 255, 0.92));
  border: 1px solid rgba(148, 188, 225, 0.38);
  box-shadow:
    0 16px 40px rgba(37, 99, 235, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
}

.search-card h2,
.result-card h2 {
  margin: 0;
  color: var(--app-primary, #2563eb);
}

.breeding-hero-card {
  border-radius: 28px;
  padding: 28px 22px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.2), transparent 32%),
    linear-gradient(135deg, rgba(30, 64, 175, 0.94), rgba(14, 116, 144, 0.92));
  border: 1px solid rgba(96, 165, 250, 0.3);
  box-shadow: 0 24px 56px rgba(30, 64, 175, 0.22);
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

.page-hero__home-btn {
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(186, 230, 253, 0.32);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.page-hero__home-btn:hover {
  transform: translateY(-1px);
  background: rgba(56, 189, 248, 0.12);
}

.page-hero__desc {
  margin: 0;
  max-width: 760px;
  color: rgba(226, 232, 240, 0.92);
  line-height: 1.75;
  font-size: 14px;
}

.search-card,
.result-card {
  padding: 22px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding-top: 2px;
}

.section-title,
.result-header h2 {
  margin: 0;
  color: var(--app-primary, #2563eb);
  font-size: 24px;
  line-height: 1.2;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-direction: column;
  margin-top: 4px;
}

.actions :deep(.el-button) {
  width: 100%;
  margin-left: 0 !important;
}

.query-btn {
  border-radius: 999px !important;
  border: none !important;
  background: linear-gradient(135deg, #2563eb, #38bdf8) !important;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.reset-btn {
  border-radius: 999px !important;
  border: none !important;
  background: #eff6ff !important;
  color: #2563eb !important;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.empty-state {
  display: grid;
  place-items: center;
  text-align: center;
  min-height: 240px;
  padding: 20px 12px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(239, 246, 255, 0.96));
  border: 1px dashed rgba(148, 188, 225, 0.5);
}

.empty-state__icon {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.12);
  margin-bottom: 12px;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
}

.empty-state__desc {
  margin: 8px 0 0;
  max-width: 520px;
  color: #64748b;
  line-height: 1.7;
  font-size: 14px;
}

.group-result-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.result-item {
  border-radius: 20px;
  padding: 18px 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  border: 1px solid rgba(148, 188, 225, 0.32);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.06);
}

.group-item {
  display: grid;
  gap: 10px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.group-pet-name {
  margin: 0 !important;
  font-size: 18px;
  color: #1a1b21;
}

.pet-id {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 3px 9px;
  white-space: nowrap;
}

.chain-text {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rise-enter-active,
.rise-leave-active {
  transition: all 0.3s ease;
}

.rise-enter-from,
.rise-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.page.theme-dark .search-card:not(.breeding-hero-card),
.page.theme-dark .result-card {
  background: rgba(12, 25, 52, 0.72);
  box-shadow:
    0 18px 36px rgba(2, 6, 23, 0.5),
    inset 0 1px 0 rgba(148, 163, 184, 0.08);
  border-color: rgba(96, 165, 250, 0.22);
}

.page.theme-dark .search-card:not(.breeding-hero-card) h2,
.page.theme-dark .result-card h2,
.page.theme-dark .empty-state__title,
.page.theme-dark .group-pet-name,
.page.theme-dark .chain-text,
.page.theme-dark .empty-state__desc {
  color: #cbd5e1;
}

.page.theme-dark .empty-state {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(12, 25, 52, 0.82));
  border-color: rgba(96, 165, 250, 0.22);
}

.page.theme-dark .result-item {
  background: #0b1220;
  border-color: rgba(96, 165, 250, 0.28);
  box-shadow: 0 12px 28px rgba(2, 6, 23, 0.55);
}

.page.theme-dark .pet-id {
  color: #bfdbfe;
  background: #172554;
  border-color: #1d4ed8;
}

.page.theme-dark .page-hero__home-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
}

:deep(.el-form-item__label) {
  color: #1d4ed8 !important;
  font-weight: 700;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 14px;
  background: #f8fbff;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12) inset !important;
  min-height: 44px;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.18) inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.24) inset !important;
}

@media (min-width: 860px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }

  .actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .actions :deep(.el-button) {
    width: auto;
    min-width: 132px;
  }

  .group-result-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-hero__title-row,
  .title-row,
  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-hero__home-btn {
    width: 100%;
  }

  .search-card,
  .result-card,
  .breeding-hero-card {
    padding: 18px;
  }
}
</style>
