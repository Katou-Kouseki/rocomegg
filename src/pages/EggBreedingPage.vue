<script setup>
import '../styles/tool-pages.css'

defineProps({
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

.group-summary-card {
  margin-bottom: 12px;
}

.group-item {
  grid-template-columns: 1fr;
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.title-row {
  gap: 8px;
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


}


</style>
