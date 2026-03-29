Audit a component or page for UI rule compliance:

1. Read the target file (user will specify which component/page)
2. Check against `UI_RULES.md` for:
   - Font sizes: any text below 11px? Any clickable element below 12px? Any 10px usage?
   - Button styles: correct h-8 height? font-semibold? cursor-pointer? hover effect?
   - Colors: using TYRO tokens or arbitrary hex? Opacity modifiers on muted text?
   - Status colors: matching StatusBadge palette?
   - Icons: correct sizes per context? Consistent app icons (Target for projects, etc.)?
   - Spacing: following gap-3/gap-4 patterns?
   - Responsive: mobile breakpoints handled? Touch targets >= 44px?
   - Dark mode: all colors work in dark theme?
3. Check for accessibility:
   - Contrast ratio >= 4.5:1 for text
   - Interactive elements have focus states
   - Images have alt text
4. Report violations with line numbers and how to fix each one
