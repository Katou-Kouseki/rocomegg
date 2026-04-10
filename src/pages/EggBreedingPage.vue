<script setup>
const props = defineProps({
  pageTitle: {
    type: String,
    default: '精灵蛋繁殖查询'
  },
  hint: {
    type: String,
    default:
      '孵蛋规则：需要同蛋组精灵，并且是一公一母；孵化出来的为母系精灵。父母均为普通精灵时，小概率出现异色/炫彩精灵；父母有异色/炫彩时，蛋出现异色/炫彩概率提高。'
  },
  breedTargetName: {
    type: String,
    default: ''
  },
  forceShiny: {
    type: Boolean,
    default: false
  },
  breedSearching: {
    type: Boolean,
    default: false
  },
  loadingData: {
    type: Boolean,
    default: false
  },
  breedHasSearched: {
    type: Boolean,
    default: false
  },
  breedResult: {
    type: Object,
    default: null
  },
  breedCandidates: {
    type: Array,
    default: () => []
  },
  canEnableShinySwitch: {
    type: Function,
    default: () => false
  },
  searchIcon: {
    type: [Object, Function],
    default: null
  },
  refreshIcon: {
    type: [Object, Function],
    default: null
  },

})

const emit = defineEmits([
  'update:breedTargetName',
  'update:forceShiny',
  'reset',
  'search'
])

function updateBreedTargetName(value) {
  emit('update:breedTargetName', value)
}

function updateForceShiny(value) {
  emit('update:forceShiny', value)
}
</script>

<template>
  <main class="panel breeding-page">
    <section class="search-card breeding-hero-card">
      <div class="page-hero__content">
        <div class="page-hero__title-row">
          <h1 class="page-hero__title">{{ pageTitle }}</h1>
        </div>
        <p class="page-hero__desc">{{ hint }}</p>
      </div>
    </section>

    <section class="search-card">
      <el-form label-position="top" class="search-form" @submit.prevent>
        <div class="grid">
          <el-form-item label="目标精灵（母系）">
            <el-input
              :model-value="breedTargetName"
              placeholder="例如：魔力猫、火神、书魔虫"
              clearable
              size="large"
              @update:model-value="updateBreedTargetName"
              @keyup.enter="emit('search')"
            />
          </el-form-item>

          <el-form-item label="指定异色">
            <div class="switch-row">
              <el-switch
                :model-value="forceShiny"
                :disabled="!canEnableShinySwitch()"
                active-text="只看异色父系"
                inactive-text="全部父系"
                @update:model-value="updateForceShiny"
              />
            </div>
          </el-form-item>
        </div>

        <div class="actions">
          <el-button
            class="reset-btn"
            size="large"
            :icon="refreshIcon"
            @click="emit('reset')"
          >
            重置
          </el-button>
          <el-button
            class="query-btn"
            type="primary"
            size="large"
            :icon="searchIcon"
            :loading="breedSearching || loadingData"
            @click="emit('search')"
          >
            查询繁殖方案
          </el-button>
        </div>
      </el-form>
    </section>

    <section class="result-card">
      <div class="result-header">
        <h2>繁殖匹配结果</h2>
        <el-tag v-if="breedHasSearched" type="success" effect="light" round>
          父系候选 {{ breedCandidates.length }} 个
        </el-tag>
        <el-tag v-else type="info" effect="light" round>
          待查询
        </el-tag>
      </div>

      <el-skeleton :loading="breedSearching || loadingData" animated :rows="7">
        <template #default>
          <div v-if="!breedHasSearched" class="empty">
            输入目标精灵后，展示母系蛋组、进化链与父系候选
          </div>
          <div v-else-if="!breedResult" class="empty">未找到目标精灵</div>
          <div v-else>
            <article class="result-item group-summary group-summary-card">
              <div class="left">
                <div class="title-row">
                  <h3>母系精灵：{{ breedResult.motherPet }}</h3>
                  <span class="pet-id">孵化蛋：{{ breedResult.eggName }}</span>
                </div>
                <p>{{ Array.isArray(breedResult.chain) ? breedResult.chain.join(' → ') : '' }}</p>
                <p v-if="breedResult.blocked" class="blocked-tip">该精灵不可孵蛋</p>
              </div>
            </article>

            <div v-if="!breedCandidates.length" class="empty">没有可匹配的父系候选</div>

            <transition-group v-else name="rank" tag="div" class="group-result-list">
              <article
                v-for="item in breedCandidates"
                :key="item.fatherPet"
                class="result-item group-item"
              >
                <div class="left">
                  <div class="title-row">
                    <h3 class="group-pet-name">{{ item.fatherPet }}</h3>
                    <span class="pet-id">{{ item.isSameChain ? '同进化链' : '可配对' }}</span>
                  </div>
                  <p class="chain-text">{{ item.fatherChain }}</p>
                  <div class="group-tags">
                    <el-tag
                      v-for="group in item.fatherAllGroups"
                      :key="`${item.fatherPet}-${group}`"
                      effect="light"
                      round
                    >
                      {{ group }}
                    </el-tag>
                  </div>
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

.breeding-page {
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

.page-hero__desc {
  margin: 0;
  max-width: 760px;
  color: rgba(226, 232, 240, 0.92);
  line-height: 1.75;
  font-size: 14px;
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

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.switch-row {
  display: flex;
  align-items: center;
  min-height: 40px;
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
  background: linear-gradient(135deg, var(--app-primary, #3b82f6), var(--app-primary-soft, #60a5fa)) !important;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
}

.reset-btn {
  border-radius: 999px !important;
  border: none !important;
  padding: 12px 26px !important;
  background: #eff6ff !important;
  color: var(--app-primary, #2563eb) !important;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 10px;
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
.page.theme-dark .result-item .left h3,
.page.theme-dark .group-pet-name,
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

.page.theme-dark .group-summary {
  background: linear-gradient(180deg, #111827, #0b1220);
  border-color: rgba(96, 165, 250, 0.35);
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

.empty {
  text-align: center;
  color: var(--app-text-muted, #6a6880);
  padding: 28px 10px;
}

.group-result-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
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

.group-summary {
  border: 1px solid rgba(37, 99, 235, 0.2);
  background: var(--app-item-bg-soft, linear-gradient(180deg, #ffffff, #f7fbff));
}

.group-summary-card {
  margin-bottom: 12px;
}

.group-item {
  grid-template-columns: 1fr;
}

.group-pet-name {
  margin: 0 !important;
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
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
  color: var(--app-primary, #2563eb);
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

.blocked-tip {
  color: #e86a6a !important;
  font-weight: 700;
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
  color: var(--app-primary, #1d4ed8) !important;
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

@media (min-width: 860px) {
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

  .group-result-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .search-card,
  .result-card {
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
}
</style>
