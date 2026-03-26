import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input, Textarea, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { getSourceOptions } from "@/lib/constants";
import { departmentNames } from "@/config/departments";
interface Props {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function StepProjeBasics({ control, errors }: Props) {
  const { t } = useTranslation();
  const sourceOptions = getSourceOptions(t);

  return (
    <div className="flex flex-col gap-5">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.name")}<span className="text-tyro-danger ml-0.5">*</span>
            </label>
            <Input
              {...field}
              placeholder={t("forms.objective.namePlaceholder")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message as string}
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
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
              {t("forms.objective.description")}
            </label>
            <Textarea
              {...field}
              placeholder={t("forms.objective.descriptionPlaceholder")}
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
        name="source"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
              errorMessage={errors.source?.message as string}
              classNames={{ trigger: "border-tyro-border" }}
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
        name="department"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">
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
              classNames={{ trigger: "border-tyro-border" }}
              placeholder={t("forms.objective.departmentPlaceholder")}
            >
              {departmentNames.map((name) => (
                <SelectItem key={name}>{name}</SelectItem>
              ))}
            </Select>
          </div>
        )}
      />
    </div>
  );
}
