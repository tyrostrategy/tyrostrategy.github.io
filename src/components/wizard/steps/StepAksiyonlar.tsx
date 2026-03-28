import { useFieldArray, Controller, type Control, type FieldErrors } from "react-hook-form";
import { Input, Textarea, DatePicker, Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";

interface Props {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function StepAksiyonlar({ control, errors }: Props) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: "aksiyonlar" });

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="p-4 rounded-2xl border border-tyro-border bg-tyro-surface/50 relative"
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-tyro-navy uppercase tracking-wide">
                {t("wizard.actionNumber", { number: index + 1 })}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-tyro-text-muted hover:text-tyro-danger hover:bg-tyro-danger/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Controller
                name={`aksiyonlar.${index}.name`}
                control={control}
                render={({ field: f }) => (
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                      {t("forms.action.name")}<span className="text-tyro-danger ml-0.5">*</span>
                    </label>
                    <Input
                      {...f}
                      placeholder={t("forms.action.namePlaceholder")}
                      isInvalid={!!(errors.aksiyonlar as any)?.[index]?.name}
                      errorMessage={(errors.aksiyonlar as any)?.[index]?.name?.message}
                      variant="bordered"
                      size="sm"
                      classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
                    />
                  </div>
                )}
              />

              <Controller
                name={`aksiyonlar.${index}.description`}
                control={control}
                render={({ field: f }) => (
                  <div>
                    <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                      {t("forms.objective.description")}
                    </label>
                    <Textarea
                      {...f}
                      placeholder="Aksiyon açıklaması (isteğe bağlı)"
                      variant="bordered"
                      size="sm"
                      minRows={1}
                      maxRows={3}
                      classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
                    />
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name={`aksiyonlar.${index}.startDate`}
                  control={control}
                  render={({ field: f }) => (
                    <div>
                      <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                        {t("common.startDate")}<span className="text-tyro-danger ml-0.5">*</span>
                      </label>
                      <DatePicker
                        value={toCalendarDate(f.value)}
                        onChange={(date) => f.onChange(fromCalendarDate(date))}
                        isInvalid={!!(errors.aksiyonlar as any)?.[index]?.startDate}
                        variant="bordered"
                        size="sm"
                        granularity="day"
                      />
                    </div>
                  )}
                />
                <Controller
                  name={`aksiyonlar.${index}.endDate`}
                  control={control}
                  render={({ field: f }) => (
                    <div>
                      <label className="block text-[11px] font-semibold text-tyro-text-secondary mb-1">
                        {t("common.endDate")}<span className="text-tyro-danger ml-0.5">*</span>
                      </label>
                      <DatePicker
                        value={toCalendarDate(f.value)}
                        onChange={(date) => f.onChange(fromCalendarDate(date))}
                        isInvalid={!!(errors.aksiyonlar as any)?.[index]?.endDate}
                        variant="bordered"
                        size="sm"
                        granularity="day"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add action button */}
      <Button
        type="button"
        variant="bordered"
        onPress={() => append({ name: "", description: "", owner: "", startDate: "", endDate: "" })}
        startContent={<Plus size={16} />}
        className="border-dashed border-tyro-gold/40 text-tyro-gold hover:bg-tyro-gold/5 rounded-xl font-semibold"
      >
        {t("wizard.addAction")}
      </Button>

      {(errors.aksiyonlar as any)?.root && (
        <p className="text-xs text-tyro-danger">{(errors.aksiyonlar as any).root.message}</p>
      )}
    </div>
  );
}
