<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import "../styles/tool-pages.css";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const errorMessage = ref("");
const creature = ref(null);
const evolutionChains = ref([]);
const learnsetEntry = ref(null);
const skillMap = ref(new Map());
const selectedFormKey = ref("");

const attributeLabelMap = Object.freeze({
    normal: "普通",
    grass: "草",
    fire: "火",
    water: "水",
    light: "光",
    earth: "地",
    ice: "冰",
    dragon: "龙",
    electric: "电",
    poison: "毒",
    bug: "虫",
    martial: "武",
    wing: "翼",
    cute: "萌",
    ghost: "幽",
    evil: "恶",
    machine: "机械",
    illusion: "幻",
    rock: "石",
});

const categoryLabelMap = Object.freeze({
    physical: "物攻",
    magical: "魔攻",
    status: "状态",
});

function toImageUrl(fileName) {
    const text = String(fileName || "").trim();
    return text ? `/creature-atlas/${text}` : "";
}

function toSkillIconUrl(fileName) {
    const text = String(fileName || "").trim();
    return text ? `/skill-icons/${text}` : "";
}

function getAttributeLabel(value) {
    const text = String(value || "").trim();
    return attributeLabelMap[text] || text || "未知";
}

function getCategoryLabel(value) {
    const text = String(value || "").trim();
    return categoryLabelMap[text] || text || "未知";
}

function normalizeStats(rawStats) {
    if (!rawStats || typeof rawStats !== "object") return null;

    return {
        total: Number(rawStats.total ?? 0),
        hp: Number(rawStats.hp ?? 0),
        physicalAttack: Number(rawStats.physicalAttack ?? 0),
        magicalAttack: Number(rawStats.magicalAttack ?? 0),
        physicalDefense: Number(rawStats.physicalDefense ?? 0),
        magicalDefense: Number(rawStats.magicalDefense ?? 0),
        speed: Number(rawStats.speed ?? 0),
    };
}

function toStatItems(stats) {
    if (!stats) return [];
    return [
        {
            key: "total",
            label: "基础数值",
            value: stats.total,
            highlight: true,
        },
        { key: "hp", label: "生命", value: stats.hp },
        { key: "physicalAttack", label: "物攻", value: stats.physicalAttack },
        { key: "magicalAttack", label: "魔攻", value: stats.magicalAttack },
        { key: "physicalDefense", label: "物防", value: stats.physicalDefense },
        { key: "magicalDefense", label: "魔防", value: stats.magicalDefense },
        { key: "speed", label: "速度", value: stats.speed },
    ];
}

function normalizeCreature(rawItem) {
    if (!rawItem || typeof rawItem !== "object") return null;

    return {
        id: String(rawItem.id || "").trim(),
        name: String(rawItem.name || "未命名精灵"),
        attributes: Array.isArray(rawItem.attributes)
            ? rawItem.attributes
                  .map((item) => String(item || "").trim())
                  .filter(Boolean)
            : [],
        trait: {
            name: String(rawItem?.trait?.name || "").trim(),
            description: String(rawItem?.trait?.description || "").trim(),
        },
        images: {
            default: String(rawItem?.images?.default || "").trim(),
            base: String(rawItem?.images?.base || "").trim(),
            forms: rawItem?.images?.forms || {},
            bossForms: rawItem?.images?.bossForms || {},
            bossFormVariants: rawItem?.images?.bossFormVariants || {},
        },
        raceStats: {
            default: normalizeStats(rawItem?.raceStats?.default),
            forms: rawItem?.raceStats?.forms || {},
            bossForms: rawItem?.raceStats?.bossForms || {},
            bossFormVariants: rawItem?.raceStats?.bossFormVariants || {},
        },
    };
}

function normalizeSkill(rawItem) {
    return {
        skillId: String(rawItem?.skillId || "").trim(),
        name: String(rawItem?.name || "未命名技能").trim(),
        attribute: String(rawItem?.attribute || "").trim(),
        category: String(rawItem?.category || "").trim(),
        icon: String(rawItem?.icon || "").trim(),
        energyCost: Number(rawItem?.energyCost ?? 0),
        power: Number(rawItem?.power ?? 0),
        effect: String(rawItem?.effect || "").trim(),
    };
}

function normalizeLearnset(rawItem) {
    if (!rawItem || typeof rawItem !== "object") return null;
    return {
        creatureId: String(rawItem.creatureId || "").trim(),
        creatureName: String(rawItem.creatureName || "").trim(),
        default: Array.isArray(rawItem.default) ? rawItem.default : [],
        forms: rawItem.forms || {},
        bossForms: rawItem.bossForms || {},
        bossFormVariants: rawItem.bossFormVariants || {},
    };
}

const pageTitle = computed(() =>
    creature.value ? `${creature.value.name} · 精灵详情` : "精灵详情",
);

const pageDescription = computed(() => {
    if (!creature.value) {
        return "查看该精灵的基础资料、全部图鉴、进化链与技能列表。";
    }

    const parts = [
        `编号 #${creature.value.id}`,
        `${totalGalleryCount.value} 张图鉴`,
    ];

    if (creature.value.attributes.length) {
        parts.push(
            creature.value.attributes.map((item) => `${item}系`).join(" / "),
        );
    }

    return parts.join(" · ");
});

const attributeText = computed(() =>
    creature.value?.attributes?.length
        ? creature.value.attributes.map((item) => `${item}系`).join(" / ")
        : "未知属性",
);

const traitName = computed(
    () => String(creature.value?.trait?.name || "").trim() || "暂无特性",
);

const traitDescription = computed(
    () =>
        String(creature.value?.trait?.description || "").trim() ||
        "暂无特性说明",
);

const formOptions = computed(() => {
    if (!creature.value) return [];

    const result = [];
    const images = creature.value.images;
    const raceStats = creature.value.raceStats;
    const baseFile = String(images.default || images.base || "").trim();

    if (baseFile) {
        result.push({
            key: "default",
            title: "基础形态",
            imageTitle: creature.value.name,
            fileName: baseFile,
            type: "default",
            stats: raceStats.default,
        });
    }

    Object.entries(images.forms || {})
        .filter(([, fileName]) => fileName)
        .forEach(([label, fileName]) => {
            result.push({
                key: `form:${label}`,
                title: label,
                imageTitle: label,
                fileName: String(fileName || "").trim(),
                type: "form",
                stats: normalizeStats(raceStats.forms?.[label]),
            });
        });

    Object.entries(images.bossForms || {})
        .filter(([, fileName]) => fileName)
        .forEach(([label, fileName]) => {
            result.push({
                key: `boss:${label}`,
                title: label,
                imageTitle: label,
                fileName: String(fileName || "").trim(),
                type: "boss",
                stats: normalizeStats(raceStats.bossForms?.[label]),
            });
        });

    Object.entries(images.bossFormVariants || {}).forEach(
        ([bossLabel, variantMap]) => {
            Object.entries(variantMap || {})
                .filter(([, fileName]) => fileName)
                .forEach(([variantLabel, fileName]) => {
                    result.push({
                        key: `boss-variant:${bossLabel}:${variantLabel}`,
                        title: `${bossLabel} · ${variantLabel}`,
                        imageTitle: `${bossLabel} · ${variantLabel}`,
                        fileName: String(fileName || "").trim(),
                        type: "boss-variant",
                        stats: normalizeStats(
                            raceStats.bossFormVariants?.[bossLabel]?.[
                                variantLabel
                            ],
                        ),
                    });
                });
        },
    );

    return result;
});

const currentForm = computed(() => {
    if (!formOptions.value.length) return null;
    const matched = formOptions.value.find(
        (item) => item.key === selectedFormKey.value,
    );
    return matched || formOptions.value[0];
});

const currentStatItems = computed(() =>
    currentForm.value?.stats ? toStatItems(currentForm.value.stats) : [],
);

const skillSectionList = computed(() => {
    if (!learnsetEntry.value) return [];

    const skills =
        Array.isArray(learnsetEntry.value.default) &&
        learnsetEntry.value.default.length
            ? learnsetEntry.value.default
                  .map((skillId) =>
                      skillMap.value.get(String(skillId || "").trim()),
                  )
                  .filter(Boolean)
            : [];

    return skills.length
        ? [
              {
                  key: "default",
                  title: "基础形态",
                  skills,
              },
          ]
        : [];
});

const evolutionChain = computed(() => {
    if (!creature.value?.id) return [];
    const id = creature.value.id;
    const matchedChain = evolutionChains.value.find((chain) =>
        Array.isArray(chain)
            ? chain.some((item) => String(item?.id || "").trim() === id)
            : false,
    );

    return Array.isArray(matchedChain)
        ? matchedChain.map((item) => ({
              id: String(item?.id || "").trim(),
              name: String(item?.name || "未知精灵").trim(),
              active: String(item?.id || "").trim() === id,
          }))
        : [];
});

const gallerySections = computed(() => {
    if (!creature.value) return [];

    const grouped = {
        base: [],
        forms: [],
        boss: [],
        variants: [],
    };

    formOptions.value.forEach((item) => {
        const baseInfo = {
            key: item.key,
            title: item.title,
            fileName: item.fileName,
            active: item.key === currentForm.value?.key,
        };

        if (item.type === "default") {
            grouped.base.push(baseInfo);
            return;
        }

        if (item.type === "form") {
            grouped.forms.push(baseInfo);
            return;
        }

        if (item.type === "boss") {
            grouped.boss.push(baseInfo);
            return;
        }

        grouped.variants.push(baseInfo);
    });

    const sections = [];
    if (grouped.base.length) {
        sections.push({
            key: "base",
            title: "基础图鉴",
            items: grouped.base,
        });
    }
    if (grouped.forms.length) {
        sections.push({
            key: "forms",
            title: "地区 / 其它形态",
            items: grouped.forms,
        });
    }
    if (grouped.boss.length) {
        sections.push({
            key: "boss",
            title: "首领形态",
            items: grouped.boss,
        });
    }
    if (grouped.variants.length) {
        sections.push({
            key: "variants",
            title: "首领变体",
            items: grouped.variants,
        });
    }

    return sections;
});

const totalGalleryCount = computed(() => formOptions.value.length);

async function loadCreatureDetail() {
    loading.value = true;
    errorMessage.value = "";
    creature.value = null;
    learnsetEntry.value = null;
    selectedFormKey.value = "";
    evolutionChains.value = [];
    skillMap.value = new Map();

    try {
        const creatureId = String(route.params.id || "").trim();

        if (!creatureId) {
            throw new Error("缺少精灵编号");
        }

        const [
            creatureResponse,
            evolutionResponse,
            learnsetResponse,
            skillResponse,
        ] = await Promise.all([
            fetch("/data/creatures-master-list.json", { cache: "no-cache" }),
            fetch("/data/evolution-chains.json", { cache: "no-cache" }),
            fetch("/data/creature-skill-learnsets.json", { cache: "no-cache" }),
            fetch("/data/skills-master-list.json", { cache: "no-cache" }),
        ]);

        if (!creatureResponse.ok) {
            throw new Error(`精灵详情数据加载失败：${creatureResponse.status}`);
        }
        if (!evolutionResponse.ok) {
            throw new Error(`进化链数据加载失败：${evolutionResponse.status}`);
        }
        if (!learnsetResponse.ok) {
            throw new Error(
                `技能学习面数据加载失败：${learnsetResponse.status}`,
            );
        }
        if (!skillResponse.ok) {
            throw new Error(`技能主表数据加载失败：${skillResponse.status}`);
        }

        const creatureData = await creatureResponse.json();
        const evolutionData = await evolutionResponse.json();
        const learnsetData = await learnsetResponse.json();
        const skillData = await skillResponse.json();

        const creatures = Array.isArray(creatureData?.creatures)
            ? creatureData.creatures
            : [];
        const matchedCreature = creatures.find(
            (item) => String(item?.id || "").trim() === creatureId,
        );

        if (!matchedCreature) {
            throw new Error(`未找到编号为 ${creatureId} 的精灵`);
        }

        creature.value = normalizeCreature(matchedCreature);

        evolutionChains.value = Array.isArray(evolutionData?.chains)
            ? evolutionData.chains
            : [];

        const learnsets = Array.isArray(learnsetData?.creatures)
            ? learnsetData.creatures
            : [];
        const matchedLearnset = learnsets.find(
            (item) => String(item?.creatureId || "").trim() === creatureId,
        );
        learnsetEntry.value = matchedLearnset
            ? normalizeLearnset(matchedLearnset)
            : null;

        const skills = Array.isArray(skillData?.skills) ? skillData.skills : [];
        skillMap.value = new Map(
            skills
                .map((item) => normalizeSkill(item))
                .filter((item) => item.skillId)
                .map((item) => [item.skillId, item]),
        );

        selectedFormKey.value = formOptions.value[0]?.key || "";
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "精灵详情数据加载失败";
    } finally {
        loading.value = false;
    }
}

function goBackToAtlas() {
    router.push({ name: "atlas" });
}

function openCreatureById(id) {
    const targetId = String(id || "").trim();
    if (!targetId) return;
    router.push({ path: `/atlas/${targetId}` });
}

function selectForm(optionKey) {
    const key = String(optionKey || "").trim();
    if (!key) return;
    selectedFormKey.value = key;
}

watch(
    () => creature.value?.name,
    (name) => {
        if (typeof document === "undefined") return;
        document.title = name ? `${name} · 精灵详情` : "精灵详情";
    },
    { immediate: true },
);

watch(
    () => route.params.id,
    () => {
        loadCreatureDetail();
    },
);

onMounted(() => {
    loadCreatureDetail();
});
</script>

<template>
    <main class="panel creature-detail-page tool-page">
        <section v-if="errorMessage" class="search-card creature-state-card">
            <el-alert
                type="error"
                :closable="false"
                show-icon
                :title="errorMessage"
            />
        </section>

        <section v-else-if="loading" class="search-card creature-state-card">
            <el-skeleton :rows="12" animated />
        </section>

        <template v-else-if="creature">
            <section class="search-card creature-overview-card">
                <div class="creature-overview">
                    <div class="creature-summary-card">
                        <div class="creature-summary-head">
                            <div class="creature-summary-icon-wrap">
                                <img
                                    v-if="currentForm?.fileName"
                                    class="creature-summary-icon"
                                    :src="toImageUrl(currentForm.fileName)"
                                    :alt="`${creature.name} ${currentForm.title} 图像`"
                                />
                                <div
                                    v-else
                                    class="creature-summary-icon-placeholder"
                                >
                                    暂无图片
                                </div>
                            </div>

                            <div class="creature-summary-body">
                                <div class="creature-summary-title-row">
                                    <h1 class="creature-summary-title">
                                        {{ creature.name }}
                                    </h1>
                                </div>

                                <div class="creature-summary-tags">
                                    <div class="creature-attribute-list">
                                        <span class="creature-attribute-tag">
                                            #{{ creature.id }}
                                        </span>
                                        <span
                                            v-for="attribute in creature.attributes"
                                            :key="`summary-${attribute}`"
                                            class="creature-attribute-tag"
                                        >
                                            {{ attribute }}系
                                        </span>
                                        <span
                                            v-if="!creature.attributes.length"
                                            class="creature-attribute-tag is-empty"
                                        >
                                            未知属性
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="creature-trait-card">
                        <div class="creature-panel-head">
                            <h2>{{ traitName }}</h2>
                        </div>
                        <p>{{ traitDescription }}</p>
                    </div>

                    <section
                        class="creature-current-stats-card creature-overview-stats-card"
                    >
                        <div class="section-title-row">
                            <div class="creature-panel-head">
                                <h2>种族值</h2>
                            </div>
                        </div>

                        <div v-if="currentStatItems.length" class="stats-grid">
                            <article
                                v-for="stat in currentStatItems"
                                :key="stat.key"
                                class="stat-card"
                                :class="{ 'is-highlight': stat.highlight }"
                            >
                                <span class="stat-label">{{ stat.label }}</span>
                                <span class="stat-value">{{ stat.value }}</span>
                            </article>
                        </div>

                        <el-empty v-else description="当前形态暂无种族值数据" />
                    </section>
                </div>
            </section>

            <section
                v-if="formOptions.length > 1"
                class="search-card creature-form-switch-card"
            >
                <div class="section-title-row">
                    <h2>形态切换</h2>
                    <span class="section-meta"
                        >{{ formOptions.length }} 种</span
                    >
                </div>

                <div class="form-chip-list">
                    <button
                        v-for="option in formOptions"
                        :key="option.key"
                        class="form-chip"
                        :class="{
                            'is-active': option.key === currentForm?.key,
                        }"
                        type="button"
                        @click="selectForm(option.key)"
                    >
                        {{ option.title }}
                    </button>
                </div>
            </section>

            <section
                v-if="evolutionChain.length"
                class="search-card creature-evolution-card"
            >
                <div class="section-title-row">
                    <h2>进化链</h2>
                    <span class="section-meta"
                        >{{ evolutionChain.length }} 阶</span
                    >
                </div>

                <div class="evolution-chain">
                    <template
                        v-for="(item, index) in evolutionChain"
                        :key="`${item.id}:${item.name}`"
                    >
                        <button
                            class="evolution-card"
                            :class="{ 'is-active': item.active }"
                            type="button"
                            @click="openCreatureById(item.id)"
                        >
                            <span class="evolution-id">#{{ item.id }}</span>
                            <span class="evolution-name">{{ item.name }}</span>
                        </button>
                        <span
                            v-if="index < evolutionChain.length - 1"
                            class="evolution-arrow"
                        >
                            →
                        </span>
                    </template>
                </div>
            </section>

            <section
                v-if="skillSectionList.length"
                class="search-card creature-all-skills-card"
            >
                <div class="section-title-row">
                    <div class="creature-panel-head">
                        <span class="creature-panel-kicker">技能面板</span>
                        <h2>基础形态技能</h2>
                    </div>
                    <span class="section-meta">仅显示基础形态</span>
                </div>

                <div class="skill-section-list">
                    <section
                        v-for="section in skillSectionList"
                        :key="section.key"
                        class="skill-section"
                    >
                        <div class="skill-section-head">
                            <h3>{{ section.title }}</h3>
                            <span>{{ section.skills.length }} 个</span>
                        </div>

                        <div class="skill-mini-grid">
                            <article
                                v-for="skill in section.skills"
                                :key="`${section.key}:${skill.skillId}`"
                                class="skill-mini-card"
                            >
                                <div class="skill-mini-icon-wrap">
                                    <img
                                        v-if="skill.icon"
                                        class="skill-mini-icon"
                                        :src="toSkillIconUrl(skill.icon)"
                                        :alt="`${skill.name} 图标`"
                                        loading="lazy"
                                    />
                                    <div v-else class="skill-mini-placeholder">
                                        技能
                                    </div>
                                </div>
                                <div class="skill-mini-name">
                                    {{ skill.name }}
                                </div>
                            </article>
                        </div>
                    </section>
                </div>
            </section>

            <section class="search-card creature-gallery-card">
                <div class="section-title-row">
                    <div class="creature-panel-head">
                        <span class="creature-panel-kicker">图鉴总览</span>
                        <h2>全部图鉴</h2>
                    </div>
                    <span class="section-meta">{{ totalGalleryCount }} 张</span>
                </div>

                <div class="gallery-section-list">
                    <section
                        v-for="section in gallerySections"
                        :key="section.key"
                        class="gallery-section"
                    >
                        <div class="gallery-section-head">
                            <h3>{{ section.title }}</h3>
                            <span>{{ section.items.length }} 张</span>
                        </div>

                        <div class="gallery-grid">
                            <button
                                v-for="item in section.items"
                                :key="item.key"
                                class="gallery-card"
                                :class="{ 'is-active': item.active }"
                                type="button"
                                @click="selectForm(item.key)"
                            >
                                <div class="gallery-image-wrap">
                                    <img
                                        class="gallery-image"
                                        :src="toImageUrl(item.fileName)"
                                        :alt="`${creature.name} ${item.title} 图鉴`"
                                        loading="lazy"
                                    />
                                </div>
                                <h4 class="gallery-card-title">
                                    {{ item.title }}
                                </h4>
                                <p class="gallery-card-file">
                                    {{ item.fileName }}
                                </p>
                            </button>
                        </div>
                    </section>
                </div>
            </section>
        </template>
    </main>
</template>

<style scoped>
.creature-detail-page {
    width: min(100%, 1180px);
    margin: 0 auto;
}

.creature-detail-hero-card,
.creature-overview-card,
.creature-form-switch-card,
.creature-evolution-card,
.creature-current-stats-card,
.creature-all-skills-card,
.creature-gallery-card,
.creature-state-card {
    overflow: hidden;
}

.creature-overview {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    align-items: stretch;
}

.creature-overview > * {
    min-width: 0;
}

.creature-overview-stats-card {
    grid-column: 1 / -1;
}

.creature-main-image-wrap {
    position: relative;
    width: 100%;
    max-width: 340px;
    aspect-ratio: 1 / 1;
    border-radius: 28px;
    border: 1px solid rgba(191, 219, 254, 0.88);
    background:
        radial-gradient(
            circle at top,
            rgba(255, 255, 255, 0.95),
            rgba(238, 245, 255, 0.78) 58%,
            rgba(226, 238, 255, 0.95)
        ),
        linear-gradient(180deg, #f8fbff, #eef5ff);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-shadow:
        0 18px 34px rgba(59, 130, 246, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.88);
    overflow: hidden;
}

.creature-main-image-wrap::before {
    content: "";
    position: absolute;
    inset: 16px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    pointer-events: none;
}

.creature-main-image {
    width: 100%;
    max-width: 236px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 16px 24px rgba(37, 99, 235, 0.18));
}

.creature-main-placeholder {
    color: var(--app-text-muted);
    font-size: 14px;
    font-weight: 700;
}

.creature-main-meta {
    display: grid;
    gap: 16px;
}

.creature-summary-card,
.creature-trait-card,
.creature-current-stats-card {
    border-radius: var(--tool-page-card-radius);
    border: 1px solid var(--tool-page-card-border);
    background: var(--tool-page-card-bg);
    box-shadow:
        inset 0 1px 0 var(--tool-page-card-highlight),
        var(--tool-page-card-shadow);
    backdrop-filter: var(--tool-page-card-blur);
    -webkit-backdrop-filter: var(--tool-page-card-blur);
}

.creature-basic-item,
.gallery-section,
.skill-section {
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.82),
        rgba(255, 255, 255, 0.6)
    );
    box-shadow:
        0 14px 28px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.68);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
}

.creature-summary-card,
.creature-trait-card,
.creature-current-stats-card {
    padding: 20px;
}

.creature-summary-card {
    display: grid;
    gap: 18px;
}

.creature-summary-head {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr);
    align-items: center;
    gap: 18px;
}

.creature-summary-icon-wrap {
    width: 132px;
    min-height: 132px;
    border-radius: 24px;
    border: 1px solid rgba(191, 219, 254, 0.88);
    background:
        radial-gradient(
            circle at top,
            rgba(255, 255, 255, 0.96),
            rgba(238, 245, 255, 0.82) 58%,
            rgba(226, 238, 255, 0.95)
        ),
        linear-gradient(180deg, #f8fbff, #eef5ff);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-shadow:
        0 14px 28px rgba(59, 130, 246, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.88);
    overflow: hidden;
}

.creature-summary-icon {
    width: 100%;
    max-width: 92px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 10px 18px rgba(37, 99, 235, 0.16));
}

.creature-summary-icon-placeholder {
    color: var(--app-text-muted);
    font-size: 13px;
    font-weight: 700;
}

.creature-summary-body {
    min-width: 0;
    display: grid;
    gap: 16px;
}

.creature-summary-title-row {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
}

.creature-summary-tags {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.creature-summary-title {
    margin: 0;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.1;
    color: var(--app-text, #1a1b21);
    letter-spacing: 0.02em;
}

.creature-attribute-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.creature-attribute-tag {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: var(--tool-page-label-light);
    font-size: 12px;
    font-weight: 700;
}

.creature-attribute-tag.is-empty {
    color: var(--app-text-muted);
    background: rgba(148, 163, 184, 0.12);
}

.creature-basic-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.creature-basic-item {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.creature-basic-label,
.section-meta,
.gallery-section-head span,
.skill-section-head span {
    font-size: 12px;
    color: var(--tool-page-desc-color);
    font-weight: 700;
}

.creature-basic-value {
    color: var(--app-text, #1a1b21);
    font-size: 18px;
    font-weight: 800;
    line-height: 1.35;
    word-break: break-word;
}

.creature-panel-head {
    display: grid;
    gap: 6px;
}

.creature-panel-kicker {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.1);
    color: var(--app-primary, #2563eb);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
}

.creature-trait-card h2,
.section-title-row h2,
.gallery-section-head h3,
.skill-section-head h3 {
    margin: 0;
    color: var(--tool-page-title-color);
}

.creature-trait-card h2,
.section-title-row h2 {
    font-size: clamp(22px, 3vw, 28px);
    line-height: 1.15;
}

.creature-trait-card p {
    margin: 14px 0 0;
    line-height: 1.8;
    color: var(--tool-page-desc-color);
}

.section-title-row,
.gallery-section-head,
.skill-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.section-title-row {
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(191, 219, 254, 0.5);
}

.form-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.form-chip {
    border: 1px solid rgba(191, 219, 254, 0.9);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    color: var(--app-primary, #2563eb);
    border-radius: 999px;
    min-height: 38px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.form-chip:hover,
.form-chip.is-active {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.34);
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.12);
}

.form-chip.is-active {
    background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.18),
        rgba(96, 165, 250, 0.22)
    );
}

.evolution-chain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}

.evolution-card {
    border: 1px solid rgba(191, 219, 254, 0.82);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 128px;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.evolution-card:hover,
.evolution-card.is-active {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.34);
    box-shadow: 0 12px 22px rgba(37, 99, 235, 0.12);
}

.evolution-card.is-active {
    background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.16),
        rgba(96, 165, 250, 0.2)
    );
}

.evolution-id {
    font-size: 12px;
    color: var(--tool-page-desc-color);
    font-weight: 700;
}

.evolution-name {
    font-size: 16px;
    color: var(--app-text, #1a1b21);
    font-weight: 800;
}

.evolution-arrow {
    color: var(--app-text-muted);
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
}

.stat-card {
    border-radius: 14px;
    border: 1px solid rgba(191, 219, 254, 0.8);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: center;
}

.stat-card.is-highlight {
    border-color: rgba(96, 165, 250, 0.32);
}

.stat-label {
    font-size: 12px;
    color: var(--tool-page-desc-color);
    font-weight: 700;
}

.stat-value {
    font-size: 20px;
    line-height: 1.2;
    color: var(--app-primary, #2563eb);
    font-weight: 800;
}

.skill-section-list,
.gallery-section-list {
    display: grid;
    gap: 16px;
}

.skill-section,
.gallery-section {
    padding: 16px;
}

.skill-mini-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    margin-top: 14px;
}

.skill-mini-card {
    border-radius: 14px;
    border: 1px solid rgba(191, 219, 254, 0.8);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 10px;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
}

.skill-mini-icon-wrap {
    width: 54px;
    height: 54px;
    border-radius: 14px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
}

.skill-mini-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.skill-mini-placeholder {
    font-size: 12px;
    color: var(--tool-page-desc-color);
    font-weight: 700;
}

.skill-mini-name {
    font-size: 13px;
    line-height: 1.35;
    color: var(--app-text, #1a1b21);
    font-weight: 700;
    word-break: break-word;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin-top: 14px;
}

.gallery-card {
    border-radius: 16px;
    border: 1px solid rgba(191, 219, 254, 0.8);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: center;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.gallery-card:hover,
.gallery-card.is-active {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.34);
    box-shadow: 0 12px 22px rgba(37, 99, 235, 0.12);
}

.gallery-card.is-active {
    background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.14),
        rgba(96, 165, 250, 0.18)
    );
}

.gallery-image-wrap {
    min-height: 140px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
}

.gallery-image {
    width: 100%;
    max-width: 112px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;
}

.gallery-card-title {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--app-text, #1a1b21);
}

.gallery-card-file {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--tool-page-desc-color);
    word-break: break-all;
}

:global(.page.theme-dark) .creature-main-image-wrap,
:global(.page.theme-dark) .creature-summary-icon-wrap,
:global(.page.theme-dark) .stat-card,
:global(.page.theme-dark) .skill-mini-card,
:global(.page.theme-dark) .gallery-card,
:global(.page.theme-dark) .evolution-card,
:global(.page.theme-dark) .form-chip {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.2);
}

:global(.page.theme-dark) .creature-summary-card,
:global(.page.theme-dark) .creature-trait-card,
:global(.page.theme-dark) .creature-current-stats-card {
    border-color: var(--tool-page-card-dark-border);
    background: var(--tool-page-card-dark-bg);
    box-shadow:
        inset 0 1px 0 var(--tool-page-card-dark-highlight),
        var(--tool-page-card-dark-shadow);
}

:global(.page.theme-dark) .creature-basic-item,
:global(.page.theme-dark) .gallery-section,
:global(.page.theme-dark) .skill-section {
    border-color: rgba(96, 165, 250, 0.18);
    background: linear-gradient(
        180deg,
        rgba(15, 23, 42, 0.72),
        rgba(15, 23, 42, 0.56)
    );
    box-shadow:
        0 12px 28px rgba(2, 6, 23, 0.34),
        inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

:global(.page.theme-dark) .creature-summary-title,
:global(.page.theme-dark) .creature-basic-value,
:global(.page.theme-dark) .creature-trait-card h2,
:global(.page.theme-dark) .section-title-row h2,
:global(.page.theme-dark) .skill-mini-name,
:global(.page.theme-dark) .gallery-card-title,
:global(.page.theme-dark) .evolution-name {
    color: var(--tool-page-heading-dark);
}

:global(.page.theme-dark) .creature-trait-card p,
:global(.page.theme-dark) .gallery-card-file,
:global(.page.theme-dark) .creature-basic-label,
:global(.page.theme-dark) .section-meta,
:global(.page.theme-dark) .gallery-section-head span,
:global(.page.theme-dark) .skill-section-head span,
:global(.page.theme-dark) .stat-label,
:global(.page.theme-dark) .evolution-id,
:global(.page.theme-dark) .skill-mini-placeholder {
    color: var(--app-text-soft);
}

:global(.page.theme-dark) .creature-panel-kicker,
:global(.page.theme-dark) .creature-attribute-tag {
    background: rgba(59, 130, 246, 0.18);
    color: #bfdbfe;
    border-color: rgba(96, 165, 250, 0.2);
}

:global(.page.theme-dark) .creature-attribute-tag.is-empty {
    color: #cbd5e1;
    background: rgba(148, 163, 184, 0.12);
}

:global(.page.theme-dark) .stat-value {
    color: #bfdbfe;
}

:global(.page.theme-dark) .creature-main-placeholder,
:global(.page.theme-dark) .creature-summary-icon-placeholder {
    color: #cbd5e1;
}

:global(.page.theme-dark) .gallery-image-wrap,
:global(.page.theme-dark) .skill-mini-icon-wrap {
    background: rgba(2, 6, 23, 0.24);
    border-color: rgba(96, 165, 250, 0.16);
}

@media (max-width: 960px) {
    .creature-overview {
        grid-template-columns: 1fr;
    }

    .creature-main-visual {
        justify-content: flex-start;
    }

    .creature-main-image-wrap {
        max-width: 280px;
    }

    .creature-summary-head {
        flex-direction: column;
        gap: 12px;
    }

    .stats-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (max-width: 767px) {
    .creature-basic-grid {
        grid-template-columns: 1fr;
    }

    .creature-summary-card {
        padding: 16px;
    }

    .creature-summary-title {
        font-size: 28px;
    }

    .gallery-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .evolution-chain {
        align-items: stretch;
    }

    .evolution-arrow {
        display: none;
    }
}

@media (max-width: 479px) {
    .gallery-grid,
    .stats-grid,
    .skill-mini-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gallery-section,
    .skill-section,
    .creature-trait-card,
    .creature-basic-item {
        padding: 14px;
    }

    .creature-main-image {
        max-width: 180px;
    }

    .gallery-image {
        max-width: 92px;
    }

    .stat-value {
        font-size: 18px;
    }
}
</style>
