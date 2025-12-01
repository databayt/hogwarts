"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Briefcase, Calendar, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { TeacherFormStepProps } from "./types";

export function ExperienceStep({ form, isView }: TeacherFormStepProps) {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "experiences"
  });

  const addExperience = () => {
    append({
      institution: "",
      position: "",
      startDate: null as any,
      endDate: null as any,
      isCurrent: false,
      description: "",
    });
  };

  const handleCurrentToggle = (index: number, checked: boolean) => {
    if (checked) {
      // Clear end date when marking as current
      update(index, {
        ...fields[index],
        isCurrent: true,
        endDate: null as any,
      });
    } else {
      update(index, {
        ...fields[index],
        isCurrent: false,
      });
    }
  };

  const calculateDuration = (startDate: Date | undefined, endDate: Date | undefined, isCurrent: boolean) => {
    if (!startDate) return null;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  // Calculate total experience
  const totalExperience = () => {
    let totalMonths = 0;
    fields.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += months;
      }
    });
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return "No experience";
    }
  };

  if (fields.length === 0 && !isView) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="rounded-full bg-muted p-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold">No Experience Added</h3>
          <p className="text-sm text-muted-foreground">
            Add teacher's professional work experience
          </p>
        </div>
        <Button
          type="button"
          onClick={addExperience}
          disabled={isView}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Professional Experience</h3>
          <p className="text-sm text-muted-foreground">
            Add work history and teaching experience
          </p>
          {fields.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              Total Experience: {totalExperience()}
            </Badge>
          )}
        </div>
        {!isView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExperience}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      {/* Timeline View */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pe-2">
        {fields.map((field, index) => {
          const duration = calculateDuration(
            form.watch(`experiences.${index}.startDate`),
            form.watch(`experiences.${index}.endDate`),
            form.watch(`experiences.${index}.isCurrent`)
          );

          return (
            <Card key={field.id} className="relative">
              {/* Timeline connector */}
              {index < fields.length - 1 && (
                <div className="absolute left-8 top-full h-4 w-0.5 bg-border" />
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Experience #{index + 1}
                        {form.watch(`experiences.${index}.isCurrent`) && (
                          <Badge variant="outline" className="ms-2 text-xs">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      {duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {duration}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isView && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 ps-14">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.institution`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Building className="h-3 w-3 inline me-1" />
                          Institution/School
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Name of school or organization"
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
                    name={`experiences.${index}.position`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Role</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Mathematics Teacher"
                            disabled={isView}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Calendar className="h-3 w-3 inline me-1" />
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isView}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!form.watch(`experiences.${index}.isCurrent`) && (
                    <FormField
                      control={form.control}
                      name={`experiences.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              disabled={isView}
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch(`experiences.${index}.isCurrent`) && (
                    <div className="flex items-center pt-8">
                      <Badge variant="default" className="px-4">
                        Present
                      </Badge>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`experiences.${index}.isCurrent`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleCurrentToggle(index, checked as boolean);
                          }}
                          disabled={isView}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I currently work here
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsibilities & Achievements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your key responsibilities and achievements..."
                          disabled={isView}
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isView && fields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addExperience}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Experience
        </Button>
      )}
    </div>
  );
}