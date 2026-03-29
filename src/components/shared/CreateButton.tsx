import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";

interface CreateButtonProps {
  onPress: () => void;
  label?: string;
}

export default function CreateButton({ onPress, label }: CreateButtonProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t("common.new");
  const theme = useSidebarTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Button
      color="primary"
      size="sm"
      onPress={onPress}
      className="font-semibold text-white transition-all duration-300 active:scale-[0.97] group/btn relative overflow-hidden"
      style={{
        background: hovered ? theme.buttonGradientHover : theme.buttonGradient,
        boxShadow: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="hidden sm:inline">{displayLabel}</span>
        <Plus
          size={14}
          className="transition-transform duration-300 ease-out"
          style={{ transform: hovered ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </span>
      <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
        <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover/btn:left-[150%] transition-all duration-700 ease-out" />
      </span>
    </Button>
  );
}
