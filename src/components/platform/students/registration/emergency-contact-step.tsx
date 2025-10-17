"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmergencyContactStepProps {
  form: UseFormReturn<any>;
  dictionary?: any;
}

const relationshipOptions = [
  "Father",
  "Mother",
  "Guardian",
  "Uncle",
  "Aunt",
  "Grandfather",
  "Grandmother",
  "Brother",
  "Sister",
  "Other",
];

export function EmergencyContactStep({ form, dictionary }: EmergencyContactStepProps) {
  return (
    <div className="grid gap-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Emergency contact information will be used only in case of emergencies. Please ensure the contact person is available and reachable.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Phone *</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+966 XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyContactRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationshipOptions.map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <h5 className="mb-2">Tips for Emergency Contacts</h5>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Choose someone who is usually available during school hours</li>
          <li>• Ensure they are authorized to make medical decisions if needed</li>
          <li>• Verify the phone number is correct and active</li>
          <li>• Consider adding an alternate emergency contact in guardian information</li>
        </ul>
      </div>
    </div>
  );
}