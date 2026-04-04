# 洛克王国世界精灵蛋查询站

一个基于 **Vue 3 + Vite + Element Plus** 的前端静态网站。  
核心功能：输入精灵蛋的 **直径（m）** 与 **重量（kg）**，返回可能孵化的候选精灵与概率。

- 在线地址（GitHub Pages）：`https://mfskys.github.io/rocomegg/`
- 仓库地址：`https://github.com/mfskys/rocomegg`

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

## 4. GitHub Actions 自动部署（推荐）

本项目使用 **GitHub Actions 自动发布到 GitHub Pages**。  
以后只需要 `git push` 到 `main`，GitHub 会自动构建并部署。

### 4.1 首次配置（只做一次）

进入仓库：

`Settings -> Pages -> Build and deployment`

- Source 选择：`GitHub Actions`

然后检查仓库权限：

`Settings -> Actions -> General`

- Workflow permissions 选择：`Read and write permissions`
- 勾选：`Allow GitHub Actions to create and approve pull requests`（可选）

### 4.2 自动部署触发方式

以下行为会触发自动部署：

- Push 到 `main` 分支
- 在 GitHub Actions 页面手动运行 workflow（若配置了 `workflow_dispatch`）

---

## 5. 手动部署（兼容旧流程）

项目仍保留了 `gh-pages` 脚本，如需手动发布可执行：

```bash
npm run deploy
```

> 建议优先使用 GitHub Actions 自动部署，减少人工操作。

---

## 6. 重要配置说明

### `vite.config.js` 中 `base` 必须与仓库名一致

仓库名为 `rocomegg` 时，应配置：

```js
base: '/rocomegg/'
```

否则上线后可能出现资源 404 或白屏。

---

## 7. 数据维护说明

### 数据文件

- `public/data/egg-measurements-final.json`：查询使用的正式数据
- `public/data/creatures-master-list.json`：精灵主清单（用于编号映射）

### 建议规范

- 直径单位：`m`
- 重量单位：`kg`
- 范围支持格式：如 `0.45~0.65`、`1.17-1.25`、`3.2`

---

## 8. 图标（Favicon）

当前站点图标使用：

- `public/rocom.ico`

若要替换图标，直接覆盖该文件并推送到 `main`，Actions 会自动发布。

---

## 9. 常见问题

### Q1：页面提示“数据加载失败，请检查 public/data/*.json”
常见原因：

- `base` 配置与仓库名不一致
- 数据文件名或路径错误
- 部署尚未完成或缓存未刷新

建议排查：

1. 检查 `vite.config.js` 的 `base`
2. 检查 `public/data` 文件是否存在
3. 查看 `Actions` 页面是否构建成功
4. 浏览器强刷（`Ctrl + F5`）

### Q2：推送后页面没更新
- 打开 `Actions` 页面确认 workflow 是否完成
- 等待 1~3 分钟后再访问
- 强刷浏览器缓存

### Q3：自定义域名如何绑定
1. 域名服务商添加 DNS（通常为 `CNAME -> mfskys.github.io`）
2. GitHub `Settings -> Pages` 填写 `Custom domain`
3. 仓库中添加 `public/CNAME`（内容为你的域名）

---

## 10. License

本项目使用 **MIT License**。