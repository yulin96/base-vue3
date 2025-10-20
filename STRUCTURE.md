# 📁 重构完成 - 精简版

## ✅ 目录结构

### utils/ - 纯工具函数库

```
utils/
├── animation/           # 动画工具
│   ├── confetti.ts
│   ├── frameAnimation.ts
│   ├── lottie.ts
│   └── notate.ts
├── browser/             # 浏览器相关
│   ├── language.ts      # 语言检测
│   ├── ua.ts            # UA检测 (isMobile, isWeChat等)
│   └── url.ts           # URL处理
├── crypto/              # 加密解密
│   ├── crypto.ts
│   ├── cryptoJS.ts
│   └── jsencrypt.ts
├── dom/                 # DOM操作
│   ├── autoScaleBox.ts
│   ├── boundsMove.ts
│   ├── dom.ts
│   ├── generateCaptcha.ts
│   └── sign.ts
├── file/                # 文件操作 (图片、下载、上传等)
│   ├── compressImage.ts
│   ├── copyText.ts
│   ├── createAntiqueImage.ts
│   ├── downloadFile.ts
│   └── uploadFile.ts
├── format/              # 格式转换
│   └── convert.ts       # deepClone, toFixedNumber等
├── string/              # 字符串工具
│   └── random.ts        # randomNum, randomString等
├── time/                # 时间日期
│   ├── date.ts          # formatDate等
│   └── timeAgo.ts       # 相对时间
└── validator/           # 校验工具
    └── index.ts         # isPhone, isEmail, isHttps等
```

### shared/ - 项目共享资源

```
shared/
├── common.ts            # 项目通用工具 (cn, sleep, routerTo等)
├── env.ts               # 环境变量
├── config/
│   └── public.ts
├── constants/           # 全局常量
│   ├── keys.ts
│   ├── tileAreaData.ts
│   └── url.ts
├── directive/
│   └── index.ts
├── integrations/        # 第三方集成
│   ├── dingtalk.ts
│   └── wx.ts
├── lotties/
│   ├── clickEffect.ts
│   └── effect1.json
├── plugins/             # UI插件封装
│   ├── vant/
│   │   ├── dialog.ts
│   │   ├── notify.ts
│   │   └── toast.ts
│   └── zoomist/
│       └── index.ts
├── request/
│   └── index.ts
├── setup/               # 应用初始化
│   ├── clearParams.ts
│   ├── createQRCode.ts
│   ├── dev.ts
│   ├── gsap.ts
│   ├── resetWxFontSize.ts
│   ├── setRem.ts
│   └── showShareImage.ts
└── user/                # 用户交互
    ├── createToaster.ts
    ├── focus.ts
    ├── getOpenId.ts
    ├── location.ts
    ├── media.ts
    ├── preload.ts
    ├── registerButtonEffect.ts
    ├── scan.ts
    ├── share.ts
    ├── showImage.ts
    └── showRegComplete.ts
```

## 📝 常用导入路径

### utils - 按功能分类导入

```ts
// 浏览器相关
import { isWeChat, isMobile } from '@/utils/browser/ua'
import { getUserLanguage, isChineseLanguage } from '@/utils/browser/language'
import { removeUrlParams } from '@/utils/browser/url'

// 字符串工具
import { randomNum, randomString } from '@/utils/string/random'

// 格式转换
import { deepClone, toFixedNumber, formDataToObj } from '@/utils/format/convert'

// 时间处理
import { formatDate } from '@/utils/time/date'
import { timeAgo } from '@/utils/time/timeAgo'

// 文件操作
import { downloadFile } from '@/utils/file/downloadFile'
import { uploadFile } from '@/utils/file/uploadFile'
import { copyText } from '@/utils/file/copyText'
import { compressImage } from '@/utils/file/compressImage'

// 校验
import { isPhone, isEmail, isHttps, isPcMode } from '@/utils/validator'

// 动画
import { confetti } from '@/utils/animation/confetti'
import { lottie } from '@/utils/animation/lottie'

// 加密
import { encrypt, decrypt } from '@/utils/crypto/crypto'

// DOM操作
import { autoScaleBox } from '@/utils/dom/autoScaleBox'
```

### shared - 项目特定功能

```ts
// 第三方集成
import { wx } from '@/shared/integrations/wx'
import { dingtalk } from '@/shared/integrations/dingtalk'

// UI组件
import { showToast } from '@/shared/plugins/vant/toast'
import { showDialog } from '@/shared/plugins/vant/dialog'
import Zoomist from '@/shared/plugins/zoomist'

// 常量
import { TILE_AREA_DATA } from '@/shared/constants/tileAreaData'

// 通用工具
import { cn, sleep, routerTo } from '@/shared/common'

// 用户交互
import { showImage } from '@/shared/user/showImage'
import { openScanQR } from '@/shared/user/scan'

// 初始化
import { setRem } from '@/shared/setup/setRem'
import { createQRCode } from '@/shared/setup/createQRCode'
```

## 🔄 主要改动总结

**utils 改动:**

- ❌ `@/utils/ua` → ✅ `@/utils/browser/ua`
- ❌ `@/utils/random` → ✅ `@/utils/string/random`
- ❌ `@/utils/convert` → ✅ `@/utils/format/convert`
- ❌ `@/utils/photo/*` → ✅ `@/utils/file/*`
- ❌ `@/utils/animate/*` → ✅ `@/utils/animation/*`

**shared 改动:**

- ❌ `@/shared/third/*` → ✅ `@/shared/integrations/*`
- ❌ `@/shared/vant/*` → ✅ `@/shared/plugins/vant/*`
- ❌ `@/shared/zoomist` → ✅ `@/shared/plugins/zoomist`
- ❌ `@/shared/time/*` → ✅ `@/utils/time/*`
- ❌ `@/shared/data/*` → ✅ `@/shared/constants/*`
- ❌ `@/shared/keys` → ✅ `@/shared/constants/keys`
- ❌ `@/shared/user/(downloadFile|uploadFile|copyText)` → ✅ `@/utils/file/*`

## 💡 设计原则

- **utils**: 纯函数，无副作用，不依赖项目上下文，可跨项目复用
- **shared**: 项目特定功能，可能依赖 Vue/Router/第三方SDK

直接从具体文件导入，无统一导出文件。

```
utils/
├── animation/
│   ├── confetti.ts
│   ├── frameAnimation.ts
│   ├── lottie.ts
│   └── notate.ts
├── browser/
│   ├── language.ts
│   ├── ua.ts
│   └── url.ts
├── crypto/
│   ├── crypto.ts
│   ├── cryptoJS.ts
│   └── jsencrypt.ts
├── dom/
│   ├── autoScaleBox.ts
│   ├── boundsMove.ts
│   ├── dom.ts
│   ├── generateCaptcha.ts
│   └── sign.ts
├── file/
│   ├── compressImage.ts
│   ├── copyText.ts
│   ├── createAntiqueImage.ts
│   ├── downloadFile.ts
│   └── uploadFile.ts
├── format/
│   └── convert.ts
├── string/
│   └── random.ts
├── time/
│   ├── date.ts
│   └── timeAgo.ts
└── validator/
    └── index.ts
```

### shared/ - 项目共享资源

```
shared/
├── common.ts
├── env.ts
├── config/
│   └── public.ts
├── constants/
│   ├── keys.ts
│   ├── tileAreaData.ts
│   └── url.ts
├── directive/
│   └── index.ts
├── integrations/
│   ├── dingtalk.ts
│   └── wx.ts
├── lotties/
│   ├── clickEffect.ts
│   └── effect1.json
├── plugins/
│   ├── vant/
│   │   ├── dialog.ts
│   │   ├── notify.ts
│   │   └── toast.ts
│   └── zoomist/
│       └── index.ts
├── request/
│   └── index.ts
├── setup/
│   ├── clearParams.ts
│   ├── createQRCode.ts
│   ├── dev.ts
│   ├── gsap.ts
│   ├── resetWxFontSize.ts
│   ├── setRem.ts
│   └── showShareImage.ts
└── user/
    ├── createToaster.ts
    ├── focus.ts
    ├── getOpenId.ts
    ├── location.ts
    ├── media.ts
    ├── preload.ts
    ├── registerButtonEffect.ts
    ├── scan.ts
    ├── share.ts
    ├── showImage.ts
    └── showRegComplete.ts
```

## 📝 导入示例

```ts
// 直接从具体文件导入
import { randomNum } from '@/utils/string/random'
import { formatDate } from '@/utils/time/date'
import { isWeChat } from '@/utils/browser/ua'
import { getUserLanguage } from '@/utils/browser/language'
import { downloadFile } from '@/utils/file/downloadFile'
import { compressImage } from '@/utils/file/compressImage'
import { deepClone } from '@/utils/format/convert'

import { wx } from '@/shared/integrations/wx'
import { showToast } from '@/shared/plugins/vant/toast'
import { TILE_AREA_DATA } from '@/shared/constants/tileAreaData'
```

## 🔄 主要改动

**utils:**

- `animate/` → `animation/`
- 新增: `browser/`, `file/`, `format/`, `string/`, `time/`
- 删除: `photo/` (整合到 file/)

**shared:**

- `third/` → `integrations/`
- 新增: `plugins/`, `constants/`
- 删除: `time/` (迁移到 utils), `data/` (整合到 constants)
