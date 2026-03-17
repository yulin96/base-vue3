# create-base-vue3

公司内部使用的 Vue 3 模板脚手架仓库。

仓库本身只负责：

- 维护 CLI
- 维护模板源码
- 本地调试模板与生成结果
- 发布到私有 npm registry

## 目录结构

```text
base-vue3/
├─ src/                    # CLI 源码
├─ scripts/                # 本地调试脚本
├─ template/
│  └─ base/                # 唯一模板源码，可直接运行
└─ playground/
   └─ dev-app/             # 本地生成产物，不提交
```

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 直接开发模板

这是最快的模板调试方式，改完 `template/base` 会直接热更新：

```bash
pnpm dev:template
```

### 验证脚手架生成结果

把当前模板生成到 `playground/dev-app`：

```bash
pnpm gen:playground
```

首次生成或模板依赖变化后执行：

```bash
pnpm install:playground
```

启动生成后的项目：

```bash
pnpm dev:playground
```

`gen:playground` 会保留 `playground/dev-app/node_modules`，所以平时改模板文件后可以反复生成，不用每次重装依赖。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm build` | 构建 CLI 到 `dist/` |
| `pnpm type-check` | 检查 CLI 和模板 |
| `pnpm lint` | 检查模板 |
| `pnpm build:template` | 构建模板项目 |
| `pnpm gen:playground` | 用当前模板生成本地调试项目 |
| `pnpm reset:playground` | 清空本地调试项目 |

## 私有发布

发布前先把根目录 `package.json` 里的包名改成你们自己的 scope，例如：

```json
{
  "name": "@your-org/create-base-vue3"
}
```

### GitHub Packages

`.npmrc`：

```ini
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

发布：

```bash
pnpm build
npm publish --registry=https://npm.pkg.github.com
```

使用：

```bash
npx @your-org/create-base-vue3 my-app
```

### GitLab Package Registry

`.npmrc`：

```ini
@your-org:registry=https://gitlab.example.com/api/v4/packages/npm/
//gitlab.example.com/api/v4/packages/npm/:_authToken=${GITLAB_TOKEN}
```

发布：

```bash
pnpm build
npm publish --registry=https://gitlab.example.com/api/v4/packages/npm/
```

使用：

```bash
npx @your-org/create-base-vue3 my-app
```
