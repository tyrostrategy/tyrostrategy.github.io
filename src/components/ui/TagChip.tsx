import { Chip } from "@heroui/react";
import { Tag } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";

interface TagChipProps {
  name: string;
  color?: string;       // override — yoksa store'dan çekilir
  size?: "sm" | "md";
  showIcon?: boolean;
  onClose?: () => void;
}

export default function TagChip({ name, color: colorOverride, size = "sm", showIcon, onClose }: TagChipProps) {
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);
  const color = colorOverride ?? tagDefinitions.find(
    (t) => t.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr")
  )?.color ?? DEFAULT_TAG_COLOR;

  return (
    <Chip
      size={size}
      variant="flat"
      startContent={showIcon ? <Tag size={10} /> : undefined}
      onClose={onClose}
      classNames={{
        base: `border ${size === "sm" ? "h-5" : "h-6"}`,
        content: `${size === "sm" ? "text-[10px]" : "text-[11px]"} font-medium px-1`,
        closeButton: "opacity-70 hover:opacity-100",
      }}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        borderColor: `${color}40`,
      }}
    >
      {name}
    </Chip>
  );
}
