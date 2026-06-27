# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 项目概述

**VisualForge** — 代码驱动的视觉动画视频渲染平台。用户通过可视化时间线编辑器编排动画效果，系统使用 @napi-rs/canvas 逐帧渲染并输出 MP4 文件，同时提供 RESTful API 供程序化调用。

## 目录结构

```
├── public/                     # 静态资源
├── Dockerfile                 # Docker 镜像构建文件
├── docker-compose.yml         # Docker Compose 编排
├── .dockerignore              # Docker 构建排除
├── scripts/                    # 构建与启动脚本
│   ├── build.sh / dev.sh / start.sh
├── src/
│   ├── app/                    # 页面路由与布局
│   │   ├── page.tsx            # 首页（产品介绍）
│   │   ├── editor/page.tsx     # 编辑器页面（核心）
│   │   ├── projects/page.tsx   # 项目列表
│   │   ├── docs/page.tsx       # API 文档
│   │   ├── api/                # 后端 API 路由
│   │   │   ├── render/route.ts           # POST 提交渲染任务
│   │   │   ├── render/[id]/status/route.ts # GET 查询渲染状态
│   │   │   ├── preview-frame/route.ts    # POST 预览单帧
│   │   │   ├── themes/route.ts           # GET 主题列表
│   │   │   └── segment-types/route.ts    # GET 片段类型 Schema
│   │   ├── globals.css        # 全局样式
│   │   └── layout.tsx         # 根布局
│   ├── components/             # React 组件
│   │   ├── ui/                 # shadcn/ui 组件库
│   │   └── editor/            # 编辑器组件
│   │       ├── toolbar.tsx           # 顶部工具栏
│   │       ├── segment-library.tsx   # 左侧片段库
│   │       ├── timeline.tsx          # 时间线轨道
│   │       ├── preview-canvas.tsx    # 实时预览器
│   │       └── property-editor.tsx   # 属性编辑器
│   ├── hooks/
│   │   └── use-editor.ts       # 编辑器状态管理 Hook
│   ├── lib/                    # 核心库
│   │   ├── types.ts            # 核心类型定义（Project/Segment/Theme等）
│   │   ├── themes.ts           # 内置主题（Tech Blue / Dark Mode）
│   │   ├── segment-schemas.ts  # 5种片段类型的属性Schema
│   │   ├── easing.ts           # 缓动函数
│   │   ├── project-storage.ts  # localStorage 项目管理
│   │   ├── utils.ts            # 通用工具函数 (cn)
│   │   ├── renderer/           # 统一渲染引擎（前后端共用）
│   │   │   ├── context.ts      # 渲染上下文（Canvas适配层）
│   │   │   ├── transitions.ts  # 转场动画
│   │   │   ├── segments.ts     # 5种片段绘制逻辑
│   │   │   └── index.ts        # 渲染入口（renderFrame/getProjectDuration）
│   │   └── server/             # 服务端专用模块
│   │       ├── render-engine.ts # 逐帧渲染引擎（node-canvas）
│   │       ├── video-encoder.ts # ffmpeg 编码
│   │       ├── storage.ts      # 本地文件存储（MP4保存到 /app/renders）
│   │       ├── render-store.ts # 渲染任务状态管理（内存Map）
│   │       └── pipeline.ts     # 完整渲染管线编排
│   └── server.ts              # 自定义服务端入口
├── next.config.ts             # Next.js 配置（含native模块externals）
├── package.json
└── tsconfig.json
```

## 渲染架构

前后端共用一套 TypeScript 渲染器（`src/lib/renderer/`），通过 `RenderContext` 适配层同时支持浏览器 HTMLCanvasElement 和服务端 @napi-rs/canvas。

渲染流程：项目JSON → 解析时间线 → 逐帧Canvas绘制 → PNG序列 → ffmpeg编码 → 本地文件存储 → 返回URL

## 关键技术点

- **@napi-rs/canvas**：纯Node.js Canvas，无需浏览器，在 next.config.ts 中已 externals
- **系统 ffmpeg**：沙箱自带 ffmpeg，通过 `which ffmpeg` 获取路径，不使用 @ffmpeg-installer
- **本地文件存储**：MP4 保存到 `/app/renders/` 目录，通过 `/api/video/[id]` 路由提供访问（支持 Range 请求）
- **Docker 部署**：提供 Dockerfile + docker-compose.yml，基于 node:24-slim，内置 canvas 原生库 + ffmpeg + 中文字体
- **中文字体**：系统自带 WenQuanYi Micro Hei（`/usr/share/fonts/truetype/wqy/wqy-microhei.ttc`）
- **Turbopack root**：next.config.ts 中设置 `turbopack.root = path.resolve(__dirname)`

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**
