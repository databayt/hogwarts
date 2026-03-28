"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ContactInfoStepProps {
  form: UseFormReturn<any>
  dictionary?: any
}

export function ContactInfoStep({ form, dictionary }: ContactInfoStepProps) {
  const reg = dictionary?.school?.students?.registration?.contact
  const sameAsPermanent = form.watch("sameAsPermanent")

  useEffect(() => {
    if (sameAsPermanent) {
      form.setValue("permanentAddress", form.getValues("currentAddress"))
      form.setValue("permanentCity", form.getValues("city"))
      form.setValue("permanentState", form.getValues("state"))
      form.setValue("permanentPostalCode", form.getValues("postalCode"))
      form.setValue("permanentCountry", form.getValues("country"))
    }
  }, [sameAsPermanent, form])

  return (
    <div className="grid gap-6">
      {/* Contact Details */}
      <h4>{reg?.title || "Contact Information"}</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.email || "Email Address"}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={reg?.emailPlaceholder || "student@example.com"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.mobileNumber || "Mobile Number"}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={reg?.mobilePlaceholder || "+966 XX XXX XXXX"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alternatePhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.alternatePhone || "Alternate Phone"}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={reg?.mobilePlaceholder || "+966 XX XXX XXXX"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Current Address */}
      <h4>{reg?.currentAddress || "Current Address"}</h4>
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="currentAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{reg?.address || "Address *"}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    reg?.addressPlaceholder ||
                    "Enter complete address including building, street, area"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{reg?.city || "City *"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={reg?.enterCity || "Enter city"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {reg?.stateProvince || "State/Province *"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={reg?.enterState || "Enter state"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{reg?.postalCode || "Postal Code"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={reg?.enterPostalCode || "Enter postal code"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{reg?.country || "Country"}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={reg?.enterCountry || "Enter country"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Permanent Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4>{reg?.permanentAddress || "Permanent Address"}</h4>
          <FormField
            control={form.control}
            name="sameAsPermanent"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm font-normal">
                  {reg?.sameAsCurrent || "Same as current address"}
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!sameAsPermanent && (
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="permanentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {reg?.permanentAddress || "Permanent Address"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        reg?.addressPlaceholder || "Enter permanent address"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="permanentCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.city || "City"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterCity || "Enter city"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanentState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {reg?.stateProvince || "State/Province"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterState || "Enter state"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanentPostalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.postalCode || "Postal Code"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          reg?.enterPostalCode || "Enter postal code"
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
                name="permanentCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{reg?.country || "Country"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={reg?.enterCountry || "Enter country"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
