import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem, DatePicker, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Check, Tag, X, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { useUIStore } from "@/stores/uiStore";
import { getStatusOptions, getSourceOptions } from "@/lib/constants";
import { PROJECT_DEPARTMENT_KEYS, deptLabel } from "@/config/departments";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";
import TagChip from "@/components/ui/TagChip";
import StatusBadge from "@/components/ui/StatusBadge";
import FormSection from "@/components/shared/FormSection";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { Proje } from "@/types";

const createProjeSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(3, t("validation.minChars")),
    description: z.string().optional(),
    owner: z.string().min(1, t("validation.ownerRequired")),
    participants: z.array(z.string()).default([]),
    department: z.string().default(""),
    source: z.enum(["T\u00fcrkiye", "Kurumsal", "International", "LALE", "Organik"]),
    status: z.enum(["On Track", "At Risk", "High Risk", "Achieved", "Not Started", "Cancelled", "On Hold"]),
    progress: z.number().min(0).max(100),
    tags: z.array(z.string()).default([]),
    parentObjectiveId: z.string().optional(),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
    reviewDate: z.string().min(1, t("validation.reviewDateRequired")),
  });

const STATUS_HEX: Record<string, string> = {
  "On Track": "#10b981", "At Risk": "#f59e0b", "High Risk": "#ef4444",
  "Achieved": "#3b82f6", "Not Started": "#94a3b8", "Cancelled": "#6b7280", "On Hold": "#8b5cf6",
};

type ProjeFormData = z.infer<ReturnType<typeof createProjeSchema>>;

interface ProjeFormProps {
  proje?: Proje;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function ProjeForm({ proje, onSuccess, onClose }: ProjeFormProps) {
  const { t } = useTranslation();
  const addProje = useDataStore((s) => s.addProje);
  const updateProje = useDataStore((s) => s.updateProje);
  const projeler = useDataStore((s) => s.projeler);
  const dbUsers = useDataStore((s) => s.users);
  const allUsers = dbUsers.map((u) => u.displayName);
  const currentUserName = useUIStore((s) => s.mockUserName);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const isDark = sidebarTheme.isDark !== false;
  const txtColor = isDark ? "#ffffff" : "#1e293b";
  const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const sepColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  const projeSchema = createProjeSchema(t);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjeFormData>({
    resolver: zodResolver(projeSchema),
    defaultValues: {
      name: proje?.name ?? "",
      description: proje?.description ?? "",
      owner: proje?.owner ?? currentUserName,
      participants: proje?.participants ?? [],
      department: proje?.department ?? "",
      source: proje?.source ?? "T\u00fcrkiye",
      status: proje?.status ?? "Not Started",
      progress: proje?.progress ?? 0,
      tags: proje?.tags ?? [],
      parentObjectiveId: proje?.parentObjectiveId ?? "",
      startDate: proje?.startDate ?? "",
      endDate: proje?.endDate ?? "",
      reviewDate: proje?.reviewDate ?? new Date().toISOString().slice(0, 10),
    },
  });

  // reviewDate varsayılan: bugünün tarihi (yeni kayıtta)
  // startDate'ten otomatik atama kaldırıldı

  const onSubmit = (data: ProjeFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        tags: data.tags.length > 0 ? data.tags : undefined,
        parentObjectiveId: data.parentObjectiveId || undefined,
      };
      if (proje) {
        // Detect changed fields for structured toast
        const details: { label: string; value: string }[] = [];
        if (data.name !== proje.name) details.push({ label: t("common.name"), value: data.name });
        if (data.progress !== proje.progress) details.push({ label: t("common.progress"), value: `%${data.progress}` });
        if (data.status !== proje.status) details.push({ label: t("common.status"), value: data.status });
        if (data.owner !== proje.owner) details.push({ label: t("common.owner"), value: data.owner });
        if (data.source !== proje.source) details.push({ label: t("common.source"), value: data.source });
        if (data.department !== proje.department) details.push({ label: t("common.department"), value: deptLabel(data.department, t) });
        if (data.startDate !== proje.startDate) details.push({ label: t("common.startDate"), value: data.startDate });
        if (data.endDate !== proje.endDate) details.push({ label: t("common.endDate"), value: data.endDate });
        updateProje(proje.id, payload);
        toast.success(t("toast.objectiveUpdated"), {
          message: data.name,
          details: details.length > 0 ? details : [{ label: t("common.status"), value: t("toast.changeSaved") }],
        });
      } else {
        addProje({ ...payload });
        toast.success(t("toast.objectiveCreated"), { message: data.name });
      }
      onSuccess();
    } catch (err) {
      toast.error(t("toast.operationFailed"), err instanceof Error ? err.message : t("toast.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = getStatusOptions(t);
  const sourceOptions = getSourceOptions(t);

  // Scroll state for fade indicators
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ top: false, bottom: true });
  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollState({
      top: el.scrollTop > 8,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 8,
    });
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Themed Header — edit mode */}
      {proje && (
        <div className="relative rounded-xl overflow-hidden px-4 py-3 shrink-0" style={{ background: sidebarTheme.bg }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {onClose && (
                  <button type="button" onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.95]"
                    style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; }}>
                    <ArrowLeft size={14} />
                  </button>
                )}
                <span className="text-[13px] font-bold tabular-nums" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)" }}>{proje.id}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(30,41,59,0.4)" }}>{t("forms.objective.editTitle")}</span>
              </div>
              {onClose && (
                <button type="button" onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.95]"
                  style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}>
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="h-px rounded-full mb-2" style={{ background: `linear-gradient(to right, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />
            <h3 className="text-[15px] font-bold leading-snug" style={{ color: sidebarTheme.textPrimary ?? "#ffffff" }}>
              {watch("name") || proje.name}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <StatusBadge status={watch("status") || proje?.status || "On Track"} />
              <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: txtColor }}>
                %{watch("progress") ?? proje.progress}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${watch("progress") ?? proje.progress}%`, backgroundColor: STATUS_HEX[watch("status") || proje.status] ?? "#94a3b8" }} />
            </div>
          </div>
        </div>
      )}

      {/* Scrollable form body */}
      <div className={`form-scroll-wrapper flex-1 min-h-0 ${scrollState.top ? "has-scroll-top" : ""} ${scrollState.bottom ? "has-scroll-bottom" : ""}`}>
        <div ref={scrollRef} className="form-scroll-body h-full px-0.5 py-1 space-y-3" onScroll={updateScroll}>

      <FormSection title={t("forms.objective.sectionTitle")}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.name")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Input
              {...field}
              placeholder={t("forms.objective.namePlaceholder")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message}
              variant="bordered"
              size="sm"
              classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
            />
          </div>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.description")}
            </label>
            <Textarea
              {...field}
              placeholder={t("forms.objective.descriptionPlaceholder")}
              variant="bordered"
              size="sm"
              minRows={2}
              maxRows={4}
              classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
            />
          </div>
        )}
      />


      <Controller
        name="owner"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.owner")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Autocomplete
              defaultInputValue={field.value}
              onInputChange={(v) => field.onChange(v)}
              onSelectionChange={(key) => { if (key) field.onChange(String(key)); }}
              variant="bordered"
              size="sm"
              placeholder={t("forms.objective.ownerPlaceholder")}
              isInvalid={!!errors.owner}
              errorMessage={errors.owner?.message}
              classNames={{ base: "w-full", input: "font-semibold text-tyro-text-primary" }}
              allowsCustomValue
            >
              {allUsers.map((name) => (
                <AutocompleteItem key={name}>{name}</AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
        )}
      />

      <Controller
        name="participants"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.participants")}
            </label>
            <Select
              selectionMode="multiple"
              selectedKeys={new Set(field.value)}
              onSelectionChange={(keys) => {
                field.onChange(Array.from(keys) as string[]);
              }}
              variant="bordered"
              size="sm"
              classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
              placeholder={t("forms.objective.participantsPlaceholder")}
            >
              {allUsers.map((name) => (
                <SelectItem key={name}>{name}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />

      <Controller
        name="department"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.department")}
            </label>
            <Select
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
              placeholder={t("forms.objective.departmentPlaceholder")}
            >
              {PROJECT_DEPARTMENT_KEYS.map((key) => (
                <SelectItem key={key}>{t(`projectDepartments.${key}`)}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />


      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.objective.source")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <Select
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                isInvalid={!!errors.source}
                errorMessage={errors.source?.message}
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
                placeholder={t("forms.objective.sourcePlaceholder")}
              >
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.key}>{opt.label}</SelectItem>
                ))}
              </Select>
            </div>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.objective.status")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <Select
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                isInvalid={!!errors.status}
                errorMessage={errors.status?.message}
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
                placeholder={t("forms.objective.statusPlaceholder")}
              >
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.key}>{opt.label}</SelectItem>
                ))}
              </Select>
            </div>
          )}
        />
      </div>

      <Controller
        name="progress"
        control={control}
        render={({ field }) => {
          const val = field.value;
          const barColor = STATUS_HEX[watch("status")] ?? "#94a3b8";
          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-tyro-text-secondary">
                  {t("common.progress")}
                </label>
                <span className="text-lg font-extrabold tabular-nums" style={{ color: barColor }}>
                  %{val}
                </span>
              </div>
              <div className="relative mb-3 h-4 flex items-center">
                <div className="absolute inset-x-0 h-2.5 rounded-full bg-tyro-border/15" />
                <div
                  className="absolute left-0 h-2.5 rounded-full"
                  style={{ width: `${val}%`, backgroundColor: barColor, transition: "width 50ms linear, background-color 300ms ease" }}
                />
                <input
                  type="range" min={0} max={100} step={5}
                  value={val}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute w-5 h-5 rounded-full bg-white border-[2.5px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] pointer-events-none"
                  style={{ left: `calc(${val}% - 10px)`, transition: "left 50ms linear, border-color 300ms ease", borderColor: barColor }}
                />
              </div>
              <div className="flex gap-[3px]">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => {
                  const isExact = val === v;
                  const isPassed = val > v;
                  return (
                    <button key={v} type="button" onClick={() => field.onChange(v)}
                      className={`flex-1 min-w-0 py-1 rounded text-[10px] font-bold tabular-nums transition-all cursor-pointer ${
                        isExact ? "text-white shadow-sm scale-105" : isPassed ? "text-white/70" : "bg-tyro-bg text-tyro-text-muted hover:bg-tyro-border/20"
                      }`}
                      style={isExact || isPassed ? { backgroundColor: isExact ? barColor : `${barColor}60` } : undefined}
                    >
                      {v}%
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }}
      />

      <Controller
        name="tags"
        control={control}
        render={({ field }) => {
          const [tagInput, setTagInput] = useState("");
          const tagDefs = useDataStore((s) => s.tagDefinitions);
          const addTagDef = useDataStore((s) => s.addTagDefinition);
          const getTagColor = useDataStore((s) => s.getTagColor);

          const allowMultiple = useUIStore((s) => s.allowMultipleTags);
          const addTag = (tag: string) => {
            const trimmed = tag.trim();
            if (!trimmed || field.value.includes(trimmed)) { setTagInput(""); return; }
            if (!allowMultiple && field.value.length >= 1) {
              toast.error(t("toast.singleTagRule"), { message: t("toast.singleTagRuleDesc") });
              setTagInput("");
              return;
            }
            // On-the-fly: register unknown tag in store
            const exists = tagDefs.some(
              (t) => t.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
            );
            if (!exists) {
              addTagDef({ name: trimmed, color: DEFAULT_TAG_COLOR });
            }
            field.onChange([...field.value, trimmed]);
            setTagInput("");
          };
          const removeTag = (tag: string) => {
            field.onChange(field.value.filter((t: string) => t !== tag));
          };
          const filteredSuggestions = tagDefs.filter(
            (td) => !field.value.includes(td.name) && td.name.toLocaleLowerCase("tr").includes(tagInput.toLocaleLowerCase("tr"))
          );
          return (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                <Tag size={12} className="inline mr-1 -mt-0.5" />
                {t("forms.objective.tags", "Etiketler")}
              </label>
              {/* Current tags — renkli TagChip */}
              {field.value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {field.value.map((tag: string) => (
                    <TagChip key={tag} name={tag} size="md" onClose={() => removeTag(tag)} />
                  ))}
                </div>
              )}
              {/* Tag input with autocomplete — renkli öneriler */}
              <Autocomplete
                inputValue={tagInput}
                onInputChange={setTagInput}
                onSelectionChange={(key) => { if (key) addTag(String(key)); }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                variant="bordered"
                size="sm"
                placeholder={t("forms.objective.tagsPlaceholder")}
                classNames={{ base: "w-full", input: "font-semibold text-tyro-text-primary" }}
                allowsCustomValue
                menuTrigger="input"
              >
                {filteredSuggestions.slice(0, 8).map((td) => (
                  <AutocompleteItem key={td.name} textValue={td.name}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: td.color }} />
                      <span>{td.name}</span>
                    </div>
                  </AutocompleteItem>
                ))}
              </Autocomplete>
            </div>
          );
        }}
      />

      <Controller
        name="parentObjectiveId"
        control={control}
        render={({ field }) => {
          const availableProjeler = projeler.filter((h) => !proje || h.id !== proje.id);
          return (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.objective.parentObjective")}
              </label>
              <Select
                selectedKeys={field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val ?? "");
                }}
                variant="bordered"
                size="sm"
                classNames={{ trigger: "border-tyro-border", value: "font-semibold text-tyro-text-primary" }}
                placeholder={t("forms.objective.parentObjectivePlaceholder")}
              >
                {availableProjeler.map((h) => (
                  <SelectItem key={h.id}>{h.name}</SelectItem>
                ))}
              </Select>
            </div>
          );
        }}
      />


      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.objective.startDate")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <DatePicker
                value={toCalendarDate(field.value)}
                onChange={(date) => field.onChange(fromCalendarDate(date))}
                isInvalid={!!errors.startDate}
                errorMessage={errors.startDate?.message}
                variant="bordered"
                size="sm"
                granularity="day"
              />
            </div>
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.objective.endDate")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <DatePicker
                value={toCalendarDate(field.value)}
                onChange={(date) => field.onChange(fromCalendarDate(date))}
                isInvalid={!!errors.endDate}
                errorMessage={errors.endDate?.message}
                variant="bordered"
                size="sm"
                granularity="day"
              />
            </div>
          )}
        />
      </div>

      <Controller
        name="reviewDate"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("forms.objective.reviewDate")}
            </label>
            <DatePicker
              value={toCalendarDate(field.value ?? "")}
              onChange={(date) => field.onChange(fromCalendarDate(date))}
              variant="bordered"
              size="sm"
              granularity="day"
            />
          </div>
        )}
      />
      </FormSection>

        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 pt-3 pb-1 border-t border-tyro-border/20 bg-tyro-surface/80 backdrop-blur-sm">
        <div className="flex gap-2">
          {onClose && (
            <Button
              type="button"
              variant="bordered"
              onPress={onClose}
              className="flex-1 rounded-button font-semibold border-tyro-border"
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isLoading}
            startContent={<Check size={14} />}
            className={`${onClose ? "flex-1" : "w-full"} rounded-button font-semibold relative overflow-hidden group text-white`}
            style={{ backgroundColor: accentColor }}
          >
            <span className="relative z-10">{proje ? t("common.save") : t("common.create")}</span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
              <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
