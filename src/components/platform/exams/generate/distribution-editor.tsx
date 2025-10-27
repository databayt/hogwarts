"use client";

import { QuestionType, DifficultyLevel } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPES, DIFFICULTY_LEVELS } from "./config";
import type { TemplateDistribution } from "./types";

interface DistributionEditorProps {
  distribution: TemplateDistribution;
  onChange: (distribution: TemplateDistribution) => void;
  totalMarks?: number;
  disabled?: boolean;
}

export function DistributionEditor({
  distribution,
  onChange,
  totalMarks,
  disabled = false,
}: DistributionEditorProps) {
  const updateCell = (
    questionType: QuestionType,
    difficulty: DifficultyLevel,
    value: number
  ) => {
    const newDistribution = { ...distribution };

    if (!newDistribution[questionType]) {
      newDistribution[questionType] = {};
    }

    newDistribution[questionType]![difficulty] = value;

    onChange(newDistribution);
  };

  const getCellValue = (
    questionType: QuestionType,
    difficulty: DifficultyLevel
  ): number => {
    return distribution[questionType]?.[difficulty] || 0;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 bg-muted/50 border-b">
        <div className="p-3 font-medium text-sm">Question Type</div>
        {DIFFICULTY_LEVELS.map((level) => (
          <div key={level.value} className="p-3 text-center font-medium text-sm">
            <Badge variant={level.color === "green" ? "default" : level.color === "yellow" ? "secondary" : "destructive"}>
              {level.label}
            </Badge>
          </div>
        ))}
      </div>

      {/* Rows */}
      {QUESTION_TYPES.map((questionType) => (
        <div key={questionType.value} className="grid grid-cols-4 border-b last:border-b-0">
          <div className="p-3 flex items-center">
            <div>
              <div className="text-sm font-medium">{questionType.label}</div>
              <div className="text-xs text-muted-foreground">
                {questionType.description}
              </div>
            </div>
          </div>

          {DIFFICULTY_LEVELS.map((difficulty) => {
            const value = getCellValue(questionType.value, difficulty.value);
            const cellId = `${questionType.value}-${difficulty.value}`;

            return (
              <div key={difficulty.value} className="p-3 flex items-center justify-center">
                <Input
                  id={cellId}
                  type="number"
                  min="0"
                  max="50"
                  value={value}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    updateCell(
                      questionType.value,
                      difficulty.value,
                      newValue
                    );
                  }}
                  className="w-20 text-center"
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Totals Row */}
      <div className="grid grid-cols-4 bg-muted/30 border-t-2">
        <div className="p-3 font-semibold text-sm">Total per Difficulty</div>
        {DIFFICULTY_LEVELS.map((difficulty) => {
          const total = QUESTION_TYPES.reduce((sum, qt) => {
            return sum + getCellValue(qt.value, difficulty.value);
          }, 0);

          return (
            <div
              key={difficulty.value}
              className="p-3 text-center font-semibold text-sm"
            >
              {total}
            </div>
          );
        })}
      </div>

      {/* Column Totals */}
      <div className="p-3 bg-muted/50 border-t flex justify-between text-sm">
        <span className="font-semibold">Total Questions by Type:</span>
        <div className="flex gap-4">
          {QUESTION_TYPES.map((qt) => {
            const total = DIFFICULTY_LEVELS.reduce((sum, dl) => {
              return sum + getCellValue(qt.value, dl.value);
            }, 0);

            if (total === 0) return null;

            return (
              <span key={qt.value} className="text-muted-foreground">
                <span className="font-medium">{qt.label}:</span> {total}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
