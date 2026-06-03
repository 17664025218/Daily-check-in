# 智卡 (Smart Punch-in Assistant)

**智卡**是一款轻量、智能的日常打卡与习惯养成小程序。帮助用户设定目标、追踪进度，通过极简的交互体验，让坚持变得更简单。

<img width="143" height="133" alt="截图20260603143855" src="https://github.com/user-attachments/assets/7546dc0e-0419-4636-bc6e-d7572dd6f653" />

> 👆 扫描上方小程序码，立即体验“智卡”

---

## 🌟 产品特色

* **极简操作**：抛弃繁琐的表单，核心打卡动作一键完成。
* **智能统计**：自动生成打卡日历与周期趋势图，直观展示坚持的成果。
* **跨端支持**：原生微信小程序体验，未来可无缝拓展至 H5 等多端。


## 📸 界面预览
<img width="108" height="227" alt="界面1" src="https://github.com/user-attachments/assets/47995124-26c8-482f-afbe-d4b716e009e0" />
<img width="108" height="227" alt="微信图片_2026-06-03_144457_451" src="https://github.com/user-attachments/assets/711757e9-bbcb-4bb9-a04d-085d675a29f6" />
<img width="108" height="227" alt="截图20260603144541" src="https://github.com/user-attachments/assets/2316cf63-a9f6-4139-9c63-66d7b6b4a3d7" />
<img width="108" height="227" alt="微信图片_2026-06-03_144619_526" src="https://github.com/user-attachments/assets/092d0286-3e32-40d8-8a35-a3ca8f4889b0" />


## 🛠 技术架构

本项目采用现代化前后端分离架构，兼顾开发效率与运行性能：

- **前端 (小程序)**：[Taro 4](https://docs.taro.zone/docs/) + React 18 + TailwindCSS (原子化样式) + Zustand (状态管理)
- **服务端**：[NestJS 10](https://nestjs.com/) + Drizzle ORM
- **核心语言**：全栈 TypeScript 覆盖，提供严谨的类型推导与校验 (Zod)

## 📂 项目结构概览

```text
├── server/                 # NestJS 后端服务
│   └── src/                # 服务端业务代码
├── src/                    # 小程序前端源码
│   ├── pages/              # 页面级组件 (首页、设置、统计等)
│   ├── components/         # 可复用 UI 组件
│   ├── stores/             # Zustand 状态管理
│   └── network.ts          # 网络请求封装
├── .cozeproj/              # Coze 平台相关配置
└── project.config.json     # 微信小程序项目配置
