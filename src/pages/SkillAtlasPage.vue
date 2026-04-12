<script setup>
import { computed, onMounted, ref } from "vue";
import "../styles/tool-pages.css";

const loading = ref(false);
const errorMessage = ref("");
const skills = ref([]);

const searchDraft = ref("");
const searchKeyword = ref("");
const selectedAttribute = ref("");
const selectedCategory = ref("");
const learnerCountMode = ref("");

const learnerPreviewLimit = 6;

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

const attributeOrderMap = Object.freeze({
    normal: 0,
    grass: 1,
    fire: 2,
    water: 3,
    light: 4,
    earth: 5,
    ice: 6,
    dragon: 7,
    electric: 8,
    poison: 9,
    bug: 10,
    martial: 11,
    wing: 12,
    cute: 13,
    ghost: 14,
    evil: 15,
    machine: 16,
    illusion: 17,
    rock: 18,
});

function getAttributeLabel(value) {
    const text = String(value || "").trim();
    return attributeLabelMap[text] || text || "未知";
}

function getCategoryLabel(value) {
    const text = String(value || "").trim();
    return categoryLabelMap[text] || text || "未知";
}

function toSkillNumber(skillId) {
    const match = String(skillId || "").match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function normalizeSkill(rawItem) {
    const learners = Array.isArray(rawItem?.learners) ? rawItem.learners : [];
    const resolvedLearnerCount = Number(rawItem?.resolvedLearnerCount ?? 0);
    const learnerCount = Number(rawItem?.learnerCount ?? learners.length);
    const unmatchedLearnerCount = Number(rawItem?.unmatchedLearnerCount ?? 0);

    return {
        skillId: String(rawItem?.skillId || ""),
        skillNumber: toSkillNumber(rawItem?.skillId),
        name: String(rawItem?.name || "未命名技能"),
        attribute: String(rawItem?.attribute || ""),
        category: String(rawItem?.category || ""),
        icon: String(rawItem?.icon || ""),
        energyCost: Number(rawItem?.energyCost ?? 0),
        power: Number(rawItem?.power ?? 0),
        effect: String(rawItem?.effect || ""),
        learnerCount,
        resolvedLearnerCount,
        unmatchedLearnerCount,
        learners,
    };
}

const attributeOptions = computed(() => {
    const set = new Set();
    for (const item of skills.value) {
        const value = String(item.attribute || "").trim();
        if (value) set.add(value);
    }
    return [...set].sort((a, b) => {
        const orderA = attributeOrderMap[a] ?? Number.MAX_SAFE_INTEGER;
        const orderB = attributeOrderMap[b] ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return getAttributeLabel(a).localeCompare(
            getAttributeLabel(b),
            "zh-CN",
        );
    });
});

const categoryOptions = computed(() => {
    const set = new Set();
    for (const item of skills.value) {
        const value = String(item.category || "").trim();
        if (value) set.add(value);
    }
    return [...set].sort((a, b) =>
        getCategoryLabel(a).localeCompare(getCategoryLabel(b), "zh-CN"),
    );
});

const learnerCountOptions = Object.freeze([
    { label: "全部数量", value: "" },
    { label: "1-5 只", value: "few" },
    { label: "6-15 只", value: "medium" },
    { label: "16-30 只", value: "many" },
    { label: "31 只及以上", value: "massive" },
]);

function matchLearnerCountMode(count, mode) {
    if (!mode) return true;
    if (mode === "few") return count >= 1 && count <= 5;
    if (mode === "medium") return count >= 6 && count <= 15;
    if (mode === "many") return count >= 16 && count <= 30;
    if (mode === "massive") return count >= 31;
    return true;
}

const filteredSkills = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    const attribute = selectedAttribute.value;
    const category = selectedCategory.value;
    const countMode = learnerCountMode.value;

    return skills.value.filter((item) => {
        const keywordMatched =
            !keyword ||
            item.name.toLowerCase().includes(keyword) ||
            item.skillId.toLowerCase().includes(keyword) ||
            item.effect.toLowerCase().includes(keyword) ||
            item.learners.some((learner) =>
                String(learner?.displayName || "")
                    .toLowerCase()
                    .includes(keyword),
            );

        const attributeMatched = !attribute || item.attribute === attribute;
        const categoryMatched = !category || item.category === category;
        const learnerCountMatched = matchLearnerCountMode(
            item.resolvedLearnerCount,
            countMode,
        );

        return (
            keywordMatched &&
            attributeMatched &&
            categoryMatched &&
            learnerCountMatched
        );
    });
});

const totalSkills = computed(() => skills.value.length);
const totalFilteredSkills = computed(() => filteredSkills.value.length);
const totalResolvedLearners = computed(() =>
    skills.value.reduce(
        (sum, item) => sum + Number(item.resolvedLearnerCount || 0),
        0,
    ),
);
const totalUnmatchedLearners = computed(() =>
    skills.value.reduce(
        (sum, item) => sum + Number(item.unmatchedLearnerCount || 0),
        0,
    ),
);

function applySearch() {
    searchKeyword.value = String(searchDraft.value || "").trim();
}

function resetFilters() {
    searchDraft.value = "";
    searchKeyword.value = "";
    selectedAttribute.value = "";
    selectedCategory.value = "";
    learnerCountMode.value = "";
}

function getLearnerPreviewNames(item) {
    return item.learners.slice(0, learnerPreviewLimit).map((learner) => ({
        key: `${item.skillId}:${learner.creatureId}:${learner.displayName}`,
        name: learner.displayName || learner.creatureName || "未知精灵",
    }));
}

async function loadSkills() {
    loading.value = true;
    errorMessage.value = "";

    try {
        const response = await fetch("/data/skills-master-list.json", {
            cache: "no-cache",
        });

        if (!response.ok) {
            throw new Error(`技能图鉴数据加载失败：${response.status}`);
        }

        const data = await response.json();
        const list = Array.isArray(data?.skills) ? data.skills : [];

        skills.value = list
            .map((item) => normalizeSkill(item))
            .sort((a, b) => {
                if (a.skillNumber !== b.skillNumber) {
                    return a.skillNumber - b.skillNumber;
                }
                return a.name.localeCompare(b.name, "zh-CN");
            });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "技能图鉴数据加载失败";
        skills.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadSkills();
});
</script>

<template>
    <main class="panel skill-atlas-page tool-page">
        <section class="search-card skill-filter-card">
            <div class="skill-filter-toolbar">
                <div class="page-hero__title-row">
                    <h1 class="page-hero__title">技能图鉴</h1>
                </div>
                <div class="page-hero__meta">
                    技能总数：<span class="dataset-value">{{
                        totalSkills
                    }}</span>
                    <span class="skill-hero-divider">·</span>
                    当前显示：<span class="dataset-value">{{
                        totalFilteredSkills
                    }}</span>
                    <span class="skill-hero-divider">·</span>
                    已关联学习记录：<span class="dataset-value">{{
                        totalResolvedLearners
                    }}</span>
                    <span
                        v-if="totalUnmatchedLearners > 0"
                        class="skill-hero-divider"
                    >
                        ·
                    </span>
                    <template v-if="totalUnmatchedLearners > 0">
                        未匹配记录：<span class="dataset-value">{{
                            totalUnmatchedLearners
                        }}</span>
                    </template>
                </div>

                <div class="skill-filter-grid">
                    <div class="skill-filter-item skill-filter-item-search">
                        <label class="skill-filter-label">搜索</label>
                        <div class="skill-search-row">
                            <el-input
                                v-model="searchDraft"
                                size="large"
                                clearable
                                placeholder="输入技能名称、编号、效果或精灵名称"
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

                    <div class="skill-filter-item">
                        <label class="skill-filter-label">属性</label>
                        <el-select
                            v-model="selectedAttribute"
                            size="large"
                            placeholder="全部属性"
                            clearable
                        >
                            <el-option label="全部属性" value="" />
                            <el-option
                                v-for="attribute in attributeOptions"
                                :key="attribute"
                                :label="getAttributeLabel(attribute)"
                                :value="attribute"
                            />
                        </el-select>
                    </div>

                    <div class="skill-filter-item">
                        <label class="skill-filter-label">分类</label>
                        <el-select
                            v-model="selectedCategory"
                            size="large"
                            placeholder="全部分类"
                            clearable
                        >
                            <el-option label="全部分类" value="" />
                            <el-option
                                v-for="category in categoryOptions"
                                :key="category"
                                :label="getCategoryLabel(category)"
                                :value="category"
                            />
                        </el-select>
                    </div>
                </div>
            </div>
        </section>

        <section class="search-card skill-list-card">
            <el-alert
                v-if="errorMessage"
                class="skill-alert"
                type="error"
                :closable="false"
                show-icon
                :title="errorMessage"
            />

            <div v-if="loading" class="skill-loading">
                <el-skeleton :rows="8" animated />
            </div>

            <div v-else-if="!filteredSkills.length" class="skill-empty">
                <el-empty description="没有符合条件的技能内容" />
            </div>

            <div v-else class="skill-grid">
                <article
                    v-for="item in filteredSkills"
                    :key="item.skillId"
                    class="skill-card"
                >
                    <div class="skill-icon-wrap">
                        <img
                            v-if="item.icon"
                            class="skill-icon-image"
                            :src="`/skill-icons/${item.icon}`"
                            :alt="`${item.name} 图标`"
                            loading="lazy"
                        />
                        <div v-else class="skill-icon-placeholder">
                            技能图标
                        </div>
                    </div>

                    <h3 class="skill-card-name">{{ item.name }}</h3>

                    <div class="skill-tag-list">
                        <span class="skill-tag skill-tag-attribute">
                            {{ getAttributeLabel(item.attribute) }}
                        </span>
                        <span class="skill-tag skill-tag-category">
                            {{ getCategoryLabel(item.category) }}
                        </span>
                    </div>
                </article>
            </div>
        </section>
    </main>
</template>

<style scoped>
.skill-atlas-page {
    width: min(100%, 1180px);
    margin: 0 auto;
}

.skill-hero-divider {
    margin: 0 8px;
    opacity: 0.55;
}

.skill-filter-toolbar {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.skill-filter-title-wrap h2 {
    margin: 0 0 6px;
}

.skill-filter-title-wrap p {
    margin: 0;
    color: var(--app-text-soft, #6b7280);
    line-height: 1.7;
}

.skill-filter-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 14px;
}

.skill-filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.skill-filter-item-search {
    grid-column: 1 / -1;
}

.skill-filter-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--app-primary, #3f83bd);
}

.skill-search-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
}

.skill-search-row :deep(.el-input) {
    flex: 1 1 auto;
    min-width: 0;
}

.skill-filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.skill-alert {
    margin-bottom: 20px;
}

.skill-loading,
.skill-empty {
    padding: 12px 0 4px;
}

.skill-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
}

.skill-card {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.8),
        rgba(255, 255, 255, 0.6)
    );
    box-shadow:
        0 10px 24px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    backdrop-filter: blur(12px) saturate(145%);
    -webkit-backdrop-filter: blur(12px) saturate(145%);
}

.skill-icon-wrap {
    width: 100%;
    max-width: 84px;
    aspect-ratio: 1 / 1;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.skill-icon-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.skill-icon-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 18px;
    border: 1px dashed rgba(59, 130, 246, 0.35);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
}

.skill-tag-list {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
}

.skill-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
}

.skill-tag-attribute {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
}

.skill-tag-category {
    background: rgba(14, 165, 233, 0.1);
    color: #0f766e;
}

.skill-card-name {
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
    color: var(--app-title, #1f2937);
    word-break: break-word;
}

.skill-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.skill-stat-item {
    border-radius: 14px;
    border: 1px solid rgba(191, 219, 254, 0.8);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.skill-stat-label {
    font-size: 12px;
    color: #64748b;
}

.skill-stat-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--app-primary, #2563eb);
    line-height: 1.2;
}

:global(.page.theme-dark) .skill-filter-title-wrap p {
    color: #cbd5e1;
}

:global(.page.theme-dark) .skill-card {
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

:global(.page.theme-dark) .skill-card-name {
    color: #e5eefb;
}

:global(.page.theme-dark) .skill-card-id {
    background: rgba(96, 165, 250, 0.16);
    color: #bfdbfe;
}

:global(.page.theme-dark) .skill-tag-attribute {
    background: rgba(59, 130, 246, 0.2);
    color: #bfdbfe;
}

:global(.page.theme-dark) .skill-tag-category {
    background: rgba(20, 184, 166, 0.16);
    color: #99f6e4;
}

:global(.page.theme-dark) .skill-stat-item {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.2);
}

:global(.page.theme-dark) .skill-stat-label {
    color: #94a3b8;
}

:global(.page.theme-dark) .skill-stat-value {
    color: #bfdbfe;
}

:global(.page.theme-dark) .skill-icon-placeholder {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.26);
    color: #cbd5e1;
}

@media (min-width: 768px) {
    .skill-filter-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .skill-grid {
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    }
}

@media (min-width: 1200px) {
    .skill-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
}

@media (max-width: 767px) {
    .skill-search-row {
        gap: 8px;
    }

    .skill-stat-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 479px) {
    .skill-card {
        padding: 12px;
    }

    .skill-card-name {
        font-size: 17px;
    }

    .skill-stat-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }
}
</style>
