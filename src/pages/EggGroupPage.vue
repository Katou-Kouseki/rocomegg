<script setup>
import { Refresh, Search } from '@element-plus/icons-vue'
import '../styles/tool-pages.css'

const emit = defineEmits([
  'update:groupKeyword',
  'update:groupStage',
  'reset',
  'search'
])

defineProps({
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

            <div class="empty-state__title">请输入精灵名称或选择蛋组后点击查询</div>

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
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding-top: 2px;
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

.group-item {
  display: grid;
  gap: 10px;
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
}
</style>
