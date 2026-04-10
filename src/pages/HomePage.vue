<script setup>
const { cards } = defineProps({
  cards: {
    type: Array,
    default: () => [
      {
        route: 'size',
        title: '精灵蛋尺寸查询',
        description: '查询精灵蛋尺寸与重量范围，快速定位候选精灵。'
      },
      {
        route: 'group',
        title: '精灵蛋蛋组查询',
        description: '快速查看精灵所属蛋组与进化链信息。'
      },
      {
        route: 'breeding',
        title: '精灵蛋繁殖查询',
        description: '输入目标精灵后，查看可用父系与繁殖方案。'
      },
      {
        route: 'shiny',
        title: '精灵蛋异色孵化',
        description: '根据已有异色清单，规划异色孵化路线。'
      }
    ]
  }
})

const emit = defineEmits(['navigate'])

function openCard(route) {
  emit('navigate', route)
}
</script>

<template>
  <main class="home-page">
    <section class="home-tools">
      <div class="home-card-grid">
        <article
          v-for="(item, index) in cards"
          :key="item.route"
          class="home-tool-card"
          :class="`home-tool-card-${index + 1}`"
        >
          <div class="home-tool-card-bg" aria-hidden="true"></div>

          <h3 class="home-tool-title">{{ item.title }}</h3>
          <p class="home-tool-desc">{{ item.description }}</p>

          <button type="button" class="home-tool-button" @click="openCard(item.route)">
            <span>打开</span>
            <span class="home-tool-arrow">→</span>
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  --home-card-radius: 24px;
  --home-glass-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.14));
  --home-glass-border: rgba(255, 255, 255, 0.24);
  --home-glass-highlight: rgba(255, 255, 255, 0.28);
  --home-glass-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
  --home-glass-blur: blur(18px) saturate(160%);
  --home-glass-dark-bg: linear-gradient(180deg, rgba(15, 23, 42, 0.34), rgba(15, 23, 42, 0.16));
  --home-glass-dark-border: rgba(148, 163, 184, 0.16);
  --home-glass-dark-highlight: rgba(148, 163, 184, 0.1);
  --home-glass-dark-shadow: 0 18px 36px rgba(2, 6, 23, 0.38);
  width: min(100%, 1180px);
  margin: 0 auto;
}

.home-tools {
  border-radius: 32px;
}

.home-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.home-tool-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--home-card-radius);
  padding: 24px 20px;
  min-height: 248px;
  background: var(--home-glass-bg);
  border: 1px solid var(--home-glass-border);
  box-shadow:
    inset 0 1px 0 var(--home-glass-highlight),
    var(--home-glass-shadow);
  display: flex;
  flex-direction: column;
  gap: 14px;
  isolation: isolate;
  backdrop-filter: var(--home-glass-blur);
  -webkit-backdrop-filter: var(--home-glass-blur);
}

.home-tool-card-bg {
  position: absolute;
  inset: auto -40px -40px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  opacity: 0.18;
  filter: blur(6px);
  z-index: -1;
}

.home-tool-card-1 .home-tool-card-bg {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.28), transparent 68%);
}

.home-tool-card-2 .home-tool-card-bg {
  background: radial-gradient(circle, rgba(14, 165, 233, 0.26), transparent 68%);
}

.home-tool-card-3 .home-tool-card-bg {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.24), transparent 68%);
}

.home-tool-card-4 .home-tool-card-bg {
  background: radial-gradient(circle, rgba(236, 72, 153, 0.24), transparent 68%);
}



.home-tool-title {
  margin: 0;
  color: var(--app-primary, #3f83bd);
  font-size: 26px;
  line-height: 1.25;
}

.home-tool-desc {
  margin: 0;
  color: var(--app-text-soft, #5f5d72);
  line-height: 1.75;
  flex: 1;
  font-size: 14px;
}

.home-tool-button {
  width: fit-content;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.14));
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 10px 20px rgba(15, 23, 42, 0.12);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.home-tool-button:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 14px 24px rgba(15, 23, 42, 0.14);
  border-color: rgba(255, 255, 255, 0.34);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.18));
}

.home-tool-button:active {
  transform: translateY(0);
}

.home-tool-arrow {
  font-size: 16px;
  line-height: 1;
}

:global(.page.theme-dark) .home-tool-card {
  background: var(--home-glass-dark-bg);
  border-color: var(--home-glass-dark-border);
  box-shadow:
    var(--home-glass-dark-shadow),
    inset 0 1px 0 var(--home-glass-dark-highlight);
}

:global(.page.theme-dark) .home-tool-title {
  color: #bfdbfe;
}

:global(.page.theme-dark) .home-tool-desc {
  color: #cbd5e1;
}

:global(.page.theme-dark) .home-tool-button {
  border-color: rgba(96, 165, 250, 0.22);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.72));
  color: #e5eefb !important;
  box-shadow:
    inset 0 1px 0 rgba(148, 163, 184, 0.12),
    0 10px 20px rgba(2, 6, 23, 0.24);
}

:global(.page.theme-dark) .home-tool-button span,
:global(.page.theme-dark) .home-tool-button .home-tool-arrow {
  color: #e5eefb !important;
}

:global(.page.theme-dark) .home-tool-button:hover {
  border-color: rgba(96, 165, 250, 0.36);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.84));
  box-shadow:
    inset 0 1px 0 rgba(148, 163, 184, 0.14),
    0 14px 24px rgba(2, 6, 23, 0.28);
}

:global(.page.theme-dark) .home-tool-meta {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(96, 165, 250, 0.28);
  color: #93c5fd;
}

@media (min-width: 860px) {
  .home-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-tool-card {
    min-height: 272px;
    padding: 28px 24px;
  }
}

@media (max-width: 640px) {
  .home-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .home-tool-card {
    min-height: auto;
    padding: 16px 12px;
    gap: 10px;
  }

  .home-tool-card-bg {
    width: 120px;
    height: 120px;
    inset: auto -24px -24px auto;
  }

  .home-tool-title {
    font-size: 18px;
    line-height: 1.3;
  }

  .home-tool-desc {
    font-size: 12px;
    line-height: 1.55;
  }

  .home-tool-button {
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
    gap: 6px;
    font-size: 13px;
  }

  .home-tool-arrow {
    font-size: 14px;
  }
}
</style>
