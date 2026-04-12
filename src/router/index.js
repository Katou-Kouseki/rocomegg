import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import EggSizePage from "../pages/EggSizePage.vue";
import EggGroupPage from "../pages/EggGroupPage.vue";
import EggBreedingPage from "../pages/EggBreedingPage.vue";
import EggShinyPage from "../pages/EggShinyPage.vue";
import EggAtlasPage from "../pages/EggAtlasPage.vue";
import CreatureDetailPage from "../pages/CreatureDetailPage.vue";
import SkillAtlasPage from "../pages/SkillAtlasPage.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
    meta: {
      title: "洛克星盘-洛克王国世界工具站",
    },
  },
  {
    path: "/size",
    name: "size",
    component: EggSizePage,
    meta: {
      title: "精灵蛋尺寸查询",
    },
  },
  {
    path: "/group",
    name: "group",
    component: EggGroupPage,
    meta: {
      title: "精灵蛋蛋组查询",
    },
  },
  {
    path: "/breeding",
    name: "breeding",
    component: EggBreedingPage,
    meta: {
      title: "精灵蛋繁殖查询",
    },
  },
  {
    path: "/shiny",
    name: "shiny",
    component: EggShinyPage,
    meta: {
      title: "精灵蛋异色孵化",
    },
  },
  {
    path: "/atlas",
    name: "atlas",
    component: EggAtlasPage,
    meta: {
      title: "精灵图鉴",
    },
  },
  {
    path: "/atlas/:id",
    name: "atlas-detail",
    component: CreatureDetailPage,
    meta: {
      title: "精灵详情",
    },
  },
  {
    path: "/skills",
    name: "skills",
    component: SkillAtlasPage,
    meta: {
      title: "技能图鉴",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (typeof document === "undefined") return;
  const pageTitle = to.meta?.title
    ? String(to.meta.title)
    : "洛克星盘-洛克王国世界工具站";
  document.title = pageTitle;
});

export default router;
