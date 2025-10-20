# GitHub Copilot Instructions

This is a mobile-first Vue3 + Vite project optimized for rapid development through automation and convention-driven architecture.

## Core Architecture

This project follows **convention over configuration** with heavy automation:

- **Auto-routing**: Files in `src/pages/` become routes automatically (e.g., `src/pages/user/profile.vue` → `/user/profile`)
- **Auto-imports**: Components in `src/components/` are automatically imported - use directly in templates without manual imports
- **Auto-persistence**: All Pinia stores automatically persist to localStorage via `pinia-plugin-persistedstate`
- **Auto-deployment**: `pnpm build` auto-uploads to OSS when env vars are set (`zAccessKeyId`, `zAccessKeySecret`, `zBucket`)

## Development Workflow

```bash
pnpm dev              # Start dev server (auto-generates QR code for mobile testing)
pnpm build            # Type-check + build + auto-upload to OSS
pnpm build-only       # Build without OSS upload
pnpm lint             # ESLint with auto-fix
```

## Key Patterns & Conventions

### Mobile-First Styling with Tailwind 4

- Use design mockup `px` values directly - PostCSS auto-converts to `rem`
- Prefer Tailwind CSS atomic classes over custom CSS
- **Custom size utilities**: Use predefined sizes `text-{1-90}`, `radius-{1-90}`, `tracking-{1-17}`
- **Custom utility classes**: `center` (flex center), `shark-wrap` (shimmer effect), `state-paused/running`
- **Typography**: `text-last-center`, `text-last-justify` for text alignment
- **Touch controls**: `callout-none/default` for mobile touch behavior
- **Class merging**: Use `cn()` helper from `@/shared/common.ts` for conditional classes
- Example: `<div class="w-375 h-200 text-16 radius-8 center">` (combines size, text, radius, and centering)

### State Management

- All stores auto-persist by default
- Use `omit: ['user.ignore']` in store config to exclude fields from persistence
- Example store pattern: `src/stores/user.ts` with built-in `.clear()` method

### API Requests

- All requests through `src/shared/request/index.ts` axios instance
- Use `useLock()` hook to prevent duplicate requests
- Pattern: Define interfaces in `src/api/types.ts`, implementations in `src/api/index.ts`

### Component Structure

- `src/components/com/`: Complex interactive components (audio, image-scale, keyboard)
- `src/components/icon/`: Icon components (checkbox, radio)
- Auto-imported via `unplugin-vue-components` - no manual imports needed

### Hooks & Utils Organization

- `src/hooks/`: Composition API functions (useLock, useToaster, useTimer)
- `src/utils/`: Pure functions organized by domain (crypto/, dom/, validator/)
- `src/shared/`: Project-wide integrations (wx.ts, dingtalk.ts, request/)

## Critical Integration Points

### OSS Auto-Upload

Controlled by environment variables and `.env` settings:

- Upload path: `VITE_OSS_ROOT_DIRNAME` + `VITE_OSS_DIRNAME`
- Skips: `index.html` and `pluginWebUpdateNotice/` files
- Base URL rewrite: `https://oss.eventnet.cn/`

### Third-Party Services

- WeChat integration: `src/shared/third/wx.ts`
- DingTalk integration: `src/shared/third/dingtalk.ts`
- All configured for mobile H5 environments

### Build Optimizations

- Image auto-compression (requires Node 18.17.0+, uses sharp)
- Code splitting by vendor: `gsap`, `html2canvas`, `lottie-web`, etc.
- Lazy route imports in dev, sync in production

## Common Patterns

```typescript
// Auto-imported components - use directly
<template>
  <ImageScale :src="image" />
  <Keyboard v-model="password" />
</template>

// Store with auto-persistence
const { user } = useStore()
user.value.clear() // Built-in clear method

// Lock pattern for API calls
const [isLocked, lock, unlock] = useLock()

// Tailwind 4 custom utilities and class merging
import { cn } from '@/shared/common'
const buttonClass = cn('center text-16 radius-8', isActive && 'shark-wrap')

// Utility imports - organized by domain
import { copyText } from '@/utils/file/copyText'
import { randomString } from '@/utils/string/random'
import { isPhone } from '@/utils/validator'
```

When creating new features:

1. Pages go in `src/pages/` (auto-routed)
2. Reusable components in `src/components/` (auto-imported)
3. API calls in `src/api/` with proper TypeScript types
4. State in Pinia stores (auto-persisted)
5. Use existing hooks/utils before creating new ones
