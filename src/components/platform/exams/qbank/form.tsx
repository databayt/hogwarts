"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionType, DifficultyLevel, BloomLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createQuestion, updateQuestion } from "../actions";
import { questionBankSchema } from "../validation";
import {
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  BLOOM_LEVELS,
  calculateDefaultPoints,
} from "../config";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { useModal } from "@/components/atom/modal/context";
import type { QuestionBankDTO } from "../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface QuestionBankFormProps {
  initialData?: QuestionBankDTO;
  subjectId?: string;
  isView?: boolean;
  dictionary?: Dictionary;
}

export function QuestionBankForm({
  initialData,
  subjectId,
  isView = false,
  dictionary,
}: QuestionBankFormProps) {
  // Default dictionary fallback for when component is used without i18n
  const dict = dictionary?.generate || {} as any;
  const { closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType>(
    initialData?.questionType || QuestionType.MULTIPLE_CHOICE
  );

  const form = useForm({
    resolver: zodResolver(questionBankSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || subjectId || "",
      questionText: initialData?.questionText || "",
      questionType: initialData?.questionType || QuestionType.MULTIPLE_CHOICE,
      difficulty: initialData?.difficulty || DifficultyLevel.MEDIUM,
      bloomLevel: initialData?.bloomLevel || BloomLevel.UNDERSTAND,
      points: initialData?.points || 1,
      timeEstimate: initialData?.timeEstimate || undefined,
      options:
        (initialData?.options as any[]) ||
        [
          { text: "", isCorrect: false, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
        ],
      acceptedAnswers: (initialData?.options as any)?.acceptedAnswers || [""],
      caseSensitive: false,
      sampleAnswer: initialData?.sampleAnswer || "",
      gradingRubric: initialData?.gradingRubric || "",
      tags: initialData?.tags || [],
      explanation: initialData?.explanation || "",
      imageUrl: initialData?.imageUrl || "",
    },
  });

  const watchType = form.watch("questionType");
  const watchDifficulty = form.watch("difficulty");

  // Update selected type when form value changes
  useEffect(() => {
    setSelectedType(watchType);
  }, [watchType]);

  // Auto-calculate default points based on type and difficulty
  useEffect(() => {
    const defaultPoints = calculateDefaultPoints(watchType, watchDifficulty);
    if (!initialData) {
      form.setValue("points", defaultPoints);
    }
  }, [watchType, watchDifficulty, initialData, form]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      if (initialData?.id) {
        formData.append("id", initialData.id);
      }

      const result = initialData?.id
        ? await updateQuestion(formData)
        : await createQuestion(formData);

      if (result.success) {
        SuccessToast(
          initialData?.id
            ? (dict.questionBank?.messages?.questionUpdated || "Question updated!")
            : (dict.questionBank?.messages?.questionCreated || "Question created!")
        );
        closeModal();
        window.location.reload();
      } else {
        ErrorToast(result.error);
      }
    } catch (error) {
      ErrorToast(
        error instanceof Error ? error.message : (dict.questionBank?.messages?.failedToSave || "Failed to save question")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {initialData?.id
              ? (dict.questionBank?.editQuestion || "Edit Question")
              : (dict.questionBank?.createQuestion || "Create Question")}
          </h2>

          {/* Subject Selection */}
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.questionBank?.form?.subjectLabel || "Subject"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isView}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={dict.questionBank?.form?.subjectPlaceholder || "Select subject"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* TODO: Fetch subjects from DB */}
                    <SelectItem value="subject-1">Mathematics</SelectItem>
                    <SelectItem value="subject-2">Science</SelectItem>
                    <SelectItem value="subject-3">English</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Type */}
          <FormField
            control={form.control}
            name="questionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.questionBank?.form?.questionTypeLabel || "Question Type"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isView}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={dict.questionBank?.form?.questionTypePlaceholder || "Select type"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {dict.questionTypes?.[type.value]?.label || type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {dict.questionTypes?.[field.value]?.description || QUESTION_TYPES.find((t) => t.value === field.value)?.description}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Text */}
          <FormField
            control={form.control}
            name="questionText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.questionBank?.form?.questionTextLabel || "Question Text"}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={dict.questionBank?.form?.questionTextPlaceholder || "Enter your question here..."}
                    className="min-h-[100px]"
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Difficulty & Bloom Level Row */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.questionBank?.form?.difficultyLabel || "Difficulty"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={dict.questionBank?.form?.difficultyPlaceholder || "Select difficulty"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-${level.color}-500`}
                            />
                            {dict.difficultyLevels?.[level.value]?.label || level.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloomLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.questionBank?.form?.bloomLevelLabel || "Bloom Level"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={dict.questionBank?.form?.bloomLevelPlaceholder || "Select level"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BLOOM_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {dict.bloomLevels?.[level.value]?.label || level.label} - {dict.bloomLevels?.[level.value]?.description || level.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Points & Time Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.questionBank?.form?.pointsLabel || "Points"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      disabled={isView}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.questionBank?.form?.timeEstimateLabel || "Time Estimate (min)"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="480"
                      disabled={isView}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>{dict.questionBank?.form?.timeEstimateDescription || "Optional"}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dynamic Fields Based on Question Type */}
          {(selectedType === QuestionType.MULTIPLE_CHOICE ||
            selectedType === QuestionType.TRUE_FALSE) && (
            <MultipleChoiceFields form={form} isView={isView} type={selectedType} />
          )}

          {selectedType === QuestionType.FILL_BLANK && (
            <FillBlankFields form={form} isView={isView} />
          )}

          {(selectedType === QuestionType.SHORT_ANSWER ||
            selectedType === QuestionType.ESSAY) && (
            <SubjectiveFields form={form} isView={isView} />
          )}

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagsInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isView}
                  />
                </FormControl>
                <FormDescription>
                  Press Enter to add tags (e.g., algebra, geometry)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Explanation */}
          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explanation (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain the concept or provide additional context..."
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        {!isView && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              {dict.actions?.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? (dict.actions?.update || "Update") : (dict.actions?.create || "Create")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

// Multiple Choice Options Component
function MultipleChoiceFields({
  form,
  isView,
  type,
}: {
  form: any;
  isView: boolean;
  type: QuestionType;
}) {
  const options = form.watch("options") || [];
  const isTrueFalse = type === QuestionType.TRUE_FALSE;

  const addOption = () => {
    const current = form.getValues("options") || [];
    form.setValue("options", [
      ...current,
      { text: "", isCorrect: false, explanation: "" },
    ]);
  };

  const removeOption = (index: number) => {
    const current = form.getValues("options") || [];
    form.setValue(
      "options",
      current.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>Options</FormLabel>
        {!isTrueFalse && !isView && options.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Option
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {options.map((option: any, index: number) => (
          <div key={index} className="flex gap-2 items-start border p-3 rounded-md">
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={(checked) => {
                const current = form.getValues("options");
                current[index].isCorrect = checked;
                form.setValue("options", [...current]);
              }}
              disabled={isView}
            />
            <div className="flex-1 space-y-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChange={(e) => {
                  const current = form.getValues("options");
                  current[index].text = e.target.value;
                  form.setValue("options", [...current]);
                }}
                disabled={isView}
              />
              <Input
                placeholder="Explanation (optional)"
                value={option.explanation || ""}
                onChange={(e) => {
                  const current = form.getValues("options");
                  current[index].explanation = e.target.value;
                  form.setValue("options", [...current]);
                }}
                disabled={isView}
                className="text-sm"
              />
            </div>
            {!isTrueFalse && !isView && options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Fill in the Blank Fields
function FillBlankFields({ form, isView }: { form: any; isView: boolean }) {
  const answers = form.watch("acceptedAnswers") || [""];

  const addAnswer = () => {
    const current = form.getValues("acceptedAnswers") || [];
    form.setValue("acceptedAnswers", [...current, ""]);
  };

  const removeAnswer = (index: number) => {
    const current = form.getValues("acceptedAnswers") || [];
    form.setValue(
      "acceptedAnswers",
      current.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>Accepted Answers</FormLabel>
        {!isView && (
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Answer
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {answers.map((answer: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Answer ${index + 1}`}
              value={answer}
              onChange={(e) => {
                const current = form.getValues("acceptedAnswers");
                current[index] = e.target.value;
                form.setValue("acceptedAnswers", [...current]);
              }}
              disabled={isView}
            />
            {!isView && answers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAnswer(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <FormField
        control={form.control}
        name="caseSensitive"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isView}
              />
            </FormControl>
            <FormLabel className="!mt-0">Case sensitive</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}

// Subjective Question Fields
function SubjectiveFields({ form, isView }: { form: any; isView: boolean }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sampleAnswer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sample Answer</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide a good sample answer..."
                className="min-h-[100px]"
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="gradingRubric"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grading Rubric</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe key points for grading..."
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormDescription>
              List the criteria for grading this question
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Tags Input Component
function TagsInput({
  value = [],
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTag}
          disabled={disabled}
        >
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
