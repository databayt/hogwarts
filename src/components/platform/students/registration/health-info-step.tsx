"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Heart, Plus, Trash, TriangleAlert } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFieldArray } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface HealthInfoStepProps {
  form: UseFormReturn<any>;
  dictionary?: any;
}

export function HealthInfoStep({ form, dictionary }: HealthInfoStepProps) {
  const hasSpecialNeeds = form.watch("hasSpecialNeeds");

  const { fields: vaccinations, append: addVaccination, remove: removeVaccination } = useFieldArray({
    control: form.control,
    name: "vaccinations",
  });

  return (
    <div className="grid gap-6">
      <Alert>
        <Heart className="h-4 w-4" />
        <AlertTitle>Medical Information</AlertTitle>
        <AlertDescription>
          This information helps us provide appropriate care and respond effectively in case of medical emergencies.
        </AlertDescription>
      </Alert>

      {/* Medical Conditions */}
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="medicalConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any chronic conditions, disabilities, or ongoing medical issues"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Allergies
                <TriangleAlert className="h-4 w-4 inline ml-2 text-yellow-500" />
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List all allergies (food, medicine, environmental, etc.)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medicationRequired"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regular Medications</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any medications taken regularly with dosage and timing"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Doctor Information */}
      <h4>Family Doctor Information</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctorContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor Contact</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+966 XX XXX XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hospitalPreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Hospital</FormLabel>
              <FormControl>
                <Input placeholder="Hospital name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Insurance Information */}
      <h4>Health Insurance</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="insuranceProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Provider</FormLabel>
              <FormControl>
                <Input placeholder="Insurance company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insuranceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Number</FormLabel>
              <FormControl>
                <Input placeholder="Policy/Member number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="insuranceValidTill"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valid Until</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Vaccination Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4>Vaccination Records</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addVaccination({ name: "", date: new Date(), nextDueDate: null })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vaccination
          </Button>
        </div>

        {vaccinations.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Vaccination {index + 1}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVaccination(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name={`vaccinations.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vaccine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., COVID-19, MMR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`vaccinations.${index}.date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Given</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`vaccinations.${index}.nextDueDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Optional</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Special Needs */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hasSpecialNeeds"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer">
                Student has special needs or requires special assistance
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasSpecialNeeds && (
          <FormField
            control={form.control}
            name="specialNeedsDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Needs Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe the special needs and any accommodations required"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}