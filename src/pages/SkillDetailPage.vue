<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import "../styles/tool-pages.css";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const errorMessage = ref("");
const skill = ref(null);
const creatureMap = ref(new Map());

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

function toSkillIconUrl(fileName) {
    const text = String(fileName || "").trim();
    return text ? `/skill-icons/${text}` : "";
}

function toCreatureImageUrl(fileName) {
    const text = String(fileName || "").trim();
    return text ? `/creature-atlas/${text}` : "";
}

function normalizeLearner(rawItem) {
    return {
        refType: String(rawItem?.refType || "").trim(),
        creatureId: String(rawItem?.creatureId || "").trim(),
        creatureName: String(rawItem?.creatureName || "").trim(),
        displayName: String(rawItem?.displayName || "").trim(),
        formName: String(rawItem?.formName || "").trim(),
    };
}

function normalizeSkill(rawItem) {
    const learners = Array.isArray(rawItem?.learners) ? rawItem.learners : [];

    return {
        skillId: String(rawItem?.skillId || "").trim(),
        skillNumber: toSkillNumber(rawItem?.skillId),
        name: String(rawItem?.name || "未命名技能").trim(),
        attribute: String(rawItem?.attribute || "").trim(),
        category: String(rawItem?.category || "").trim(),
        icon: String(rawItem?.icon || "").trim(),
        energyCost: Number(rawItem?.energyCost ?? 0),
        power: Number(rawItem?.power ?? 0),
        effect: String(rawItem?.effect || "").trim(),
        learnerCount: Number(rawItem?.learnerCount ?? learners.length),
        resolvedLearnerCount: Number(rawItem?.resolvedLearnerCount ?? 0),
        unmatchedLearnerCount: Number(rawItem?.unmatchedLearnerCount ?? 0),
        learners: learners.map((item) => normalizeLearner(item)),
    };
}

function normalizeCreature(rawItem) {
    if (!rawItem || typeof rawItem !== "object") return null;

    return {
        id: String(rawItem?.id || "").trim(),
        name: String(rawItem?.name || "").trim(),
        images: {
            default: String(rawItem?.images?.default || "").trim(),
            base: String(rawItem?.images?.base || "").trim(),
            forms: rawItem?.images?.forms || {},
            bossForms: rawItem?.images?.bossForms || {},
            bossFormVariants: rawItem?.images?.bossFormVariants || {},
        },
    };
}

function parseLearnerDisplayName(displayName, creatureName) {
    const fullName = String(displayName || "").trim();
    const baseName = String(creatureName || "").trim();

    if (!fullName) {
        return {
            title: baseName || "未知精灵",
            subtitle: "",
        };
    }

    if (baseName && fullName.startsWith(baseName)) {
        const suffix = fullName.slice(baseName.length).trim();
        const cleaned =
            suffix.startsWith("（") && suffix.endsWith("）")
                ? suffix.slice(1, -1).trim()
                : suffix;

        return {
            title: baseName,
            subtitle: cleaned,
        };
    }

    return {
        title: fullName,
        subtitle: "",
    };
}

function normalizeFormLabel(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/\(/g, "（")
        .replace(/\)/g, "）")
        .replace(/时的样子/g, "期的样子");
}

function extractDisplayFormName(displayName, creatureName) {
    const fullName = String(displayName || "").trim();
    const baseName = String(creatureName || "").trim();

    if (!fullName) return "";

    if (baseName && fullName.startsWith(baseName)) {
        const suffix = fullName.slice(baseName.length).trim();
        if (suffix.startsWith("（") && suffix.endsWith("）")) {
            return suffix.slice(1, -1).trim();
        }
        if (suffix.startsWith("(") && suffix.endsWith(")")) {
            return suffix.slice(1, -1).trim();
        }
    }

    const bracketMatch = fullName.match(/[（(]([^（）()]+)[）)]/);
    return bracketMatch ? String(bracketMatch[1] || "").trim() : "";
}

function buildLearnerFormCandidates(learner) {
    const candidates = [
        String(learner?.formName || "").trim(),
        extractDisplayFormName(learner?.displayName, learner?.creatureName),
    ].filter(Boolean);

    return [...new Set(candidates)];
}

function findImageByFormCandidates(imageMap, candidates) {
    const entries = Object.entries(imageMap || {}).filter(([, fileName]) =>
        String(fileName || "").trim(),
    );

    if (!entries.length || !candidates.length) return "";

    for (const candidate of candidates) {
        const exactMatched = imageMap?.[candidate];
        if (exactMatched) {
            return toCreatureImageUrl(exactMatched);
        }
    }

    const normalizedCandidates = candidates.map((item) => ({
        raw: item,
        normalized: normalizeFormLabel(item),
    }));

    for (const [label, fileName] of entries) {
        const normalizedLabel = normalizeFormLabel(label);
        const matched = normalizedCandidates.some(
            (item) => item.normalized && item.normalized === normalizedLabel,
        );

        if (matched) {
            return toCreatureImageUrl(fileName);
        }
    }

    return "";
}

function resolveLearnerImage(learner) {
    const creatureId = String(learner?.creatureId || "").trim();
    const refType = String(learner?.refType || "").trim();
    const creature = creatureMap.value.get(creatureId);
    const formCandidates = buildLearnerFormCandidates(learner);

    if (!creature) return "";

    if (refType === "form") {
        const matchedImage = findImageByFormCandidates(
            creature.images.forms,
            formCandidates,
        );

        if (matchedImage) return matchedImage;
    }

    if (refType === "boss") {
        const matchedImage = findImageByFormCandidates(
            creature.images.bossForms,
            formCandidates,
        );

        if (matchedImage) return matchedImage;
    }

    if (refType === "boss-variant") {
        for (const variants of Object.values(
            creature.images.bossFormVariants || {},
        )) {
            const matchedImage = findImageByFormCandidates(
                variants,
                formCandidates,
            );

            if (matchedImage) return matchedImage;
        }
    }

    return toCreatureImageUrl(
        creature.images.default || creature.images.base || "",
    );
}

const pageTitle = computed(() =>
    skill.value ? `${skill.value.name} · 技能详情` : "技能详情",
);

const skillTags = computed(() => {
    if (!skill.value) return [];
    return [
        {
            key: "attribute",
            label: getAttributeLabel(skill.value.attribute),
        },
        {
            key: "category",
            label: getCategoryLabel(skill.value.category),
        },
    ];
});

const learnerItems = computed(() => {
    if (!skill.value) return [];

    return skill.value.learners.map((item, index) => {
        const parsed = parseLearnerDisplayName(
            item.displayName,
            item.creatureName,
        );

        return {
            key: `${skill.value.skillId}:${item.creatureId}:${index}`,
            creatureId: item.creatureId,
            title: parsed.title,
            subtitle: parsed.subtitle,
            displayName: item.displayName || item.creatureName || "未知精灵",
            imageUrl: resolveLearnerImage(item),
        };
    });
});

function openCreature(item) {
    const creatureId = String(item?.creatureId || "").trim();
    if (!creatureId) return;

    router.push({
        path: `/atlas/${creatureId}`,
    });
}

async function loadSkillDetail() {
    loading.value = true;
    errorMessage.value = "";
    skill.value = null;
    creatureMap.value = new Map();

    try {
        const skillId = String(route.params.id || "").trim();

        if (!skillId) {
            throw new Error("缺少技能编号");
        }

        const [skillResponse, creatureResponse] = await Promise.all([
            fetch("/data/skills-master-list.json", {
                cache: "no-cache",
            }),
            fetch("/data/creatures-master-list.json", {
                cache: "no-cache",
            }),
        ]);

        if (!skillResponse.ok) {
            throw new Error(`技能详情数据加载失败：${skillResponse.status}`);
        }

        if (!creatureResponse.ok) {
            throw new Error(`精灵主表数据加载失败：${creatureResponse.status}`);
        }

        const skillData = await skillResponse.json();
        const creatureData = await creatureResponse.json();

        const skillList = Array.isArray(skillData?.skills)
            ? skillData.skills
            : [];
        const matchedSkill = skillList.find(
            (item) => String(item?.skillId || "").trim() === skillId,
        );

        if (!matchedSkill) {
            throw new Error(`未找到编号为 ${skillId} 的技能`);
        }

        const creatures = Array.isArray(creatureData?.creatures)
            ? creatureData.creatures
            : [];

        creatureMap.value = new Map(
            creatures
                .map((item) => normalizeCreature(item))
                .filter((item) => item?.id)
                .map((item) => [item.id, item]),
        );

        skill.value = normalizeSkill(matchedSkill);
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "技能详情数据加载失败";
    } finally {
        loading.value = false;
    }
}

watch(
    () => pageTitle.value,
    (value) => {
        if (typeof document === "undefined") return;
        document.title = value || "技能详情";
    },
    { immediate: true },
);

watch(
    () => route.params.id,
    () => {
        loadSkillDetail();
    },
);

onMounted(() => {
    loadSkillDetail();
});
</script>

<template>
    <main class="panel skill-detail-page tool-page">
        <section
            v-if="errorMessage"
            class="search-card skill-detail-state-card"
        >
            <el-alert
                type="error"
                :closable="false"
                show-icon
                :title="errorMessage"
            />
        </section>

        <section
            v-else-if="loading"
            class="search-card skill-detail-state-card"
        >
            <el-skeleton :rows="12" animated />
        </section>

        <template v-else-if="skill">
            <section class="search-card skill-detail-overview-card">
                <div class="skill-summary-card">
                    <div class="skill-summary-head">
                        <div class="skill-summary-media">
                            <div class="skill-summary-icon-wrap">
                                <img
                                    v-if="skill.icon"
                                    class="skill-summary-icon"
                                    :src="toSkillIconUrl(skill.icon)"
                                    :alt="`${skill.name} 图标`"
                                />
                                <div
                                    v-else
                                    class="skill-summary-icon-placeholder"
                                >
                                    技能图标
                                </div>
                            </div>

                            <h1 class="skill-summary-title">
                                {{ skill.name }}
                            </h1>
                        </div>

                        <div class="skill-summary-body">
                            <div class="skill-summary-effect-card">
                                <div class="skill-panel-head">
                                    <h2>技能效果</h2>
                                </div>
                                <p class="skill-effect-text">
                                    {{ skill.effect || "暂无技能说明" }}
                                </p>
                            </div>

                            <div class="skill-summary-info-grid">
                                <div
                                    v-for="tag in skillTags"
                                    :key="tag.key"
                                    class="skill-summary-info-card"
                                >
                                    <span class="skill-summary-info-label">
                                        {{
                                            tag.key === "attribute"
                                                ? "属性"
                                                : "分类"
                                        }}
                                    </span>
                                    <span class="skill-summary-info-value">
                                        {{ tag.label }}
                                    </span>
                                </div>

                                <div class="skill-summary-info-card">
                                    <span class="skill-summary-info-label">
                                        耗能
                                    </span>
                                    <span class="skill-summary-info-value">
                                        {{ skill.energyCost }}
                                    </span>
                                </div>

                                <div class="skill-summary-info-card">
                                    <span class="skill-summary-info-label">
                                        威力
                                    </span>
                                    <span class="skill-summary-info-value">
                                        {{ skill.power }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="search-card skill-learner-card">
                <div class="section-title-row">
                    <div class="skill-panel-head">
                        <span class="skill-panel-kicker">学习者列表</span>
                        <h2>全部学习者</h2>
                    </div>
                </div>

                <div v-if="learnerItems.length" class="skill-learner-grid">
                    <button
                        v-for="item in learnerItems"
                        :key="item.key"
                        class="skill-learner-item"
                        type="button"
                        @click="openCreature(item)"
                    >
                        <div class="skill-learner-image-wrap">
                            <img
                                v-if="item.imageUrl"
                                class="skill-learner-image"
                                :src="item.imageUrl"
                                :alt="`${item.displayName} 图像`"
                                loading="lazy"
                            />
                            <div v-else class="skill-learner-image-placeholder">
                                暂无图片
                            </div>
                        </div>

                        <div class="skill-learner-text">
                            <h3 class="skill-learner-name">
                                {{ item.title }}
                            </h3>
                            <p
                                v-if="item.subtitle"
                                class="skill-learner-suffix"
                            >
                                {{ item.subtitle }}
                            </p>
                        </div>
                    </button>
                </div>

                <el-empty v-else description="当前技能暂无学习者数据" />
            </section>
        </template>
    </main>
</template>

<style scoped>
.skill-detail-page {
    width: min(100%, 1180px);
    margin: 0 auto;
}

.skill-detail-overview-card,
.skill-learner-card,
.skill-detail-state-card {
    overflow: hidden;
}

.skill-summary-card,
.skill-learner-item {
    border-radius: 24px;
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.26),
        rgba(255, 255, 255, 0.1)
    );
    border: 1px solid rgba(255, 255, 255, 0.24);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.24),
        0 14px 30px rgba(15, 23, 42, 0.14);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.skill-summary-card {
    padding: 24px;
}

.skill-summary-head {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
}

.skill-summary-media {
    display: grid;
    gap: 14px;
    justify-items: center;
    text-align: center;
}

.skill-summary-icon-wrap {
    width: 140px;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.skill-summary-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.skill-summary-icon-placeholder,
.skill-learner-image-placeholder {
    font-size: 12px;
    color: var(--app-text-muted, #6b7280);
    font-weight: 700;
    text-align: center;
}

.skill-summary-body {
    display: grid;
    gap: 16px;
    min-width: 0;
}

.skill-summary-title,
.skill-panel-head h2 {
    margin: 0;
    color: var(--tool-page-title-color, var(--app-primary, #3f83bd));
}

.skill-summary-title {
    font-size: clamp(26px, 4vw, 36px);
    line-height: 1.2;
}

.skill-summary-info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.skill-summary-info-card {
    border-radius: 18px;
    border: 1px solid rgba(191, 219, 254, 0.72);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 14px 16px;
    display: grid;
    gap: 8px;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        0 10px 20px rgba(15, 23, 42, 0.06);
}

.skill-summary-info-label {
    font-size: 12px;
    color: var(--tool-page-desc-color, var(--app-text-soft, #5f5d72));
    font-weight: 700;
    line-height: 1;
}

.skill-summary-info-value {
    font-size: 28px;
    line-height: 1.1;
    font-weight: 800;
    color: var(--app-primary, #2563eb);
    word-break: break-word;
}

.skill-panel-kicker,
.skill-learner-suffix {
    color: var(--tool-page-desc-color, var(--app-text-soft, #5f5d72));
}

.skill-effect-text {
    margin: 0;
    line-height: 1.85;
}

.skill-panel-head {
    display: grid;
    gap: 4px;
}

.skill-panel-kicker {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.skill-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.skill-stat-card {
    border-radius: 18px;
    border: 1px solid rgba(191, 219, 254, 0.72);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.skill-stat-card-label {
    font-size: 12px;
    color: var(--app-text-muted, #64748b);
}

.skill-stat-card-value {
    font-size: 20px;
    font-weight: 800;
    line-height: 1.2;
    color: var(--app-primary, #2563eb);
}

.skill-summary-effect-card {
    border-radius: 20px;
    border: 1px solid rgba(191, 219, 254, 0.72);
    padding: 18px 20px;
    display: grid;
    gap: 12px;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        0 10px 20px rgba(15, 23, 42, 0.06);
}

.skill-effect-text,
.skill-learner-name {
    color: var(--app-text, #1a1b21);
}

.skill-learner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 12px;
}

.skill-learner-item {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    cursor: pointer;
}

.skill-learner-image-wrap {
    flex: 0 0 76px;
    width: 76px;
    height: 76px;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff, #eef5ff);
    border: 1px solid rgba(191, 219, 254, 0.62);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    overflow: hidden;
}

.skill-learner-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.skill-learner-text {
    min-width: 0;
    display: grid;
    gap: 4px;
}

.skill-learner-name {
    margin: 0;
    font-size: 16px;
    line-height: 1.35;
    word-break: break-word;
}

.skill-learner-suffix {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
}

:global(.page.theme-dark) .skill-summary-card,
:global(.page.theme-dark) .skill-learner-item {
    border: 1px solid rgba(148, 163, 184, 0.16);
    background: linear-gradient(
        180deg,
        rgba(15, 23, 42, 0.34),
        rgba(15, 23, 42, 0.16)
    );
    box-shadow:
        0 18px 36px rgba(2, 6, 23, 0.38),
        inset 0 1px 0 rgba(148, 163, 184, 0.1);
}

:global(.page.theme-dark) .skill-learner-image-wrap {
    background: var(
        --app-item-bg-soft,
        linear-gradient(180deg, #111827, #0b1220)
    );
    border-color: rgba(148, 163, 184, 0.18);
}

:global(.page.theme-dark) .skill-summary-title,
:global(.page.theme-dark) .skill-panel-head h2,
:global(.page.theme-dark) .skill-effect-text,
:global(.page.theme-dark) .skill-learner-name {
    color: var(--app-text, #e5e7eb);
}

:global(.page.theme-dark) .skill-panel-kicker,
:global(.page.theme-dark) .skill-learner-suffix,
:global(.page.theme-dark) .skill-stat-card-label,
:global(.page.theme-dark) .skill-summary-icon-placeholder,
:global(.page.theme-dark) .skill-learner-image-placeholder {
    color: var(--app-text-soft, #d5deea);
}

:global(.page.theme-dark) .skill-summary-info-card {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.22);
    box-shadow:
        inset 0 1px 0 rgba(148, 163, 184, 0.08),
        0 12px 22px rgba(2, 6, 23, 0.22);
}

:global(.page.theme-dark) .skill-summary-info-label {
    color: var(--app-text-soft, #d5deea);
}

:global(.page.theme-dark) .skill-summary-info-value {
    color: #bfdbfe;
}

:global(.page.theme-dark) .skill-stat-card,
:global(.page.theme-dark) .skill-summary-effect-card {
    background: linear-gradient(
        180deg,
        rgba(30, 41, 59, 0.95),
        rgba(15, 23, 42, 0.9)
    );
    border-color: rgba(96, 165, 250, 0.22);
}

:global(.page.theme-dark) .skill-stat-card-value {
    color: #bfdbfe;
}

@media (max-width: 767px) {
    .skill-summary-card {
        padding: 20px;
    }

    .skill-summary-head {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .skill-summary-media {
        justify-items: center;
    }

    .section-title-row {
        justify-content: center;
    }

    .skill-summary-info-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .skill-summary-effect-card {
        text-align: left;
    }

    .skill-stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .skill-learner-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 479px) {
    .skill-summary-info-grid,
    .skill-stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>
