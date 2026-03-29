# Code Style & Best Practices

## TypeScript

### No `any` — ever
```typescript
// WRONG
const data: any = fetchData();
resolver: zodResolver(schema) as any

// CORRECT
const data: unknown = fetchData();
// or define a proper type
interface ProjectData { id: string; name: string; }
const data: ProjectData = fetchData();
```

If a library type doesn't match perfectly, create a type wrapper — don't escape to `any`.

### Strict Types
- `strict: true` is enabled — respect it
- No `@ts-ignore` without a comment explaining WHY
- No `// @ts-expect-error` unless the library genuinely has a type bug
- All exported functions must have explicit return types
- Use `unknown` instead of `any` when type is genuinely unknown

---

## React Patterns

### No Inline Style Objects in Render
Style objects created inside JSX cause unnecessary re-renders and GC pressure.

```typescript
// WRONG — new object every render
<div style={{ backgroundColor: theme.bg, color: theme.text }}>

// CORRECT — memoize or extract
const cardStyle = useMemo(() => ({
  backgroundColor: theme.bg,
  color: theme.text,
}), [theme.bg, theme.text]);
<div style={cardStyle}>

// BEST — use Tailwind classes instead of inline styles
<div className="bg-tyro-surface text-tyro-text-primary">
```

### List Keys — Never Use Array Index
```typescript
// WRONG — index as key causes bugs on reorder
{items.map((item, idx) => <Card key={idx} />)}

// CORRECT — use unique identifier
{items.map((item) => <Card key={item.id} />)}
```

### useCallback for Callbacks Passed to Children
```typescript
// WRONG — new function every render, breaks React.memo
<MemoizedChild onClick={() => handleClick(id)} />

// CORRECT
const handleChildClick = useCallback(() => handleClick(id), [id]);
<MemoizedChild onClick={handleChildClick} />
```

### useMemo for Expensive Computations
```typescript
// WRONG — sorts on every render
const sorted = items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

// CORRECT
const sorted = useMemo(
  () => [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [items]
);
```

---

## No Hardcoded Data

### User Identity
```typescript
// WRONG — duplicated in 3+ files
const CURRENT_USER = "Cenk Şayli";

// CORRECT — centralized from auth context
const { user } = useCurrentUser();
// or from MSAL
const { accounts } = useMsal();
```

### Filter/Dropdown Options
```typescript
// WRONG — hardcoded user names
const liderOptions = ["Kerime İkizler", "Recep Mergen", ...];

// CORRECT — from data store or API
const { data: users } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
const liderOptions = users?.map(u => u.name) ?? [];
```

### Magic Numbers
```typescript
// WRONG
if (items.length > 5) { ... }
setTimeout(fn, 3000);
style={{ maxWidth: 480 }}

// CORRECT — named constants
const MAX_VISIBLE_ITEMS = 5;
const TOAST_DURATION_MS = 3000;
const PANEL_DEFAULT_WIDTH = 480;
```

---

## Error Handling

### Never Swallow Errors
```typescript
// WRONG — silent failure
fn().catch((err) => console.error(err));

// CORRECT — inform the user
fn().catch((err) => {
  console.error("[Context]", err);
  useToastStore.getState().addToast({
    type: "error",
    message: t("toast.syncFailed"),
  });
});
```

### Supabase Sync Must Report Failures
The `syncToSupabase()` helper in `dataStore.ts` must notify users on failure, not just console.error.

---

## Component Architecture

### Extract Complex Inline Handlers
```typescript
// WRONG — logic in JSX
<button onClick={() => { setShowSave(false); setName(""); resetForm(); }}>

// CORRECT — named handler
const handleCancel = useCallback(() => {
  setShowSave(false);
  setName("");
  resetForm();
}, [resetForm]);
<button onClick={handleCancel}>
```

### Keep Components Focused
- Max ~300 lines per component file
- If a component has 5+ useState hooks, consider extracting to a custom hook
- If JSX return is 100+ lines, split into sub-components

### File Organization
- One component per file
- Co-locate closely related sub-components in same directory
- Shared utilities go in `lib/`, not duplicated across files

---

## Import Hygiene

- Remove unused imports immediately
- Group imports: React → libraries → @ aliases → relative
- No circular dependencies between modules
- Use `@/` path alias, never `../../..` deep relative paths
