# 打卡小程序设计指南

## 1. 品牌定位

- **应用定位**：每日习惯打卡工具，帮助用户养成好习惯
- **设计风格**：简洁、清新、激励感
- **目标用户**：希望养成好习惯的年轻人

## 2. 配色方案

### 主色板
- **主色 (Primary)**: `#10b981` (emerald-500) - 代表成长、坚持
- **主色浅**: `#34d399` (emerald-400)
- **主色深**: `#059669` (emerald-600)

### 中性色
- **背景**: `#ffffff` (white)
- **前景文字**: `#1f2937` (gray-800)
- **次要文字**: `#6b7280` (gray-500)
- **边框**: `#e5e7eb` (gray-200)
- **卡片背景**: `#f9fafb` (gray-50)

### 语义色
- **成功**: `#10b981` (emerald-500) - 打卡成功
- **警告**: `#f59e0b` (amber-500) - 待打卡
- **危险**: `#ef4444` (red-500) - 删除操作

## 3. 字体规范

- **H1 标题**: `text-2xl font-bold`
- **H2 副标题**: `text-xl font-semibold`
- **H3 小标题**: `text-lg font-medium`
- **正文**: `text-base`
- **说明文字**: `text-sm text-gray-500`
- **数字强调**: `text-3xl font-bold text-emerald-500`

## 4. 间距系统

- **页面边距**: `p-4` (16px)
- **卡片内边距**: `p-4`
- **列表间距**: `gap-3`
- **按钮内边距**: `px-4 py-2`

## 5. 组件使用原则

**组件选型约束**：
- 按钮、输入框、弹窗、Tabs、Toast、Card 等通用组件**优先使用** `@/components/ui/*`
- 禁止在页面中用 `View/Text` 手搓按钮、输入框、卡片等通用 UI
- 新页面开发前，先拆分 UI 单元，再映射到组件库

**打卡页面所需组件**：
- `Button` - 打卡按钮、操作按钮
- `Card` - 任务卡片容器
- `Input` - 任务名称输入
- `Dialog` - 新建/编辑任务弹窗
- `Badge` - 打卡状态标签
- `Progress` - 打卡进度展示
- `Calendar` - 日历视图选择日期
- `Checkbox` - 任务完成勾选

## 6. 导航结构

**TabBar 配置**：
- 首页 (`pages/index/index`) - 今日打卡任务列表
- 记录 (`pages/records/index`) - 打卡历史日历视图
- 我的 (`pages/profile/index`) - 个人设置

**页面跳转**：
- TabBar 页面使用 `Taro.switchTab()`
- 普通页面使用 `Taro.navigateTo()`

## 7. 状态展示

- **空状态**: 使用 Card + 居中提示文字 + 引导按钮
- **加载态**: 使用 `Skeleton` 组件
- **打卡成功**: 使用 `Toast` 提示 + 绿色勾选动画

## 8. 小程序约束

- **包体积**: 单包不超过 2MB，图片资源走 TOS
- **图片策略**: TabBar 图标放 `src/assets/tabbar/`，其他图片用 TOS URL
- **性能优化**: 避免大列表渲染，使用分页加载
