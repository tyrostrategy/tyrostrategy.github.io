import { Check } from "lucide-react";
import { TAG_COLOR_PALETTE, getContrastText } from "@/config/tagColors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {TAG_COLOR_PALETTE.map((color) => {
        const isSelected = color === value;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-tyro-navy/30"
            style={{
              backgroundColor: color,
              boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
            }}
            title={color}
          >
            {isSelected && <Check size={12} style={{ color: getContrastText(color) }} />}
          </button>
        );
      })}
    </div>
  );
}
