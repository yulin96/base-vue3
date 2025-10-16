# 弹幕组件更新说明

更新日期: 2025年10月16日

## ✅ 更新内容

### 1. 🗑️ 删除 pin 功能

已完全移除置顶弹幕相关功能：

- ✅ 删除 `BarrageItem.pin` 属性
- ✅ 删除 `pinColor` prop
- ✅ 删除 pin 图标渲染逻辑
- ✅ 删除 CSS 中的 `.pin_my` 样式
- ✅ 简化颜色逻辑，直接随机选择颜色

### 2. 🎯 新增每条轨道独立速度配置

#### 新增 prop: `trackSpeeds`

```typescript
trackSpeeds?: number[]  // 可选，每条轨道的速度数组
```

**功能说明：**

- 允许为每条轨道设置不同的速度
- 如果未设置或轨道索引超出范围，则使用默认 `speed` prop
- 轨道索引从 0 开始，对应 slot 中的子元素顺序

---

## 📝 使用示例

### 基础用法（所有轨道相同速度）

```vue
<template>
  <com-barrage v-model="currentId" :barrage-list="barrageData" :speed="90">
    <div class="flex h-100 w-full items-center"></div>
    <div class="flex h-100 w-full items-center"></div>
    <div class="flex h-100 w-full items-center"></div>
  </com-barrage>
</template>

<script setup>
import { ref } from 'vue'

const currentId = ref(0)
const barrageData = [{ content: '这是第一条弹幕' }, { content: '这是第二条弹幕' }, { content: '这是第三条弹幕' }]
</script>
```

### 高级用法（每条轨道不同速度）

```vue
<template>
  <com-barrage v-model="currentId" :barrage-list="barrageData" :track-speeds="[60, 90, 120, 150]">
    <!-- 轨道 0: 速度 60 (最慢) -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 1: 速度 90 -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 2: 速度 120 -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 3: 速度 150 (最快) -->
    <div class="flex h-100 w-full items-center"></div>
  </com-barrage>
</template>

<script setup>
import { ref } from 'vue'

const currentId = ref(0)
const barrageData = [
  { content: '这条弹幕可能出现在任意轨道' },
  { content: '每条轨道速度不同' },
  { content: '速度越大移动越快' },
]
</script>
```

### 混合使用（部分轨道自定义速度）

```vue
<template>
  <com-barrage v-model="currentId" :barrage-list="barrageData" :speed="100" :track-speeds="[50, 150]">
    <!-- 轨道 0: 速度 50 (自定义) -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 1: 速度 150 (自定义) -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 2: 速度 100 (使用默认 speed) -->
    <div class="flex h-100 w-full items-center"></div>

    <!-- 轨道 3: 速度 100 (使用默认 speed) -->
    <div class="flex h-100 w-full items-center"></div>
  </com-barrage>
</template>
```

---

## 🎨 完整 Props 列表

| Prop            | 类型             | 默认值        | 说明                     |
| --------------- | ---------------- | ------------- | ------------------------ |
| `barrageList`   | `BarrageItem[]`  | 必填          | 弹幕数据数组             |
| `gap`           | `number`         | `20`          | 弹幕之间的最小间距       |
| `speed`         | `number`         | `90`          | 默认速度（数值越大越快） |
| `trackSpeeds`   | `number[]`       | `undefined`   | 每条轨道的速度数组       |
| `colors`        | `BarrageColor[]` | 预设 6 种颜色 | 弹幕颜色数组             |
| `throttleDelay` | `number`         | `300`         | 弹幕创建节流延迟 (ms)    |

### 数据类型定义

```typescript
interface BarrageItem {
  content: string // 弹幕文本内容
}

interface BarrageColor {
  background: string // 背景色
  foreground: string // 文字色
}
```

---

## 🎮 暴露的方法

```typescript
// 获取组件引用
const barrageRef = ref()

// 暂停弹幕
barrageRef.value?.pause()

// 继续弹幕
barrageRef.value?.resume()
```

---

## 🎯 速度配置说明

### 速度值含义

- **数值越大 = 移动越快**
- 速度值实际上是 `px/s`（像素每秒）
- 例如：`speed: 90` 表示弹幕每秒移动 90 像素

### 推荐速度范围

- **慢速**: 30-60
- **中速**: 60-120
- **快速**: 120-200
- **极快**: 200+

### 速度匹配建议

```vue
<!-- 渐进式速度：从慢到快 -->
<com-barrage :track-speeds="[50, 80, 110, 140]">
  <!-- 4 条轨道，速度逐渐增加 -->
</com-barrage>

<!-- 交错速度：快慢交替 -->
<com-barrage :track-speeds="[60, 120, 60, 120]">
  <!-- 偶数轨道快，奇数轨道慢 -->
</com-barrage>

<!-- 边缘快，中间慢 -->
<com-barrage :track-speeds="[150, 80, 80, 150]">
  <!-- 上下轨道快，中间轨道慢 -->
</com-barrage>
```

---

## 🔧 实现细节

### 速度选择逻辑

```typescript
// 获取当前轨道的速度
const currentSpeed =
  trackSpeeds && trackSpeeds[index] !== undefined
    ? trackSpeeds[index] // 使用轨道自定义速度
    : speed // 使用默认速度

// 应用到动画
gsap.to(barrage, {
  x: -offset,
  duration: offset / currentSpeed, // 速度越大，duration 越小
  ease: 'none',
})
```

### 优先级

1. 如果提供了 `trackSpeeds` 且包含当前轨道索引 → 使用 `trackSpeeds[index]`
2. 否则 → 使用默认 `speed`

---

## 🚀 性能优化要点

### 已实现的优化

✅ RAF 节流控制（默认 300ms）
✅ 缓存 DOM 查询结果
✅ 缓存 getBoundingClientRect
✅ GSAP 动画实例管理
✅ 组件销毁时清理资源

### 性能配置建议

```vue
<!-- 高性能场景 -->
<com-barrage :throttle-delay="500" :speed="60" :barrage-list="data" />

<!-- 密集弹幕场景 -->
<com-barrage :throttle-delay="100" :track-speeds="[80, 100, 120, 140]" :barrage-list="data" />
```

---

## 📊 更新对比

### 删除的功能

- ❌ `pin` 属性（置顶弹幕）
- ❌ `pinColor` prop
- ❌ pin 图标显示
- ❌ pin 加粗样式

### 新增的功能

- ✅ `trackSpeeds` prop（每条轨道独立速度）
- ✅ 更灵活的速度控制
- ✅ 更详细的使用文档

### 保留的功能

- ✅ 颜色随机选择
- ✅ 左右气泡方向
- ✅ 暂停/继续控制
- ✅ 性能优化机制
- ✅ 节流控制

---

## 💡 使用建议

### 1. 视觉层次感

使用不同速度创建视觉层次：

```vue
<com-barrage :track-speeds="[40, 70, 100, 130]">
  <!-- 由慢到快，营造景深效果 -->
</com-barrage>
```

### 2. 重要信息突出

将重要轨道设置为慢速：

```vue
<com-barrage :track-speeds="[90, 50, 90, 90]">
  <!-- 第二条轨道速度慢，更容易阅读 -->
</com-barrage>
```

### 3. 动态效果

快慢结合创造动感：

```vue
<com-barrage :track-speeds="[150, 60, 150, 60]">
  <!-- 快慢交替，视觉冲击力强 -->
</com-barrage>
```

---

## 🔄 迁移指南

### 从旧版本迁移

#### 如果使用了 pin 功能

```typescript
// ❌ 旧版本
const data = [{ content: '普通弹幕' }, { content: '重要消息', pin: true }]

// ✅ 新版本：移除 pin 属性
const data = [
  { content: '普通弹幕' },
  { content: '重要消息' }, // 现在所有弹幕平等
]
```

#### 如果需要突出某些弹幕

可以通过自定义颜色实现：

```vue
<com-barrage
  :colors="[
    { background: '#FC6760', foreground: '#fff' },
    { background: '#FFD700', foreground: '#000' }, // 金色更醒目
  ]"
/>
```

---

**更新完成！** 🎉

组件更简洁，功能更强大，每条轨道都可以有自己的速度！
