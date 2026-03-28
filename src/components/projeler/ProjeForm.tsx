import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, Select, SelectItem, DatePicker, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Check, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { getStatusOptions, getSourceOptions } from "@/lib/constants";
import { departments } from "@/config/departments";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";
import TagChip from "@/components/ui/TagChip";
import EntityHeader from "@/components/shared/EntityHeader";
import FormSection from "@/components/shared/FormSection";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { Proje } from "@/types";

const CURRENT_USER = "Cenk \u015eayli";
const allUsers = departments.flatMap((d) => d.users.map((u) => u.name));
const departmentNames = departments.map((d) => d.name);

const createHedefSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(3, t("validation.minChars")),
    description: z.string().optional(),
    owner: z.string().min(1, t("validation.ownerRequired")),
    participants: z.array(z.string()).default([]),
    department: z.string().default(""),
    source: z.enum(["T\u00fcrkiye", "Kurumsal", "International"]),
    status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Not Started", "Cancelled", "On Hold"]),
    tags: z.array(z.string()).default([]),
    parentObjectiveId: z.string().optional(),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
    reviewDate: z.string().min(1, t("validation.reviewDateRequired", "Kontrol tarihi zorunludur")),
  });

type ProjeFormData = z.infer<ReturnType<typeof createHedefSchema>>;

interface ProjeFormProps {
  proje?: Proje;
  onSuccess: () => void;
}

export default function ProjeForm({ proje, onSuccess }: ProjeFormProps) {
  const { t } = useTranslation();
  const addProje = useDataStore((s) => s.addProje);
  const updateProje = useDataStore((s) => s.updateProje);
  const projeler = useDataStore((s) => s.projeler);
  const [isLoading, setIsLoading] = useState(false);
  const accentColor = useSidebarTheme().accentColor ?? "#c8922a";

  const hedefSchema = createHedefSchema(t);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjeFormData>({
    resolver: zodResolver(hedefSchema) as any,
    defaultValues: {
      name: proje?.name ?? "",
      description: proje?.description ?? "",
      owner: proje?.owner ?? CURRENT_USER,
      participants: proje?.participants ?? [],
      department: proje?.department ?? "",
      source: proje?.source ?? "T\u00fcrkiye",
      status: proje?.status ?? "Not Started",
      tags: proje?.tags ?? [],
      parentObjectiveId: proje?.parentObjectiveId ?? "",
      startDate: proje?.startDate ?? "",
      endDate: proje?.endDate ?? "",
      reviewDate: proje?.reviewDate ?? "",
    },
  });

  // Yeni hedefte: startDate değiştiğinde reviewDate otomatik doldur (eğer boşsa)
  const watchStartDate = watch("startDate");
  const watchReviewDate = watch("reviewDate");
  useEffect(() => {
    if (!proje && watchStartDate && !watchReviewDate) {
      setValue("reviewDate", watchStartDate);
    }
  }, [watchStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (data.name !== proje.name) details.push({ label: "Ad", value: data.name });
        if (data.status !== proje.status) details.push({ label: "Durum", value: data.status });
        if (data.owner !== proje.owner) details.push({ label: "Sahip", value: data.owner });
        if (data.source !== proje.source) details.push({ label: "Kaynak", value: data.source });
        if (data.department !== proje.department) details.push({ label: "Departman", value: data.department });
        if (data.startDate !== proje.startDate) details.push({ label: "Başlangıç", value: data.startDate });
        if (data.endDate !== proje.endDate) details.push({ label: "Bitiş", value: data.endDate });
        updateProje(proje.id, payload);
        toast.success(t("toast.objectiveUpdated"), {
          message: data.name,
          details: details.length > 0 ? details : [{ label: "Durum", value: "Değişiklik kaydedildi" }],
        });
      } else {
        addProje({ ...payload, progress: 0 });
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

  return (
    <form onSubmit={handleSubmit(onSubmit) as any} className="flex flex-col gap-3">
      {/* Entity Header — edit mode only */}
      {proje && (
        <EntityHeader
          id={proje.id}
          name={watch("name") || proje.name}
          description={proje.description}
          status={watch("status") as any}
          progress={proje.progress}
          tags={watch("tags")}
        />
      )}

      {/* Section: Temel Bilgiler */}
      <FormSection title="Temel Bilgiler">
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
      </FormSection>

      {/* Section: Sorumluluk */}
      <FormSection title="Sorumluluk">
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
              {departmentNames.map((name) => (
                <SelectItem key={name}>{name}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />
      </FormSection>

      {/* Section: Sınıflandırma */}
      <FormSection title="Sınıflandırma">
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
        name="tags"
        control={control}
        render={({ field }) => {
          const [tagInput, setTagInput] = useState("");
          const tagDefs = useDataStore((s) => s.tagDefinitions);
          const addTagDef = useDataStore((s) => s.addTagDefinition);
          const getTagColor = useDataStore((s) => s.getTagColor);

          const addTag = (tag: string) => {
            const trimmed = tag.trim();
            if (!trimmed || field.value.includes(trimmed)) { setTagInput(""); return; }
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
                onKeyDown={(e: any) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                variant="bordered"
                size="sm"
                placeholder={t("forms.objective.tagsPlaceholder", "Etiket yazın veya seçin...")}
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
          const availableHedefler = projeler.filter((h) => !proje || h.id !== proje.id);
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
                {availableHedefler.map((h) => (
                  <SelectItem key={h.id}>{h.name}</SelectItem>
                ))}
              </Select>
            </div>
          );
        }}
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

      <Button
        type="submit"
        isLoading={isLoading}
        startContent={<Check size={14} />}
        className="mt-2 rounded-button font-semibold relative overflow-hidden group text-white"
        style={{ backgroundColor: accentColor }}
      >
        <span className="relative z-10">{proje ? t("common.save") : t("common.create")}</span>
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
          <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
        </span>
      </Button>
    </form>
  );
}
