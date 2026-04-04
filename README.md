# 洛克王国世界精灵蛋查询站

一个基于 **Vue 3 + Vite + Element Plus** 的前端静态网站。  
核心功能：输入精灵蛋的 **直径（m）** 与 **重量（kg）**，返回可能孵化的候选精灵与概率。

- 在线地址（GitHub Pages）：`https://mfskys.github.io/rocomegg/`

---

## 1. 技术栈

- **Vue 3**：页面框架
- **Vite**：开发与构建工具
- **Element Plus**：UI 组件库
- **JSON（public/data）**：静态数据存储
- **GitHub Pages + GitHub Actions**：自动部署

---

## 2. 目录结构

```text
rock-egg-table/
├─ .github/
│  ├─ dependabot.yml
│  └─ workflows/
│     └─ deploy-pages.yml          # GitHub Actions 自动部署工作流
├─ public/
│  ├─ rocom.ico
│  └─ data/
│     ├─ creatures-master-list.json
│     └─ egg-measurements-final.json
├─ src/
│  ├─ App.vue
│  ├─ main.js
│  └─ style.css
├─ index.html
├─ vite.config.js
├─ LICENSE
└─ package.json
```

---

## 3. 本地开发

> 建议 Node.js 版本：18+

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:5173/`

### 本地构建与预览

```bash
npm run build
npm run preview
```

---

## 4. License

本项目使用 **MIT License**。