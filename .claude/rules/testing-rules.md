# Testing Rules

## Framework
- **Runner:** Vitest
- **DOM:** jsdom
- **Assertions:** @testing-library/jest-dom
- **Rendering:** @testing-library/react
- **Config:** `vitest.config.ts` + `src/test/setup.ts`

## When to Write Tests
- Every new shared/reusable component in `components/shared/` or `components/ui/`
- Every custom hook in `hooks/`
- Every Zustand store in `stores/`
- Bug fixes: add a regression test proving the fix

## Test Location
- Component tests: `src/components/__tests__/ComponentName.test.tsx`
- Hook tests: `src/hooks/__tests__/useHookName.test.ts`
- Store tests: `src/stores/__tests__/storeName.test.ts`

## Conventions
```typescript
// Standard test structure
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock i18n in every component test
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock framer-motion to avoid animation issues
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));
```

## Commands
- `npm run test` — single run
- `npm run test:watch` — watch mode
- Tests must pass before any PR
