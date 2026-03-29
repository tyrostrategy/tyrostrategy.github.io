# Error Handling

## Principles
1. **Never swallow errors** — no empty catch blocks, no `console.log` only
2. **User-visible errors go through toast** — use `toastStore` for all user-facing error notifications
3. **API errors:** TanStack Query `onError` callbacks should show toast with meaningful message
4. **Form validation:** Zod schemas define validation, React Hook Form displays errors inline
5. **ErrorBoundary:** app-level ErrorBoundary exists in `shared/` — wraps route-level components

## Error Reporting Pattern

```typescript
// API mutation → toast on error
const mutation = useMutation({
  mutationFn: updateProject,
  onError: (error) => {
    console.error("[updateProject]", error);
    useToastStore.getState().addToast({
      type: "error",
      message: t("toast.updateFailed"),
    });
  },
  onSuccess: () => {
    useToastStore.getState().addToast({
      type: "success",
      message: t("toast.objectiveUpdated"),
    });
  },
});
```

## Supabase Sync Errors
The `syncToSupabase()` helper MUST NOT be fire-and-forget with console.error only. It must:
1. Log to console for debugging
2. Show toast notification to user
3. Optionally retry once for transient network errors

```typescript
// WRONG
fn().catch((err) => console.error("[Supabase Sync]", err));

// CORRECT
fn().catch((err) => {
  console.error("[Supabase Sync]", err);
  useToastStore.getState().addToast({
    type: "error",
    message: t("toast.syncFailed"),
  });
});
```

## Form Validation
```typescript
// Zod schema with translated messages
const schema = z.object({
  name: z.string().min(1, t("validation.required")),
  email: z.string().email(t("validation.invalidEmail")),
});
```

## Rules
- Error messages must be translated via i18n keys (never hardcoded Turkish/English)
- Network errors: show generic "connection error" toast, log detail to console
- 401/403: redirect to login or show permission denied
- Supabase errors: map to user-friendly messages via error code
- Toast duration: errors stay 5s, success stays 3s
- Never show raw error objects/stack traces to users
