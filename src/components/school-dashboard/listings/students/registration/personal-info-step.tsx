"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { BloodGroup, Gender, StudentType } from "./validation"

interface PersonalInfoStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

export function PersonalInfoStep({ form, dictionary }: PersonalInfoStepProps) {
  const reg = dictionary?.school?.students?.registration?.personal

  return (
    <div className="grid gap-6">
      {/* Name Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.firstName || "First Name *"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterFirstName || "Enter first name"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="middleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.middleName || "Middle Name"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterMiddleName || "Enter middle name"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.lastName || "Last Name *"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterLastName || "Enter last name"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Basic Info Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.dateOfBirth || "Date of Birth *"}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full ps-3 text-start font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{reg?.pickDate || "Pick a date"}</span>
                      )}
                      <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.gender || "Gender *"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={reg?.selectGender || "Select gender"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(Gender).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
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
          name="bloodGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.bloodGroup || "Blood Group"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        reg?.selectBloodGroup || "Select blood group"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(BloodGroup).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nationality Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.nationality || "Nationality"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterNationality || "Enter nationality"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passportNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.passportNumber || "Passport Number"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    reg?.enterPassportNumber || "Enter passport number"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visaStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.visaStatus || "Visa Status"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterVisaStatus || "Enter visa status"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Visa Expiry Date */}
      {form.watch("visaStatus") && (
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="visaExpiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {reg?.visaExpiryDate || "Visa Expiry Date"}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full ps-3 text-start font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{reg?.pickDate || "Pick a date"}</span>
                        )}
                        <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Student IDs Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="grNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.grNumber || "GR Number"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={reg?.enterGrNumber || "Enter GR number"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="admissionNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {reg?.admissionNumber || "Admission Number"}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    reg?.enterAdmissionNumber || "Enter admission number"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.studentType || "Student Type *"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        reg?.selectStudentType || "Select student type"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(StudentType).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Category */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.category || "Category"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={reg?.selectCategory || "Select category"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="General">
                    {reg?.general || "General"}
                  </SelectItem>
                  <SelectItem value="SC">{reg?.sc || "SC"}</SelectItem>
                  <SelectItem value="ST">{reg?.st || "ST"}</SelectItem>
                  <SelectItem value="OBC">{reg?.obc || "OBC"}</SelectItem>
                  <SelectItem value="EWS">{reg?.ews || "EWS"}</SelectItem>
                  <SelectItem value="Other">{reg?.other || "Other"}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="admissionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.admissionDate || "Admission Date *"}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full ps-3 text-start font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{reg?.pickDate || "Pick a date"}</span>
                      )}
                      <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
