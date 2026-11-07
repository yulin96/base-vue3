---
name: 现场体验问卷
description: 当前问卷与抽奖页面的视觉记录，仅适用于本次活动页面。
colors:
  primary: "#c04b23"
  accent: "#d75b2c"
  background: "#f9f7f0"
  text: "#34382d"
  text-muted: "#726a5d"
  surface: "#fffdf8"
  border: "#e2dcd0"
  selected: "#fcf0e5"
  selected-text: "#ab4a23"
  on-primary: "#fffdf7"
typography:
  headline:
    fontSize: "45px"
    fontWeight: 600
  title:
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.6
  body:
    fontFamily: "'PingFang SC', 'Noto Sans SC', -apple-system, sans-serif"
    fontSize: "25px"
    lineHeight: 1.5
  supporting:
    fontSize: "23px"
  caption:
    fontSize: "21px"
  action:
    fontSize: "29px"
    fontWeight: 550
rounded:
  option: "11px"
  field: "12px"
  action: "13px"
spacing:
  compact: "13px"
  content: "22px"
  section: "35px"
  gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "24px 33px"
  answer-option:
    backgroundColor: "{colors.surface}"
    textColor: "#5e5a4f"
    typography: "{typography.body}"
    rounded: "{rounded.option}"
    padding: "19px 23px"
  answer-option-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.selected-text}"
    rounded: "{rounded.option}"
---

# Design System: 现场体验问卷

## Overview

**Creative North Star: "清晰、温暖的现场问卷"**

从当前页面提取的局部视觉记录：暖白底、深色文字与橙色操作，让观众专注填写。适用边界是本次问卷与抽奖页面，不作为基础模板的全局品牌。

**Key Characteristics:**
- 暖白底与橙色操作。
- 单列长问卷与吸顶进度。
- 细边框选项与明确选中状态。

## Colors

### Primary
- `primary` 用于主按钮和抽奖中心；`accent` 用于选中标记、进度及必填提示。

### Neutral
- `background` 为页面底色，`surface` 为选项与输入区域底色。
- `text` 承载标题与正文；`text-muted` 承载补充信息；`border` 划分选项边界。
- `selected` 与 `selected-text` 配合强调已选答案；主按钮使用 `on-primary` 文字。

## Typography

沿用系统中文无衬线字体。页面标题使用 `headline`，题目使用 `title`，答案和输入使用 `body`；辅助信息与进度使用较小字号。尺寸均为 750 设计稿像素，由现有 rem 流程适配。

## Layout

单列自然撑高并滚动，左右留白使用 `gutter`；选项间使用 `compact`，题目间使用 `section`。问卷直接展开 15 题，进度吸顶；提交后切换到同一套视觉下的九宫格抽奖，抽奖结束后进入独立结果页。中奖结果页以白底凭证展示奖品、待核销状态、二维码和凭证编号，不展示品牌顶栏。不另设桌面布局。

## Elevation & Depth

问卷以底色、细边框和留白分层，不使用卡片投影。抽奖当前格通过底色与内描边强调。

## Shapes

选项、输入区域与主按钮采用相近的小圆角；单选标记为圆形，多选标记为小方形。抽奖外框使用更大的圆角，不扩展为通用圆角尺度。

## Components

### Buttons

主按钮满容器宽，内容居中，最小高度为 102 设计像素。按下时轻微缩小；禁用状态由业务逻辑阻止重复操作。

### Questionnaire Options

选项最小高度为 85 设计像素，细边框配浅色底。选中时同时改变底色、描边、文字与勾选标记；多选允许连续操作。评分与建议输入延续相同的底色和圆角语言。

## Do's and Don'ts

### Do:
- **Do** 保持单列阅读、清晰题号与可辨认的选中状态。
- **Do** 沿用现有 750 设计稿与 rem 适配。

### Don't:
- **Don't** 为此问卷增加入口首页、无关营销文案或演示标识。
- **Don't** 将本页活动名称、题目和奖品视为已确认的全局品牌规范。
