
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Color {
  name: string;
  value: string;
  hex: string;
}

interface ColorPaletteProps {
  colors: Color[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  onColorSelect,
}) => {
  const getColorClass = (colorName: string) => {
    return colorName.toLowerCase();
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {colors.map((color) => (
        <Button
          key={color.value}
          variant={selectedColor === color.value ? "default" : "outline"}
          className={`h-12 relative overflow-visible group color-option ${getColorClass(color.name)}`}
          onClick={() => onColorSelect(color.value)}
          style={{
            backgroundColor: selectedColor === color.value ? color.value : 'transparent',
            borderColor: color.value,
            borderWidth: '2px',
          }}
        >
          <div
            className="absolute inset-1 rounded transition-all duration-300"
            style={{ backgroundColor: color.value }}
          />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {selectedColor === color.value && (
              <Check className="w-4 h-4 text-white drop-shadow-md" />
            )}
          </div>
          <span
            className="absolute bottom-0 left-0 right-0 text-xs font-medium text-center py-1 text-white bg-black bg-opacity-50 transition-opacity duration-300"
          >
            {color.name}
          </span>
        </Button>
      ))}
    </div>
  );
};
