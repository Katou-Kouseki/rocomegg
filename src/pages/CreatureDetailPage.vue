<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import "../styles/tool-pages.css";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const errorMessage = ref("");
const creature = ref(null);
const creatureMap = ref(new Map());
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
                            ] ?? raceStats.bossForms?.[bossLabel],
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

function formatDisplayName(baseName, formKey, formTitle) {
    const resolvedBaseName =
        String(baseName || "未知精灵").trim() || "未知精灵";
    const parsed = parseFormKey(formKey);
    const resolvedTitle = String(formTitle || "").trim();

    if (parsed.type === "default") {
        return resolvedBaseName;
    }

    if (parsed.type === "form") {
        return `${resolvedBaseName}·${resolvedTitle || parsed.label || "未命名形态"}`;
    }

    return resolvedTitle || resolvedBaseName;
}

const currentDisplayName = computed(() => {
    if (!creature.value) return "";
    if (!currentForm.value) return creature.value.name;

    return formatDisplayName(
        creature.value.name,
        currentForm.value.key,
        currentForm.value.title,
    );
});

const currentStatItems = computed(() =>
    currentForm.value?.stats ? toStatItems(currentForm.value.stats) : [],
);

function parseFormKey(rawKey) {
    const key = String(rawKey || "default").trim() || "default";

    if (key === "default") {
        return {
            raw: "default",
            type: "default",
            label: "",
            bossLabel: "",
            variantLabel: "",
        };
    }

    if (key.startsWith("form:")) {
        return {
            raw: key,
            type: "form",
            label: key.slice(5).trim(),
            bossLabel: "",
            variantLabel: "",
        };
    }

    if (key.startsWith("boss:")) {
        return {
            raw: key,
            type: "boss",
            label: key.slice(5).trim(),
            bossLabel: "",
            variantLabel: "",
        };
    }

    if (key.startsWith("boss-variant:")) {
        const rest = key.slice(13);
        const separatorIndex = rest.indexOf(":");
        const bossLabel =
            separatorIndex >= 0 ? rest.slice(0, separatorIndex).trim() : "";
        const variantLabel =
            separatorIndex >= 0
                ? rest.slice(separatorIndex + 1).trim()
                : rest.trim();

        return {
            raw: key,
            type: "boss-variant",
            label: variantLabel,
            bossLabel,
            variantLabel,
        };
    }

    return {
        raw: key,
        type: "unknown",
        label: key,
        bossLabel: "",
        variantLabel: "",
    };
}

function getCurrentSkillIds() {
    if (!learnsetEntry.value) return [];

    const entry = learnsetEntry.value;
    const selectedKey = String(currentForm.value?.key || "default").trim();
    const parsed = parseFormKey(selectedKey);

    if (parsed.type === "form") {
        const formSkills = entry.forms?.[parsed.label];
        if (Array.isArray(formSkills) && formSkills.length) {
            return formSkills;
        }
    }

    if (parsed.type === "boss") {
        const bossSkills = entry.bossForms?.[parsed.label];
        if (Array.isArray(bossSkills) && bossSkills.length) {
            return bossSkills;
        }
    }

    if (parsed.type === "boss-variant") {
        const variantSkills =
            entry.bossFormVariants?.[parsed.bossLabel]?.[parsed.variantLabel];
        if (Array.isArray(variantSkills) && variantSkills.length) {
            return variantSkills;
        }

        const bossSkills = entry.bossForms?.[parsed.bossLabel];
        if (Array.isArray(bossSkills) && bossSkills.length) {
            return bossSkills;
        }
    }

    return Array.isArray(entry.default) ? entry.default : [];
}

const skillSectionList = computed(() => {
    if (!learnsetEntry.value) return [];

    const skills = getCurrentSkillIds()
        .map((skillId) => skillMap.value.get(String(skillId || "").trim()))
        .filter(Boolean);

    if (!skills.length) return [];

    return [
        {
            key:
                String(currentForm.value?.key || "default").trim() || "default",
            title: currentDisplayName.value || "当前形态",
            skills,
        },
    ];
});

function normalizeStageForms(stage, stageName) {
    const forms = Array.isArray(stage?.forms)
        ? stage.forms.map((form) => ({
              key: String(form?.key || "").trim(),
              name: String(form?.name || "未命名形态").trim(),
              type: String(form?.type || "").trim(),
          }))
        : [];

    const defaultForm = forms.find((form) => form.key === "default") || {
        key: "default",
        name: stageName,
        type: "default",
    };

    return { forms, defaultForm };
}

function resolveEvolutionItemImage(stageId, formKey) {
    const entry = creatureMap.value.get(String(stageId || "").trim());

    if (!entry) return "";

    const key = String(formKey || "default").trim() || "default";
    const parsed = parseFormKey(key);

    if (parsed.type === "default") {
        return toImageUrl(entry.images.default || entry.images.base || "");
    }

    if (parsed.type === "form") {
        return toImageUrl(entry.images.forms?.[parsed.label] || "");
    }

    if (parsed.type === "boss") {
        return toImageUrl(entry.images.bossForms?.[parsed.label] || "");
    }

    if (parsed.type === "boss-variant") {
        return toImageUrl(
            entry.images.bossFormVariants?.[parsed.bossLabel]?.[
                parsed.variantLabel
            ] || "",
        );
    }

    return toImageUrl(entry.images.default || entry.images.base || "");
}

function createEvolutionDisplayItem(
    stageId,
    stageName,
    form,
    selectedKey,
    isCurrentCreature,
) {
    const formKey = String(form?.key || "default").trim() || "default";
    const rawFormName = String(form?.name || "").trim();
    const displayName =
        formKey === "default"
            ? stageName
            : formatDisplayName(stageName, formKey, rawFormName || stageName);

    return {
        id: stageId,
        name: displayName,
        imageUrl: resolveEvolutionItemImage(stageId, formKey),
        active: isCurrentCreature && formKey === selectedKey,
        isCurrentCreature,
        formKey,
    };
}

function pushEvolutionDisplayItem(
    result,
    stageId,
    stageName,
    form,
    selectedKey,
    isCurrentCreature,
) {
    if (!form) return;

    const nextItem = createEvolutionDisplayItem(
        stageId,
        stageName,
        form,
        selectedKey,
        isCurrentCreature,
    );
    const duplicated = result.some(
        (item) => item.id === nextItem.id && item.formKey === nextItem.formKey,
    );

    if (!duplicated) {
        result.push(nextItem);
    }
}

function resolveStageFormForSelection(stage, selectedKey, currentCreatureId) {
    const stageId = String(stage?.id || "").trim();
    const stageName = String(stage?.name || "未知精灵").trim();
    const isCurrentCreature = stageId === currentCreatureId;
    const parsed = parseFormKey(selectedKey);
    const { forms, defaultForm } = normalizeStageForms(stage, stageName);
    const exactMatch = forms.find((form) => form.key === selectedKey);
    const sameFormMatch =
        parsed.type === "form" && parsed.label
            ? forms.find((form) => form.key === `form:${parsed.label}`)
            : null;
    const sameBossMatch =
        parsed.type === "boss" && parsed.label
            ? forms.find((form) => form.key === `boss:${parsed.label}`)
            : null;
    const sameBossVariantMatch =
        parsed.type === "boss-variant" &&
        parsed.bossLabel &&
        parsed.variantLabel
            ? forms.find(
                  (form) =>
                      form.key ===
                      `boss-variant:${parsed.bossLabel}:${parsed.variantLabel}`,
              )
            : null;
    const relatedFormMatch =
        parsed.type === "boss-variant" && parsed.variantLabel
            ? forms.find((form) => form.key === `form:${parsed.variantLabel}`)
            : null;
    const relatedBossVariantMatch =
        parsed.type === "form" && parsed.label
            ? forms.find((form) => {
                  const formInfo = parseFormKey(form.key);
                  return (
                      formInfo.type === "boss-variant" &&
                      formInfo.variantLabel === parsed.label
                  );
              })
            : null;

    const result = [];

    if (parsed.type === "default") {
        pushEvolutionDisplayItem(
            result,
            stageId,
            stageName,
            defaultForm,
            "default",
            isCurrentCreature,
        );

        forms
            .filter((form) => form.type === "boss")
            .forEach((bossForm) => {
                pushEvolutionDisplayItem(
                    result,
                    stageId,
                    stageName,
                    bossForm,
                    "default",
                    isCurrentCreature,
                );
            });

        return result;
    }

    if (parsed.type === "form") {
        pushEvolutionDisplayItem(
            result,
            stageId,
            stageName,
            sameFormMatch || defaultForm,
            selectedKey,
            isCurrentCreature,
        );

        if (sameFormMatch && relatedBossVariantMatch) {
            pushEvolutionDisplayItem(
                result,
                stageId,
                stageName,
                relatedBossVariantMatch,
                selectedKey,
                isCurrentCreature,
            );
        }

        return result;
    }

    if (parsed.type === "boss") {
        pushEvolutionDisplayItem(
            result,
            stageId,
            stageName,
            defaultForm,
            selectedKey,
            isCurrentCreature,
        );

        if (sameBossMatch) {
            pushEvolutionDisplayItem(
                result,
                stageId,
                stageName,
                sameBossMatch,
                selectedKey,
                isCurrentCreature,
            );
        }

        return result;
    }

    if (parsed.type === "boss-variant") {
        pushEvolutionDisplayItem(
            result,
            stageId,
            stageName,
            relatedFormMatch || defaultForm,
            selectedKey,
            isCurrentCreature,
        );

        if (sameBossVariantMatch || exactMatch) {
            pushEvolutionDisplayItem(
                result,
                stageId,
                stageName,
                sameBossVariantMatch || exactMatch,
                selectedKey,
                isCurrentCreature,
            );
        }

        return result;
    }

    pushEvolutionDisplayItem(
        result,
        stageId,
        stageName,
        defaultForm,
        selectedKey,
        isCurrentCreature,
    );

    if (exactMatch && exactMatch.key !== "default") {
        pushEvolutionDisplayItem(
            result,
            stageId,
            stageName,
            exactMatch,
            selectedKey,
            isCurrentCreature,
        );
    }

    return result;
}

const evolutionChainSections = computed(() => {
    if (!creature.value?.id) return [];

    const id = creature.value.id;
    const selectedKey =
        String(currentForm.value?.key || "default").trim() || "default";
    const matchedChains = evolutionChains.value.filter((chain) =>
        Array.isArray(chain)
            ? chain.some((item) => String(item?.id || "").trim() === id)
            : false,
    );

    if (!matchedChains.length) return [];

    return matchedChains
        .map((chain, index) => ({
            key: `${id}:chain:${index}`,
            title:
                matchedChains.length > 1 ? `进化分支 ${index + 1}` : "进化链",
            items: chain
                .flatMap((item) =>
                    resolveStageFormForSelection(item, selectedKey, id),
                )
                .filter(Boolean),
        }))
        .filter((section) => section.items.length);
});

function syncSelectedFormKeyFromRoute() {
    if (!formOptions.value.length) {
        selectedFormKey.value = "";
        return;
    }

    const routeFormKey = String(route.query.form || "").trim();
    const matched = formOptions.value.find((item) => item.key === routeFormKey);

    selectedFormKey.value = matched?.key || formOptions.value[0]?.key || "";
}

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
        creatureMap.value = new Map(
            creatures
                .map((item) => normalizeCreature(item))
                .filter((item) => item?.id)
                .map((item) => [item.id, item]),
        );
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

        syncSelectedFormKeyFromRoute();
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "精灵详情数据加载失败";
    } finally {
        loading.value = false;
    }
}

function openEvolutionItem(item) {
    const targetId = String(item?.id || "").trim();
    const targetFormKey = String(item?.formKey || "").trim();

    if (!targetId) return;

    if (item?.isCurrentCreature) {
        selectForm(targetFormKey || "default");
        return;
    }

    router.push({
        path: `/atlas/${targetId}`,
        query:
            targetFormKey && targetFormKey !== "default"
                ? { form: targetFormKey }
                : undefined,
    });
}

function selectForm(optionKey) {
    const key = String(optionKey || "").trim();
    if (!key || key === selectedFormKey.value) return;

    selectedFormKey.value = key;
    router.replace({
        path: route.path,
        query: {
            ...route.query,
            form: key,
        },
    });
}

watch(
    () => currentDisplayName.value,
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

watch(
    () => route.query.form,
    () => {
        if (!formOptions.value.length) return;
        syncSelectedFormKeyFromRoute();
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
                                        {{ currentDisplayName }}
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

                    <section
                        v-if="evolutionChainSections.length"
                        class="creature-current-stats-card creature-overview-stats-card"
                    >
                        <div class="section-title-row">
                            <h2>进化链</h2>
                        </div>

                        <div class="skill-section-list">
                            <section
                                v-for="section in evolutionChainSections"
                                :key="section.key"
                                class="skill-section"
                            >
                                <div class="evolution-chain">
                                    <template
                                        v-for="(item, index) in section.items"
                                        :key="`${section.key}:${item.id}:${item.formKey || 'base'}:${item.name}`"
                                    >
                                        <button
                                            class="evolution-card"
                                            :class="{
                                                'is-active': item.active,
                                            }"
                                            type="button"
                                            @click="openEvolutionItem(item)"
                                        >
                                            <div class="gallery-image-wrap">
                                                <img
                                                    v-if="item.imageUrl"
                                                    class="gallery-image"
                                                    :src="item.imageUrl"
                                                    :alt="`${item.name} 图像`"
                                                    loading="lazy"
                                                />
                                                <div
                                                    v-else
                                                    class="creature-summary-icon-placeholder"
                                                >
                                                    暂无图片
                                                </div>
                                            </div>
                                        </button>

                                        <span
                                            v-if="
                                                index < section.items.length - 1
                                            "
                                            class="evolution-arrow"
                                        >
                                            →
                                        </span>
                                    </template>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>
            </section>

            <section
                v-if="skillSectionList.length"
                class="search-card creature-all-skills-card"
            >
                <div class="section-title-row">
                    <div class="creature-panel-head">
                        <span class="creature-panel-kicker">技能面板</span>
                        <h2>当前形态技能</h2>
                    </div>
                    <span class="section-meta">随当前形态切换</span>
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

.evolution-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    min-width: 128px;
}

.evolution-form-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 240px;
}

.evolution-form-chip {
    min-height: 32px;
    padding: 0 12px;
    font-size: 12px;
}

.evolution-card {
    border: 1px solid rgba(191, 219, 254, 0.82);
    background: linear-gradient(180deg, #f8fbff, #eef5ff);
    border-radius: 20px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 148px;
    width: 148px;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.evolution-card :deep(.gallery-image-wrap) {
    width: 100%;
    min-height: 116px;
    padding: 10px;
    border-radius: 16px;
}

.evolution-card :deep(.gallery-image) {
    max-width: 100px;
}

.evolution-card:hover,
.evolution-card.is-active {
    transform: translateY(-2px);
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
    border: 1px solid var(--tool-page-card-border);
    background: var(--tool-page-card-bg);
    box-shadow:
        inset 0 1px 0 var(--tool-page-card-highlight),
        var(--tool-page-card-shadow);
    backdrop-filter: var(--tool-page-card-blur);
    -webkit-backdrop-filter: var(--tool-page-card-blur);
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
    background: var(
        --app-item-bg-soft,
        linear-gradient(180deg, #ffffff, #f7fbff)
    );
    border: 1px solid var(--tool-page-secondary-border);
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

:global(.page.theme-dark) .skill-mini-card {
    border-color: var(--tool-page-card-dark-border);
    background: var(--tool-page-card-dark-bg);
    box-shadow:
        inset 0 1px 0 var(--tool-page-card-dark-highlight),
        var(--tool-page-card-dark-shadow);
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

:global(.page.theme-dark) .gallery-image-wrap {
    background: rgba(2, 6, 23, 0.24);
    border-color: rgba(96, 165, 250, 0.16);
}

:global(.page.theme-dark) .skill-mini-icon-wrap {
    background: var(--app-item-bg-soft);
    border-color: var(--tool-page-card-dark-border);
}

:global(.page.theme-dark) .evolution-form-chip {
    background: rgba(59, 130, 246, 0.18);
    color: var(--tool-page-label-dark);
    border-color: rgba(96, 165, 250, 0.2);
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
