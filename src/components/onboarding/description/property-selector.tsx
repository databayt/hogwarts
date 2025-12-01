"use client";

import React from "react";
import { Check } from "lucide-react";

interface PropertySelectorProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export function PropertySelector({
  title,
  description,
  isSelected,
  onClick,
}: PropertySelectorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-6 rounded-xl border-2 transition-colors text-start
        ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {isSelected && (
          <div className="rounded-full bg-primary p-1">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
} 