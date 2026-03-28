import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Autocomplete, AutocompleteItem, Select, SelectItem, DatePicker } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { departments } from "@/config/departments";
import { useDataStore } from "@/stores/dataStore";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
const allUsers = departments.flatMap((d) => d.users.map((u) => u.name));

interface Props {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function StepOwnershipDates({ control, errors }: Props) {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);

  return (
    <div className="flex flex-col gap-5">
      <Controller
        name="owner"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
              errorMessage={errors.owner?.message as string}
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
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
        name="parentObjectiveId"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
              {projeler.map((h) => (
                <SelectItem key={h.id}>{h.name}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
                {t("forms.objective.startDate")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <DatePicker
                value={toCalendarDate(field.value)}
                onChange={(date) => field.onChange(fromCalendarDate(date))}
                isInvalid={!!errors.startDate}
                errorMessage={errors.startDate?.message as string}
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
              <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
                {t("forms.objective.endDate")}<span className="text-tyro-danger ml-0.5">*</span>
              </label>
              <DatePicker
                value={toCalendarDate(field.value)}
                onChange={(date) => field.onChange(fromCalendarDate(date))}
                isInvalid={!!errors.endDate}
                errorMessage={errors.endDate?.message as string}
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
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
    </div>
  );
}
