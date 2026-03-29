import { describe, it, expect, beforeEach } from "vitest";
import { useToastStore, toast } from "../toastStore";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe("toastStore", () => {
  describe("default values", () => {
    it("toasts defaults to empty array", () => {
      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe("addToast", () => {
    it("adds a toast to the list", () => {
      useToastStore.getState().addToast({ type: "success", title: "Done" });
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it("assigns a unique id to each toast", () => {
      useToastStore.getState().addToast({ type: "info", title: "A" });
      useToastStore.getState().addToast({ type: "info", title: "B" });
      const [a, b] = useToastStore.getState().toasts;
      expect(a.id).toBeTruthy();
      expect(b.id).toBeTruthy();
      expect(a.id).not.toBe(b.id);
    });

    it("preserves toast type and title", () => {
      useToastStore.getState().addToast({ type: "error", title: "Oops" });
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("error");
      expect(t.title).toBe("Oops");
    });

    it("preserves optional message", () => {
      useToastStore
        .getState()
        .addToast({ type: "warning", title: "Warn", message: "Details here" });
      expect(useToastStore.getState().toasts[0].message).toBe("Details here");
    });

    it("preserves optional details array", () => {
      const details = [{ label: "ID", value: "123" }];
      useToastStore
        .getState()
        .addToast({ type: "info", title: "Info", details });
      expect(useToastStore.getState().toasts[0].details).toEqual(details);
    });

    it("preserves optional duration", () => {
      useToastStore
        .getState()
        .addToast({ type: "success", title: "Quick", duration: 2000 });
      expect(useToastStore.getState().toasts[0].duration).toBe(2000);
    });
  });

  describe("removeToast", () => {
    it("removes a toast by id", () => {
      useToastStore.getState().addToast({ type: "info", title: "A" });
      useToastStore.getState().addToast({ type: "info", title: "B" });
      const idToRemove = useToastStore.getState().toasts[0].id;
      useToastStore.getState().removeToast(idToRemove);
      const remaining = useToastStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe("B");
    });

    it("does nothing when id does not exist", () => {
      useToastStore.getState().addToast({ type: "info", title: "A" });
      useToastStore.getState().removeToast("nonexistent-id");
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe("toast convenience helpers", () => {
    it("toast.success adds a success toast with string message", () => {
      toast.success("Saved", "Record created");
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("success");
      expect(t.title).toBe("Saved");
      expect(t.message).toBe("Record created");
    });

    it("toast.error adds an error toast with string message", () => {
      toast.error("Failed", "Network error");
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("error");
      expect(t.title).toBe("Failed");
      expect(t.message).toBe("Network error");
    });

    it("toast.warning adds a warning toast", () => {
      toast.warning("Careful");
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("warning");
      expect(t.title).toBe("Careful");
    });

    it("toast.info adds an info toast", () => {
      toast.info("FYI");
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("info");
      expect(t.title).toBe("FYI");
    });

    it("toast.success accepts options object with details", () => {
      const details = [{ label: "Proje", value: "Alpha" }];
      toast.success("Created", { message: "Done", details, duration: 5000 });
      const t = useToastStore.getState().toasts[0];
      expect(t.message).toBe("Done");
      expect(t.details).toEqual(details);
      expect(t.duration).toBe(5000);
    });

    it("toast.error accepts options object without message", () => {
      toast.error("Fail", { duration: 8000 });
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe("error");
      expect(t.duration).toBe(8000);
      expect(t.message).toBeUndefined();
    });

    it("toast helpers work with no second argument", () => {
      toast.info("Just title");
      const t = useToastStore.getState().toasts[0];
      expect(t.title).toBe("Just title");
      expect(t.message).toBeUndefined();
    });
  });
});
