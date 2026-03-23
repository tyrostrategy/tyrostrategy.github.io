import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem, DatePicker, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { getStatusOptions } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import { departments } from "@/config/departments";
import StatusBadge from "@/components/ui/StatusBadge";
import type { Aksiyon, EntityStatus } from "@/types";

const CURRENT_USER = "Cenk \u015eayli";
const allUsers = departments.flatMap((d) => d.users.map((u) => u.name));

const createAksiyonSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.actionNameRequired")),
    description: z.string().optional(),
    owner: z.string().min(1, t("validation.ownerRequired")),
    hedefId: z.string().min(1, t("validation.objectiveRequired")),
    progress: z.number().min(0).max(100),
    status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Not Started"]),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
  });

type AksiyonFormData = z.infer<ReturnType<typeof createAksiyonSchema>>;

interface AksiyonFormProps {
  aksiyon?: Aksiyon;
  defaultHedefId?: string;
  onSuccess: () => void;
}

export default function AksiyonForm({ aksiyon, defaultHedefId, onSuccess }: AksiyonFormProps) {
  const { t } = useTranslation();
  const hedefler = useDataStore((s) => s.hedefler);
  const addAksiyon = useDataStore((s) => s.addAksiyon);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);
  const [isLoading, setIsLoading] = useState(false);

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
      owner: aksiyon?.owner ?? CURRENT_USER,
      hedefId: aksiyon?.hedefId ?? defaultHedefId ?? "",
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
        // Detect changed fields for detailed toast
        const changes: string[] = [];
        if (data.name !== aksiyon.name) changes.push(`Ad: "${data.name}"`);
        if (data.progress !== aksiyon.progress) changes.push(`İlerleme: %${data.progress}`);
        if (data.status !== aksiyon.status) changes.push(`Durum: ${data.status}`);
        if (data.owner !== aksiyon.owner) changes.push(`Sahip: ${data.owner}`);
        if (data.startDate !== aksiyon.startDate) changes.push(`Başlangıç: ${data.startDate}`);
        if (data.endDate !== aksiyon.endDate) changes.push(`Bitiş: ${data.endDate}`);
        updateAksiyon(aksiyon.id, data);
        const detail = changes.length > 0 ? `"${data.name}" → ${changes.join(", ")}` : `"${data.name}" ${t("toast.updatedSuccessfully")}.`;
        toast.success(t("toast.actionUpdated"), detail);
      } else {
        addAksiyon(data);
        toast.success(t("toast.actionCreated"), `"${data.name}" hedefe eklendi.`);
      }
      onSuccess();
    } catch (err) {
      toast.error(t("toast.operationFailed"), err instanceof Error ? err.message : t("toast.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = getStatusOptions(t);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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
              classNames={{ inputWrapper: "border-tyro-border" }}
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
              classNames={{ inputWrapper: "border-tyro-border" }}
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
              {t("common.owner")}<span className="text-tyro-danger ml-0.5">*</span>
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
              classNames={{ base: "w-full" }}
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
        name="hedefId"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
              {t("nav.objectives")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Select
              selectedKeys={field.value ? [field.value] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val ?? "");
              }}
              variant="bordered"
              size="sm"
              isInvalid={!!errors.hedefId}
              errorMessage={errors.hedefId?.message}
              classNames={{ trigger: "border-tyro-border" }}
              placeholder={t("forms.action.objectivePlaceholder")}
            >
              {hedefler.map((h) => (
                <SelectItem key={h.id}>{h.name}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />

      <Controller
        name="progress"
        control={control}
        render={({ field }) => {
          const val = field.value;
          const getBarColor = (v: number) => {
            if (v <= 25) return "from-red-400 to-red-500";
            if (v <= 50) return "from-amber-400 to-amber-500";
            if (v <= 75) return "from-yellow-400 to-emerald-400";
            return "from-emerald-400 to-emerald-500";
          };
          const getTextColor = (v: number) => {
            if (v <= 25) return "text-red-500";
            if (v <= 50) return "text-amber-500";
            if (v <= 75) return "text-yellow-600";
            return "text-emerald-500";
          };
          const getChipBg = (v: number, selected: boolean) => {
            if (!selected) return "bg-tyro-bg text-tyro-text-muted hover:bg-tyro-border/30";
            if (v <= 25) return "bg-red-500 text-white shadow-tyro-sm";
            if (v <= 50) return "bg-amber-500 text-white shadow-tyro-sm";
            if (v <= 75) return "bg-yellow-500 text-white shadow-tyro-sm";
            return "bg-emerald-500 text-white shadow-tyro-sm";
          };

          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-tyro-text-secondary">
                  {t("forms.action.progress")}
                </label>
                <span className={`text-lg font-extrabold tabular-nums ${getTextColor(val)}`}>
                  %{val}
                </span>
              </div>

              <div className="relative mb-3 h-4 flex items-center">
                <div className="absolute inset-x-0 h-2.5 rounded-full bg-tyro-border/15" />
                <div
                  className={`absolute left-0 h-2.5 rounded-full bg-gradient-to-r ${getBarColor(val)}`}
                  style={{ width: `${val}%`, transition: "width 50ms linear, background 300ms ease" }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={val}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute w-5 h-5 rounded-full bg-white border-[2.5px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] pointer-events-none"
                  style={{
                    left: `calc(${val}% - 10px)`,
                    transition: "left 50ms linear, border-color 300ms ease",
                    borderColor: val <= 25 ? "#ef4444" : val <= 50 ? "#f59e0b" : val <= 75 ? "#eab308" : "#10b981",
                  }}
                />
              </div>

              <div className="flex gap-1.5">
                {[0, 10, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={`flex-1 py-1.5 rounded-button text-[11px] font-semibold transition-all cursor-pointer ${getChipBg(v, val === v)}`}
                  >
                    %{v}
                  </button>
                ))}
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
                  <span className="ml-1.5 text-[9px] text-tyro-text-muted font-normal">(otomatik)</span>
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
                classNames={{ trigger: "border-tyro-border" }}
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

      {aksiyon && (aksiyon.createdBy || aksiyon.createdAt || aksiyon.completedAt) && (
        <div className="mt-4 pt-4 border-t border-tyro-border/30 flex flex-wrap gap-x-6 gap-y-2">
          {aksiyon.createdBy && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.createdBy").toUpperCase()}</p>
              <p className="text-xs text-tyro-text-secondary">{aksiyon.createdBy}</p>
            </div>
          )}
          {aksiyon.createdAt && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.createdAt").toUpperCase()}</p>
              <p className="text-xs text-tyro-text-secondary">{formatDate(aksiyon.createdAt)}</p>
            </div>
          )}
          {aksiyon.completedAt && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.completedAt").toUpperCase()}</p>
              <p className="text-xs text-emerald-600 font-medium">{formatDate(aksiyon.completedAt)}</p>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        startContent={<Check size={14} />}
        className="mt-2 rounded-button font-semibold relative overflow-hidden group"
      >
        <span className="relative z-10">{aksiyon ? t("common.save") : t("common.create")}</span>
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
          <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
        </span>
      </Button>
    </form>
  );
}
