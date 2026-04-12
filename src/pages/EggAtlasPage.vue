<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import "../styles/tool-pages.css";
import {
    EGG_GROUP_INPUT,
    SHINY_SEED_PETS,
    normalizeBreedingName,
} from "../data/breeding-config";
import {
    buildGroupIndex,
    buildShinyPetSet,
    hasAnyAttribute,
} from "../data/atlas-utils";
import { isAtlasNormalForm } from "../data/atlas-normal-forms";

const pageTitle = "精灵图鉴";

const loading = ref(false);
const errorMessage = ref("");
const creatures = ref([]);

const searchDraft = ref("");
const searchKeyword = ref("");
const selectedAttribute = ref("");
const selectedFormType = ref("");
const shinyOnly = ref(false);

const router = useRouter();

function toImageUrl(fileName) {
    if (!fileName) return "";
    return `/creature-atlas/${fileName}`;
}

function toIdNumber(id) {
    const value = Number(id);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function createAtlasEntry({
    id,
    idNumber,
    baseName,
    name,
    attributes,
    fileName,
    key,
    formType,
    sortOrder,
}) {
    return {
        key,
        id,
        idNumber,
        baseName,
        name,
        attributes,
        imageUrl: toImageUrl(fileName),
        imageAlt: `${name} 图像`,
        formType,
        sortOrder,
    };
}

function inferFormType(baseName, label) {
    const text = String(label || "").trim();
    if (!text) return "normal";
    return isAtlasNormalForm(baseName, text) ? "normal" : "region";
}

function buildAtlasEntries(entry) {
    const id = String(entry?.id || "");
    const idNumber = toIdNumber(id);
    const baseName = String(entry?.name || "未命名精灵");
    const attributes = Array.isArray(entry?.attributes) ? entry.attributes : [];
    const images = entry?.images || {};
    const defaultFile = images.default || images.base || "";
    const baseFile = images.base || "";
    const formsMap = images.forms || {};
    const bossFormsMap = images.bossForms || {};
    const bossFormVariantsMap = images.bossFormVariants || {};

    const result = [];
    const usedKeys = new Set();
    let orderIndex = 0;
    const formEntries = Object.entries(formsMap).filter(
        ([, fileName]) => fileName,
    );
    const shouldShowBaseCard =
        formEntries.length === 0 ||
        !formEntries.some(([label]) => isAtlasNormalForm(baseName, label));

    function pushEntry(name, fileName, suffix, formType = "normal") {
        if (!fileName) return;
        const key = `${id}:${suffix}:${fileName}:${name}`;
        if (usedKeys.has(key)) return;
        usedKeys.add(key);
        result.push(
            createAtlasEntry({
                id,
                idNumber,
                baseName,
                name,
                attributes,
                fileName,
                key,
                formType,
                sortOrder: orderIndex++,
            }),
        );
    }

    if (shouldShowBaseCard) {
        pushEntry(baseName, defaultFile || baseFile, "base", "normal");
    }

    formEntries.forEach(([label, fileName]) => {
        pushEntry(
            `${baseName}·${label}`,
            fileName,
            `form:${label}`,
            inferFormType(baseName, label),
        );
    });

    Object.entries(bossFormsMap)
        .filter(([, fileName]) => fileName)
        .forEach(([label, fileName]) => {
            pushEntry(label, fileName, `boss:${label}`, "boss");
        });

    Object.entries(bossFormVariantsMap).forEach(([bossLabel, variantMap]) => {
        Object.entries(variantMap || {})
            .filter(([, fileName]) => fileName)
            .forEach(([variantLabel, fileName]) => {
                pushEntry(
                    `${bossLabel}·${variantLabel}`,
                    fileName,
                    `boss-variant:${bossLabel}:${variantLabel}`,
                    "boss",
                );
            });
    });

    return result;
}

const atlasEntries = computed(() =>
    creatures.value
        .flatMap((item) => buildAtlasEntries(item))
        .sort((a, b) => {
            if (a.idNumber !== b.idNumber) return a.idNumber - b.idNumber;

            const rankMap = {
                normal: 0,
                region: 1,
                boss: 2,
            };

            const rankA = rankMap[a.formType] ?? 99;
            const rankB = rankMap[b.formType] ?? 99;

            if (rankA !== rankB) return rankA - rankB;
            return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }),
);

const attributeOptions = computed(() => {
    const set = new Set();
    for (const creature of creatures.value) {
        const attributes = Array.isArray(creature?.attributes)
            ? creature.attributes
            : [];
        for (const attribute of attributes) {
            const value = String(attribute || "").trim();
            if (value) set.add(value);
        }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "zh-CN"));
});

const formTypeOptions = Object.freeze([
    { label: "全部形态", value: "" },
    { label: "普通形态", value: "normal" },
    { label: "地区形态", value: "region" },
    { label: "首领形态", value: "boss" },
]);

const sharedShinyPetSet = ref(new Set());

const filteredEntries = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    const attribute = selectedAttribute.value;
    const formType = selectedFormType.value;

    return atlasEntries.value.filter((entry) => {
        const keywordMatched =
            !keyword ||
            entry.name.toLowerCase().includes(keyword) ||
            entry.id.toLowerCase().includes(keyword);

        const attributeMatched = hasAnyAttribute(entry.attributes, attribute);
        const formMatched = !formType || entry.formType === formType;
        const shinyMatched =
            !shinyOnly.value ||
            sharedShinyPetSet.value.has(entry.baseName) ||
            sharedShinyPetSet.value.has(entry.name);

        return (
            keywordMatched && attributeMatched && formMatched && shinyMatched
        );
    });
});

const totalCreatures = computed(() => creatures.value.length);
const totalAtlasTiles = computed(() => atlasEntries.value.length);
const filteredCount = computed(() => filteredEntries.value.length);

function applySearch() {
    searchKeyword.value = String(searchDraft.value || "").trim();
}

function resetFilters() {
    searchDraft.value = "";
    searchKeyword.value = "";
    selectedAttribute.value = "";
    selectedFormType.value = "";
    shinyOnly.value = false;
}

function openCreatureDetail(entry) {
    const id = String(entry?.id || "").trim();
    if (!id) return;
    router.push({ path: `/atlas/${id}` });
}

async function loadCreatures() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const [masterResponse, evoResponse] = await Promise.all([
            fetch("/data/creatures-master-list.json", {
                cache: "no-cache",
            }),
            fetch("/data/evolution-chains.json", {
                cache: "no-cache",
            }),
        ]);

        if (!masterResponse.ok) {
            throw new Error(`图鉴数据加载失败：${masterResponse.status}`);
        }

        if (!evoResponse.ok) {
            throw new Error(`进化链数据加载失败：${evoResponse.status}`);
        }

        const masterData = await masterResponse.json();
        const evoData = await evoResponse.json();

        creatures.value = Array.isArray(masterData?.creatures)
            ? masterData.creatures
            : [];

        const masterNames = creatures.value
            .map((item) => item?.name)
            .filter(Boolean);
        const evolutionChains = Array.isArray(evoData?.chains)
            ? evoData.chains
            : [];

        const groupIndex = buildGroupIndex(
            masterNames,
            evolutionChains,
            EGG_GROUP_INPUT,
        );

        sharedShinyPetSet.value = buildShinyPetSet({
            shinySeedPets: [...SHINY_SEED_PETS],
            groupIndex,
            normalizeBreedingName,
        });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "图鉴数据加载失败";
        creatures.value = [];
        sharedShinyPetSet.value = new Set();
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadCreatures();
});
</script>

<template>
    <main class="panel egg-atlas-page tool-page">
        <section class="search-card atlas-filter-card">
            <div class="atlas-filter-toolbar">
                <div class="page-hero__title-row">
                    <h1 class="page-hero__title">{{ pageTitle }}</h1>
                </div>
                <p class="page-hero__meta">
                    基础精灵：<span class="dataset-value">{{
                        totalCreatures
                    }}</span>
                    <span class="atlas-hero-divider">·</span>
                    图鉴方格：<span class="dataset-value">{{
                        totalAtlasTiles
                    }}</span>
                    <span class="atlas-hero-divider">·</span>
                    当前显示：<span class="dataset-value">{{
                        filteredCount
                    }}</span>
                </p>

                <div class="atlas-filter-grid">
                    <div class="atlas-filter-item atlas-filter-item-search">
                        <label class="atlas-filter-label">搜索</label>
                        <div class="atlas-search-row">
                            <el-input
                                v-model="searchDraft"
                                size="large"
                                clearable
                                placeholder="输入精灵名称或 ID"
                                @keyup.enter="applySearch"
                            />
                            <el-button
                                type="primary"
                                size="large"
                                @click="applySearch"
                            >
                                搜索
                            </el-button>
                            <el-button size="large" @click="resetFilters">
                                重置筛选
                            </el-button>
                        </div>
                    </div>

                    <div class="atlas-filter-item">
                        <label class="atlas-filter-label">系别</label>
                        <el-select
                            v-model="selectedAttribute"
                            size="large"
                            placeholder="全部系别"
                            clearable
                        >
                            <el-option label="全部系别" value="" />
                            <el-option
                                v-for="attribute in attributeOptions"
                                :key="attribute"
                                :label="`${attribute}系`"
                                :value="attribute"
                            />
                        </el-select>
                    </div>

                    <div class="atlas-filter-item">
                        <label class="atlas-filter-label">形态</label>
                        <el-select
                            v-model="selectedFormType"
                            size="large"
                            placeholder="全部形态"
                            clearable
                        >
                            <el-option
                                v-for="item in formTypeOptions"
                                :key="item.value || 'all'"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </div>

                    <div class="atlas-filter-item atlas-filter-item-switch">
                        <label class="atlas-filter-label">异色</label>
                        <div class="atlas-switch-wrap">
                            <el-switch
                                v-model="shinyOnly"
                                inline-prompt
                                active-text="开"
                                inactive-text="关"
                            />
                            <span class="atlas-switch-tip">只显示异色</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="search-card atlas-list-card">
            <el-alert
                v-if="errorMessage"
                class="atlas-alert"
                type="error"
                :closable="false"
                show-icon
                :title="errorMessage"
            />

            <div v-if="loading" class="atlas-loading">
                <el-skeleton :rows="6" animated />
            </div>

            <div v-else-if="!filteredEntries.length" class="atlas-empty">
                <el-empty description="没有符合条件的图鉴内容" />
            </div>

            <div v-else class="atlas-grid">
                <article
                    v-for="entry in filteredEntries"
                    :key="entry.key"
                    class="atlas-card"
                    role="button"
                    tabindex="0"
                    @click="openCreatureDetail(entry)"
                    @keyup.enter="openCreatureDetail(entry)"
                    @keyup.space.prevent="openCreatureDetail(entry)"
                >
                    <div class="atlas-card-id">#{{ entry.id }}</div>

                    <div class="atlas-main-image-wrap">
                        <img
                            v-if="entry.imageUrl"
                            class="atlas-main-image"
                            :src="entry.imageUrl"
                            :alt="entry.imageAlt"
                            loading="lazy"
                        />
                        <div v-else class="atlas-image-placeholder">
                            暂无图片
                        </div>
                    </div>

                    <h3 class="atlas-card-name">{{ entry.name }}</h3>

                    <div class="atlas-attribute-list">
                        <span
                            v-for="attribute in entry.attributes"
                            :key="`${entry.key}-${attribute}`"
                            class="atlas-attribute-tag"
                        >
                            {{ attribute }}
                        </span>
                        <span
                            v-if="!entry.attributes.length"
                            class="atlas-attribute-tag is-empty"
                        >
                            未知属性
                        </span>
                    </div>
                </article>
            </div>
        </section>
    </main>
</template>

<style scoped>
.egg-atlas-page {
    width: min(100%, 1180px);
    margin: 0 auto;
}

.atlas-filter-card,
.atlas-list-card {
    overflow: hidden;
}

.atlas-hero-divider {
    margin: 0 8px;
    opacity: 0.55;
}

.atlas-filter-toolbar {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.atlas-filter-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 14px;
}

.atlas-filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.atlas-filter-item-search {
    grid-column: 1 / -1;
}

.atlas-filter-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--app-primary, #3f83bd);
}

.atlas-search-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
}

.atlas-search-row :deep(.el-input) {
    flex: 1 1 auto;
    min-width: 0;
}

.atlas-filter-item-switch {
    justify-content: flex-end;
}

.atlas-switch-wrap {
    min-height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(248, 250, 252, 0.85);
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.atlas-switch-tip {
    font-size: 13px;
    color: #475569;
}

.atlas-alert {
    margin-bottom: 20px;
}

.atlas-loading,
.atlas-empty {
    padding: 12px 0 4px;
}

.atlas-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.atlas-card {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.78),
        rgba(255, 255, 255, 0.58)
    );
    box-shadow:
        0 10px 24px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    backdrop-filter: blur(12px) saturate(145%);
    -webkit-backdrop-filter: blur(12px) saturate(145%);
}

.atlas-card:hover,
.atlas-card:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(96, 165, 250, 0.28);
    box-shadow:
        0 14px 28px rgba(15, 23, 42, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    outline: none;
}

.atlas-card-id {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(63, 131, 189, 0.12);
    color: var(--app-primary, #3f83bd);
    font-weight: 700;
    font-size: 12px;
}

.atlas-main-image-wrap {
    width: 100%;
    min-height: 92px;
    border-radius: 14px;
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    border: 1px solid rgba(191, 219, 254, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
}

.atlas-main-image {
    width: 100%;
    max-width: 78px;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;
}

.atlas-image-placeholder {
    color: #94a3b8;
    font-size: 12px;
}

.atlas-card-name {
    margin: 0;
    font-size: 14px;
    line-height: 1.35;
    color: var(--app-title, #1f2937);
    word-break: break-word;
}

.atlas-attribute-list {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
}

.atlas-attribute-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
}

.atlas-attribute-tag.is-empty {
    color: #64748b;
    background: rgba(148, 163, 184, 0.12);
}

:global(.page.theme-dark) .atlas-card {
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

:global(.page.theme-dark) .atlas-card-name {
    color: #e5eefb;
}

:global(.page.theme-dark) .atlas-card-id {
    background: rgba(96, 165, 250, 0.16);
    color: #bfdbfe;
}

:global(.page.theme-dark) .atlas-main-image-wrap {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.2);
}

:global(.page.theme-dark) .atlas-attribute-tag {
    background: rgba(59, 130, 246, 0.2);
    color: #bfdbfe;
}

:global(.page.theme-dark) .atlas-attribute-tag.is-empty {
    color: #cbd5e1;
    background: rgba(148, 163, 184, 0.12);
}

:global(.page.theme-dark) .atlas-switch-wrap {
    background: rgba(30, 41, 59, 0.62);
    border-color: rgba(96, 165, 250, 0.12);
}

:global(.page.theme-dark) .atlas-switch-tip {
    color: #cbd5e1;
}

@media (min-width: 860px) {
    .atlas-filter-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .atlas-filter-item-switch {
        align-self: end;
    }

    .atlas-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .atlas-main-image {
        max-width: 88px;
    }
}

@media (min-width: 1200px) {
    .atlas-grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .atlas-search-row {
        gap: 8px;
    }

    .atlas-card {
        padding: 10px 8px;
    }

    .atlas-main-image-wrap {
        min-height: 84px;
    }

    .atlas-main-image {
        max-width: 72px;
    }
}
</style>
