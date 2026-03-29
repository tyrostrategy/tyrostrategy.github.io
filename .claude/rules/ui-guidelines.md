# UI Guidelines

## Mandatory Reference Files
Before writing ANY UI code, read these two files:
1. **`UI_RULES.md`** (project root) — Pixel-level rules: font sizes, button heights, status colors, spacing, animation. This is the law.
2. **`tyro-saas-skill/references/foundation.md`** — Design tokens, glassmorphism, typography system, color palette.

---

## 1. Font Sizes (from UI_RULES.md)

- Clickable text: min **12px**, never below
- Readable text: min **11px**
- **10px and below: BANNED**
- Page titles (H1): 18-24px
- Full table in UI_RULES.md section 1

---

## 2. Button Standards

### Sizing
- Min height: `h-8` (32px), icon buttons: `w-8 h-8`
- Always: `font-semibold`, `cursor-pointer`, hover effect
- Touch targets on mobile: min **44x44px**

### Variants (use consistently — never mix approaches)
| Variant | Style |
|---------|-------|
| Primary | `bg-tyro-navy text-white`, hover: `scale-1.04` |
| Secondary | `border border-tyro-border bg-tyro-surface shadow-sm` |
| Danger | `border-red-200 text-red-500`, hover: `bg-red-50` |
| Disabled | `border-tyro-border/40 text-tyro-text-muted/40 cursor-default` |

### Button Composition — Use ONE approach
**Use HeroUI `<Button>` for all buttons.** Do NOT use raw `<button>` with custom classes. If theme accent color is needed, pass it via HeroUI's `style` prop but keep `className` consistent.

```tsx
// CORRECT — HeroUI Button everywhere
<Button color="primary" size="sm" onPress={handleSave}>
  {t("common.save")}
</Button>

// WRONG — raw HTML button with custom classes
<button className="h-8 px-3 rounded-lg..." onClick={handleSave}>
  Kaydet
</button>
```

### Button Order in Forms
Follow this consistent order (left-to-right, or stacked on mobile):
- **Form footer:** `[Cancel/Secondary]` `[Save/Primary]` — primary action on the RIGHT
- **Confirm dialogs:** `[Cancel]` `[Confirm/Danger]` — destructive action on the RIGHT
- **Wizard navigation:** `[Back]` `[Skip]` `[Next/Submit]` — forward action on the RIGHT
- **Detail panel header:** `[Back arrow]` ... `[Edit] [Delete] [Close X]`

### Cancel Button Rule
**Every form MUST have a visible Cancel button** alongside Submit in the sticky footer. The close X in the header is NOT a substitute for Cancel — users expect both.

```tsx
// Form sticky footer pattern
<div className="shrink-0 pt-3 pb-1 border-t border-tyro-border/20">
  <div className="flex gap-2">
    <Button variant="bordered" onPress={onClose} className="flex-1">
      {t("common.cancel")}
    </Button>
    <Button type="submit" color="primary" className="flex-1">
      {proje ? t("common.save") : t("common.create")}
    </Button>
  </div>
</div>
```

---

## 3. Sliding Panel / Detail Form Standards

### Panel Widths (standardized)
| Panel Type | Width | Example |
|------------|-------|---------|
| Form (create/edit) | 480px (default) | ProjeForm, AksiyonForm |
| Detail (read-only) | 640px | ProjeDetail, AksiyonDetail |
| Wizard (multi-step) | 680px | ProjeAksiyonWizard |

### Header Approach
Use ONE of these two patterns per panel type:
- **Forms:** Use SlidingPanel default `title` + `icon` props (simple header)
- **Detail views:** Use `hideHeader={true}` with custom themed banner (rich header with status, progress)

Do NOT mix these approaches within the same panel type.

### Sticky Footer Pattern
All forms must use this sticky footer:
```tsx
<div className="shrink-0 pt-3 pb-1 border-t border-tyro-border/20 bg-tyro-surface/80 backdrop-blur-sm">
  {/* Cancel + Submit buttons */}
</div>
```

### Close Button
- Always top-right corner
- Always use X icon (`<X size={15} />`)
- Backdrop click also closes

---

## 4. Colors & Contrast

- Use TYRO tokens only (`--tyro-navy`, `--tyro-gold`, etc.), never arbitrary hex
- **NEVER** use opacity modifiers on `text-tyro-text-muted` (`/70`, `/50` etc.)
- Min contrast: 4.5:1 (WCAG AA)
- Status colors must match `StatusBadge` palette everywhere
- Progress bar color = status color
- Full status color table in UI_RULES.md section 6

---

## 5. Icons

- **Lucide React** as primary icon set
- App-wide consistent icons: Proje=Target/Crosshair, Aksiyon=CircleCheckBig, Sihirbaz=Wand2
- Sizes per context: buttons 13-14px, menu items 14px, card headers 16px, tabs 16-18px
- `strokeWidth={2}` default, tabs use 1.8
- Full table in UI_RULES.md section 7

---

## 6. Component Patterns

- Base UI layer: **HeroUI** (NOT shadcn)
- Glass cards: `glass-card rounded-xl p-4 sm:p-5`
- Loading: `<Skeleton>` from HeroUI
- Tooltips: required for icon-only buttons
- Modals: HeroUI `<Modal>` with glassmorphism backdrop
- Tables: TanStack Table + HeroUI styling
- Charts: Tremor + TYRO color overrides
- Animated counters: all numeric metrics use Framer Motion, never static numbers
- Dark/light mode: required for every component. Default: light ("Sade Beyaz")
- Footer: "Powered by TTECH Business Solutions" — premium, minimal

---

## 7. Responsive

- Breakpoints: sm(640) md(768) lg(1024) xl(1280)
- Sidebar → drawer on mobile
- Tables → card-list on small screens
- Touch target: min 44x44px on mobile
- Button text: hide on mobile with `hidden sm:inline`, show icon-only
- Full patterns: `tyro-saas-skill/references/responsive.md`

---

## 8. Animation

- Button hover: `whileHover={{ scale: 1.04 }}`, `whileTap={{ scale: 0.96 }}`
- Panel: opacity 0→1, y: 8→0, duration: 0.2s
- Dropdown: scale: 0.95→1, duration: 0.12s
- Progress: `transition-all duration-700`
