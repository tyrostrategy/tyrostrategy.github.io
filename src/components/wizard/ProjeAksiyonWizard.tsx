import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Wand2, Target, Users, ListChecks, ClipboardCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDataStore } from "@/stores/dataStore";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/stores/toastStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import WizardStepper from "./WizardStepper";
import WizardSuccess from "./WizardSuccess";
import StepProjeBasics from "./steps/StepProjeBasics";
import StepOwnershipDates from "./steps/StepOwnershipDates";
import StepAksiyonlar from "./steps/StepAksiyonlar";
import StepReview from "./steps/StepReview";

const createWizardSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(3, t("validation.minChars")),
    description: z.string().optional().default(""),
    source: z.enum(["Türkiye", "Kurumsal", "International", "LALE", "Organik"], {
      message: t("validation.sourceRequired"),
    }),
    department: z.string().default(""),
    owner: z.string().min(1, t("validation.ownerRequired")),
    participants: z.array(z.string()).default([]),
    parentObjectiveId: z.string().optional().default(""),
    startDate: z.string().min(1, t("validation.startDateRequired")),
    endDate: z.string().min(1, t("validation.endDateRequired")),
    reviewDate: z.string().default(""),
    aksiyonlar: z
      .array(
        z.object({
          name: z.string().min(1, t("validation.actionNameRequired")),
          description: z.string().optional().default(""),
          owner: z.string().optional().default(""),
          startDate: z.string().min(1, t("validation.startDateRequired")),
          endDate: z.string().min(1, t("validation.endDateRequired")),
        }),
      )
      .default([]),
  });

export type WizardFormData = z.infer<ReturnType<typeof createWizardSchema>>;

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ["name", "source"],
  ["owner", "startDate", "endDate"],
  ["aksiyonlar"],
  [],
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 26 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
    transition: { duration: 0.25 },
  }),
};

const STEP_THEME_CONFIGS = [
  { icon: Target, color: "text-tyro-navy", bg: "bg-tyro-navy/8", key: "step1Desc" },
  { icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/8", key: "step2Desc" },
  { icon: ListChecks, color: "text-violet-600", bg: "bg-violet-500/8", key: "step3Desc" },
  { icon: ClipboardCheck, color: "text-tyro-gold", bg: "bg-tyro-gold/8", key: "step4Desc" },
];

interface Props {
  onClose: () => void;
}

export default function ProjeAksiyonWizard({ onClose }: Props) {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const addProje = useDataStore((s) => s.addProje);
  const addAksiyon = useDataStore((s) => s.addAksiyon);
  const { canCreateProje } = usePermissions();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [createdAksiyonCount, setCreatedAksiyonCount] = useState(0);

  const schema = createWizardSchema(t);

  const {
    control,
    trigger,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      source: "Türkiye",
      department: "",
      owner: localStorage.getItem("tyro-mock-user") || "Demo User",
      participants: [],
      parentObjectiveId: "",
      startDate: "",
      endDate: "",
      reviewDate: new Date().toISOString().slice(0, 10),
      aksiyonlar: [],
    },
    mode: "onTouched",
  });

  const steps = [
    t("wizard.step1Title"),
    t("wizard.step2Title"),
    t("wizard.step3Title"),
    t("wizard.step4Title"),
  ];

  const goNext = useCallback(async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    // Aksiyonlar step: boş array'de validation atlansın
    if (currentStep === 2) {
      const aksList = getValues("aksiyonlar") ?? [];
      if (aksList.length === 0) {
        setDirection(1);
        setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
        return;
      }
    }
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [currentStep, trigger, steps.length, getValues]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goSkip = useCallback(() => {
    // Aksiyonlar adımını atlarken boş/eksik aksiyonları temizle
    const current = getValues("aksiyonlar") ?? [];
    const valid = current.filter((a) => a.name?.trim() && a.owner?.trim());
    setValue("aksiyonlar", valid);
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [steps.length, getValues, setValue]);

  const onSubmit = useCallback(
    (data: WizardFormData) => {
      if (!canCreateProje) {
        toast.error(t("toast.operationFailed"), t("permissions.noCreatePermission", "Proje oluşturma yetkiniz yok."));
        return;
      }
      try {
        // Aksiyon tarih aralığı kontrolü
        const invalidAksiyon = (data.aksiyonlar ?? []).find((a) =>
          (a.startDate && data.startDate && a.startDate < data.startDate) ||
          (a.endDate && data.endDate && a.endDate > data.endDate)
        );
        if (invalidAksiyon) {
          toast.error("Tarih Aralığı Hatası", {
            message: `"${invalidAksiyon.name}" aksiyonunun tarihleri projenin tarih aralığının (${data.startDate} — ${data.endDate}) dışında.`,
          });
          return;
        }

        addProje({
          name: data.name,
          description: data.description || undefined,
          source: data.source,
          department: data.department,
          owner: data.owner,
          participants: data.participants,
          parentObjectiveId: data.parentObjectiveId || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          reviewDate: data.reviewDate || data.startDate,
          status: "Not Started",
          progress: 0,
        });

        const newProjeId = useDataStore.getState().projeler.at(-1)!.id;

        (data.aksiyonlar ?? []).forEach((a, i) => {
          addAksiyon({
            projeId: newProjeId,
            name: a.name,
            description: a.description || undefined,
            owner: a.owner || data.owner,
            startDate: a.startDate,
            endDate: a.endDate,
            status: "Not Started",
            progress: 0,
            sortOrder: i + 1,
          });
        });

        setCreatedName(data.name);
        setCreatedAksiyonCount(data.aksiyonlar?.length ?? 0);
        setShowSuccess(true);

        const aksCount = data.aksiyonlar?.length ?? 0;
        toast.success(t("toast.objectiveCreated"), {
          message: data.name,
          details: aksCount > 0
            ? [{ label: "Aksiyonlar", value: `${aksCount} aksiyon eklendi` }]
            : undefined,
        });
      } catch (err) {
        toast.error(
          t("toast.operationFailed"),
          err instanceof Error ? err.message : t("toast.unexpectedError"),
        );
      }
    },
    [addProje, addAksiyon, t, canCreateProje],
  );

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="relative flex flex-col min-h-[450px]">
      {/* Stepper */}
      <WizardStepper steps={steps} currentStep={currentStep} />

      {/* Step content — scrollable area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Step header banner — accent color themed */}
            {(() => {
              const theme = STEP_THEME_CONFIGS[currentStep];
              const StepIcon = theme.icon;
              return (
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-5"
                  style={{ backgroundColor: `${accentColor}12` }}
                >
                  <StepIcon size={16} style={{ color: accentColor }} />
                  <span className="text-[12px] font-semibold" style={{ color: accentColor }}>{t(`wizard.${theme.key}`)}</span>
                </div>
              );
            })()}

            {currentStep === 0 && <StepProjeBasics control={control} errors={errors} />}
            {currentStep === 1 && <StepOwnershipDates control={control} errors={errors} />}
            {currentStep === 2 && <StepAksiyonlar control={control} errors={errors} />}
            {currentStep === 3 && <StepReview control={control} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer navigation */}
      {!showSuccess && (
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-tyro-border">
          {currentStep === 0 ? (
            <Button
              variant="light"
              onPress={onClose}
              startContent={<X size={14} />}
              className="font-semibold text-tyro-text-muted"
            >
              {t("common.cancel", "İptal")}
            </Button>
          ) : (
            <Button
              variant="light"
              onPress={goBack}
              startContent={<ArrowLeft size={14} />}
              className="font-semibold"
            >
              {t("wizard.back")}
            </Button>
          )}

          <div className="flex items-center gap-2">
            {/* Atla butonu — sadece aksiyonlar adımında (step 2) */}
            {currentStep === 2 && (
              <Button
                variant="light"
                onPress={goSkip}
                className="font-semibold text-tyro-text-muted"
              >
                {t("wizard.skip", "Atla")}
              </Button>
            )}

            {isLastStep ? (
              <Button
                onPress={() => handleSubmit(onSubmit)()}
                startContent={<Wand2 size={14} />}
                className="rounded-button font-semibold relative overflow-hidden group text-white"
                style={{ backgroundColor: accentColor }}
              >
                <span className="relative z-10">{t("wizard.submit")}</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                  <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
                </span>
              </Button>
            ) : (
              <Button
                onPress={goNext}
                endContent={<ArrowRight size={14} />}
                className="rounded-button font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {t("wizard.next")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <WizardSuccess
            projeName={createdName}
            aksiyonCount={createdAksiyonCount}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
