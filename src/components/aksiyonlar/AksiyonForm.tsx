import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem, DatePicker } from "@heroui/react";
import { Check, X, ArrowLeft, ChevronDown } from "lucide-react";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { getStatusOptions } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import StatusBadge from "@/components/ui/StatusBadge";
import FormSection from "@/components/shared/FormSection";
import type { Aksiyon, EntityStatus } from "@/types";

const CURRENT_USER = "Cenk \u015eayli";

const createAksiyonSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.actionNameRequired")),
    description: z.string().optional(),
    owner: z.string().min(1, t("validation.ownerRequired")),
    projeId: z.string().min(1, t("validation.objectiveRequired")),
    progress: z.number().min(0).max(100),
    status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Not Started", "Cancelled", "On Hold"]),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
  });

type AksiyonFormData = z.infer<ReturnType<typeof createAksiyonSchema>>;

interface AksiyonFormProps {
  aksiyon?: Aksiyon;
  defaultProjeId?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AksiyonForm({ aksiyon, defaultProjeId, onSuccess, onClose }: AksiyonFormProps) {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const proje = aksiyon
    ? projeler.find((p) => p.id === aksiyon.projeId)
    : defaultProjeId ? projeler.find((p) => p.id === defaultProjeId) : null;
  const addAksiyon = useDataStore((s) => s.addAksiyon);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);
  const [isLoading, setIsLoading] = useState(false);
  const [projeCardOpen, setProjeCardOpen] = useState(false);
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const isDark = sidebarTheme.isDark !== false;
  const txtColor = isDark ? "#ffffff" : "#1e293b";
  const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const sepColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  const aksiyonSchema = createAksiyonSchema(t);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AksiyonFormData>({
    resolver: zodResolver(aksiyonSchema),
    defaultValues: {
      name: aksiyon?.name ?? "",
      description: aksiyon?.description ?? "",
      owner: aksiyon?.owner ?? proje?.owner ?? CURRENT_USER,
      projeId: aksiyon?.projeId ?? defaultProjeId ?? "",
      progress: aksiyon?.progress ?? 0,
      status: aksiyon?.status ?? "Not Started",
      startDate: aksiyon?.startDate ?? "",
      endDate: aksiyon?.endDate ?? "",
    },
  });

  // ===== İlerleme → Durum otomatik hesaplama =====
  const watchProgress = watch("progress");
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchStatus = watch("status");

  const STATUS_HEX: Record<string, string> = {
    "On Track": "#10b981", "At Risk": "#f59e0b", "Behind": "#ef4444",
    "Achieved": "#3b82f6", "Not Started": "#94a3b8", "Cancelled": "#6b7280", "On Hold": "#8b5cf6",
  };

  const suggestStatus = (progress: number, start: string, end: string): EntityStatus => {
    if (progress === 0) return "Not Started";
    if (progress >= 100) return "Achieved";
    // %1-99: tarihe göre hesapla
    if (!start || !end) return "On Track";
    const now = Date.now();
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const totalDuration = endMs - startMs;
    if (totalDuration <= 0) return "On Track";
    const elapsed = now - startMs;
    const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const diff = expectedProgress - progress;
    if (diff > 20) return "Behind";    // %20'den fazla geride → Gecikmeli
    if (diff > 10) return "At Risk";   // %10-20 geride → Risk Altında
    return "On Track";                  // Planda → Yolunda
  };

  // İlerleme değiştiğinde durumu otomatik öner
  useEffect(() => {
    const suggested = suggestStatus(watchProgress, watchStartDate, watchEndDate);
    // %0 ve %100'de kilitli — otomatik set
    if (watchProgress === 0 || watchProgress >= 100) {
      setValue("status", suggested);
    } else {
      // %1-99: öner ama kullanıcı override edebilir
      setValue("status", suggested);
    }
  }, [watchProgress, watchStartDate, watchEndDate, setValue]);

  const isStatusLocked = watchProgress === 0 || watchProgress >= 100;

  const onSubmit = (data: AksiyonFormData) => {
    setIsLoading(true);
    try {
      if (aksiyon) {
        // Detect changed fields for structured toast
        const details: { label: string; value: string }[] = [];
        if (data.name !== aksiyon.name) details.push({ label: "Ad", value: data.name });
        if (data.progress !== aksiyon.progress) details.push({ label: "İlerleme", value: `%${data.progress}` });
        if (data.status !== aksiyon.status) details.push({ label: "Durum", value: data.status });
        if (data.owner !== aksiyon.owner) details.push({ label: "Sahip", value: data.owner });
        if (data.startDate !== aksiyon.startDate) details.push({ label: "Başlangıç", value: data.startDate });
        if (data.endDate !== aksiyon.endDate) details.push({ label: "Bitiş", value: data.endDate });
        updateAksiyon(aksiyon.id, data);
        toast.success(t("toast.actionUpdated"), {
          message: data.name,
          details: details.length > 0 ? details : [{ label: "Durum", value: "Değişiklik kaydedildi" }],
        });
      } else {
        addAksiyon(data);
        toast.success(t("toast.actionCreated"), { message: data.name });
      }
      onSuccess();
    } catch (err) {
      toast.error(t("toast.operationFailed"), err instanceof Error ? err.message : t("toast.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = getStatusOptions(t);

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
      {/* Themed Header — create mode */}
      {!aksiyon && (
        <div className="relative rounded-xl overflow-hidden px-4 py-3" style={{ background: sidebarTheme.bg }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }} />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)" }}>Yeni Aksiyon Oluştur</span>
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
        </div>
      )}

      {/* Themed Header — edit mode (same style as AksiyonDetail) */}
      {aksiyon && (
        <div className="relative rounded-xl overflow-hidden px-4 py-3" style={{ background: sidebarTheme.bg }}>
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
                <span className="text-[13px] font-bold tabular-nums" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)" }}>{aksiyon.id}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(30,41,59,0.4)" }}>Aksiyon Düzenleme</span>
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
            <div className="h-px rounded-full mb-2" style={{ background: `linear-gradient(to right, transparent, ${sidebarTheme.isDark !== false ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"} 30%, ${sidebarTheme.isDark !== false ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"} 70%, transparent)` }} />
            <h3 className="text-[15px] font-bold leading-snug" style={{ color: sidebarTheme.textPrimary ?? "#ffffff" }}>
              {watch("name") || aksiyon.name}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <StatusBadge status={watchStatus} />
              <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: sidebarTheme.isDark !== false ? "#ffffff" : "#1e293b" }}>
                %{watchProgress}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: sidebarTheme.isDark !== false ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${watchProgress}%`, backgroundColor: STATUS_HEX[watchStatus] ?? "#94a3b8" }} />
            </div>
          </div>
        </div>
      )}

      {/* Parent Project Card — collapsible (brandStrategy color) */}
      {proje && (
        <div className="relative rounded-xl overflow-hidden mt-1" style={{ background: sidebarTheme.brandStrategy ?? sidebarTheme.accentColor ?? "#c8922a" }}>
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
            backgroundSize: "16px 16px",
          }} />
          <button type="button" onClick={() => setProjeCardOpen(!projeCardOpen)}
            className="relative z-10 w-full flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Bağlı Proje: <span className="text-white tabular-nums">{proje.id}</span></span>
            <ChevronDown size={14} className={`text-white/80 transition-transform duration-200 ${projeCardOpen ? "rotate-180" : ""}`} />
          </button>
          {projeCardOpen && (
            <div className="relative z-10 px-4 pb-3">
              <p className="text-[13px] font-semibold text-white leading-snug">{proje.name}</p>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <StatusBadge status={proje.status} />
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/15 text-white/80">{proje.source}</span>
                <span className="text-[11px] text-white/70">{proje.owner}</span>
                <span className="ml-auto text-[12px] font-bold tabular-nums text-white/80">%{proje.progress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable form body */}
      <div className={`form-scroll-wrapper flex-1 min-h-0 ${scrollState.top ? "has-scroll-top" : ""} ${scrollState.bottom ? "has-scroll-bottom" : ""}`}>
        <span className="form-scroll-chevron text-[10px] text-tyro-text-muted flex items-center gap-1">↓ Diğer alanlar</span>
        <div ref={scrollRef} className="form-scroll-body h-full px-0.5 py-1 space-y-3" onScroll={updateScroll}>

      {/* Section: Temel Bilgiler */}
      <FormSection title="Temel Bilgiler">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                {t("forms.action.name")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <Input
                {...field}
                placeholder={t("forms.action.namePlaceholder")}
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
                placeholder={t("forms.action.descriptionPlaceholder", "Aksiyon açıklaması giriniz (isteğe bağlı)")}
                variant="bordered"
                size="sm"
                minRows={2}
                maxRows={4}
                classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
              />
            </div>
          )}
        />
      </FormSection>

      {/* Section: İlerleme & Durum */}
      <FormSection title="İlerleme & Durum">
      <Controller
        name="progress"
        control={control}
        render={({ field }) => {
          const val = field.value;
          const barColor = STATUS_HEX[watchStatus] ?? "#94a3b8";

          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-tyro-text-secondary">
                  {t("forms.action.progress")}
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
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={val}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute w-5 h-5 rounded-full bg-white border-[2.5px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] pointer-events-none"
                  style={{
                    left: `calc(${val}% - 10px)`,
                    transition: "left 50ms linear, border-color 300ms ease",
                    borderColor: barColor,
                  }}
                />
              </div>

              <div className="flex gap-[3px]">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => {
                  const isExact = val === v;
                  const isPassed = val > v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => field.onChange(v)}
                      className={`flex-1 min-w-0 py-1 rounded text-[10px] font-bold tabular-nums transition-all cursor-pointer ${
                        isExact
                          ? "text-white shadow-sm scale-105"
                          : isPassed
                            ? "text-white/70"
                            : "bg-tyro-bg text-tyro-text-muted hover:bg-tyro-border/20"
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
        name="status"
        control={control}
        render={({ field }) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-tyro-text-secondary">
                {t("forms.objective.status")}<span className="text-tyro-danger ml-0.5">*</span>
                {isStatusLocked && (
                  <span className="ml-1.5 text-[11px] text-tyro-text-muted font-normal">(otomatik)</span>
                )}
              </label>
              {field.value && <StatusBadge status={field.value as EntityStatus} />}
            </div>
            {!isStatusLocked ? (
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
            ) : (
              <p className="text-[11px] text-tyro-text-muted italic px-1">
                {watchProgress === 0 ? "İlerleme %0 olduğunda durum otomatik belirlenir" : "İlerleme %100 olduğunda durum otomatik belirlenir"}
              </p>
            )}
          </div>
        )}
      />
      </FormSection>

      {/* Section: Tarihler */}
      <FormSection title="Tarihler">
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
      </FormSection>

      {aksiyon && (aksiyon.createdBy || aksiyon.createdAt || aksiyon.completedAt) && (
        <div className="rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-tyro-border/30 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden divide-y divide-tyro-border/20">
          <div className="grid grid-cols-2 divide-x divide-tyro-border/15">
            <div className="px-3.5 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1">{t("common.createdAt")}</span>
              <p className="text-[12px] font-semibold text-tyro-text-primary">{aksiyon.createdAt ? formatDate(aksiyon.createdAt) : "—"}</p>
            </div>
            <div className="px-3.5 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1">{t("common.createdBy")}</span>
              <p className="text-[12px] font-semibold text-tyro-text-primary">{aksiyon.createdBy ?? "—"}</p>
            </div>
          </div>
          {aksiyon.completedAt && (
            <div className="px-3.5 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1">{t("common.completedAt")}</span>
              <p className="text-[12px] font-semibold text-emerald-600">{formatDate(aksiyon.completedAt)}</p>
            </div>
          )}
        </div>
      )}

        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 pt-3 pb-1 border-t border-tyro-border/20 bg-tyro-surface/80 backdrop-blur-sm">
        <Button
          type="submit"
          isLoading={isLoading}
          startContent={<Check size={14} />}
          className="w-full rounded-button font-semibold relative overflow-hidden group text-white"
          style={{ backgroundColor: accentColor }}
        >
        <span className="relative z-10">{aksiyon ? t("common.save") : t("common.create")}</span>
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
          <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
        </span>
        </Button>
      </div>
    </form>
  );
}
