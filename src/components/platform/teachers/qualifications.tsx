"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GraduationCap, Award, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { TeacherFormStepProps } from "./types";
import { QUALIFICATION_TYPE_OPTIONS } from "./config";

export function QualificationsStep({ form, isView }: TeacherFormStepProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "qualifications"
  });

  const addQualification = () => {
    append({
      qualificationType: "DEGREE",
      name: "",
      institution: "",
      major: "",
      dateObtained: undefined,
      expiryDate: undefined,
      licenseNumber: "",
      documentUrl: "",
    });
  };

  const getQualificationIcon = (type: string) => {
    switch (type) {
      case "DEGREE":
        return <GraduationCap className="h-4 w-4" />;
      case "CERTIFICATION":
        return <Award className="h-4 w-4" />;
      case "LICENSE":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  if (fields.length === 0 && !isView) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="rounded-full bg-muted p-4">
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold">No Qualifications Added</h3>
          <p className="text-sm text-muted-foreground">
            Add teacher's educational qualifications and certifications
          </p>
        </div>
        <Button
          type="button"
          onClick={addQualification}
          disabled={isView}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Qualification
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Qualifications</h3>
          <p className="text-sm text-muted-foreground">
            Add educational qualifications, certifications, and licenses
          </p>
        </div>
        {!isView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQualification}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {fields.map((field, index) => (
          <Card key={field.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getQualificationIcon(form.watch(`qualifications.${index}.qualificationType`))}
                  Qualification #{index + 1}
                </CardTitle>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`qualifications.${index}.qualificationType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUALIFICATION_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name={`qualifications.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bachelor of Education"
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
                  name={`qualifications.${index}.institution`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="University/Institution name"
                          disabled={isView}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`qualifications.${index}.major`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major/Field of Study</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mathematics"
                          disabled={isView}
                          {...field}
                          value={field.value || ''}
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
                  name={`qualifications.${index}.dateObtained`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Obtained</FormLabel>
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

                <FormField
                  control={form.control}
                  name={`qualifications.${index}.expiryDate`}
                  render={({ field }) => {
                    const expiryDate = field.value;
                    const isExpired = expiryDate && new Date(expiryDate) < new Date();
                    const isExpiringSoon = expiryDate &&
                      new Date(expiryDate) > new Date() &&
                      new Date(expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

                    return (
                      <FormItem>
                        <FormLabel>
                          Expiry Date
                          {isExpired && (
                            <span className="ml-2 text-xs text-destructive">(Expired)</span>
                          )}
                          {isExpiringSoon && (
                            <span className="ml-2 text-xs text-yellow-600">(Expiring Soon)</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isView}
                            className={cn(
                              isExpired && "border-destructive",
                              isExpiringSoon && "border-yellow-500"
                            )}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {form.watch(`qualifications.${index}.qualificationType`) === "LICENSE" && (
                <FormField
                  control={form.control}
                  name={`qualifications.${index}.licenseNumber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter license number"
                          disabled={isView}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!isView && fields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addQualification}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Qualification
        </Button>
      )}
    </div>
  );
}