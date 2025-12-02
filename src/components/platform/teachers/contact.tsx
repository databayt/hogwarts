"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { teacherCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Phone, Mail, Smartphone, House, Briefcase, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import { TeacherFormStepProps } from "./types";

const PHONE_TYPE_OPTIONS = [
  { label: "Mobile", value: "mobile", icon: Smartphone },
  { label: "House", value: "home", icon: House },
  { label: "Work", value: "work", icon: Briefcase },
  { label: "Emergency", value: "emergency", icon: TriangleAlert },
] as const;

export function ContactStep({ form, isView }: TeacherFormStepProps) {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "phoneNumbers"
  });

  const addPhoneNumber = () => {
    append({
      phoneType: "mobile",
      phoneNumber: "",
      isPrimary: fields.length === 0, // First phone is primary by default
    });
  };

  const handlePrimaryToggle = (index: number, checked: boolean) => {
    if (checked) {
      // Unset all other primary flags
      fields.forEach((_, i) => {
        if (i !== index) {
          update(i, { ...fields[i], isPrimary: false });
        }
      });
      // Set this one as primary
      update(index, { ...fields[index], isPrimary: true });
    }
  };

  const getPhoneIcon = (type: string) => {
    const option = PHONE_TYPE_OPTIONS.find(opt => opt.value === type);
    const Icon = option?.icon || Phone;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Email Address</h3>
            </div>
            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="teacher@school.edu"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Phone Numbers</h3>
              </div>
              {!isView && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhoneNumber}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Phone
                </Button>
              )}
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No phone numbers added</p>
                {!isView && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhoneNumber}
                    className="mt-2 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Phone Number
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const isPrimary = form.watch(`phoneNumbers.${index}.isPrimary`);

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "p-3 border rounded-lg space-y-3",
                        isPrimary && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPhoneIcon(form.watch(`phoneNumbers.${index}.phoneType`))}
                          <span className="text-sm font-medium">
                            Phone #{index + 1}
                          </span>
                          {isPrimary && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
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

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`phoneNumbers.${index}.phoneType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PHONE_TYPE_OPTIONS.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <Icon className="h-4 w-4" />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`phoneNumbers.${index}.phoneNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+1 (555) 123-4567"
                                  disabled={isView}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {!isView && fields.length > 1 && (
                        <FormField
                          control={form.control}
                          name={`phoneNumbers.${index}.isPrimary`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    handlePrimaryToggle(index, checked as boolean);
                                  }}
                                  disabled={isView}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs">
                                  Set as primary contact number
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isView && fields.length > 0 && fields.length < 4 && (
              <Button
                type="button"
                variant="outline"
                onClick={addPhoneNumber}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Phone Number
              </Button>
            )}

            {fields.length >= 4 && (
              <p className="text-xs text-muted-foreground text-center">
                Maximum 4 phone numbers allowed
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
