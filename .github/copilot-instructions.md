# GitHub Copilot Instructions

This repository is a mobile-first Vue 3 + Vite starter focused on H5 activity pages.

## Core Architecture

- **Auto routing**: `src/pages/**/*.vue` is converted to routes by `vue-router/auto-routes`.
- **Auto components**: components under `src/components` are auto-registered by `unplugin-vue-components`.
- **State persistence**: Pinia uses `pinia-plugin-persistedstate` in `src/main.ts`.
- **Build deploy hooks**: OSS/FTP deploy plugins are configured in `vite.config.ts` and gated by env flags.

## Development Commands

```bash
pnpm dev              # Start local dev server
pnpm type-check       # Run vue-tsc
pnpm lint             # Run eslint --fix
pnpm build:only       # Build only
pnpm build            # type-check + build:only
```

## Project Layout

- `src/pages`: route pages (file-based routing)
- `src/components/base`: reusable UI/business components
- `src/api`: API entry and API types
- `src/hooks`: composition hooks
- `src/utils`: utility modules (`animation`, `crypto`, `dom`, `file`, `platform`)
- `src/plugins`: app init, directives, ARMS, Vant wrappers
- `src/stores`: Pinia stores
- `src/lang`: i18n resources (currently optional)

## Styling Conventions

- Tailwind CSS v4 is enabled via `@tailwindcss/vite`.
- `postcss-pxtorem` converts px to rem; Vant files use a different root value.
- Shared CSS lives in `src/assets/styles`.

## API Conventions

- Request helpers live in `src/utils/request.ts`.
- API functions should be declared in `src/api/index.ts` and typed with `src/api/types.ts`.
- Use lock wrappers in `src/hooks/useLockRequest.ts` when duplicate submit must be prevented.

## Routing Conventions

- Define per-page route meta in SFC `<route lang="json">` blocks.
- Keep global guards in `src/router/index.ts`.
- Avoid registering global guards inside components.

## Environment

- Runtime app env uses `VITE_*` vars from `.env*` files.
- Deployment credentials are read from shell env (`process.env`) in `vite.config.ts`.

## Guardrails

1. Prefer existing hooks/utils/components before adding new abstractions.
2. Keep mobile behavior first (touch interaction, viewport, lightweight first screen).
3. For new dependencies, justify bundle impact and usage scope.
4. Keep docs and paths aligned with actual repository structure.
